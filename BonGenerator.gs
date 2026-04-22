// ================================================================
// BC GOODS APPROVAL — BON PDF GENERATOR v6
// Menggunakan Google Sheets template + clean empty rows
//
// CARA SETUP:
// 1. Buka https://script.google.com → project BonGenerator
// 2. Paste seluruh kode ini (ganti yang lama)
// 3. Deploy → New version
// ================================================================

const TEMPLATE_SPREADSHEET_ID = '1xTsvUapjNgLPabruYUBvXqKsa_MwJ_F1QcaCXuqSvoU';
const DRIVE_FOLDER_ID          = ''; // kosong = root My Drive

function doGet(e) {
  if (e.parameter && e.parameter.data) {
    try {
      var data   = JSON.parse(decodeURIComponent(e.parameter.data));
      var result = generateBonPdf(data);
      return HtmlService.createHtmlOutput(
        '<html><head><meta charset="UTF-8"><title>BON Siap</title></head><body>' +
        '<p style="font-family:sans-serif;padding:20px;">✅ BON siap! Mengunduh...</p>' +
        '<script>window.location.href="' + result.downloadUrl + '";<\/script>' +
        '</body></html>'
      );
    } catch(err) {
      Logger.log('ERROR: ' + err.message + '\n' + err.stack);
      return HtmlService.createHtmlOutput(
        '<html><body style="font-family:sans-serif;padding:40px;">' +
        '<h2 style="color:red;">❌ Error</h2><p>' + err.message + '</p>' +
        '</body></html>'
      );
    }
  }
  return HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif;padding:40px;"><h2>✓ BON Generator aktif</h2></body></html>'
  );
}

function doPost(e) { return doGet(e); }

function generateBonPdf(data) {
  var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];
  var tgl    = new Date(data.tanggal);
  var tglStr = tgl.getDate() + ' ' + bulan[tgl.getMonth()] + ' ' + tgl.getFullYear();

  // 1. Buka spreadsheet template (bukan copy dulu)
  var ss           = SpreadsheetApp.openById(TEMPLATE_SPREADSHEET_ID);
  var templateSheet = ss.getSheetByName('BON_Format') || ss.getSheets()[0];
  var tempName     = 'TEMP_BON_' + data.bon_number.replace(/\//g, '-');

  // 2. Hapus sisa TEMP sheet jika ada
  var oldTemp = ss.getSheetByName(tempName);
  if (oldTemp) ss.deleteSheet(oldTemp);

  // 3. Copy sheet template ke sheet sementara
  var tempSheet = templateSheet.copyTo(ss).setName(tempName);

  // 4. Isi placeholder
  replaceInSheet(tempSheet, '{{nomor}}',              data.bon_number);
  replaceInSheet(tempSheet, '{{tanggal}}',            tglStr);
  replaceInSheet(tempSheet, '{{nama divisi}}',        data.divisi_nama);
  replaceInSheet(tempSheet, '{{kode divisi}}',        (data.bon_number.split('/')[1] || ''));
  replaceInSheet(tempSheet, '{{nama kepala divisi}}', data.kepala_nama || '');
  replaceInSheet(tempSheet, '{{pemohon}}',            data.pemohon_nama || '');

  // 5. Isi keterangan di M17
  tempSheet.getRange('M17').setValue(data.keterangan || '');

  // 6. Isi item barang via placeholder {{nama_N}} dst.
  var items = data.items || [];
  for (var i = 0; i < 34; i++) {
    var n = i + 1;
    if (i < items.length) {
      var it = items[i];
      replaceInSheet(tempSheet, '{{nama_'   + n + '}}', it.nama    || '');
      replaceInSheet(tempSheet, '{{jumlah_' + n + '}}', it.jumlah  || '');
      replaceInSheet(tempSheet, '{{satuan_' + n + '}}', it.satuan  || '');
      replaceInSheet(tempSheet, '{{ket_'    + n + '}}', it.keterangan || '');
    } else {
      replaceInSheet(tempSheet, '{{nama_'   + n + '}}', '');
      replaceInSheet(tempSheet, '{{jumlah_' + n + '}}', '');
      replaceInSheet(tempSheet, '{{satuan_' + n + '}}', '');
      replaceInSheet(tempSheet, '{{ket_'    + n + '}}', '');
    }
  }

  // 7. Hapus baris item kosong (D17:D50, dari bawah ke atas)
  for (var row = 50; row >= 17; row--) {
    if (tempSheet.getRange('D' + row).getValue() === '') {
      tempSheet.deleteRow(row);
    }
  }

  SpreadsheetApp.flush();

  // 8. Export PDF — range B3:O[lastRow] dinamis
  var spreadsheetId = ss.getId();
  var sheetId       = tempSheet.getSheetId();
  var lastRow       = tempSheet.getLastRow();
  var token         = ScriptApp.getOAuthToken();

  var expUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export' +
    '?format=pdf' +
    '&gid=' + sheetId +
    '&range=B3:O' + lastRow +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&gridlines=false' +
    '&printtitle=false' +
    '&sheetnames=false' +
    '&pagenumbers=false' +
    '&top_margin=0.2' +
    '&bottom_margin=0.2' +
    '&left_margin=0.2' +
    '&right_margin=0.2';

  var resp = UrlFetchApp.fetch(expUrl, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    ss.deleteSheet(tempSheet);
    throw new Error('Export PDF gagal: HTTP ' + resp.getResponseCode());
  }

  var pdfName = data.bon_number.replace(/\//g, '-') + '.pdf';
  var pdfBlob = resp.getBlob().setName(pdfName);

  // 9. Simpan ke Drive
  var folder;
  if (DRIVE_FOLDER_ID) {
    try { folder = DriveApp.getFolderById(DRIVE_FOLDER_ID); }
    catch(e) { folder = DriveApp.getRootFolder(); }
  } else {
    folder = DriveApp.getRootFolder();
  }

  var existing = folder.getFilesByName(pdfName);
  while (existing.hasNext()) existing.next().setTrashed(true);

  var file = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 10. Hapus sheet sementara
  ss.deleteSheet(tempSheet);

  var fileId = file.getId();
  return {
    filename:    pdfName,
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
    viewUrl:     'https://drive.google.com/file/d/' + fileId + '/view'
  };
}

function replaceInSheet(sheet, search, replacement) {
  var range  = sheet.getDataRange();
  var values = range.getValues();
  var changed = false;
  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < values[r].length; c++) {
      var v = values[r][c];
      if (typeof v === 'string' && v.indexOf(search) !== -1) {
        values[r][c] = v.replace(new RegExp(escapeRegex(search), 'g'), String(replacement));
        changed = true;
      }
    }
  }
  if (changed) range.setValues(values);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Upload TTD (endpoint terpisah jika diperlukan) ──
function uploadTTDtoDrive(data) {
  var TTD_FOLDER_ID = '1Q1XDuLg79zmZ2eeOz39pyHUwt_3xXiDZ';
  var folder;
  try { folder = DriveApp.getFolderById(TTD_FOLDER_ID); }
  catch(e) { folder = DriveApp.getRootFolder(); }

  var decoded  = Utilities.base64Decode(data.filedata);
  var blob     = Utilities.newBlob(decoded, data.filetype || 'application/pdf', data.filename);

  var existing = folder.getFilesByName(data.filename);
  while (existing.hasNext()) existing.next().setTrashed(true);

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { filename: file.getName(), fileId: file.getId() };
}
