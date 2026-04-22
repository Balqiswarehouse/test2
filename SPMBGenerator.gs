// ================================================================
// SPMB GENERATOR
// Berdasarkan pola cleanAndExportBON
//
// CARA SETUP:
// 1. Buka https://script.google.com → New project (BARU, bukan BonGenerator)
// 2. Paste seluruh kode ini
// 3. Deploy → New deployment
//    - Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL → paste ke SPMB_SCRIPT_URL di web app
// ================================================================

// ID spreadsheet template SPMB kamu
const SPMB_TEMPLATE_ID = '12ylq7BmAB3xNIBIsYb-Zo8lhfANWdZJsISmtG-L3Zes';

// ID folder Drive untuk menyimpan PDF (kosong = root My Drive)
const SPMB_FOLDER_ID = '';

function doGet(e) {
  if (e.parameter && e.parameter.data) {
    try {
      var data   = JSON.parse(decodeURIComponent(e.parameter.data));
      var result = cleanAndExportSPMB(data);
      return HtmlService.createHtmlOutput(
        '<html><head><meta charset="UTF-8"><title>SPMB Siap</title></head><body>' +
        '<p style="font-family:sans-serif;padding:20px;font-size:14px;">✅ SPMB siap! Mengunduh...</p>' +
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
    '<html><body style="font-family:sans-serif;padding:40px;">' +
    '<h2>✓ SPMB Generator aktif</h2>' +
    '<p>Template ID: ' + SPMB_TEMPLATE_ID + '</p>' +
    '</body></html>'
  );
}

function doPost(e) { return doGet(e); }

/**
 * Main function: isi placeholder, hapus baris kosong, export PDF
 */
function cleanAndExportSPMB(data) {
  var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];
  var tgl    = new Date(data.tanggal);
  var tglStr = tgl.getDate() + ' ' + bulan[tgl.getMonth()] + ' ' + tgl.getFullYear();

  // 1. Buka spreadsheet template
  var ss            = SpreadsheetApp.openById(SPMB_TEMPLATE_ID);
  var templateSheet = ss.getSheetByName('SPMB_Format') || ss.getSheets()[0];
  var tempName      = 'TEMP_SPMB_PRINT';

  // 2. Hapus TEMP sheet lama jika ada
  var oldTemp = ss.getSheetByName(tempName);
  if (oldTemp) ss.deleteSheet(oldTemp);

  // 3. Copy sheet template ke sheet sementara
  var tempSheet = templateSheet.copyTo(ss).setName(tempName);

  // 4. Isi placeholder header
  // H9  : nomor SPMB
  // C12 : "Sub Bagian / Seksi : {{nama divisi}}"
  // C13 : "Berdasarkan Surat Permintaan Barang No : {{nomor Bon}}"
  // C14 : "Tanggal : {{tanggal}}"
  // C51 : "Diterima : {{tanggal}}"
  // G51 : "Dikeluarkan : {{tanggal}}"
  // K51 : "Tg. Balai Karimun , {{tanggal}}"
  // C52 : "Kepala {{nama divisi}}"
  // C58 : {{pemohon}}
  // G58 : {{staff gudang}}
  // K58 : {{nama kepala divisi}}

  replaceInSheet(tempSheet, '{{nomor SPMB}}',        data.spmb_number  || data.bon_number || '');
  replaceInSheet(tempSheet, '{{nomor Bon}}',          data.bon_number   || '');
  replaceInSheet(tempSheet, '{{nama divisi}}',        data.divisi_nama  || '');
  replaceInSheet(tempSheet, '{{tanggal}}',            tglStr);
  replaceInSheet(tempSheet, '{{pemohon}}',            data.pemohon_nama || '');
  replaceInSheet(tempSheet, '{{staff gudang}}',       data.staf_gudang  || '');
  replaceInSheet(tempSheet, '{{nama kepala divisi}}', data.kepala_nama  || '');

  // 5. Isi item barang D17:D50
  //    Kolom: D=nama, I=jumlah, K=satuan, M=keterangan
  var items = data.items || [];
  for (var i = 0; i < 34; i++) {
    var rowNum = 17 + i;
    if (i < items.length) {
      var it = items[i];
      tempSheet.getRange('D' + rowNum).setValue(it.nama        || '');
      tempSheet.getRange('I' + rowNum).setValue(it.jumlah      || '');
      tempSheet.getRange('K' + rowNum).setValue(it.satuan      || '');
      // Keterangan: pakai keterangan item, atau fallback ke keterangan bon
      tempSheet.getRange('M' + rowNum).setValue(it.keterangan  || data.keterangan || '');
    } else {
      // Bersihkan placeholder agar deleteRow bisa deteksi baris kosong
      tempSheet.getRange('D' + rowNum).setValue('');
      tempSheet.getRange('I' + rowNum).setValue('');
      tempSheet.getRange('K' + rowNum).setValue('');
      tempSheet.getRange('M' + rowNum).setValue('');
    }
  }

  SpreadsheetApp.flush();

  // 6. Hapus baris item kosong D17:D50 dari bawah ke atas
  for (var row = 50; row >= 17; row--) {
    if (tempSheet.getRange('D' + row).getValue() === '') {
      tempSheet.deleteRow(row);
    }
  }

  SpreadsheetApp.flush();

  // 7. Export PDF — range B3:O[lastRow] dinamis
  var spreadsheetId = ss.getId();
  var sheetId       = tempSheet.getSheetId();
  var lastRow       = tempSheet.getLastRow();
  var token         = ScriptApp.getOAuthToken();

  var expUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export' +
    '?format=pdf' +
    '&gid=' + sheetId +
    '&range=B3:O' + lastRow +
    '&size=LEGAL' +
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
    throw new Error('Export PDF gagal: HTTP ' + resp.getResponseCode() + ' — ' + resp.getContentText().slice(0, 100));
  }

  // 8. Simpan PDF ke Drive
  var pdfName = (data.spmb_number || data.bon_number).replace(/\//g, '-') + '_SPMB.pdf';
  var pdfBlob = resp.getBlob().setName(pdfName);

  var folder;
  if (SPMB_FOLDER_ID) {
    try { folder = DriveApp.getFolderById(SPMB_FOLDER_ID); }
    catch(e) { folder = DriveApp.getRootFolder(); }
  } else {
    folder = DriveApp.getRootFolder();
  }

  // Hapus file lama dengan nama sama
  var existing = folder.getFilesByName(pdfName);
  while (existing.hasNext()) existing.next().setTrashed(true);

  var file = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 9. Hapus sheet sementara
  ss.deleteSheet(tempSheet);

  Logger.log('SPMB generated: ' + pdfName);

  var fileId = file.getId();
  return {
    filename:    pdfName,
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
    viewUrl:     'https://drive.google.com/file/d/' + fileId + '/view'
  };
}

// ── Helper: ganti semua placeholder di sheet ──
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
