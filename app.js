
// ── Konfigurasi URL ──
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4qgEpJJ-T66mS1gy__Ricvn-tjIA7E4Haoykwkk0xvoZAiU2aSWV1jA0dGL0sduVy/exec';
const TTD_UPLOAD_URL  = 'https://script.google.com/macros/s/AKfycbx4qgEpJJ-T66mS1gy__Ricvn-tjIA7E4Haoykwkk0xvoZAiU2aSWV1jA0dGL0sduVy/exec';
const SPMB_SCRIPT_URL  = 'https://script.google.com/macros/s/AKfycbwqzGul00sCmxORYMz8Cf_3BiNmKkvtjdCkkB1okGG7D4lale1qU781ajf0IUFxCnk8/exec';

// ================================================================
// DATA & STATE
// ================================================================
const USERS = [
  { id:1, email:'pemohon',     pass:'admin123', nama:'Pemohon',     jabatan:'Pelaksana',                                          unit:'BC 30005', role:'PEMOHON',     avatar:'PM', divisi_id:null },
  { id:2, email:'assessor',    pass:'admin123', nama:'Assessor',    jabatan:'Kepala Seksi Pengelolaan Kapal dan Sarana Pendukung', unit:'-',        role:'ASSESSOR',    avatar:'AS', divisi_id:3    },
  { id:3, email:'gudang',      pass:'admin123', nama:'Staff Gudang',jabatan:'Staff Perbekalan Gudang',                            unit:'-',        role:'GUDANG',      avatar:'GD', divisi_id:null },
  { id:4, email:'admingudang', pass:'admin123', nama:'Admin Gudang',jabatan:'Admin Gudang',                                       unit:'-',        role:'ADMIN_GUDANG',avatar:'AG', divisi_id:null },
  { id:5, email:'superadmin',  pass:'admin123', nama:'Super Admin', jabatan:'System Administrator',                               unit:'-',        role:'SUPER_ADMIN', avatar:'SA', divisi_id:null },
];

// Checklist state per bon { bonId: Set of checked indices }
const CHECKLIST_STATE = {};

// ── NOTIFIKASI ──
// { id, user_ids:[], type, message, bon_id, timestamp, read_by:Set }
let NOTIF_LIST = [
  { id:1, user_ids:[1],   type:'approved',  message:'BON-264/PSO.13/2026 disetujui oleh Assessor', bon_id:105, timestamp:'2026-04-09T09:15:00', read_by:new Set() },
  { id:2, user_ids:[2],   type:'submitted', message:'Request baru masuk — bon baru (PSO.13)', bon_id:106, timestamp:'2026-04-11T10:30:00', read_by:new Set() },
  { id:3, user_ids:[3],   type:'sent_gudang', message:'BON-263/PSO.13/2026 diajukan ke gudang oleh Assessor', bon_id:102, timestamp:'2026-04-03T14:00:00', read_by:new Set() },
];
let NOTIF_SEQ = 10;

function addNotif(user_ids, type, message, bon_id) {
  NOTIF_LIST.unshift({ id:++NOTIF_SEQ, user_ids, type, message, bon_id, timestamp:new Date().toISOString(), read_by:new Set() });
  refreshNotifBadge();
}

function getMyNotifs() {
  if (!S.user) return [];
  return NOTIF_LIST.filter(n => n.user_ids.includes(S.user.id));
}

function getUnreadCount() {
  return getMyNotifs().filter(n => !n.read_by.has(S.user.id)).length;
}

function refreshNotifBadge() {
  const dot = document.getElementById('notif-dot');
  const cnt = document.getElementById('notif-count');
  const n = getUnreadCount();
  if (dot) dot.style.display = n > 0 ? 'block' : 'none';
  if (cnt) { cnt.textContent = n > 0 ? n : ''; cnt.style.display = n > 0 ? 'flex' : 'none'; }
}

// ── AUDIT LOG ──
// { id, bon_id, bon_number, actor, actor_role, action, detail, timestamp }
let AUDIT_LOG = [
  { id:1,  bon_id:101, bon_number:'BON-261/PSO.13/2026', actor:'Agus Suryanto',  actor_role:'PEMOHON',  action:'SUBMITTED',      detail:'Request diajukan dengan 2 item',                         timestamp:'2026-03-15T08:00:00' },
  { id:2,  bon_id:101, bon_number:'BON-261/PSO.13/2026', actor:'Hendra Saputra', actor_role:'ASSESSOR', action:'APPROVED',       detail:'Disetujui. Bon PDF diterbitkan',                          timestamp:'2026-03-15T09:30:00' },
  { id:3,  bon_id:101, bon_number:'BON-261/PSO.13/2026', actor:'Hendra Saputra', actor_role:'ASSESSOR', action:'SENT_GUDANG',    detail:'Diajukan ke Staff Gudang untuk verifikasi',               timestamp:'2026-03-15T09:35:00' },
  { id:4,  bon_id:101, bon_number:'BON-261/PSO.13/2026', actor:'Ahmad Fadli',    actor_role:'GUDANG',   action:'COMPLETED',      detail:'Semua item terverifikasi. Stok dikurangi. SPMB terbit',   timestamp:'2026-03-18T11:00:00' },
  { id:5,  bon_id:102, bon_number:'BON-263/PSO.13/2026', actor:'Agus Suryanto',  actor_role:'PEMOHON',  action:'SUBMITTED',      detail:'Request diajukan dengan 1 item',                         timestamp:'2026-04-02T08:30:00' },
  { id:6,  bon_id:102, bon_number:'BON-263/PSO.13/2026', actor:'Hendra Saputra', actor_role:'ASSESSOR', action:'APPROVED',       detail:'Disetujui oleh Hendra Saputra',                          timestamp:'2026-04-03T10:00:00' },
  { id:7,  bon_id:102, bon_number:'BON-263/PSO.13/2026', actor:'Hendra Saputra', actor_role:'ASSESSOR', action:'SENT_GUDANG',    detail:'Diajukan ke Staff Gudang',                               timestamp:'2026-04-03T14:00:00' },
  { id:8,  bon_id:105, bon_number:'BON-264/PSO.13/2026', actor:'Budi Santoso',   actor_role:'PEMOHON',  action:'SUBMITTED',      detail:'Request diajukan dengan 2 item',                         timestamp:'2026-04-09T08:00:00' },
  { id:9,  bon_id:105, bon_number:'BON-264/PSO.13/2026', actor:'Hendra Saputra', actor_role:'ASSESSOR', action:'APPROVED',       detail:'Disetujui. BON-264/PSO.13/2026 diterbitkan',             timestamp:'2026-04-09T09:15:00' },
];
let AUDIT_SEQ = 20;

function addAudit(bon_id, bon_number, action, detail) {
  if (!S.user) return;
  AUDIT_LOG.push({ id:++AUDIT_SEQ, bon_id, bon_number:bon_number||'—', actor:S.user.nama, actor_role:S.user.role, action, detail, timestamp:new Date().toISOString() });
}

function getAuditForBon(bon_id) {
  return AUDIT_LOG.filter(a => a.bon_id === bon_id).sort((a,b) => a.timestamp.localeCompare(b.timestamp));
}

function fmtTs(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) + ' ' + d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}

const MASTER_SEKSI = [
  { id:1, kode_bon:'PSO.11', kode_spmb:'PSO.11/SBU', nama:'Subbagian Umum dan KI',             akronim:'SBUKI', kepala:'Ema Susanti',             icon:'🏢' },
  { id:2, kode_bon:'PSO.12', kode_spmb:'PSO.11/AWK', nama:'Seksi Pengawakan',                  akronim:'AWK',   kepala:'Arintoko Aji',            icon:'👥' },
  { id:3, kode_bon:'PSO.13', kode_spmb:'PSO.11/KSP', nama:'Seksi Pengelolaan Kapal & Sarana Pendukung', akronim:'PKSP', kepala:'Hendra Saputra',   icon:'⚓' },
  { id:4, kode_bon:'PSO.14', kode_spmb:'PSO.11/TLI', nama:'Seksi Telekomunikasi & Penginderaan', akronim:'TLI', kepala:'Muhammad Muhtadi Firdaus', icon:'📡' },
  { id:5, kode_bon:'PSO.15', kode_spmb:'PSO.11/KLT', nama:'Seksi Kelaiklautan',                akronim:'KLT',   kepala:'Iwan Hartawan',           icon:'🚢' },
];

const BARANG_DB = [
  { id:1,  kode:'1010101006000002', nama:'Cat Kapal FPB 28 Abu-Abu Tua Marine 5L', satuan:'KALENG', stok:24, rak:'Rak A1-01', divisi_id:3, emoji:'🎨', deskripsi:'Cat anti-korosi untuk lambung kapal. Tahan air laut & UV.' },
  { id:2,  kode:'1010101005000003', nama:'Batu Asah Datar 200mm',                  satuan:'BUAH',   stok:12,  rak:'Rak B2-03', divisi_id:3, emoji:'🪨', deskripsi:'Batu asah dua sisi: kasar #120 & halus #240. Untuk mengasah peralatan bengkel.' },
  { id:5,  kode:'1010201001000001', nama:'Kuas Cat 3 Inch',                         satuan:'BUAH',   stok:30,  rak:'Rak A1-02', divisi_id:3, emoji:'🖌️', deskripsi:'Kuas bulu nilon tahan solvent, untuk pengecatan lambung dan dek kapal.' },
  { id:6,  kode:'1010201001000002', nama:'Kuas Cat 2 Inch',                         satuan:'BUAH',   stok:20,  rak:'Rak A1-02', divisi_id:3, emoji:'🖌️', deskripsi:'Kuas bulu nilon untuk pekerjaan detail dan area sempit.' },
  { id:7,  kode:'1010101006000010', nama:'Cat Kapal FPB 28 Putih Marine 5L',        satuan:'KALENG', stok:18, rak:'Rak A1-01', divisi_id:3, emoji:'🎨', deskripsi:'Cat putih marine untuk dek dan bangunan atas kapal. Tahan UV dan air laut.' },
  { id:8,  kode:'1010101006000011', nama:'Thinner Nitro 1 Liter',                   satuan:'KALENG', stok:2,  rak:'Rak A2-01', divisi_id:3, emoji:'🧴', deskripsi:'Thinner nitrocellulose serbaguna. Jauhkan dari sumber api.' },
  { id:11, kode:'1010201005000001', nama:'Ampelas Besi 80 Grit',                    satuan:'BUAH',   stok:50,  rak:'Rak B1-01', divisi_id:3, emoji:'📄', deskripsi:'Ampelas grit 80 ukuran 230x280mm untuk pengamplasan besi sebelum pengecatan.' },
  { id:14, kode:'1010101007000001', nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',       satuan:'KALENG', stok:10,  rak:'Rak A3-02', divisi_id:3, emoji:'⚙️', deskripsi:'Grease EP2 multipurpose untuk pelumasan bantalan poros dan gear kapal.' },
  { id:15, kode:'1010101007000002', nama:'Oli Mesin SAE 40 1 Liter',                satuan:'BUAH',   stok:24,  rak:'Rak A3-01', divisi_id:3, emoji:'🛢️', deskripsi:'Oli mesin diesel SAE 40. Ganti setiap 250 jam operasi mesin kapal patroli.' },
  { id:3,  kode:'1010304999000001', nama:'Keyboard Logitech K270',                  satuan:'BUAH',   stok:5, rak:'Rak C1-02', divisi_id:1, emoji:'⌨️', deskripsi:'Keyboard wireless 2.4GHz jangkauan 10m. USB nano receiver. Windows/Linux.' },
  { id:4,  kode:'1010304999000002', nama:'Mouse Wireless Logitech M185',            satuan:'BUAH',   stok:8, rak:'Rak C1-03', divisi_id:1, emoji:'🖱️', deskripsi:'Mouse wireless 2.4GHz. Baterai AA 1 tahun. Sensor optis 1000 DPI.' },
  { id:12, kode:'1010304001000001', nama:'Tinta Printer Hitam Epson L3110',         satuan:'BUAH',   stok:6,  rak:'Rak C2-01', divisi_id:1, emoji:'🖨️', deskripsi:'Tinta original Epson 664 hitam. Kapasitas 4000 halaman. Khusus L-series.' },
  { id:13, kode:'1010304001000002', nama:'Tinta Printer Warna Epson L3110 (Set)',   satuan:'SET',    stok:4, rak:'Rak C2-01', divisi_id:1, emoji:'🖨️', deskripsi:'Set tinta 3 warna Epson 664 (C/M/Y). 6500 halaman per warna.' },
  { id:9,  kode:'1010501001000001', nama:'Kabel UTP Cat6 Per Meter',                satuan:'METER',  stok:150,   rak:'Rak D3-01', divisi_id:4, emoji:'🔌', deskripsi:'Kabel UTP Cat6, max 1Gbps. Standar TIA/EIA-568-B.2-1.' },
  { id:10, kode:'1010501001000002', nama:'Konektor RJ45 Cat6',                      satuan:'BUAH',   stok:200,   rak:'Rak D3-02', divisi_id:4, emoji:'🔌', deskripsi:'Konektor RJ45 Cat6, 50 micron gold plated. Crimping tipe 8 pin.' },
];

// Bon number sequences per divisi per tahun
const BON_SEQ = { 3: 264, 1: 42, 2: 18, 4: 31, 5: 55 };

// Shared bon list (both roles see same data)
let BON_LIST = [
  // ── COMPLETED ──
  { id:101, bon_number:'BON-261/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Pelaksana', pemohon_unit:'BC 30005', keterangan:'Untuk keperluan pengecatan ulang lambung kapal BC 30005 B', status:'COMPLETED', tanggal:'2026-03-15', tgl_approve:'2026-03-15', tgl_selesai:'2026-03-18', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi Pengelolaan Kapal dan Sarana Pendukung', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Agus Suryanto', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:1,nama:'Cat Kapal FPB 28 Abu-Abu Tua Marine 5L',jumlah:6,satuan:'KALENG',kode:'1010101006000002',rak:'Rak A1-01',emoji:'🎨'},{barang_id:5,nama:'Kuas Cat 3 Inch',jumlah:4,satuan:'BUAH',kode:'1010201001000001',rak:'Rak A1-02',emoji:'🖌️'}]},
  { id:107, bon_number:'BON-255/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Budi Santoso', pemohon_jabatan:'Analis', pemohon_unit:'BC 20008', keterangan:'Penggantian oli mesin dan filter BC 20008', status:'COMPLETED', tanggal:'2026-03-01', tgl_approve:'2026-03-02', tgl_selesai:'2026-03-04', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Budi Santoso', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:8,satuan:'BUAH',kode:'1010101007000002',rak:'Rak A3-01',emoji:'🛢️'},{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:3,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'}]},
  { id:108, bon_number:'BON-256/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Doni Prasetyo', pemohon_jabatan:'Nahkoda', pemohon_unit:'BC 10001', keterangan:'Persiapan operasi patroli rutin', status:'COMPLETED', tanggal:'2026-03-05', tgl_approve:'2026-03-06', tgl_selesai:'2026-03-07', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Doni Prasetyo', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:7,nama:'Cat Kapal FPB 28 Putih Marine 5L',jumlah:4,satuan:'KALENG',kode:'1010101006000010',rak:'Rak A1-01',emoji:'🎨'},{barang_id:11,nama:'Ampelas Besi 80 Grit',jumlah:20,satuan:'BUAH',kode:'1010201005000001',rak:'Rak B1-01',emoji:'📄'},{barang_id:5,nama:'Kuas Cat 3 Inch',jumlah:3,satuan:'BUAH',kode:'1010201001000001',rak:'Rak A1-02',emoji:'🖌️'}]},
  { id:109, bon_number:'BON-257/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Rizky Firmansyah', pemohon_jabatan:'KKM', pemohon_unit:'BC 20002', keterangan:'Pemeliharaan mesin induk BC 20002', status:'COMPLETED', tanggal:'2026-03-08', tgl_approve:'2026-03-09', tgl_selesai:'2026-03-10', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Rizky Firmansyah', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:5,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'},{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:12,satuan:'BUAH',kode:'1010101007000002',rak:'Rak A3-01',emoji:'🛢️'},{barang_id:2,nama:'Batu Asah Datar 200mm',jumlah:2,satuan:'BUAH',kode:'1010101005000003',rak:'Rak B2-03',emoji:'🪨'}]},
  { id:110, bon_number:'BON-259/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Pelaksana', pemohon_unit:'BC 9002', keterangan:'Pengecatan ulang dek dan lambung BC 9002', status:'COMPLETED', tanggal:'2026-03-12', tgl_approve:'2026-03-13', tgl_selesai:'2026-03-16', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Agus Suryanto', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:1,nama:'Cat Kapal FPB 28 Abu-Abu Tua Marine 5L',jumlah:8,satuan:'KALENG',kode:'1010101006000002',rak:'Rak A1-01',emoji:'🎨'},{barang_id:7,nama:'Cat Kapal FPB 28 Putih Marine 5L',jumlah:4,satuan:'KALENG',kode:'1010101006000010',rak:'Rak A1-01',emoji:'🎨'},{barang_id:8,nama:'Thinner Nitro 1 Liter',jumlah:6,satuan:'KALENG',kode:'1010101006000011',rak:'Rak A2-01',emoji:'🧴'},{barang_id:6,nama:'Kuas Cat 2 Inch',jumlah:8,satuan:'BUAH',kode:'1010201001000002',rak:'Rak A1-02',emoji:'🖌️'}]},
  { id:111, bon_number:'BON-260/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Budi Santoso', pemohon_jabatan:'Analis', pemohon_unit:'BC 7004', keterangan:'Keperluan bengkel mesin rutin', status:'COMPLETED', tanggal:'2026-03-14', tgl_approve:'2026-03-14', tgl_selesai:'2026-03-15', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Budi Santoso', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:2,nama:'Batu Asah Datar 200mm',jumlah:4,satuan:'BUAH',kode:'1010101005000003',rak:'Rak B2-03',emoji:'🪨'},{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:2,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'}]},
  { id:112, bon_number:'BON-262/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Doni Prasetyo', pemohon_jabatan:'Nahkoda', pemohon_unit:'BC 30001', keterangan:'Persiapan docking tahunan BC 30001', status:'COMPLETED', tanggal:'2026-03-20', tgl_approve:'2026-03-21', tgl_selesai:'2026-03-23', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Doni Prasetyo', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:11,nama:'Ampelas Besi 80 Grit',jumlah:30,satuan:'BUAH',kode:'1010201005000001',rak:'Rak B1-01',emoji:'📄'},{barang_id:1,nama:'Cat Kapal FPB 28 Abu-Abu Tua Marine 5L',jumlah:10,satuan:'KALENG',kode:'1010101006000002',rak:'Rak A1-01',emoji:'🎨'},{barang_id:8,nama:'Thinner Nitro 1 Liter',jumlah:5,satuan:'KALENG',kode:'1010101006000011',rak:'Rak A2-01',emoji:'🧴'}]},
  { id:113, bon_number:'BON-265/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Rizky Firmansyah', pemohon_jabatan:'KKM', pemohon_unit:'BC 20005', keterangan:'Servis mesin bantu BC 20005', status:'COMPLETED', tanggal:'2026-04-01', tgl_approve:'2026-04-01', tgl_selesai:'2026-04-03', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Rizky Firmansyah', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:4,satuan:'BUAH',kode:'1010101007000002',rak:'Rak A3-01',emoji:'🛢️'},{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:2,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'}]},
  { id:114, bon_number:'BON-266/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Mualim I', pemohon_unit:'BC 8001', keterangan:'Perbaikan cat lambung BC 8001 pasca patroli', status:'COMPLETED', tanggal:'2026-04-05', tgl_approve:'2026-04-05', tgl_selesai:'2026-04-07', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_pengambil:'Agus Suryanto', gudang_staf:'Ahmad Fadli', gudang_kepala:'Ratna Dewi',
    items:[{barang_id:7,nama:'Cat Kapal FPB 28 Putih Marine 5L',jumlah:6,satuan:'KALENG',kode:'1010101006000010',rak:'Rak A1-01',emoji:'🎨'},{barang_id:6,nama:'Kuas Cat 2 Inch',jumlah:5,satuan:'BUAH',kode:'1010201001000002',rak:'Rak A1-02',emoji:'🖌️'},{barang_id:11,nama:'Ampelas Besi 80 Grit',jumlah:15,satuan:'BUAH',kode:'1010201005000001',rak:'Rak B1-01',emoji:'📄'}]},

  // ── IN REVIEW / APPROVED ──
  { id:102, bon_number:'BON-263/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Pelaksana', pemohon_unit:'BC 30005', keterangan:'Untuk penajaman alat kerja seksi', status:'IN_REVIEW_GUDANG', tanggal:'2026-04-02', tgl_approve:'2026-04-03', tgl_selesai:null, assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:2,nama:'Batu Asah Datar 200mm',jumlah:2,satuan:'BUAH',kode:'1010101005000003',rak:'Rak B2-03',emoji:'🪨'}]},
  { id:105, bon_number:'BON-264/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Budi Santoso', pemohon_jabatan:'Analis', pemohon_unit:'BC 20008', keterangan:'Untuk penggantian injektor mesin bantu BC 20008 dan pemeliharaan rutin', status:'APPROVED', tanggal:'2026-04-09', tgl_approve:'2026-04-09', tgl_selesai:null, assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:6,satuan:'BUAH',kode:'1010101007000002',rak:'Rak A3-01',emoji:'🛢️'},{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:2,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'}]},
  { id:115, bon_number:'BON-267/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Doni Prasetyo', pemohon_jabatan:'Nahkoda', pemohon_unit:'BC 10001', keterangan:'Kebutuhan rutin perbekalan kapal patroli', status:'APPROVED', tanggal:'2026-04-10', tgl_approve:'2026-04-10', tgl_selesai:null, assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'', revision_count:0, has_ttd:true, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:6,satuan:'BUAH',kode:'1010101007000002',rak:'Rak A3-01',emoji:'🛢️'},{barang_id:8,nama:'Thinner Nitro 1 Liter',jumlah:3,satuan:'KALENG',kode:'1010101006000011',rak:'Rak A2-01',emoji:'🧴'}]},

  // ── SUBMITTED ──
  { id:103, bon_number:null, divisi_id:1, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Pelaksana', pemohon_unit:'BC 30005', keterangan:'Kebutuhan perlengkapan kantor seksi', status:'SUBMITTED', tanggal:'2026-04-08', tgl_approve:null, tgl_selesai:null, assessor_nama:'', assessor_jabatan:'', reject_notes:'', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:3,nama:'Keyboard Logitech K270',jumlah:1,satuan:'BUAH',kode:'1010304999000001',rak:'Rak C1-02',emoji:'⌨️'},{barang_id:4,nama:'Mouse Wireless Logitech M185',jumlah:2,satuan:'BUAH',kode:'1010304999000002',rak:'Rak C1-03',emoji:'🖱️'}]},
  { id:106, bon_number:null, divisi_id:3, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Pelaksana', pemohon_unit:'BC 30005', keterangan:'Kebutuhan mendesak untuk persiapan patroli rutin', status:'SUBMITTED', tanggal:'2026-04-11', tgl_approve:null, tgl_selesai:null, assessor_nama:'', assessor_jabatan:'', reject_notes:'', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:7,nama:'Cat Kapal FPB 28 Putih Marine 5L',jumlah:4,satuan:'KALENG',kode:'1010101006000010',rak:'Rak A1-01',emoji:'🎨'},{barang_id:11,nama:'Ampelas Besi 80 Grit',jumlah:10,satuan:'BUAH',kode:'1010201005000001',rak:'Rak B1-01',emoji:'📄'},{barang_id:6,nama:'Kuas Cat 2 Inch',jumlah:6,satuan:'BUAH',kode:'1010201001000002',rak:'Rak A1-02',emoji:'🖌️'}]},
  { id:116, bon_number:null, divisi_id:3, pemohon_user_id:1, pemohon_nama:'Rizky Firmansyah', pemohon_jabatan:'KKM', pemohon_unit:'BC 20009', keterangan:'Pemeliharaan sistem pelumasan mesin BC 20009', status:'SUBMITTED', tanggal:'2026-04-12', tgl_approve:null, tgl_selesai:null, assessor_nama:'', assessor_jabatan:'', reject_notes:'', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:4,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'},{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:6,satuan:'BUAH',kode:'1010101007000002',rak:'Rak A3-01',emoji:'🛢️'}]},

  // ── REJECTED ──
  { id:104, bon_number:'BON-258/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Agus Suryanto', pemohon_jabatan:'Pelaksana', pemohon_unit:'BC 30005', keterangan:'Pengecatan deck kapal BC 20008', status:'REJECTED_ASSESSOR', tanggal:'2026-03-10', tgl_approve:null, tgl_selesai:'2026-03-11', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'Stok cat sedang dalam proses pengadaan. Harap ajukan ulang 2 minggu lagi.', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:1,nama:'Cat Kapal FPB 28 Abu-Abu Tua Marine 5L',jumlah:10,satuan:'KALENG',kode:'1010101006000002',rak:'Rak A1-01',emoji:'🎨'}]},
  { id:117, bon_number:'BON-253/PSO.13/2026', divisi_id:3, pemohon_user_id:1, pemohon_nama:'Budi Santoso', pemohon_jabatan:'Masinis I', pemohon_unit:'BC 20003', keterangan:'Penggantian filter bahan bakar', status:'REJECTED_GUDANG', tanggal:'2026-02-20', tgl_approve:'2026-02-21', tgl_selesai:'2026-02-22', assessor_nama:'Hendra Saputra', assessor_jabatan:'Kepala Seksi', reject_notes:'Barang tidak tersedia di gudang. Perlu PO terlebih dahulu.', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'',
    items:[{barang_id:14,nama:'Gemuk Pelumas (Grease) Kaleng 1Kg',jumlah:3,satuan:'KALENG',kode:'1010101007000001',rak:'Rak A3-02',emoji:'⚙️'}]},
];


const S = {
  user: null,
  page: 'login',
  selectedDivisi: null,
  keranjang: {},
  filterSatuan: 'Semua',
  filterStatus: 'Semua',
  searchQ: '',
  assessorTab: 'masuk',
  assessorFilter: 'Semua',
  laporanDari: '2026-01-01',
  laporanSampai: '2026-04-13',
};

// ================================================================
// AUTH
// ================================================================
function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  const showErr = (msg) => { if(errEl){errEl.textContent=msg;errEl.style.display='block';} else alert(msg); };
  const u = USERS.find(x => x.email === username);
  if (!u) { showErr('Username tidak ditemukan'); return; }
  if (u.pass !== pass) { showErr('Password salah'); return; }
  if(errEl) errEl.style.display='none';
  S.user = u;
  document.getElementById('user-avatar').textContent = u.avatar;
  const avColors = {PEMOHON:'av-blue',ASSESSOR:'av-green',GUDANG:'av-orange',ADMIN_GUDANG:'av-purple',SUPER_ADMIN:'av-red'};
  document.getElementById('user-avatar').className = 'user-avatar ' + (avColors[u.role]||'av-blue');
  document.getElementById('user-name-disp').textContent = u.nama;
  const roleLabel = {PEMOHON:'Pemohon',ASSESSOR:'Staff Assessor',GUDANG:'Staff Gudang',ADMIN_GUDANG:'Admin Gudang',SUPER_ADMIN:'Super Admin'};
  document.getElementById('user-role-disp').textContent = roleLabel[u.role]||u.role;
  const subLabel = {PEMOHON:'Portal Pemohon',ASSESSOR:'Portal Assessor',GUDANG:'Portal Gudang',ADMIN_GUDANG:'Portal Admin Gudang',SUPER_ADMIN:'Portal Super Admin'};
  document.getElementById('topbar-sub').textContent = subLabel[u.role]||'Portal';
  document.getElementById('notif-dot').style.display = ['ASSESSOR','GUDANG','ADMIN_GUDANG'].includes(u.role) ? 'block' : 'none';
  showPage('app');
  setTimeout(refreshNotifBadge, 50);
  if (u.role==='ASSESSOR') renderAssessorDashboard();
  else if (u.role==='GUDANG') renderGudangDashboard();
  else if (u.role==='ADMIN_GUDANG') renderAdminGudangDashboard();
  else if (u.role==='SUPER_ADMIN') renderSuperAdminDashboard();
  else renderDashboardPemohon();
}
function doLogout() {
  S.user = null; S.keranjang = {}; S.selectedDivisi = null;
  hideKeranjang();
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  showPage('login');
}
function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
}

// ================================================================
// HELPERS
// ================================================================
function setContent(h) { document.getElementById('app-content').innerHTML = h; }
function getDivisi(id) { return MASTER_SEKSI.find(d => d.id === id); }
function getBarang(id) { return BARANG_DB.find(b => b.id === id); }
function getBon(id) { return BON_LIST.find(b => b.id == id); }
function showToast(msg, dur=2500) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', dur);
}
function showModal(html, lg=false) {
  document.getElementById('modal-container').innerHTML =
    `<div class="modal-overlay" onclick="handleOvClick(event)"><div class="modal ${lg?'modal-lg':''}">${html}</div></div>`;
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

// Global click delegation for ref-bon links (works for any modal)
document.addEventListener('click', function(e) {
  var elBon = e.target.closest('[data-bon]');
  if (elBon) { e.preventDefault(); openRefBon(elBon.getAttribute('data-bon')); return; }
  var elPb = e.target.closest('[data-pbdok]');
  if (elPb) { e.preventDefault(); openRefPembelian(elPb.getAttribute('data-pbdok')); }
});
function handleOvClick(e) { if(e.target.classList.contains('modal-overlay')) closeModal(); }

const STATUS_BADGE = {
  SUBMITTED:        '<span class="badge b-submitted">Menunggu Review</span>',
  APPROVED:         '<span class="badge b-approved">Disetujui</span>',
  IN_REVIEW_GUDANG: '<span class="badge b-inreview">In Review Gudang</span>',
  NEEDS_REVISION:   '<span class="badge b-revision">Perlu Revisi</span>',
  COMPLETED:        '<span class="badge b-completed">Selesai ✓</span>',
  REJECTED_ASSESSOR:'<span class="badge b-rejected">Ditolak (Assessor)</span>',
  REJECTED_GUDANG:  '<span class="badge b-rejected">Ditolak (Gudang)</span>',
};
const STATUS_FILTER = {
  'Semua':    null,
  'Pending':  ['SUBMITTED'],
  'Disetujui':['APPROVED'],
  'In Review':['IN_REVIEW_GUDANG','NEEDS_REVISION'],
  'Selesai':  ['COMPLETED'],
  'Ditolak':  ['REJECTED_ASSESSOR','REJECTED_GUDANG'],
};
function fmtDate(d) { if(!d) return '—'; return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); }
function fmtRupiah(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }

// ================================================================
// ================= PORTAL PEMOHON ===============================
// ================================================================
function renderDashboardPemohon() {
  hideKeranjang();
  refreshNotifBadge();
  const myBon = BON_LIST.filter(b => b.pemohon_user_id === S.user.id);
  const aktif = myBon.filter(b => ['SUBMITTED','APPROVED','IN_REVIEW_GUDANG','NEEDS_REVISION'].includes(b.status)).length;
  const completed = myBon.filter(b=>b.status==='COMPLETED').length;
  const rejected  = myBon.filter(b=>['REJECTED_ASSESSOR','REJECTED_GUDANG'].includes(b.status)).length;
  setContent(`
    <div style="margin-bottom:24px;">
      <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Selamat datang, ${S.user.nama.split(' ')[0]} 👋</div>
      <div style="font-size:13px;color:var(--gray-500);">Portal Pemohon — Sistem Permintaan Barang Persediaan</div>
    </div>

    <!-- Stat row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">
      <div style="background:linear-gradient(135deg,var(--primary) 0%,var(--primary-mid) 100%);border-radius:16px;padding:16px 18px;color:#fff;box-shadow:0 6px 20px var(--primary-glow);">
        <div style="font-size:28px;font-weight:800;font-family:var(--font-head);">${myBon.length}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:2px;font-weight:600;">Total Bon</div>
      </div>
      <div style="background:rgba(255,255,255,0.82);border:1px solid rgba(255,255,255,0.9);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow-md);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);">
        <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--warning);">${aktif}</div>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;font-weight:600;">Sedang Proses</div>
      </div>
      <div style="background:rgba(255,255,255,0.82);border:1px solid rgba(255,255,255,0.9);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow-md);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);">
        <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--success);">${completed}</div>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;font-weight:600;">Selesai</div>
      </div>
      <div style="background:rgba(255,255,255,0.82);border:1px solid rgba(255,255,255,0.9);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow-md);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);">
        <div style="font-size:28px;font-weight:800;font-family:var(--font-head);color:var(--danger);">${rejected}</div>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;font-weight:600;">Ditolak</div>
      </div>
    </div>

    <!-- Action cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
      <div onclick="renderAjukanStep1()" style="background:rgba(255,255,255,0.82);border:1.5px solid rgba(255,255,255,0.9);border-radius:20px;padding:24px;cursor:pointer;transition:all 0.2s;box-shadow:var(--shadow-md);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:flex-start;gap:16px;position:relative;overflow:hidden;"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 16px 40px rgba(3,105,161,0.15)';this.style.borderColor='rgba(3,105,161,0.3)'"
         onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='rgba(255,255,255,0.9)'">
        <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--primary-light),rgba(2,132,199,0.15));display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:24px;box-shadow:0 4px 12px rgba(3,105,161,0.12);">➕</div>
        <div>
          <div style="font-family:var(--font-head);font-size:15px;font-weight:700;color:var(--gray-900);margin-bottom:5px;">Ajukan Bon Baru</div>
          <div style="font-size:12px;color:var(--gray-500);line-height:1.55;">Buat permintaan barang dari katalog gudang</div>
          <div style="margin-top:10px;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--primary);">Mulai →</div>
        </div>
      </div>

      <div onclick="renderBonBerjalan()" style="background:rgba(255,255,255,0.82);border:1.5px solid rgba(255,255,255,0.9);border-radius:20px;padding:24px;cursor:pointer;transition:all 0.2s;box-shadow:var(--shadow-md);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:flex-start;gap:16px;"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 16px 40px rgba(13,148,136,0.15)';this.style.borderColor='rgba(13,148,136,0.3)'"
         onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='rgba(255,255,255,0.9)'">
        <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--success-light),rgba(13,148,136,0.15));display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:24px;box-shadow:0 4px 12px rgba(13,148,136,0.12);">📋</div>
        <div>
          <div style="font-family:var(--font-head);font-size:15px;font-weight:700;color:var(--gray-900);margin-bottom:5px;">Bon Berjalan Saya</div>
          <div style="font-size:12px;color:var(--gray-500);line-height:1.55;">Pantau status, download bon, upload TTD</div>
          ${aktif > 0 ? `<div style="margin-top:8px;"><span style="background:rgba(217,119,6,0.12);color:var(--warning);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${aktif} sedang proses</span></div>` : ''}
          <div style="margin-top:10px;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--success);">Lihat →</div>
        </div>
      </div>
    </div>
  `);
}

// ---- STEP 1: PILIH DIVISI ----
function renderAjukanStep1() {
  S.selectedDivisi = null; S.keranjang = {}; hideKeranjang();
  setContent(`
    <div class="breadcrumb"><a onclick="renderDashboardPemohon()">Dashboard</a><span>›</span><span>Ajukan Bon</span></div>
    <div class="steps">
      <div class="step active"><div class="step-num">1</div><div class="step-label">Pilih Divisi</div></div>
      <div class="step-line"></div>
      <div class="step inactive"><div class="step-num">2</div><div class="step-label">Katalog Barang</div></div>
      <div class="step-line"></div>
      <div class="step inactive"><div class="step-num">3</div><div class="step-label">Submit Bon</div></div>
    </div>
    <div style="padding:20px 20px 8px;">
      <div style="font-family:var(--font-head);font-size:18px;font-weight:800;color:var(--gray-900);margin-bottom:4px;">Pilih Divisi</div>
      <div style="font-size:12px;color:var(--gray-500);">Satu bon hanya untuk satu divisi</div>
    </div>
    <div class="divisi-grid">
      ${MASTER_SEKSI.map(d => `
        <div class="divisi-card" onclick="selectDivisi(${d.id})">
          <div class="divisi-icon">${d.icon}</div>
          <div class="divisi-name">${d.nama}</div>
          <div class="divisi-kode">${d.kode_bon}</div>
        </div>`).join('')}
    </div>`);
}
function selectDivisi(id) {
  S.selectedDivisi = getDivisi(id);
  S.filterSatuan = 'Semua'; S.searchQ = '';
  renderAjukanStep2();
}

// ---- STEP 2: KATALOG ----
function renderAjukanStep2() {
  const d = S.selectedDivisi;
  const all = BARANG_DB.filter(b => b.divisi_id === d.id);
  const satuans = ['Semua', ...new Set(all.map(b => b.satuan))];
  setContent(`
    <div class="breadcrumb"><a onclick="renderDashboardPemohon()">Dashboard</a><span>›</span><a onclick="renderAjukanStep1()">Ajukan Bon</a><span>›</span><span>Katalog ${d.kode_bon}</span></div>
    <div class="steps">
      <div class="step done"><div class="step-num">✓</div><div class="step-label">Pilih Divisi</div></div>
      <div class="step-line done"></div>
      <div class="step active"><div class="step-num">2</div><div class="step-label">Katalog Barang</div></div>
      <div class="step-line"></div>
      <div class="step inactive"><div class="step-num">3</div><div class="step-label">Submit Bon</div></div>
    </div>
    <div style="background:#fff;border:1px solid var(--gray-200);border-radius:10px;padding:11px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:22px;">${d.icon}</span>
      <div style="flex:1;"><div style="font-weight:600;font-size:14px;">${d.nama}</div><div style="font-size:11px;color:var(--gray-500);">${d.kode_bon} · Kepala: ${d.kepala}</div></div>
      <a onclick="renderAjukanStep1()" style="font-size:12px;color:var(--primary);cursor:pointer;">Ganti ↩</a>
    </div>
    <div class="katalog-top">
      <div class="search-bar">
        <span class="search-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
        <input type="text" id="search-input" placeholder="Cari nama atau kode barang..." oninput="S.searchQ=this.value;renderItemGrid()" value="${S.searchQ}">
      </div>
    </div>
    <div class="filter-chips" id="filter-chips">
      ${satuans.map(s=>`<button class="chip ${S.filterSatuan===s?'active':''}" onclick="setSatuanFilter('${s}')">${s}</button>`).join('')}
    </div>
    <div id="item-grid-container"></div>
    <div class="spacer-bottom"></div>`);
  renderItemGrid();
  updateKeranjangBar();
}
function setSatuanFilter(s) {
  S.filterSatuan = s;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.textContent === s));
  renderItemGrid();
}
function renderItemGrid() {
  const d = S.selectedDivisi;
  let list = BARANG_DB.filter(b => b.divisi_id === d.id);
  if (S.filterSatuan !== 'Semua') list = list.filter(b => b.satuan === S.filterSatuan);
  if (S.searchQ) { const q = S.searchQ.toLowerCase(); list = list.filter(b => b.nama.toLowerCase().includes(q) || b.kode.includes(q)); }
  const c = document.getElementById('item-grid-container');
  if (!c) return;
  if (!list.length) { c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-400);">📦 Tidak ada barang ditemukan</div>'; return; }
  c.innerHTML = `<div class="item-grid">${list.map(b => {
    const qty = S.keranjang[b.id] || 0;
    const sc = b.stok === 0 ? 'stok-empty' : b.stok < 5 ? 'stok-low' : 'stok-ok';
    const st = b.stok === 0 ? 'Stok habis' : b.stok < 5 ? `Stok: ${b.stok} ⚠` : `Stok: ${b.stok}`;
    return `<div class="item-card">
      <div class="item-img">${b.emoji}</div>
      <div class="item-body">
        <div class="item-name">${b.nama}</div>
        <div class="item-kode">${b.kode}</div>
        ${b.deskripsi ? `<div style="font-size:10px;color:var(--gray-500);line-height:1.4;margin-bottom:5px;border-top:1px solid var(--gray-100);padding-top:5px;">${b.deskripsi}</div>` : ''}
        <div class="item-stok ${sc}">${st} ${b.satuan.toLowerCase()}</div>
        <div class="item-footer">
          <span class="item-satuan">${b.satuan}</span>
          ${b.stok===0 ? '<span style="font-size:11px;color:var(--danger)">Habis</span>' :
            qty===0 ? `<button class="qty-btn add" onclick="addCart(${b.id})" title="Tambah ke keranjang" style="width:32px;height:32px;font-size:16px;">+</button>` :
            `<div class="qty-control">
              <button class="qty-btn" onclick="decQty(${b.id})">−</button>
              <input class="qty-input" type="number" min="1" max="${b.stok}" value="${qty}" onchange="setQty(${b.id},this.value,${b.stok})">
              <button class="qty-btn add" onclick="incQty(${b.id},${b.stok})">+</button>
            </div>`}
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}
function addCart(id) { S.keranjang[id]=1; renderItemGrid(); updateKeranjangBar(); }
function incQty(id,max) { if((S.keranjang[id]||0)<max) S.keranjang[id]=(S.keranjang[id]||0)+1; renderItemGrid(); updateKeranjangBar(); }
function decQty(id) { if((S.keranjang[id]||0)<=1) delete S.keranjang[id]; else S.keranjang[id]--; renderItemGrid(); updateKeranjangBar(); }
function setQty(id,v,max) { const n=Math.min(Math.max(1,parseInt(v)||1),max); S.keranjang[id]=n; renderItemGrid(); updateKeranjangBar(); }
function updateKeranjangBar() {
  const keys = Object.keys(S.keranjang);
  const bar = document.getElementById('keranjang-bar');
  if (!keys.length) { bar.style.display='none'; return; }
  bar.style.display='flex';
  document.getElementById('kj-count').textContent = keys.length;
  const total = keys.reduce((s,k)=>s+S.keranjang[k],0);
  const names = keys.slice(0,2).map(k=>{const b=BARANG_DB.find(x=>x.id==k);return b?b.nama.split(' ').slice(0,3).join(' '):'';});
  document.getElementById('kj-preview').textContent=`${total} item — ${names.join(', ')}${keys.length>2?'...':''}`;
}
function hideKeranjang() { document.getElementById('keranjang-bar').style.display='none'; }

// ---- STEP 3: SUBMIT POPUP ----
function showSubmitPopup() {
  const cartItems = Object.entries(S.keranjang).map(([id,qty])=>{const b=BARANG_DB.find(x=>x.id==id);return b?{...b,qty}:null;}).filter(Boolean);
  showModal(`
    <div class="modal-header"><h3>Konfirmasi & Submit Bon</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="alert alert-info">Data ini akan digunakan untuk mengisi bon permintaan barang.</div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-500);margin-bottom:6px;">Ringkasan Item (${cartItems.length} jenis)</div>
      <div style="background:rgba(241,249,255,0.8);border:1px solid rgba(3,105,161,0.1);border-radius:14px;padding:12px 14px;margin-bottom:14px;">
        ${cartItems.map(b=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--gray-100);font-size:12px;"><span>${b.emoji} ${b.nama}</span><span style="font-weight:600;">${b.qty} ${b.satuan}</span></div>`).join('')}
      </div>
      <div class="form-row">
        <div class="form-group"><label>Nama Lengkap <span style="color:var(--danger)">*</span></label><input id="f-nama" value="${S.user.nama}"></div>
        <div class="form-group"><label>Jabatan <span style="color:var(--danger)">*</span><br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">untuk rekap</span></label><select id="f-jabatan"><option value="Staf" ${S.user.jabatan==="Staf"?"selected":""}>Staf</option><option value="PJTU" ${S.user.jabatan==="PJTU"?"selected":""}>PJTU</option><option value="Nahkoda" ${S.user.jabatan==="Nahkoda"?"selected":""}>Nahkoda</option><option value="KKM" ${S.user.jabatan==="KKM"?"selected":""}>KKM</option><option value="Mualim I" ${S.user.jabatan==="Mualim I"?"selected":""}>Mualim I</option><option value="Mualim II" ${S.user.jabatan==="Mualim II"?"selected":""}>Mualim II</option><option value="Mualim III" ${S.user.jabatan==="Mualim III"?"selected":""}>Mualim III</option><option value="Masinis I" ${S.user.jabatan==="Masinis I"?"selected":""}>Masinis I</option><option value="Masinis II" ${S.user.jabatan==="Masinis II"?"selected":""}>Masinis II</option><option value="Masinis III" ${S.user.jabatan==="Masinis III"?"selected":""}>Masinis III</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Unit <span style="color:var(--danger)">*</span><br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">untuk rekap</span></label><select id="f-unit"><option value="-" ${S.user.unit==="-"?"selected":""}>-</option><option value="Bengkel Dock" ${S.user.unit==="Bengkel Dock"?"selected":""}>Bengkel Dock</option><option value="Bengkel Mesin" ${S.user.unit==="Bengkel Mesin"?"selected":""}>Bengkel Mesin</option><option value="Bengkel Listrik" ${S.user.unit==="Bengkel Listrik"?"selected":""}>Bengkel Listrik</option><option value="Bengkel PTK" ${S.user.unit==="Bengkel PTK"?"selected":""}>Bengkel PTK</option><option value="Bengkel Las" ${S.user.unit==="Bengkel Las"?"selected":""}>Bengkel Las</option><option value="BC 1601" ${S.user.unit==="BC 1601"?"selected":""}>BC 1601</option><option value="BC 1602" ${S.user.unit==="BC 1602"?"selected":""}>BC 1602</option><option value="BC 1603" ${S.user.unit==="BC 1603"?"selected":""}>BC 1603</option><option value="BC 5002" ${S.user.unit==="BC 5002"?"selected":""}>BC 5002</option><option value="BC 6003" ${S.user.unit==="BC 6003"?"selected":""}>BC 6003</option><option value="BC 7004" ${S.user.unit==="BC 7004"?"selected":""}>BC 7004</option><option value="BC 7006" ${S.user.unit==="BC 7006"?"selected":""}>BC 7006</option><option value="BC 8001" ${S.user.unit==="BC 8001"?"selected":""}>BC 8001</option><option value="BC 8005" ${S.user.unit==="BC 8005"?"selected":""}>BC 8005</option><option value="BC 8006" ${S.user.unit==="BC 8006"?"selected":""}>BC 8006</option><option value="BC 9002" ${S.user.unit==="BC 9002"?"selected":""}>BC 9002</option><option value="BC 9004" ${S.user.unit==="BC 9004"?"selected":""}>BC 9004</option><option value="BC 10001" ${S.user.unit==="BC 10001"?"selected":""}>BC 10001</option><option value="BC 10002" ${S.user.unit==="BC 10002"?"selected":""}>BC 10002</option><option value="BC 20002" ${S.user.unit==="BC 20002"?"selected":""}>BC 20002</option><option value="BC 20003" ${S.user.unit==="BC 20003"?"selected":""}>BC 20003</option><option value="BC 20004" ${S.user.unit==="BC 20004"?"selected":""}>BC 20004</option><option value="BC 20005" ${S.user.unit==="BC 20005"?"selected":""}>BC 20005</option><option value="BC 20008" ${S.user.unit==="BC 20008"?"selected":""}>BC 20008</option><option value="BC 20009" ${S.user.unit==="BC 20009"?"selected":""}>BC 20009</option><option value="BC 20011" ${S.user.unit==="BC 20011"?"selected":""}>BC 20011</option><option value="BC 30001" ${S.user.unit==="BC 30001"?"selected":""}>BC 30001</option><option value="BC 30002" ${S.user.unit==="BC 30002"?"selected":""}>BC 30002</option><option value="BC 30004" ${S.user.unit==="BC 30004"?"selected":""}>BC 30004</option><option value="BC 30005" ${S.user.unit==="BC 30005"?"selected":""}>BC 30005</option><option value="BC 60001" ${S.user.unit==="BC 60001"?"selected":""}>BC 60001</option></select></div>
        <div class="form-group"><label>Divisi</label><input value="${S.selectedDivisi.nama} (${S.selectedDivisi.kode_bon})" readonly style="background:var(--gray-50);color:var(--gray-500);"></div>
      </div>
      <div class="form-group"><label>Keterangan / Notes <span style="color:var(--danger)">*</span> <span style="font-size:10px;font-weight:400;color:var(--gray-400)">tampil di kolom keterangan bon</span></label>
        <textarea id="f-notes" placeholder="Contoh: Untuk keperluan penggantian injektor mesin bantu BC 30005 B"></textarea></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Batalkan</button><button class="btn btn-primary" onclick="submitBon()">Submit Bon →</button></div>`);
}
function submitBon() {
  const nama = document.getElementById('f-nama')?.value.trim();
  const jabatan = document.getElementById('f-jabatan')?.value.trim();
  const unit = document.getElementById('f-unit')?.value.trim();
  const notes = document.getElementById('f-notes')?.value.trim();
  if (!nama||!jabatan||!unit||!notes) { showToast('Semua field wajib diisi'); return; }
  const items = Object.entries(S.keranjang).map(([id,qty])=>{
    const b = BARANG_DB.find(x=>x.id==id);
    return b ? {barang_id:b.id,nama:b.nama,jumlah:qty,satuan:b.satuan,kode:b.kode,rak:b.rak,emoji:b.emoji} : null;
  }).filter(Boolean);
  const newBon = {
    id: Date.now(), bon_number:null, divisi_id: S.selectedDivisi.id,
    pemohon_user_id: S.user.id, pemohon_nama:nama, pemohon_jabatan:jabatan, pemohon_unit:unit,
    keterangan:notes, status:'SUBMITTED', tanggal:new Date().toISOString().slice(0,10),
    tgl_approve:null, tgl_selesai:null, assessor_nama:'', assessor_jabatan:'',
    reject_notes:'', revision_count:0, has_ttd:false, gudang_staf:'', gudang_kepala:'', items
  };
  BON_LIST.unshift(newBon);
  addAudit(newBon.id, null, 'SUBMITTED', `Request diajukan dengan ${items.length} item. Divisi: ${S.selectedDivisi.nama}`);
  const assessors = USERS.filter(u=>u.role==='ASSESSOR'&&u.divisi_id===S.selectedDivisi.id).map(u=>u.id);
  addNotif(assessors, 'submitted', `Request baru dari ${nama} (${S.selectedDivisi.kode_bon})`, newBon.id);
  S.keranjang = {}; closeModal(); hideKeranjang();
  showModal(`
    <div class="modal-body" style="text-align:center;padding:40px 24px;">
      <div style="width:56px;height:56px;background:var(--success-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:28px;">✓</div>
      <h3 style="font-size:17px;font-weight:700;margin-bottom:8px;">Bon Berhasil Diajukan!</h3>
      <p style="font-size:13px;color:var(--gray-500);margin-bottom:20px;">Request dikirim ke Staff Assessor <strong>${S.selectedDivisi.nama}</strong> untuk direview.</p>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="closeModal();renderAjukanStep1()">Ajukan Lagi</button>
        <button class="btn btn-primary" onclick="closeModal();renderBonBerjalan()">Lihat Bon Berjalan →</button>
      </div>
    </div>`);
}

// ---- BON BERJALAN ----
function renderBonBerjalan() {
  hideKeranjang();
  setContent(`
    <div class="breadcrumb"><a onclick="renderDashboardPemohon()">Dashboard</a><span>›</span><span>Bon Berjalan</span></div>
    <div class="page-header"><h2>Bon Berjalan Saya</h2><p>Semua pengajuan bon atas nama Anda</p></div>
    <div class="card">
      <div class="card-header">
        <h3>Daftar Pengajuan</h3>
        <div class="filter-tabs" id="bon-tabs">
          ${['Semua','Pending','Disetujui','In Review','Selesai','Ditolak'].map(s=>`<button class="filter-tab ${S.filterStatus===s?'active':''}" onclick="setBonFilter('${s}')">${s}</button>`).join('')}
        </div>
      </div>
      <div id="bon-table-wrap"></div>
    </div>`);
  renderBonTable();
}
function setBonFilter(s) {
  S.filterStatus = s;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.textContent === s));
  renderBonTable();
}
function renderBonTable() {
  const c = document.getElementById('bon-table-wrap'); if (!c) return;
  const f = STATUS_FILTER[S.filterStatus];
  const myBon = BON_LIST.filter(b => b.pemohon_user_id === S.user.id);
  let list = f ? myBon.filter(b => f.includes(b.status)) : myBon;
  if (!S.bonSortAsc) S.bonSortAsc = false;
  // Sort by tanggal
  list = [...list].sort((a,b) => {
    const diff = a.tanggal.localeCompare(b.tanggal);
    return S.bonSortAsc ? diff : -diff;
  });
  const sortIcon = S.bonSortAsc ? '↑' : '↓';
  if (!list.length) { c.innerHTML='<div style="text-align:center;padding:36px;color:var(--gray-400);">📋 Tidak ada pengajuan ditemukan</div>'; return; }
  c.innerHTML=`<div class="table-wrap"><table>
    <thead><tr>
      <th>BON ID</th>
      <th>Nama Pemohon</th>
      <th>Divisi</th>
      <th>Status</th>
      <th style="cursor:pointer;user-select:none;white-space:nowrap;" onclick="S.bonSortAsc=!S.bonSortAsc;renderBonTable()">
        Tanggal <span style="font-size:11px;opacity:0.7;">${sortIcon}</span>
      </th>
      <th>Dokumen</th>
      <th>Lampiran TTD</th>
      <th></th>
    </tr></thead>
    <tbody>${list.map(b=>{
      const d=getDivisi(b.divisi_id);
      const canDl=['APPROVED','IN_REVIEW_GUDANG','NEEDS_REVISION','COMPLETED'];
      const canUpload=['APPROVED','IN_REVIEW_GUDANG','NEEDS_REVISION'];
      return `<tr>
        <td style="font-family:monospace;font-size:12px;font-weight:600;">${b.bon_number||'<span style="color:var(--gray-400);font-style:italic;font-weight:400;font-family:sans-serif">Belum terbit</span>'}</td>
        <td style="font-size:12px;font-weight:500;">${b.pemohon_nama||'—'}</td>
        <td style="font-size:12px;">${d?`<span>${d.icon} ${d.kode_bon}</span>`:'—'}</td>
        <td>${STATUS_BADGE[b.status]||b.status}</td>
        <td style="font-size:12px;white-space:nowrap;">${fmtDate(b.tanggal)}</td>
        <td>
          ${canDl.includes(b.status)?`<button class="btn btn-secondary btn-sm" onclick="generateBonHTML(${b.id})">📄 Bon</button>`:''}
          ${b.status==='COMPLETED'?'<span style="display:inline-block;margin-top:4px;font-size:11px;color:var(--gray-500);">📑 SPMB siap di TTE di NADINE</span>':''}
        </td>
        <td>
          ${canUpload.includes(b.status)
            ? (b.has_ttd
                ? '<span style="font-size:11px;color:var(--success);font-weight:600;">✓ TTD Terupload</span>'
                : `<button class="btn btn-orange btn-sm" onclick="showUploadTTD(${b.id})">⬆ Upload</button>`)
            : '<span style="color:var(--gray-300);font-size:12px;">—</span>'}
        </td>
        <td><button class="btn btn-secondary btn-sm" onclick="showDetailBon(${b.id})">Detail</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}
function triggerTTDFile() {
  var el = document.getElementById('ttd-file');
  if (el) el.click();
}
function showUploadTTD(id) {
  const b   = getBon(id);
  const bon = b ? b.bon_number : '';
  // Buka Google Form upload TTD di tab baru
  window.open('https://docs.google.com/forms/d/e/1FAIpQLScv-wtgsHsMdYnmk49hyPsfADXE6BjtJe96AvALuRlV_NWgCQ/viewform?usp=header', '_blank', 'noopener,noreferrer');
  // Tandai has_ttd setelah user konfirmasi
  showModal(
    '<div class="modal-header"><h3>Upload Lampiran TTD</h3>' +
    '<button class="modal-close" onclick="closeModal()">×</button></div>' +
    '<div class="modal-body" style="text-align:center;padding:24px 16px;">' +
    '<div style="font-size:40px;margin-bottom:12px;">📋</div>' +
    '<p style="font-size:14px;margin-bottom:16px;">Form upload TTD sudah dibuka di tab baru.</p>' +
    '<p style="font-size:12px;color:var(--gray-500);margin-bottom:20px;">Nomor Bon: <strong>' + bon + '</strong></p>' +
    '<button class="btn btn-success" onclick="markTTDUploaded(' + id + ')">' +
    '✓ Sudah Upload TTD</button>' +
    '</div>' +
    '<div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Batal</button></div>'
  );
}

function markTTDUploaded(id) {
  const b = getBon(id);
  if (b) { b.has_ttd = true; }
  closeModal();
  renderBonTable();
  showToast('✓ TTD ' + (b ? b.bon_number : '') + ' ditandai sudah diupload');
}


function simUpload(id) {
  // Legacy — tidak dipakai lagi, diganti uploadTTDtoDrive
  const b = getBon(id); if (b) b.has_ttd = true;
  closeModal(); renderBonTable(); showToast('Lampiran TTD berhasil diupload');
}

function uploadTTDtoDrive(id, input) {
  const file = input.files[0];
  if (!file) return;

  const b       = getBon(id);
  const bon     = b ? b.bon_number : 'BON';
  const zone    = document.getElementById('ttd-zone');
  const filename = bon.replace(/\//g, '-') + '-TTD.pdf';

  if (zone) zone.innerHTML =
    '<div style="font-size:28px;">⏳</div>' +
    '<div style="font-size:13px;margin-top:8px;">Membaca file...</div>';

  const reader = new FileReader();
  reader.onload = function(ev) {
    const base64 = ev.target.result.split(',')[1];

    if (zone) zone.innerHTML =
      '<div style="font-size:28px;">⏳</div>' +
      '<div style="font-size:13px;margin-top:8px;">Mengupload ke Drive...</div>';

    // Gunakan hidden iframe + form POST
    // — tidak butuh popup, tidak kena CORS
    const iframeId = 'ttd-iframe-' + Date.now();
    const iframe   = document.createElement('iframe');
    iframe.id      = iframeId;
    iframe.name    = iframeId;
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method  = 'POST';
    form.action  = TTD_UPLOAD_URL;
    form.target  = iframeId;
    form.enctype = 'multipart/form-data';
    form.style.display = 'none';

    // Field: bon_number
    const f1 = document.createElement('input');
    f1.type = 'hidden'; f1.name = 'bon_number'; f1.value = bon;
    form.appendChild(f1);

    // Field: filename
    const f2 = document.createElement('input');
    f2.type = 'hidden'; f2.name = 'filename'; f2.value = filename;
    form.appendChild(f2);

    // Field: filetype
    const f3 = document.createElement('input');
    f3.type = 'hidden'; f3.name = 'filetype'; f3.value = file.type || 'application/pdf';
    form.appendChild(f3);

    // Field: filedata (base64)
    const f4 = document.createElement('input');
    f4.type = 'hidden'; f4.name = 'filedata'; f4.value = base64;
    form.appendChild(f4);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Tandai sukses setelah 4 detik (tidak bisa baca response iframe cross-origin)
    if (b) { b.has_ttd = true; b.ttd_filename = filename; }
    setTimeout(function() {
      iframe.remove();
      if (zone) zone.innerHTML =
        '<div style="font-size:28px;">✅</div>' +
        '<div style="font-size:13px;font-weight:600;color:var(--success);margin-top:8px;">File dikirim ke Drive!</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:4px;">' + filename + '</div>';
      setTimeout(function() {
        closeModal();
        renderBonTable();
        showToast('✓ TTD ' + bon + ' berhasil diupload');
      }, 1500);
    }, 4000);
  };
  reader.readAsDataURL(file);
}


function showDetailBon(id) {
  const b=getBon(id); const d=getDivisi(b.divisi_id);
  const notes={SUBMITTED:'Menunggu review dari Staff Assessor.',APPROVED:'Bon telah terbit. Assessor akan mengajukan ke gudang.',IN_REVIEW_GUDANG:'Sedang diverifikasi oleh Staff Gudang.',NEEDS_REVISION:'Gudang minta revisi, sedang diproses Assessor.',COMPLETED:'Barang keluar, SPMB terbit.',REJECTED_ASSESSOR:'Ditolak oleh Assessor.',REJECTED_GUDANG:'Ditolak oleh Staff Gudang.'};
  const ac=b.status==='COMPLETED'?'alert-success':b.status.includes('REJECTED')?'alert-danger':'alert-info';
  showModal(`
    <div class="modal-header"><h3>Detail Bon</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="alert ${ac}">${notes[b.status]||''}</div>
      <div class="info-row"><div class="info-label">BON ID</div><div class="info-value" style="font-family:monospace;">${b.bon_number||'Belum terbit'}</div></div>
      <div class="info-row"><div class="info-label">Divisi</div><div class="info-value">${d?d.icon+' '+d.nama:'—'}</div></div>
      <div class="info-row"><div class="info-label">Status</div><div class="info-value">${STATUS_BADGE[b.status]}</div></div>
      <div class="info-row"><div class="info-label">Tanggal Ajuan</div><div class="info-value">${fmtDate(b.tanggal)}</div></div>
      ${b.assessor_nama&&['APPROVED','IN_REVIEW_GUDANG','COMPLETED','NEEDS_REVISION'].includes(b.status)?`<div class="info-row"><div class="info-label">Disetujui Oleh</div><div class="info-value" style="color:var(--success);font-weight:500;">${b.assessor_nama}</div></div>`:''}
      ${b.assessor_nama&&['REJECTED_ASSESSOR','REJECTED_GUDANG'].includes(b.status)?`<div class="info-row"><div class="info-label">Ditolak Oleh</div><div class="info-value" style="color:var(--danger);font-weight:500;">${b.assessor_nama}</div></div>`:''}
      ${b.tgl_selesai?`<div class="info-row"><div class="info-label">Tgl Selesai</div><div class="info-value">${fmtDate(b.tgl_selesai)}</div></div>`:''}
      ${b.reject_notes?`<div class="info-row"><div class="info-label">Alasan Tolak</div><div class="info-value" style="color:var(--danger);">${b.reject_notes}</div></div>`:''}
      ${b.keterangan?`<div class="info-row"><div class="info-label">Keterangan</div><div class="info-value" style="font-style:italic;">${b.keterangan}</div></div>`:''}
      <div style="margin-top:14px;margin-bottom:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--gray-500);">Daftar Item</div>
      <div style="background:var(--gray-50);border-radius:8px;overflow:hidden;">
        <table style="width:100%;"><thead><tr><th style="padding:7px 12px;">Item</th><th style="padding:7px 12px;text-align:right;">Jumlah</th><th style="padding:7px 12px;">Satuan</th></tr></thead>
        <tbody>${b.items.map(i=>`<tr><td style="padding:7px 12px;font-size:12px;">${i.emoji||''} ${i.nama}</td><td style="padding:7px 12px;font-size:12px;text-align:right;font-weight:600;">${i.jumlah}</td><td style="padding:7px 12px;font-size:12px;">${i.satuan}</td></tr>`).join('')}</tbody></table>
      </div>
      
          ${!b.has_ttd&&b.status!=='COMPLETED'?`<button class="btn btn-orange btn-sm" onclick="closeModal();showUploadTTD(${b.id})">⬆ Upload TTD</button>`:''}
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Tutup</button></div>`);
}

// ================================================================
// ================= PORTAL ASSESSOR ==============================
// ================================================================
function renderAssessorDashboard() {
  hideKeranjang();
  S.assessorTab = 'masuk';
  const divisi = getDivisi(S.user.divisi_id);
  const myBons = BON_LIST.filter(b => b.divisi_id === S.user.divisi_id);
  const pending = myBons.filter(b=>b.status==='SUBMITTED').length;
  const revision = myBons.filter(b=>b.status==='NEEDS_REVISION').length;
  setContent(`
    <div class="assessor-banner" style="border-radius:20px;padding:22px 26px;">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.75;margin-bottom:4px;">${divisi.kode_bon}</div>
        <div style="font-family:var(--font-head);font-size:20px;font-weight:800;color:#fff;margin-bottom:2px;">${divisi.icon} ${divisi.nama}</div>
        <div style="font-size:12px;opacity:0.75;">Kepala: ${divisi.kepala}</div>
      </div>
      <div style="display:flex;gap:14px;">
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 18px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:#fff;">${pending}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">Pending</div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 18px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:#fff;">${revision}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">Revisi</div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 18px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:#fff;">${myBons.filter(b=>b.status==='COMPLETED').length}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">Selesai</div>
        </div>
      </div>
    </div>
    <div class="assessor-tabs">
      <button class="assessor-tab ${S.assessorTab==='masuk'?'active':''}" onclick="switchAssessorTab('masuk')">
        Request Masuk ${pending+revision>0?`<span class="tab-badge">${pending+revision}</span>`:''}
      </button>
      <button class="assessor-tab ${S.assessorTab==='selesai'?'active':''}" onclick="switchAssessorTab('selesai')">Selesai</button>
      <button class="assessor-tab ${S.assessorTab==='laporan'?'active':''}" onclick="switchAssessorTab('laporan')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Laporan Transaksi
      </button>
      <button class="assessor-tab ${S.assessorTab==='divisi'?'active':''}" onclick="switchAssessorTab('divisi')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/></svg>
        Data Divisi
      </button>
      <button class="assessor-tab ${S.assessorTab==='katalog'?'active':''}" onclick="switchAssessorTab('katalog')">
        📦 Katalog Barang
      </button>
    </div>
    <div id="assessor-tab-content"></div>`);
  renderAssessorTab();
}
function switchAssessorTab(tab) {
  S.assessorTab = tab;
  document.querySelectorAll('.assessor-tab').forEach((t,i)=>{
    const tabs=['masuk','selesai','laporan','divisi','katalog'];
    t.classList.toggle('active', tabs[i]===tab);
  });
  renderAssessorTab();
}
function renderAssessorTab() {
  const c = document.getElementById('assessor-tab-content'); if(!c) return;
  if (S.assessorTab==='masuk') renderAssessorMasuk(c);
  else if (S.assessorTab==='selesai') renderAssessorSelesai(c);
  else if (S.assessorTab==='laporan') renderLaporan(c);
  else if (S.assessorTab==='divisi') renderDataDivisi(c);
  else if (S.assessorTab==='katalog') renderKatalogBarangAssessor(c);
}

// ---- TAB MASUK ----
function renderAssessorMasuk(c) {
  if (S.masukSort===undefined) S.masukSort = false;
  let list = BON_LIST.filter(b => b.divisi_id===S.user.divisi_id && ['SUBMITTED','APPROVED','IN_REVIEW_GUDANG','NEEDS_REVISION'].includes(b.status));
  list = [...list].sort((a,b) => S.masukSort ? a.tanggal.localeCompare(b.tanggal) : b.tanggal.localeCompare(a.tanggal));
  if (!list.length) { c.innerHTML='<div style="text-align:center;padding:40px;color:var(--gray-400);">📭 Tidak ada request aktif saat ini</div>'; return; }
  c.innerHTML=`
    <div class="card">
      <div class="card-header"><h3>Request Aktif — ${getDivisi(S.user.divisi_id).kode_bon}</h3>
        <div style="display:flex;gap:8px;align-items:center;">
          <select style="font-size:12px;padding:5px 8px;border:1px solid var(--gray-300);border-radius:6px;" onchange="S.assessorFilter=this.value;renderAssessorTab()">
            <option ${S.assessorFilter==='Semua'?'selected':''}>Semua</option>
            <option ${S.assessorFilter==='SUBMITTED'?'selected':''} value="SUBMITTED">Menunggu Review</option>
            <option ${S.assessorFilter==='APPROVED'?'selected':''} value="APPROVED">Disetujui</option>
            <option ${S.assessorFilter==='IN_REVIEW_GUDANG'?'selected':''} value="IN_REVIEW_GUDANG">In Review Gudang</option>
            <option ${S.assessorFilter==='NEEDS_REVISION'?'selected':''} value="NEEDS_REVISION">Perlu Revisi</option>
          </select>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>BON ID</th><th>Pemohon</th><th>Unit</th><th>Item</th><th>Status</th><th style="cursor:pointer;user-select:none;white-space:nowrap;" onclick="S.masukSort=!S.masukSort;renderAssessorTab()">Tanggal ${S.masukSort===false?'↓':'↑'}</th><th>Assessor</th><th>Aksi</th></tr></thead>
        <tbody>${list.filter(b=>S.assessorFilter==='Semua'||b.status===S.assessorFilter).map(b=>`<tr>
          <td style="font-family:monospace;font-size:12px;font-weight:600;">${b.bon_number||'<span style="color:var(--gray-400);font-style:italic;font-weight:400;font-family:sans-serif">Pending</span>'}</td>
          <td style="font-size:12px;font-weight:500;">${b.pemohon_nama}</td>
          <td style="font-size:12px;color:var(--gray-600);">${b.pemohon_unit}</td>
          <td style="font-size:12px;">${b.items.length} item</td>
          <td>${STATUS_BADGE[b.status]}</td>
          <td style="font-size:12px;">${fmtDate(b.tanggal)}</td>
          <td style="font-size:12px;color:var(--gray-500);">${b.assessor_nama||'—'}</td>
          <td>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              ${(b.status==='IN_REVIEW_GUDANG'||b.status==='APPROVED')
                ? `<button class="btn btn-secondary btn-sm" onclick="showDetailReadonly(${b.id})">👁 Lihat</button>`
                : `<button class="btn btn-primary btn-sm" onclick="showDetailReview(${b.id})">${b.status==='NEEDS_REVISION'?'✏ Edit & Ajukan':'Review'}</button>`
              }
              ${b.status==='APPROVED'?`<button class="btn btn-success btn-sm" onclick="ajukanKeGudang(${b.id})">→ Gudang</button>`:''}
            </div>
          </td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

// ---- TAB SELESAI ----
function renderAssessorSelesai(c) {
  if (S.selesaiSort===undefined) S.selesaiSort = false;
  let list = BON_LIST.filter(b=>b.divisi_id===S.user.divisi_id&&['COMPLETED','REJECTED_ASSESSOR','REJECTED_GUDANG'].includes(b.status));
  list = [...list].sort((a,b) => S.selesaiSort ? a.tanggal.localeCompare(b.tanggal) : b.tanggal.localeCompare(a.tanggal));
  if (!list.length) { c.innerHTML='<div style="text-align:center;padding:40px;color:var(--gray-400);">📁 Belum ada request selesai</div>'; return; }
  c.innerHTML=`<div class="card"><div class="card-header"><h3>Request Selesai / Ditolak</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>BON ID</th><th>Pemohon</th><th>Unit</th><th>Status</th><th style="cursor:pointer;user-select:none;white-space:nowrap;" onclick="S.selesaiSort=!S.selesaiSort;renderAssessorTab()">Tanggal ${S.selesaiSort===false?'↓':'↑'}</th><th>Assessor</th><th>Dokumen</th></tr></thead>
      <tbody>${list.map(b=>`<tr>
        <td style="font-family:monospace;font-size:12px;font-weight:600;">${b.bon_number||'—'}</td>
        <td style="font-size:12px;font-weight:500;">${b.pemohon_nama}</td>
        <td style="font-size:12px;color:var(--gray-600);">${b.pemohon_unit||'—'}</td>
        <td>${STATUS_BADGE[b.status]}</td>
        <td style="font-size:12px;">${fmtDate(b.tgl_selesai||b.tanggal)}</td>
        <td style="font-size:12px;color:var(--gray-500);">${b.assessor_nama||'—'}</td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            ${b.bon_number?`<button class="btn btn-secondary btn-sm" onclick="generateBonHTML(${b.id})">📄 Bon</button>`:''}
            
            
          </div>
        </td>
      </tr>`).join('')}
      </tbody></table></div></div>`;
}

// ---- LAPORAN TRANSAKSI ----
function downloadLaporanCSV() {
  // Ambil data yang sedang ditampilkan (filter aktif)
  if (!S.laporanUnit) S.laporanUnit = '';
  const completed = BON_LIST.filter(b => b.divisi_id === S.user.divisi_id && b.status === 'COMPLETED');
  let rows = [];
  completed.forEach(b => {
    b.items.forEach(it => {
      rows.push({
        bon:     b.bon_number || '—',
        tanggal: b.tanggal   || '',
        pemohon: b.pemohon_nama  || '—',
        unit:    b.pemohon_unit  || '—',
        nama:    it.nama,
        jumlah:  it.jumlah,
        satuan:  it.satuan,
        keterangan: it.keterangan || b.keterangan || ''
      });
    });
  });

  // Filter tanggal + unit (sama persis seperti renderLaporan)
  const filtered = rows.filter(r => {
    const inDate = r.tanggal >= S.laporanDari && r.tanggal <= S.laporanSampai;
    const inUnit = !S.laporanUnit || r.unit === S.laporanUnit;
    return inDate && inUnit;
  });

  if (!filtered.length) { showToast('Tidak ada data untuk diunduh'); return; }

  // Sort sesuai state
  const sorted = [...filtered].sort((a, b) =>
    S.laporanSort ? a.tanggal.localeCompare(b.tanggal) : b.tanggal.localeCompare(a.tanggal)
  );

  // Build CSV
  const headers = ['Nomor Bon', 'Tanggal', 'Pemohon', 'Unit', 'Nama Barang', 'Jumlah', 'Satuan', 'Keterangan'];
  const escape  = v => '"' + String(v).replace(/"/g, '""') + '"';
  const lines   = [
    headers.map(escape).join(','),
    ...sorted.map(r => [
      r.bon, r.tanggal, r.pemohon, r.unit, r.nama, r.jumlah, r.satuan, r.keterangan
    ].map(escape).join(','))
  ];
  const csv = String.fromCharCode(0xFEFF) + lines.join('\r\n'); // BOM agar Excel baca UTF-8 dengan benar

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const dari    = S.laporanDari.replace(/-/g,'');
  const sampai  = S.laporanSampai.replace(/-/g,'');
  const unit    = S.laporanUnit ? '_' + S.laporanUnit.replace(/\s/g,'-') : '';
  a.href     = url;
  a.download = `Laporan_Transaksi${unit}_${dari}-${sampai}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  showToast('✓ CSV berhasil diunduh — buka dengan Excel');
}

function renderLaporan(c) {
  if (!S.laporanUnit) S.laporanUnit = '';
  const completed = BON_LIST.filter(b=>b.divisi_id===S.user.divisi_id&&b.status==='COMPLETED');

  // Kumpulkan semua unit unik
  const allUnits = [...new Set(completed.map(b=>b.pemohon_unit||'—'))].sort();

  let rows = [];
  completed.forEach(b=>{
    b.items.forEach(it=>{
      rows.push({bon:b.bon_number, tanggal:b.tanggal, unit:b.pemohon_unit||'—', pemohon:b.pemohon_nama||'—', kode:it.kode||'', nama:it.nama, jumlah:it.jumlah, satuan:it.satuan});
    });
  });

  if (S.laporanSort===undefined) S.laporanSort = false;
  // Filter tanggal + unit
  let filtered = rows.filter(r=>{
    const inDate = r.tanggal>=S.laporanDari && r.tanggal<=S.laporanSampai;
    const inUnit = !S.laporanUnit || r.unit===S.laporanUnit;
    return inDate && inUnit;
  });
  filtered = [...filtered].sort((a,b) => S.laporanSort ? a.tanggal.localeCompare(b.tanggal) : b.tanggal.localeCompare(a.tanggal));

  const filteredBon = completed.filter(b=>{
    const inDate = b.tanggal>=S.laporanDari && b.tanggal<=S.laporanSampai;
    const inUnit = !S.laporanUnit || (b.pemohon_unit||'—')===S.laporanUnit;
    return inDate && inUnit;
  });

  // Tracking per unit: jumlah item keluar per unit
  const unitTracking = {};
  filtered.forEach(r=>{
    if (!unitTracking[r.unit]) unitTracking[r.unit] = {bon:new Set(), items:0};
    unitTracking[r.unit].items += r.jumlah;
    unitTracking[r.unit].bon.add(r.bon);
  });
  const trackingKeys = Object.keys(unitTracking).sort();

  c.innerHTML=`
    <div class="card">
      <div class="card-header"><h3>Laporan Transaksi</h3>
        <button class="btn btn-success btn-sm" onclick="downloadLaporanCSV()">⬇ Download CSV (Excel)</button>
      </div>

      <!-- Filter -->
      <div style="padding:16px 20px;border-bottom:1px solid var(--gray-100);">
        <div class="laporan-filter" style="flex-wrap:wrap;gap:12px;">
          <div class="form-group"><label style="font-size:12px;">Dari</label>
            <input type="date" value="${S.laporanDari}" onchange="S.laporanDari=this.value;renderAssessorTab()" style="width:auto;font-size:12px;padding:6px 10px;">
          </div>
          <div class="form-group"><label style="font-size:12px;">Sampai</label>
            <input type="date" value="${S.laporanSampai}" onchange="S.laporanSampai=this.value;renderAssessorTab()" style="width:auto;font-size:12px;padding:6px 10px;">
          </div>
          <div class="form-group"><label style="font-size:12px;">Unit</label>
            <select onchange="S.laporanUnit=this.value;renderAssessorTab()" style="font-size:12px;padding:6px 10px;border:1px solid var(--gray-300);border-radius:8px;">
              <option value="" ${!S.laporanUnit?'selected':''}>Semua Unit</option>
              ${allUnits.map(u=>`<option value="${u}" ${S.laporanUnit===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Summary cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px;">
          <div class="summary-stat"><div class="stat-num">${filteredBon.length}</div><div class="stat-label">Bon Selesai</div></div>
          <div class="summary-stat"><div class="stat-num">${filtered.length}</div><div class="stat-label">Total Item Keluar</div></div>
          <div class="summary-stat"><div class="stat-num">${trackingKeys.length}</div><div class="stat-label">Unit Aktif</div></div>
        </div>
      </div>



      <!-- Tabel -->
      <div class="table-wrap"><table>
        <thead><tr><th>Nomor Bon</th><th>Pemohon</th><th>Unit</th><th style="cursor:pointer;user-select:none;white-space:nowrap;" onclick="S.laporanSort=!S.laporanSort;renderAssessorTab()">Tanggal ${S.laporanSort===false?'↓':'↑'}</th><th>Nama Barang</th><th style="text-align:right;">Jumlah</th><th>Satuan</th></tr></thead>
        <tbody>${filtered.length ? filtered.map(r=>`<tr>
          <td style="font-family:monospace;font-size:11px;">${r.bon}</td>
          <td style="font-size:12px;">${r.pemohon}</td>
          <td style="font-size:12px;">${r.unit}</td>
          <td style="font-size:12px;white-space:nowrap;">${fmtDate(r.tanggal)}</td>
          <td style="font-size:12px;">${r.nama}</td>
          <td style="text-align:right;font-size:12px;font-weight:600;">${r.jumlah}</td>
          <td style="font-size:12px;">${r.satuan}</td>
        </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400);">Tidak ada data</td></tr>'}
        </tbody>
      </table></div>
    </div>`;
}

// ---- DATA DIVISI ----
function renderDataDivisi(c) {
  const d = getDivisi(S.user.divisi_id);
  c.innerHTML=`
    <div class="data-divisi-card">
      <div style="margin-bottom:16px;">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:4px;">Data Divisi — ${d.icon} ${d.kode_bon}</h3>
        <p style="font-size:12px;color:var(--gray-500);">Data ini digunakan untuk generate bon & SPMB secara otomatis. Pastikan selalu diperbarui.</p>
      </div>
      <div class="alert alert-warning">⚠ <strong>Nama Kepala Seksi</strong> akan langsung  pada kolom tanda tangan. Pastikan selalu akurat.</div>
      <div class="form-row">
        <div class="form-group"><label>Nama Seksi</label><input id="dd-nama" value="${d.nama}"></div>
        <div class="form-group"><label>Akronim</label><input id="dd-akronim" value="${d.akronim}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Kode Format BON</label><input id="dd-kode-bon" value="${d.kode_bon}" placeholder="Contoh: PSO.13"></div>
        <div class="form-group"><label>Kode Format SPMB</label><input id="dd-kode-spmb" value="${d.kode_spmb}" placeholder="Contoh: PSO.11/KSP"></div>
      </div>
      <div class="form-group"><label>Nama Kepala Seksi <span style="color:var(--danger)">*</span></label><input id="dd-kepala" value="${d.kepala}" placeholder="Nama lengkap kepala seksi"></div>
      <button class="btn btn-primary" onclick="saveDataDivisi()">💾 Simpan Perubahan</button>
    </div>`;
}
function saveDataDivisi() {
  const d = getDivisi(S.user.divisi_id);
  d.nama = document.getElementById('dd-nama').value.trim()||d.nama;
  d.akronim = document.getElementById('dd-akronim').value.trim()||d.akronim;
  d.kode_bon = document.getElementById('dd-kode-bon').value.trim()||d.kode_bon;
  d.kode_spmb = document.getElementById('dd-kode-spmb').value.trim()||d.kode_spmb;
  d.kepala = document.getElementById('dd-kepala').value.trim()||d.kepala;
  showToast('Data divisi berhasil disimpan ✓');
  renderAssessorDashboard();
}

// ---- DETAIL REVIEW (popup besar) ----
function showDetailReview(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  const isRevision = b.status === 'NEEDS_REVISION';
  showModal(`
    <div class="modal-header">
      <div>
        <h3>Review Request — ${b.bon_number||'[Belum Terbit]'}</h3>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;">${isRevision?'⚠ Status: Perlu Revisi dari Gudang':'Request baru masuk'}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      ${isRevision&&b.reject_notes?`<div class="alert alert-warning">📋 <strong>Catatan Revisi dari Gudang:</strong> ${b.reject_notes}</div>`:''}
      <div style="background:var(--gray-50);border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;">
          <div><span style="color:var(--gray-500);">Pemohon:</span> <strong>${b.pemohon_nama}</strong></div>
          <div><span style="color:var(--gray-500);">Jabatan:</span> ${b.pemohon_jabatan}</div>
          <div><span style="color:var(--gray-500);">Unit:</span> ${b.pemohon_unit}</div>
          <div><span style="color:var(--gray-500);">Divisi:</span> ${d.icon} ${d.kode_bon}</div>
          <div style="grid-column:1/-1;"><span style="color:var(--gray-500);">Keterangan:</span> <em>${b.keterangan}</em></div>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--gray-500);margin-bottom:8px;">Daftar Item (editable)</div>
      <div style="overflow-x:auto;margin-bottom:12px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Item</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Kode</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);">Stok</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);">Jumlah</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Satuan</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Rak</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);"></th>
          </tr></thead>
          <tbody id="review-items-tbody">
            ${b.items.map((it,idx)=>{
              const bar = BARANG_DB.find(x=>x.id===it.barang_id)||{};
              return `<tr class="review-item-row" id="review-row-${idx}">
                <td style="padding:8px;"><div style="display:flex;align-items:center;gap:8px;">
                  <div class="item-thumb">${it.emoji||bar.emoji||'📦'}</div>
                  <div style="font-size:12px;font-weight:500;line-height:1.3;">${it.nama}</div>
                </div></td>
                <td style="padding:8px;font-family:monospace;font-size:10px;color:var(--gray-400);">${it.kode}</td>
                <td style="padding:8px;text-align:center;font-size:12px;">${bar.stok||'—'}</td>
                <td style="padding:8px;text-align:center;"><input class="qty-field" type="number" min="1" max="${bar.stok||999}" value="${it.jumlah}" id="qty-${idx}" oninput="updateReviewQty(${id},${idx},this.value)"></td>
                <td style="padding:8px;font-size:12px;">${it.satuan}</td>
                <td style="padding:8px;font-size:12px;color:var(--gray-500);">${it.rak||bar.rak||'—'}</td>
                <td style="padding:8px;"><button class="delete-btn" onclick="removeReviewItem(${id},${idx})" title="Hapus item">🗑</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="showAddItemModal(${id})">+ Tambah Item</button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-danger" onclick="showRejectPopup(${id})">✕ Tolak Request</button>
      <div style="flex:1;"></div>
      ${isRevision
        ? `<button class="btn btn-primary" onclick="ajukanUlangKeGudang(${id})">→ Ajukan Ulang ke Gudang</button>`
        : `<button class="btn btn-success" onclick="showApprovePopup(${id})">✓ Approve Request</button>`
      }
    </div>`, true);
}

function updateReviewQty(bonId, idx, val) {
  const b = getBon(bonId);
  const bar = BARANG_DB.find(x=>x.id===b.items[idx].barang_id)||{stok:999};
  b.items[idx].jumlah = Math.min(Math.max(1,parseInt(val)||1), bar.stok||999);
}
function removeReviewItem(bonId, idx) {
  const b = getBon(bonId);
  if (b.items.length<=1) { showToast('Minimal satu item harus ada'); return; }
  b.items.splice(idx,1);
  showDetailReview(bonId);
}
function showAddItemModal(bonId) {
  const b = getBon(bonId);
  const d = getDivisi(b.divisi_id);
  const available = BARANG_DB.filter(x=>x.divisi_id===d.id);
  showModal(`
    <div class="modal-header"><h3>Tambah Item ke Bon</h3><button class="modal-close" onclick="showDetailReview(${bonId})">×</button></div>
    <div class="modal-body">
      <div class="add-item-grid">
        ${available.map(x=>`
          <div class="add-item-card" onclick="addItemToBon(${bonId},${x.id})">
            <div style="font-size:24px;margin-bottom:4px;">${x.emoji}</div>
            <div style="font-size:11px;font-weight:600;line-height:1.3;margin-bottom:2px;">${x.nama}</div>
            <div style="font-size:10px;color:var(--gray-500);">Stok: ${x.stok} ${x.satuan}</div>
          </div>`).join('')}
      </div>
    </div>`);
}
function addItemToBon(bonId, barangId) {
  const b = getBon(bonId);
  const bar = BARANG_DB.find(x=>x.id===barangId);
  if (!bar) return;
  if (b.items.find(i=>i.barang_id===barangId)) { showToast('Item sudah ada di daftar'); showDetailReview(bonId); return; }
  b.items.push({barang_id:bar.id,nama:bar.nama,jumlah:1,satuan:bar.satuan,kode:bar.kode,rak:bar.rak,emoji:bar.emoji});
  showDetailReview(bonId);
  showToast(`${bar.emoji} ${bar.nama.split(' ').slice(0,3).join(' ')} ditambahkan`);
}

// ---- APPROVE ----
function showApprovePopup(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  showModal(`
    <div class="modal-header"><h3>Konfirmasi Approve Request</h3><button class="modal-close" onclick="showDetailReview(${id})">×</button></div>
    <div class="modal-body">
      
      <div class="form-group"><label>Nama Assessor <span style="color:var(--danger)">*</span></label>
        <input id="ap-nama" value="${S.user.nama}"></div>
      <div class="form-group"><label>Jabatan Assessor <span style="color:var(--danger)">*</span></label>
        <input id="ap-jabatan" value="${S.user.jabatan}"></div>
      <div style="background:var(--gray-50);border-radius:8px;padding:12px;font-size:12px;margin-top:4px;">
        <div class="info-row"><div class="info-label">Kepala Seksi</div><div class="info-value">${d.kepala} <span style="color:var(--gray-400);font-size:10px;">(dari data divisi)</span></div></div>
        <div class="info-row"><div class="info-label">Format Bon</div><div class="info-value" style="font-family:monospace;">BON-${BON_SEQ[d.id]||1}/${d.kode_bon}/${new Date().getFullYear()}</div></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="showDetailReview(${id})">← Kembali</button>
      <button class="btn btn-success" onclick="doApprove(${id})">✓ Konfirmasi Approve</button>
    </div>`);
}
function doApprove(id) {
  const ap_nama = document.getElementById('ap-nama')?.value.trim();
  const ap_jab  = document.getElementById('ap-jabatan')?.value.trim();
  if (!ap_nama||!ap_jab) { showToast('Nama dan jabatan wajib diisi'); return; }
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  const num = BON_SEQ[d.id]||1; BON_SEQ[d.id] = num+1;
  b.bon_number = `BON-${num}/${d.kode_bon}/${new Date().getFullYear()}`;
  b.status = 'APPROVED';
  b.tgl_approve = new Date().toISOString().slice(0,10);
  b.assessor_nama = ap_nama;
  b.assessor_jabatan = ap_jab;
  addAudit(id, b.bon_number, 'APPROVED', `Disetujui oleh ${ap_nama}. Bon PDF diterbitkan.`);
  addNotif([b.pemohon_user_id], 'approved', `Bon ${b.bon_number} disetujui oleh Assessor`, id);
  closeModal();
  showModal(`
    <div class="modal-body" style="text-align:center;padding:36px 24px;">
      <div style="font-size:40px;margin-bottom:12px;">✅</div>
      <h3 style="font-weight:700;margin-bottom:8px;">Request Disetujui!</h3>
      <div style="font-size:13px;color:var(--gray-600);margin-bottom:8px;">Nomor Bon diterbitkan:</div>
      <div style="font-family:monospace;font-size:18px;font-weight:800;color:var(--primary);background:var(--primary-light);padding:10px 20px;border-radius:8px;display:inline-block;margin-bottom:16px;">${b.bon_number}</div>
      <p style="font-size:12px;color:var(--gray-500);margin-bottom:20px;">Bon PDF otomatis diterbitkan. Anda dapat mengajukan ke Gudang sekarang atau menunggu pemohon upload TTD terlebih dahulu.</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="closeModal();previewBonPDF(${id})">📄 Preview Bon</button>
        <button class="btn btn-primary" onclick="closeModal();doAjukanKeGudang(${id})">→ Ajukan ke Gudang Sekarang</button>
        <button class="btn btn-secondary" onclick="closeModal();renderAssessorDashboard()">Nanti Saja</button>
      </div>
    </div>`);
}

// ---- AJUKAN KE GUDANG ----
function ajukanKeGudang(id) {
  const b = getBon(id);
  showModal(`
    <div class="modal-body" style="text-align:center;padding:30px 24px;">
      <div style="font-size:32px;margin-bottom:10px;">📦</div>
      <h3 style="font-weight:700;margin-bottom:8px;">Ajukan ke Gudang</h3>
      <p style="font-size:13px;color:var(--gray-600);margin-bottom:6px;">Bon <strong>${b.bon_number}</strong> akan dikirim ke Staff Gudang untuk diverifikasi.</p>
      <p style="font-size:12px;color:var(--gray-500);margin-bottom:20px;">Lampiran TTD dari pemohon: ${b.has_ttd?'<span style="color:var(--success);font-weight:600;">✓ Sudah ada</span>':'<span style="color:var(--warning);">⚠ Belum ada</span>'}</p>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="closeModal();doAjukanKeGudang(${id})">✓ Ajukan ke Gudang</button>
      </div>
    </div>`);
}
function doAjukanKeGudang(id) {
  const b = getBon(id);
  b.status = 'IN_REVIEW_GUDANG';
  addAudit(id, b.bon_number, 'SENT_GUDANG', 'Diajukan ke Staff Gudang untuk verifikasi lapangan');
  const gudang = USERS.filter(u=>u.role==='GUDANG').map(u=>u.id);
  addNotif(gudang, 'sent_gudang', `${b.bon_number} siap diverifikasi di gudang`, id);
  showToast(`${b.bon_number} berhasil diajukan ke Gudang ✓`);
  renderAssessorDashboard();
}

// ---- AJUKAN ULANG (revisi) ----
function ajukanUlangKeGudang(id) {
  const b = getBon(id);
  b.items.forEach((it,idx)=>{
    const inp = document.getElementById(`qty-${idx}`);
    if(inp) it.jumlah = parseInt(inp.value)||it.jumlah;
  });
  b.status = 'IN_REVIEW_GUDANG';
  b.revision_count = (b.revision_count||0)+1;
  addAudit(id, b.bon_number, 'REVISION_SENT', `Bon direvisi & diajukan ulang (revisi ke-${b.revision_count})`);
  const gudang2 = USERS.filter(u=>u.role==='GUDANG').map(u=>u.id);
  addNotif(gudang2, 'sent_gudang', `${b.bon_number} direvisi & diajukan ulang ke gudang`, id);
  closeModal();
  showToast(`${b.bon_number} (revisi ke-${b.revision_count}) berhasil diajukan ulang ke Gudang ✓`);
  renderAssessorDashboard();
}

// ---- REJECT ----
function showRejectPopup(id) {
  const b = getBon(id);
  showModal(`
    <div class="modal-header"><h3>Tolak Request</h3><button class="modal-close" onclick="showDetailReview(${id})">×</button></div>
    <div class="modal-body">
      <div class="alert alert-danger">Request akan ditolak dan pemohon akan mendapat notifikasi. Nomor bon (jika sudah terbit) akan dikembalikan ke pool.</div>
      <div class="form-row">
        <div class="form-group">
          <label>Nama Assessor <span style="color:var(--danger)">*</span></label>
          <input id="rej-nama" value="${S.user.nama}" placeholder="Nama assessor">
        </div>
        <div class="form-group">
          <label>Jabatan Assessor <span style="color:var(--danger)">*</span></label>
          <input id="rej-jabatan" value="${S.user.jabatan}" placeholder="Jabatan assessor">
        </div>
      </div>
      <div class="form-group"><label>Alasan Penolakan <span style="color:var(--danger)">*</span></label>
        <textarea id="rej-reason" placeholder="Jelaskan alasan penolakan agar pemohon mengerti..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="showDetailReview(${id})">← Kembali</button>
      <button class="btn btn-danger" onclick="doReject(${id})">✕ Konfirmasi Tolak</button>
    </div>`);
}
function doReject(id) {
  const rejNama    = document.getElementById('rej-nama')?.value.trim();
  const rejJabatan = document.getElementById('rej-jabatan')?.value.trim();
  const reason     = document.getElementById('rej-reason')?.value.trim();
  if (!reason) { showToast('Alasan penolakan wajib diisi'); return; }
  const b = getBon(id);
  if (b.bon_number) { BON_SEQ[b.divisi_id] = parseInt(b.bon_number.split('-')[1]); b.bon_number = null; }
  if (rejNama) b.assessor_nama = rejNama;
  if (rejJabatan) b.assessor_jabatan = rejJabatan;
  b.status = 'REJECTED_ASSESSOR';
  b.reject_notes = reason;
  b.tgl_selesai = new Date().toISOString().slice(0,10);
  addAudit(id, null, 'REJECTED_ASSESSOR', `Ditolak oleh Assessor. Alasan: ${reason}`);
  addNotif([b.pemohon_user_id], 'rejected', `Request Anda ditolak Assessor: ${reason.slice(0,60)}`, id);
  closeModal();
  showToast('Request ditolak. Nomor bon dikembalikan ke pool.');
  renderAssessorDashboard();
}

// ---- PREVIEW BON ----
function previewBonPDF(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  const tgl = new Date(b.tgl_approve||b.tanggal).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const itemRows = b.items.map((it,i)=>`<tr><td style="text-align:center;">${i+1}</td><td>${it.nama}</td><td style="text-align:center;">${it.jumlah}</td><td style="text-align:center;">${it.satuan}</td><td>${b.keterangan}</td></tr>`).join('');
  showModal(`
    <div class="modal-header"><h3>Preview Bon PDF — ${b.bon_number}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="bon-preview">
        <div class="bon-kop">
          <p>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
          <p>DIREKTORAT JENDERAL BEA DAN CUKAI</p>
          <p>KANTOR WILAYAH DJBC KHUSUS KEPULAUAN RIAU</p>
          <p>PANGKALAN SARANA OPERASI BEA DAN CUKAI TIPE A TANJUNG BALAI KARIMUN</p>
        </div>
        <div class="bon-title">BON PERMOHONAN BARANG PERSEDIAAN</div>
        <div class="bon-meta">
          <p><strong>Nomor</strong> &nbsp;&nbsp;&nbsp;: ${b.bon_number}</p>
          <p><strong>Tanggal</strong> : ${tgl}</p>
          <br>
          <p>Yth. Kepala Subbagian Umum dan Kepatuhan Internal</p>
          <p>Diajukan permohonan permintaan barang untuk keperluan operasional <em>${d.nama}</em>:</p>
        </div>
        <table class="bon-table">
          <thead><tr><th style="width:30px;">No</th><th>Nama Barang</th><th style="width:50px;">Jumlah</th><th style="width:60px;">Satuan</th><th>Keterangan</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="bon-ttd">
          <div class="bon-ttd-col">
            <div class="label">${b.assessor_jabatan||d.kepala}</div>
            <div style="height:40px;"></div>
            <div class="name">${b.assessor_nama||d.kepala}</div>
          </div>
          <div class="bon-ttd-col">
            <div class="label">Yang Mengajukan</div>
            <div style="height:40px;"></div>
            <div class="name">${b.pemohon_nama}</div>
          </div>
        </div>
      </div>
      <p style="font-size:11px;color:var(--gray-400);text-align:center;margin-top:10px;">Preview halaman 1 dari 2 (FPB ada di halaman 2)</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      <button class="btn btn-primary" onclick="generateBonHTML(${b.id});closeModal()">📄 Download PDF</button>
    </div>`, true);
}

// ================================================================
// ================= PORTAL STAFF GUDANG ==========================
// ================================================================

function renderGudangDashboard() {
  hideKeranjang();
  S.gudangTab = S.gudangTab || 'aktif';
  const inReview = BON_LIST.filter(b => b.status === 'IN_REVIEW_GUDANG');
  const completed = BON_LIST.filter(b => b.status === 'COMPLETED');
  setContent(`
    <div class="gudang-banner" style="border-radius:20px;padding:22px 26px;">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.7;margin-bottom:4px;">STAFF GUDANG</div>
        <div style="font-family:var(--font-head);font-size:20px;font-weight:800;color:#fff;margin-bottom:3px;">🏪 Portal Staff Gudang</div>
        <div style="font-size:12px;opacity:0.75;margin-bottom:8px;">Verifikasi barang di lapangan & penerbitan SPMB</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">✔ Centang item</span>
          <span style="background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">⊕ Tambah barang</span>
          <span style="background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">＋/− Jumlah</span>
        </div>
      </div>
      <div style="display:flex;gap:14px;">
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 20px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:28px;font-weight:800;color:#fff;">${inReview.length}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">In Review</div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 20px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:28px;font-weight:800;color:#fff;">${completed.length}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">Selesai</div>
        </div>
      </div>
    </div>
    <div class="gudang-tabs">
      <button class="gudang-tab ${S.gudangTab==='aktif'?'active':''}" onclick="switchGudangTab('aktif')">
        Antrian Verifikasi
        ${inReview.length>0?`<span class="tab-badge">${inReview.length}</span>`:''}
      </button>
      <button class="gudang-tab ${S.gudangTab==='selesai'?'active':''}" onclick="switchGudangTab('selesai')">Selesai & Riwayat</button>
    </div>
    <div id="gudang-tab-content"></div>`);
  renderGudangTab();
}

function switchGudangTab(tab) {
  S.gudangTab = tab;
  document.querySelectorAll('.gudang-tab').forEach((t,i) => {
    t.classList.toggle('active', ['aktif','selesai'][i] === tab);
  });
  renderGudangTab();
}

function renderGudangTab() {
  const c = document.getElementById('gudang-tab-content'); if(!c) return;
  if (S.gudangTab === 'aktif') renderGudangAktif(c);
  else renderGudangSelesai(c);
}

// ---- TAB AKTIF: list antrian IN_REVIEW_GUDANG ----
function renderGudangAktif(c) {
  const list = BON_LIST.filter(b => b.status === 'IN_REVIEW_GUDANG');
  if (!list.length) {
    c.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--gray-400);">
      <div style="font-size:48px;margin-bottom:12px;">📭</div>
      <div style="font-size:15px;font-weight:500;margin-bottom:6px;">Tidak ada antrian verifikasi</div>
      <div style="font-size:12px;">Semua bon sudah diproses atau belum ada yang diajukan assessor.</div>
    </div>`;
    return;
  }
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Antrian Verifikasi Lapangan</h3>
        <span style="font-size:12px;color:var(--gray-500);">${list.length} bon menunggu verifikasi</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th>BON ID</th><th>Divisi</th><th>Pemohon</th><th>Unit</th>
          <th>Jml Item</th><th>Tanggal Diajukan</th><th>TTD</th><th>Aksi</th>
        </tr></thead>
        <tbody>${list.map(b => {
          const d = getDivisi(b.divisi_id);
          return `<tr>
            <td style="font-family:monospace;font-size:12px;font-weight:600;">${b.bon_number}</td>
            <td style="font-size:12px;">${d ? d.icon+' '+d.kode_bon : '—'}</td>
            <td style="font-size:12px;"><div style="font-weight:500;">${b.pemohon_nama}</div><div style="font-size:11px;color:var(--gray-400);">${b.pemohon_jabatan}</div></td>
            <td style="font-size:12px;">${b.pemohon_unit}</td>
            <td style="text-align:center;font-weight:600;">${b.items.length}</td>
            <td style="font-size:12px;">${fmtDate(b.tgl_approve)}</td>
            <td style="text-align:center;">${b.has_ttd ? '<span style="color:var(--success);font-size:16px;" title="TTD tersedia">✓</span>' : '<span style="color:var(--gray-300);font-size:16px;" title="TTD belum ada">—</span>'}</td>
            <td><button class="btn btn-warning btn-sm" onclick="showVerifikasiLapangan(${b.id})" style="background:var(--orange);color:#fff;">🔍 Verifikasi</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`;
}

// ---- TAB SELESAI ----
function renderGudangSelesai(c) {
  const list = BON_LIST.filter(b => ['COMPLETED','REJECTED_GUDANG','NEEDS_REVISION'].includes(b.status));
  if (!list.length) { c.innerHTML='<div style="text-align:center;padding:40px;color:var(--gray-400);">Belum ada riwayat</div>'; return; }
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Riwayat Verifikasi</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>BON ID</th><th>Divisi</th><th>Pemohon</th><th>Pengambil</th><th>Status</th><th>Tanggal Selesai</th><th>Dokumen</th></tr></thead>
        <tbody>${list.map(b => {
          const d = getDivisi(b.divisi_id);
          return `<tr>
            <td style="font-family:monospace;font-size:12px;font-weight:600;">${b.bon_number||'—'}</td>
            <td style="font-size:12px;">${d?d.icon+' '+d.kode_bon:'—'}</td>
            <td style="font-size:12px;">${b.pemohon_nama}</td>
            <td style="font-size:12px;">${b.gudang_pengambil||'<span style="color:var(--gray-400);">—</span>'}</td>
            <td>${STATUS_BADGE[b.status]}</td>
            <td style="font-size:12px;">${fmtDate(b.tgl_selesai||b.tanggal)}</td>
            <td>
              <div style="display:flex;gap:5px;flex-wrap:wrap;">
                <div style="display:flex;flex-direction:column;gap:4px;">
        ${b.bon_number?`<button class="btn btn-secondary btn-sm" onclick="generateBonHTML(${b.id})">📄 Bon</button>`:''}
        ${b.status==='COMPLETED'?`<button class="btn btn-secondary btn-sm" onclick="generateSpmbHTML(${b.id})">📑 SPMB</button>`:''}
      </div>
                
              </div>
            </td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ================================================================
// VERIFIKASI LAPANGAN — halaman utama proses gudang
// ================================================================
function showVerifikasiLapangan(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  // Simpan snapshot item asli sebelum gudang mengedit (hanya sekali)
  if (!b.orig_items) b.orig_items = b.items.map(it => ({...it}));
  if (!CHECKLIST_STATE[id]) CHECKLIST_STATE[id] = new Set();
  const checked = CHECKLIST_STATE[id];
  const allChecked = checked.size === b.items.length;

  // Cek apakah ada perubahan item vs snapshot asli
  const origItems = b.orig_items || [];
  const itemCountChanged = b.items.length !== origItems.length; // ada tambah/hapus
  const qtyChanged = !itemCountChanged && b.items.some((it, i) => {
    const orig = origItems[i];
    return orig && it.jumlah !== orig.jumlah;
  });
  const hasItemChange = itemCountChanged; // tambah/hapus → approve disabled

  // Checklist bisa dipencet hanya jika tidak ada perubahan jumlah
  const checklistDisabled = qtyChanged || itemCountChanged;
  // Approve bisa hanya jika tidak ada tambah/hapus item, semua dicentang, dan ada TTD
  const canApprove = allChecked && b.has_ttd && !hasItemChange;
  const pct = b.items.length > 0 ? Math.round(checked.size / b.items.length * 100) : 0;

  showModal(`
    <div class="modal-header">
      <div>
        <h3>Verifikasi Lapangan — ${b.bon_number}</h3>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;">${d.icon} ${d.nama} · Pemohon: ${b.pemohon_nama} · ${b.pemohon_unit}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">

      <!-- Info bon + dokumen -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">

        ${b.has_ttd ? `<span style="font-size:11px;color:var(--success);display:flex;align-items:center;gap:4px;">📎 <strong>TTD sudah diupload</strong></span>` : `<span style="font-size:11px;color:var(--danger);display:flex;align-items:center;gap:4px;">📎 <strong>TTD belum diupload — wajib sebelum Approve</strong></span>`}
      </div>

      <!-- Info pemohon + pengambil -->
      <div style="background:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.8);border-radius:12px;padding:10px 14px;margin-bottom:10px;font-size:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 16px;">
          <div><span style="color:var(--gray-500);">Pemohon:</span> <strong>${b.pemohon_nama}</strong></div>
          <div><span style="color:var(--gray-500);">Unit:</span> ${b.pemohon_unit}</div>
          <div><span style="color:var(--gray-500);">Assessor:</span> <span style="color:var(--success);font-weight:500;">${b.assessor_nama||'—'}</span></div>
          <div><span style="color:var(--gray-500);">Pengambil:</span> <strong style="color:${b.gudang_pengambil?'var(--primary)':'var(--gray-400)'};">${b.gudang_pengambil||'Belum diisi'}</strong></div>
        </div>
      </div>
      <!-- Keterangan bon -->
      <div style="background:rgba(224,242,254,0.8);border:1px solid rgba(186,230,253,0.7);border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--info);">
        📋 <strong>Keterangan Pemohon:</strong> ${b.keterangan}
      </div>

      <!-- Progress checklist -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="font-size:12px;font-weight:600;color:var(--gray-700);">Checklist Barang (${checked.size}/${b.items.length} terverifikasi)</div>
        <div style="font-size:12px;font-weight:700;color:${allChecked?'var(--success)':'var(--gray-500)'};">${pct}%</div>
      </div>
      <div class="progress-wrap" style="margin-bottom:14px;">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>

      <!-- Checklist items -->
      <div class="checklist-wrap" id="cl-wrap-${id}">
        ${b.items.map((it, idx) => {
          const bar = BARANG_DB.find(x=>x.id===it.barang_id)||{};
          const isChecked = checked.has(idx);
          return `<div class="checklist-item ${isChecked?'checked':''}" id="cl-row-${id}-${idx}">
            <div class="cl-checkbox ${isChecked?'checked':''}" onclick="toggleChecklistSafe(${id},${idx},${checklistDisabled?1:0})" title="${checklistDisabled?'Selesaikan revisi dulu sebelum centang':'Centang jika barang tersedia di lapangan'}" style="${checklistDisabled?'opacity:0.4;cursor:not-allowed;':''}">
              ${isChecked?'✓':''}
            </div>
            <div class="cl-thumb">${it.emoji||bar.emoji||'📦'}</div>
            <div style="flex:1;min-width:0;">
              <div class="ci-nama">${it.nama}</div>
              <div class="ci-meta">Kode: ${it.kode} · Rak: ${it.rak||bar.rak||'—'} · Stok: ${bar.stok!==undefined?bar.stok:'?'} ${it.satuan}</div>
            </div>
            <div style="flex-shrink:0;text-align:center;margin-left:8px;">
              <div style="font-size:10px;color:var(--gray-500);margin-bottom:3px;">Jumlah</div>
              <div style="display:flex;align-items:center;gap:3px;">
                <button class="qty-btn" onclick="decGudangQty(${id},${idx})" style="width:22px;height:22px;" ${checked.has(idx)?'disabled style="opacity:0.3;cursor:not-allowed;width:22px;height:22px;"':''}>−</button>
                <input type="number" min="1" max="${bar.stok||999}" value="${it.jumlah}"
                  oninput="setGudangQty(${id},${idx},this.value,${bar.stok||999})"
                  id="gqty-${id}-${idx}"
                  ${checked.has(idx)?'disabled':''}
                  style="width:42px;text-align:center;border:1px solid var(--gray-300);border-radius:5px;padding:2px;font-size:12px;font-weight:600;${checked.has(idx)?'opacity:0.4;background:var(--gray-100);':''}">
                <button class="qty-btn add" onclick="incGudangQty(${id},${idx},${bar.stok||999})" style="width:22px;height:22px;" ${checked.has(idx)?'disabled style="opacity:0.3;cursor:not-allowed;width:22px;height:22px;"':''}>+</button>
              </div>
              <div style="font-size:10px;color:var(--gray-400);">${it.satuan}</div>
            </div>
            <button class="delete-btn" onclick="removeGudangItem(${id},${idx})" title="Hapus item" style="margin-left:6px;flex-shrink:0;${checked.has(idx)?'opacity:0.3;cursor:not-allowed;pointer-events:none;':''}" ${checked.has(idx)?'disabled':''}>🗑</button>
          </div>`;
        }).join('')}
      </div>

      ${hasItemChange ? '<div class="alert alert-warning" style="font-size:12px;margin-bottom:10px;">⚠ Ada item yang ditambah/dihapus — <strong>Kirim Revisi ke Assessor</strong> sebelum Approve.</div>' : ''}
      ${qtyChanged && !itemCountChanged ? '<div class="alert alert-warning" style="font-size:12px;margin-bottom:10px;">⚠ Ada perubahan jumlah — centang tidak bisa diubah. Kirim Revisi ke Assessor.</div>' : ''}
      <div style="margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" onclick="showAddItemGudang(${id})">+ Tambah Item Barang</button>
        ${(hasItemChange||qtyChanged)?`<button class="btn btn-secondary btn-sm" style="margin-left:6px;" onclick="resetGudangItems(${id})">↺ Reset ke Semula</button>`:''}
      </div>

      ${!allChecked
        ? `<div class="alert alert-warning" style="margin-top:0;">⚠ Centang semua item yang sudah diverifikasi di lapangan sebelum Approve.</div>`
        : !b.has_ttd
          ? `<div class="alert alert-danger" style="margin-top:0;">📎 Lampiran TTD <strong>wajib diupload</strong> sebelum Approve. Minta pemohon upload TTD via Satu Kemenkeu terlebih dahulu.</div>`
          : `<div class="alert alert-success" style="margin-top:0;">✓ Semua item terverifikasi & TTD sudah ada. Siap untuk di-Approve.</div>`
      }
    </div>
    <div class="modal-footer">
      <button class="btn btn-danger btn-sm" onclick="showGudangRejectPopup(${id})">✕ Tolak Semua</button>
      <button class="btn btn-warning btn-sm" onclick="showGudangRevisiPopup(${id})">↩ Kirim Revisi ke Assessor</button>
      <div style="flex:1"></div>
      <button class="btn ${canApprove?'btn-success':'btn-secondary'}"
        onclick="doApproveClick(${id})"
        style="${canApprove?'':'opacity:0.55;cursor:not-allowed;'}">
        ✓ Approve & Terbitkan SPMB
      </button>
    </div>`, true);
}


// ── GUDANG EDIT HELPERS ──
function resetGudangItems(bonId) {
  const b = getBon(bonId);
  if (!b || !b.orig_items) return;
  b.items = b.orig_items.map(it => ({...it}));
  if (CHECKLIST_STATE[bonId]) CHECKLIST_STATE[bonId].clear();
  showVerifikasiLapangan(bonId);
  showToast('Item dikembalikan ke kondisi semula');
}
function incGudangQty(bonId, idx, max) {
  const b = getBon(bonId); if (!b) return;
  if (!b.orig_items) b.orig_items = JSON.parse(JSON.stringify(b.items));
  b.items[idx].jumlah = Math.min((b.items[idx].jumlah||1)+1, max);
  const el = document.getElementById(`gqty-${bonId}-${idx}`);
  if (el) el.value = b.items[idx].jumlah;
}
function decGudangQty(bonId, idx) {
  const b = getBon(bonId); if (!b) return;
  if (!b.orig_items) b.orig_items = JSON.parse(JSON.stringify(b.items));
  b.items[idx].jumlah = Math.max(1, (b.items[idx].jumlah||1)-1);
  const el = document.getElementById(`gqty-${bonId}-${idx}`);
  if (el) el.value = b.items[idx].jumlah;
}
function setGudangQty(bonId, idx, val, max) {
  const b = getBon(bonId); if (!b) return;
  if (!b.orig_items) b.orig_items = JSON.parse(JSON.stringify(b.items));
  const n = Math.min(Math.max(1, parseInt(val)||1), max);
  b.items[idx].jumlah = n;
}

// ── TAMBAH ITEM dari katalog (gudang) ──
function showAddItemGudang(bonId) {
  const b = getBon(bonId);
  const d = getDivisi(b.divisi_id);
  const available = BARANG_DB.filter(x => x.divisi_id === d.id);
  showModal(`
    <div class="modal-header">
      <h3>Tambah Item ke Bon</h3>
      <button class="modal-close" onclick="showVerifikasiLapangan(${bonId})">×</button>
    </div>
    <div class="modal-body">
      <div class="alert alert-info">Item yang ditambahkan di sini akan disertakan dalam catatan revisi ke Assessor.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;max-height:360px;overflow-y:auto;">
        ${available.map(x => {
          const alreadyIn = b.items.find(i => i.barang_id === x.id);
          return `<div style="border:1px solid ${alreadyIn?'var(--gray-200)':'var(--gray-200)'};border-radius:8px;padding:10px;cursor:${alreadyIn?'default':'pointer'};text-align:center;opacity:${alreadyIn?'0.45':'1'};transition:all 0.1s;"
            ${!alreadyIn?`onclick="addItemGudang(${bonId},${x.id})" onmouseover="this.style.borderColor='var(--primary)';this.style.background='var(--primary-light)'" onmouseout="this.style.borderColor='var(--gray-200)';this.style.background=''"`:''}>
            <div style="font-size:24px;margin-bottom:4px;">${x.emoji}</div>
            <div style="font-size:11px;font-weight:600;line-height:1.3;margin-bottom:2px;">${x.nama}</div>
            <div style="font-size:10px;color:var(--gray-500);">Stok: ${x.stok} ${x.satuan}</div>
            ${alreadyIn?`<div style="font-size:10px;color:var(--gray-400);margin-top:3px;">Sudah ada</div>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>`, false);
}

function addItemGudang(bonId, barangId) {
  const b = getBon(bonId);
  const bar = BARANG_DB.find(x => x.id === barangId);
  if (!bar) return;
  if (b.items.find(i => i.barang_id === barangId)) {
    showToast('Item sudah ada dalam daftar'); return;
  }
  // Save original items snapshot before first edit
  if (!b.orig_items) b.orig_items = JSON.parse(JSON.stringify(b.items));
  b.items.push({
    barang_id: bar.id, nama: bar.nama, jumlah: 1,
    satuan: bar.satuan, kode: bar.kode, rak: bar.rak, emoji: bar.emoji
  });
  showToast(`${bar.emoji} ${bar.nama.split(' ').slice(0,3).join(' ')} ditambahkan`);
  showVerifikasiLapangan(bonId);
}

function toggleChecklistSafe(bonId, idx, disabled) {
  if (disabled) { showToast('Selesaikan revisi item dulu sebelum centang'); return; }
  toggleChecklist(bonId, idx);
}
function toggleChecklist(bonId, idx) {
  if (!CHECKLIST_STATE[bonId]) CHECKLIST_STATE[bonId] = new Set();
  const s = CHECKLIST_STATE[bonId];
  if (s.has(idx)) s.delete(idx); else s.add(idx);
  showVerifikasiLapangan(bonId);
}

function removeGudangItem(bonId, idx) {
  const b = getBon(bonId);
  if (b.items.length <= 1) { showToast('Minimal satu item harus ada'); return; }
  if (!b.orig_items) b.orig_items = JSON.parse(JSON.stringify(b.items));
  b.items.splice(idx, 1);
  // re-index checklist
  const old = CHECKLIST_STATE[bonId] || new Set();
  const newSet = new Set();
  old.forEach(i => { if (i < idx) newSet.add(i); else if (i > idx) newSet.add(i-1); });
  CHECKLIST_STATE[bonId] = newSet;
  showVerifikasiLapangan(bonId);
  showToast('Item dihapus dari bon');
}

// ---- APPROVE GUDANG ----
function doApproveClick(id) {
  const b = getBon(id);
  if (!b) return;
  const checked = CHECKLIST_STATE[id] || new Set();
  const origItems = b.orig_items || [];
  const itemCountChanged = b.items.length !== origItems.length;
  const allChecked = checked.size === b.items.length;
  const canApprove = allChecked && b.has_ttd && !itemCountChanged;
  if (itemCountChanged) { showToast('Ada item ditambah/dihapus — kirim revisi ke Assessor dulu'); return; }
  if (!allChecked) { showToast('Centang semua item terlebih dahulu'); return; }
  if (!b.has_ttd) { showToast('Upload TTD terlebih dahulu sebelum Approve'); return; }
  showGudangApprovePopup(id);
}
function showGudangApprovePopup(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  const spmb_num = `SPMB-${b.bon_number.split('-')[1].split('/')[0]}/${d.kode_spmb}/${new Date().getFullYear()}`;
  showModal(`
    <div class="modal-header"><h3>Konfirmasi Approve & Terbitkan SPMB</h3><button class="modal-close" onclick="showVerifikasiLapangan(${id})">×</button></div>
    <div class="modal-body">
      <div class="alert alert-warning">
        ⚠ <strong>Perhatian:</strong> Setelah Approve, stok barang akan langsung dikurangi dan SPMB diterbitkan. Tindakan ini tidak dapat dibatalkan.
      </div>
      <div style="background:var(--gray-50);border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;">
        <div class="info-row"><div class="info-label">Bon Referensi</div><div class="info-value" style="font-family:monospace;">${b.bon_number}</div></div>
        <div class="info-row"><div class="info-label">Nomor SPMB</div><div class="info-value" style="font-family:monospace;color:var(--orange);font-weight:700;">${spmb_num}</div></div>
        <div class="info-row"><div class="info-label">Total Item</div><div class="info-value">${b.items.length} jenis barang</div></div>
      </div>
      <div class="form-group">
        <label>Nama Pengambil Barang <span style="color:var(--danger)">*</span><br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">yang hadir langsung mengambil di gudang — tampil di SPMB kolom Penerima</span></label>
        <input id="gd-pengambil" value="${b.pemohon_nama}" placeholder="Nama yang mengambil barang">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nama Staf Perbekalan <span style="color:var(--danger)">*</span><br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">kolom "Staf Perbekalan" di SPMB</span></label>
          <input id="gd-staf" value="${S.user.nama}" placeholder="Nama staf gudang">
        </div>
        <div class="form-group">
          <label>Kepala Subbagian Umum & KI <span style="color:var(--danger)">*</span><br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">kolom KaSuBag di SPMB</span></label>
          <input id="gd-kepala" value="Ratna Dewi Lestari" placeholder="Nama kepala subbag">
        </div>
      </div>
      <div style="background:var(--success-light);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--success);margin-top:4px;">
        <strong>Stok yang akan dikurangi:</strong><br>
        ${b.items.map(it=>`${it.emoji||''} ${it.nama}: −${it.jumlah} ${it.satuan}`).join('<br>')}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="showVerifikasiLapangan(${id})">← Kembali</button>
      <button class="btn btn-success" onclick="doGudangApprove(${id})">✓ Approve & Terbitkan SPMB</button>
    </div>`);
}

function doGudangApprove(id) {
  const pengambil = document.getElementById('gd-pengambil')?.value.trim();
  const staf = document.getElementById('gd-staf')?.value.trim();
  const kepala = document.getElementById('gd-kepala')?.value.trim();
  if (!pengambil || !staf || !kepala) { showToast('Semua field wajib diisi'); return; }

  const b = getBon(id);
  const d = getDivisi(b.divisi_id);

  // Validasi stok
  let stokError = null;
  for (const it of b.items) {
    const bar = BARANG_DB.find(x => x.id === it.barang_id);
    if (bar && bar.stok < it.jumlah) {
      stokError = `Stok ${it.nama} tidak mencukupi (tersedia: ${bar.stok}, diminta: ${it.jumlah})`;
      break;
    }
  }
  if (stokError) { showToast('⚠ ' + stokError); return; }

  // Kurangi stok + catat ke STOCK_LOG
  b.items.forEach(it => {
    const bar = BARANG_DB.find(x => x.id === it.barang_id);
    if (bar) {
      const stok_sblm = bar.stok;
      bar.stok = Math.max(0, bar.stok - it.jumlah);
      STOCK_LOG.push({ id:++STOCK_LOG_SEQ, barang_id:bar.id, tgl:new Date().toISOString().slice(0,10),
        jenis:'KELUAR', jumlah:it.jumlah, keterangan:b.bon_number+' — '+b.keterangan.slice(0,60),
        ref_bon:b.bon_number, stok_sebelum:stok_sblm, stok_sesudah:bar.stok });
    }
  });

  // Generate SPMB number
  const bonNum = b.bon_number.split('-')[1].split('/')[0];
  b.spmb_number = `SPMB-${bonNum}/${d.kode_spmb}/${new Date().getFullYear()}`;
  b.status = 'COMPLETED';
  b.tgl_selesai = new Date().toISOString().slice(0,10);
  b.gudang_pengambil = pengambil;
  b.gudang_staf = staf;
  b.gudang_kepala = kepala;

  // Kirim notifikasi ke pemohon
  addNotif(
    [b.pemohon_user_id],
    'gudang_approved',
    'Permintaan Kamu Telah Disetujui Gudang — Tandatangani SPMB di Satu Kemenkeu (menu TTE Eksternal)',
    b.id
  );

  closeModal();
  showModal(`
    <div class="modal-body" style="text-align:center;padding:36px 24px;">
      <div style="font-size:44px;margin-bottom:12px;">🎉</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">Barang Berhasil Dikeluarkan!</h3>
      <div style="font-size:13px;color:var(--gray-600);margin-bottom:8px;">SPMB diterbitkan:</div>
      <div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--orange);background:var(--orange-light);padding:10px 20px;border-radius:8px;display:inline-block;margin-bottom:16px;">${b.spmb_number}</div>
      <div style="background:var(--success-light);border-radius:10px;padding:12px 16px;margin-bottom:18px;text-align:left;font-size:12px;color:var(--success);">
        <div style="font-weight:600;margin-bottom:6px;">✓ Stok berhasil dikurangi:</div>
        ${b.items.map(it=>`<div>• ${it.emoji||''} ${it.nama}: −${it.jumlah} ${it.satuan}</div>`).join('')}
      </div>

      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="generateSpmbHTML(${id});closeModal()">📑 Preview SPMB</button>
        <button class="btn btn-primary" onclick="closeModal();renderGudangDashboard()">Kembali ke Dashboard</button>
      </div>
    </div>`);
}

// ---- REVISI GUDANG ----
function showGudangRevisiPopup(id) {
  const b = getBon(id);
  showModal(`
    <div class="modal-header"><h3>Minta Revisi ke Assessor</h3><button class="modal-close" onclick="showVerifikasiLapangan(${id})">×</button></div>
    <div class="modal-body">
      <div class="alert alert-info">Bon + editan item (perubahan jumlah & item baru) akan dikirim ke Assessor. Assessor cukup review dan ajukan ulang ke gudang.</div>
      <div class="form-group">
        <label>Catatan Revisi <span style="color:var(--danger)">*</span></label>
        <textarea id="rev-notes" placeholder="Jelaskan ketidaksesuaian yang ditemukan. Contoh: Jumlah Cat Kapal hanya tersedia 4 kaleng (diminta 6). Thinner Nitro habis stok."></textarea>
      </div>
      <div style="background:var(--gray-50);border-radius:8px;padding:10px 14px;font-size:12px;margin-top:4px;">
        <div style="font-weight:600;margin-bottom:6px;color:var(--gray-600);">Daftar item (setelah editan gudang):</div>
        ${b.items.map(it=>{
          const orig = (b.orig_items||[]).find(o=>o.barang_id===it.barang_id);
          const changed = orig && orig.jumlah !== it.jumlah;
          const isNew = !orig;
          return `<div style="margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <span>${it.emoji||''} ${it.nama}: <strong>${it.jumlah} ${it.satuan}</strong></span>
            ${changed?`<span style="font-size:10px;background:var(--warning-light);color:var(--warning);padding:1px 6px;border-radius:10px;">diubah dari ${orig.jumlah}</span>`:''}
            ${isNew?`<span style="font-size:10px;background:var(--primary-light);color:var(--primary);padding:1px 6px;border-radius:10px;">baru ditambahkan</span>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="showVerifikasiLapangan(${id})">← Kembali</button>
      <button class="btn btn-warning" onclick="doGudangRevisi(${id})">↩ Kirim Revisi ke Assessor</button>
    </div>`);
}

function doGudangRevisi(id) {
  const notes = document.getElementById('rev-notes')?.value.trim();
  if (!notes) { showToast('Catatan revisi wajib diisi'); return; }
  const b = getBon(id);
  // Build diff summary for assessor
  const orig = b.orig_items || [];
  const diffLines = [];
  b.items.forEach(it => {
    const o = orig.find(x => x.barang_id === it.barang_id);
    if (!o) diffLines.push(`[+] ${it.nama}: ${it.jumlah} ${it.satuan} (baru ditambahkan gudang)`);
    else if (o.jumlah !== it.jumlah) diffLines.push(`[~] ${it.nama}: ${o.jumlah} → ${it.jumlah} ${it.satuan} (diubah gudang)`);
  });
  orig.forEach(o => {
    if (!b.items.find(it => it.barang_id === o.barang_id))
      diffLines.push(`[-] ${o.nama}: dihapus oleh gudang`);
  });
  const fullNote = notes + (diffLines.length ? '\n\nPerubahan dari gudang:\n' + diffLines.join('\n') : '');
  b.status = 'NEEDS_REVISION';
  b.reject_notes = fullNote;
  b.revision_count = (b.revision_count||0) + 1;
  // Items edited by gudang are kept as-is — assessor sees the modified list
  delete b.orig_items; // reset snapshot for next round
  delete CHECKLIST_STATE[id];
  addAudit(id, b.bon_number, 'NEEDS_REVISION', `Gudang minta revisi (ke-${b.revision_count}): ${notes}`);
  const aIds = USERS.filter(u=>u.role==='ASSESSOR'&&u.divisi_id===b.divisi_id).map(u=>u.id);
  addNotif(aIds, 'revision', `${b.bon_number} dikembalikan untuk revisi: ${notes.slice(0,60)}`, id);
  closeModal();
  showToast('Bon + editan item dikembalikan ke Assessor ✓');
  renderGudangDashboard();
}

// ---- REJECT GUDANG ----
function showGudangRejectPopup(id) {
  const b = getBon(id);
  showModal(`
    <div class="modal-header"><h3>Tolak Request</h3><button class="modal-close" onclick="showVerifikasiLapangan(${id})">×</button></div>
    <div class="modal-body">
      <div class="alert alert-danger">Request akan ditolak secara total. Nomor bon <strong>${b.bon_number}</strong> dikembalikan ke pool (SPMB tidak diterbitkan). Stok tidak berubah.</div>
      <div class="form-group">
        <label>Alasan Penolakan <span style="color:var(--danger)">*</span></label>
        <textarea id="grej-reason" placeholder="Jelaskan alasan penolakan. Contoh: Semua item yang diminta tidak tersedia di gudang."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="showVerifikasiLapangan(${id})">← Kembali</button>
      <button class="btn btn-danger" onclick="doGudangReject(${id})">✕ Konfirmasi Tolak</button>
    </div>`);
}

function doGudangReject(id) {
  const reason = document.getElementById('grej-reason')?.value.trim();
  if (!reason) { showToast('Alasan penolakan wajib diisi'); return; }
  const b = getBon(id);
  // Return bon number to pool
  if (b.bon_number) {
    const num = parseInt(b.bon_number.split('-')[1]);
    if (!isNaN(num)) BON_SEQ[b.divisi_id] = num;
    b.bon_number = null;
  }
  b.status = 'REJECTED_GUDANG';
  b.reject_notes = reason;
  b.tgl_selesai = new Date().toISOString().slice(0,10);
  delete CHECKLIST_STATE[id];
  addAudit(id, null, 'REJECTED_GUDANG', `Ditolak Gudang: ${reason}`);
  const aIds2 = USERS.filter(u=>u.role==='ASSESSOR'&&u.divisi_id===b.divisi_id).map(u=>u.id);
  addNotif([b.pemohon_user_id, ...aIds2], 'rejected', `${b.bon_number} ditolak gudang: ${reason.slice(0,60)}`, id);
  closeModal();
  showToast('Request ditolak. Nomor bon dikembalikan ke pool.');
  renderGudangDashboard();
}

// ---- PREVIEW SPMB ----
function previewSPMB(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  if (!b.spmb_number) {
    const bonNum = b.bon_number ? b.bon_number.split('-')[1].split('/')[0] : '?';
    b.spmb_number = `SPMB-${bonNum}/${d.kode_spmb}/${new Date().getFullYear()}`;
  }
  const tgl = new Date(b.tgl_selesai||b.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const itemRows = b.items.map((it,i)=>`
    <tr>
      <td style="text-align:center;">${i+1}</td>
      <td style="text-align:center;">${it.jumlah}</td>
      <td style="text-align:center;">${it.satuan}</td>
      <td>${it.kode}</td>
      <td>${it.nama}</td>
      <td></td>
    </tr>`).join('');
  showModal(`
    <div class="modal-header"><h3>Preview SPMB — ${b.spmb_number}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="spmb-preview">
        <div class="spmb-kop">
          <p>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
          <p>DIREKTORAT JENDERAL BEA DAN CUKAI</p>
          <p>KANTOR WILAYAH DJBC KHUSUS KEPULAUAN RIAU</p>
          <p>PANGKALAN SARANA OPERASI BEA DAN CUKAI TIPE A TANJUNG BALAI KARIMUN</p>
        </div>
        <div class="spmb-title">Surat Perintah Mengeluarkan Barang (SPMB)</div>
        <div style="margin-bottom:10px;">
          <p><strong>Nomor</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${b.spmb_number}</p>
          <p><strong>Sub Bagian / Seksi</strong> : ${d.nama}</p>
          <p><strong>Berdasarkan Surat</strong> : ${b.bon_number}</p>
          <p><strong>Tanggal</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${tgl}</p>
        </div>
        <table class="spmb-table">
          <thead><tr>
            <th style="width:28px;">No</th>
            <th style="width:45px;">Jumlah</th>
            <th style="width:55px;">Satuan</th>
            <th>Kode Barang</th>
            <th>Nama Barang</th>
            <th style="width:60px;">Ket.</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;font-size:10.5px;">
          <div><strong>Diterima</strong> : ${tgl}</div>
          <div><strong>Dikeluarkan</strong> : ${tgl}</div>
        </div>
        <div class="spmb-ttd">
          <div class="spmb-ttd-col">
            <div class="st-label">Penerima Barang</div>
            <div class="st-name">${b.pemohon_nama}</div>
          </div>
          <div class="spmb-ttd-col">
            <div class="st-label">Staf Perbekalan</div>
            <div class="st-name">${b.gudang_staf||S.user.nama}</div>
          </div>
          <div class="spmb-ttd-col">
            <div class="st-label">Kep. Subbag Umum & KI<br>a.n Kuasa Pengguna Barang</div>
            <div class="st-name">${b.gudang_kepala||'Ratna Dewi Lestari'}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
      <button class="btn btn-primary" onclick="generateSpmbHTML(b.id);closeModal()">📑 Download SPMB PDF</button>
    </div>`, true);
}

// ================================================================
// ================= PORTAL ADMIN GUDANG ==========================
// ================================================================

// State untuk tambah/edit barang
const ADMIN_STATE = { editId: null, adminTab: 'barang', opnameChanges: {}, userEditId: null, searchBarang: '', pembelianItems: [] };

// ── STOCK LOG (Kartu Barang Digital) ──
// { id, barang_id, tgl, jenis:'MASUK'|'KELUAR'|'OPNAME'|'SALDO_AWAL', jumlah, keterangan, ref_bon, stok_sebelum, stok_sesudah }
let STOCK_LOG = [
  { id:1,  barang_id:1,  tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:30, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:30 },
  { id:2,  barang_id:1,  tgl:'2026-03-18', jenis:'KELUAR',     jumlah:6,  keterangan:'BON-261/PSO.13/2026 — Pengecatan lambung BC 30005', ref_bon:'BON-261/PSO.13/2026', stok_sebelum:30, stok_sesudah:24 },
  { id:3,  barang_id:2,  tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:12, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:12 },
  { id:4,  barang_id:5,  tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:34, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:34 },
  { id:5,  barang_id:5,  tgl:'2026-03-18', jenis:'KELUAR',     jumlah:4,  keterangan:'BON-261/PSO.13/2026 — Pengecatan lambung BC 30005', ref_bon:'BON-261/PSO.13/2026', stok_sebelum:34, stok_sesudah:30 },
  { id:6,  barang_id:7,  tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:18, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:18 },
  { id:7,  barang_id:8,  tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:5,  keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:5 },
  { id:8,  barang_id:8,  tgl:'2026-02-10', jenis:'MASUK',      jumlah:3,  keterangan:'Pengadaan Q1 2026', ref_bon:'—', stok_sebelum:5,  stok_sesudah:2 },
  { id:9,  barang_id:11, tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:50, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:50 },
  { id:10, barang_id:14, tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:10, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:10 },
  { id:11, barang_id:15, tgl:'2026-01-01', jenis:'SALDO_AWAL', jumlah:30, keterangan:'Saldo awal tahun 2026', ref_bon:'—', stok_sebelum:0,  stok_sesudah:30 },
  { id:12, barang_id:15, tgl:'2026-01-20', jenis:'MASUK',      jumlah:6,  keterangan:'Pengadaan Q1 2026', ref_bon:'—', stok_sebelum:30, stok_sesudah:36 },
  { id:13, barang_id:15, tgl:'2026-02-15', jenis:'KELUAR',     jumlah:12, keterangan:'Pemeliharaan rutin Feb 2026', ref_bon:'—', stok_sebelum:36, stok_sesudah:24 },
];
let STOCK_LOG_SEQ = 20;

// ── LOG PEMBELIAN (Dokumen Pengadaan) ──
let PEMBELIAN_LOG = [
  { id:1, no_dok:'SPK-2026/001', tgl:'2026-01-05', keterangan:'Pengadaan Awal Tahun 2026 Q1',
    items:[{barang_id:15,nama:'Oli Mesin SAE 40 1 Liter',jumlah:6},{barang_id:8,nama:'Thinner Nitro 1 Liter',jumlah:3}] },
];
let PEMBELIAN_SEQ = 10;

function addStockLog(barang_id, jenis, jumlah, keterangan, ref_bon) {
  const b = BARANG_DB.find(x=>x.id===barang_id); if (!b) return;
  const stok_sebelum = b.stok;
  const stok_sesudah = jenis==='KELUAR' ? stok_sebelum - jumlah : stok_sebelum + jumlah;
  STOCK_LOG.push({ id:++STOCK_LOG_SEQ, barang_id, tgl:new Date().toISOString().slice(0,10), jenis, jumlah, keterangan, ref_bon:ref_bon||'—', stok_sebelum, stok_sesudah });
}

function renderAdminGudangDashboard() {
  hideKeranjang();
  ADMIN_STATE.adminTab = ADMIN_STATE.adminTab || 'barang';
  const totalBarang = BARANG_DB.length;
  const stokHabis = BARANG_DB.filter(b => b.stok === 0).length;
  const stokRendah = BARANG_DB.filter(b => b.stok > 0 && b.stok < 5).length;
  const selesai = BON_LIST.filter(b => b.status === 'COMPLETED').length;

  setContent(`
    <div class="admin-banner" style="border-radius:20px;padding:22px 26px;">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.7;margin-bottom:4px;">ADMIN GUDANG</div>
        <div style="font-family:var(--font-head);font-size:20px;font-weight:800;color:#fff;margin-bottom:3px;">🗄 Portal Admin Gudang</div>
        <div style="font-size:12px;opacity:0.75;">Manajemen master data barang, stok, dan laporan transaksi</div>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 18px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:#fff;">${totalBarang}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">Jenis Barang</div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 18px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
          <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:#fff;">${selesai}</div>
          <div style="font-size:10px;opacity:0.8;font-weight:600;">Transaksi</div>
        </div>
      </div>
    </div>
    <div class="admin-stat-grid">
      <div class="admin-stat-card">
        <div class="asc-num">${totalBarang}</div>
        <div class="asc-label">Total Jenis Barang</div>
        <div class="asc-sub">di semua divisi</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-num" style="color:var(--danger);">${stokHabis}</div>
        <div class="asc-label">Stok Habis</div>
        <div class="asc-sub">perlu restock</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-num" style="color:var(--warning);">${stokRendah}</div>
        <div class="asc-label">Stok Rendah</div>
        <div class="asc-sub">di bawah 5 unit</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-num" style="color:var(--success);">${selesai}</div>
        <div class="asc-label">Transaksi Selesai</div>
        <div class="asc-sub">total keseluruhan</div>
      </div>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab ${ADMIN_STATE.adminTab==='barang'?'active':''}" onclick="switchAdminTab('barang')">📦 Manajemen Barang</button>
      <button class="admin-tab ${ADMIN_STATE.adminTab==='opname'?'active':''}" onclick="switchAdminTab('opname')">📊 Stock Opname</button>
      <button class="admin-tab ${ADMIN_STATE.adminTab==='laporan'?'active':''}" onclick="switchAdminTab('laporan')">📄 Laporan Transaksi</button>
      <button class="admin-tab ${ADMIN_STATE.adminTab==='pembelian'?'active':''}" onclick="switchAdminTab('pembelian')">🛒 Input Pembelian</button>
    </div>
    <div id="admin-tab-content"></div>`);
  renderAdminTab();
}

function switchAdminTab(tab) {
  ADMIN_STATE.adminTab = tab;
  ADMIN_STATE.opnameChanges = {};
  document.querySelectorAll('.admin-tab').forEach((t,i) => {
    t.classList.toggle('active', ['barang','opname','laporan','pembelian'][i] === tab);
  });
  renderAdminTab();
}

function renderAdminTab() {
  const c = document.getElementById('admin-tab-content'); if (!c) return;
  if (ADMIN_STATE.adminTab === 'barang')    renderManajemenBarang(c);
  if (ADMIN_STATE.adminTab === 'opname')    renderStockOpname(c);
  if (ADMIN_STATE.adminTab === 'laporan')   renderAdminLaporan(c);
  if (ADMIN_STATE.adminTab === 'pembelian') renderInputPembelian(c);
}

// ---- MANAJEMEN BARANG ----
function adminSearchInput(val) {
  ADMIN_STATE.searchBarang = val;
  const tbody = document.getElementById('barang-tbody');
  if (!tbody) { renderAdminTab(); return; }
  const filterDiv = ADMIN_STATE.filterDivisi || 'Semua';
  const searchQ   = (val || '').toLowerCase();
  let list = [...BARANG_DB];
  if (filterDiv !== 'Semua') list = list.filter(b => b.divisi_id === parseInt(filterDiv));
  if (searchQ) list = list.filter(b => b.nama.toLowerCase().includes(searchQ) || b.kode.includes(searchQ));
  const rows = list.map(b => {
    const d = getDivisi(b.divisi_id);
    const stokClass = b.stok===0 ? 'stok-zero' : b.stok<5 ? 'stok-low' : 'stok-ok';
    return `<tr>
      <td><div class="barang-thumb">${b.emoji||'📦'}</div></td>
      <td style="font-size:13px;font-weight:500;max-width:200px;">${b.nama}</td>
      <td style="font-family:monospace;font-size:11px;color:var(--gray-500);">${b.kode}</td>
      <td style="font-size:12px;">${d?d.icon+' '+d.kode_bon:'—'}</td>
      <td style="font-size:12px;">${b.satuan}</td>
      <td><span class="stok-pill ${stokClass}">${b.stok} ${b.satuan.toLowerCase()}</span></td>
      <td style="font-size:12px;color:var(--gray-500);">${b.rak||'—'}</td>
      <td>${b.aktif!==false?'<span style="color:var(--success);font-weight:600;font-size:12px;">Aktif</span>':'<span style="color:var(--gray-400);font-size:12px;">Nonaktif</span>'}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="showKartuBarang(${b.id})" style="margin-right:4px;">📋 Kartu</button>
        <button class="btn btn-secondary btn-sm" onclick="showFormBarang(${b.id})">✏️</button>
      </td>
    </tr>`;
  }).join('');
  tbody.innerHTML = rows || '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-400);">Tidak ada barang ditemukan</td></tr>';
}

function renderManajemenBarang(c) {
  const filterDiv = ADMIN_STATE.filterDivisi || 'Semua';
  const filterAktif = ADMIN_STATE.filterAktif !== undefined ? ADMIN_STATE.filterAktif : 'Semua';
  const searchQ = (ADMIN_STATE.searchBarang||'').toLowerCase();
  let list = [...BARANG_DB];
  if (filterDiv !== 'Semua') list = list.filter(b => b.divisi_id === parseInt(filterDiv));
  if (searchQ) list = list.filter(b => b.nama.toLowerCase().includes(searchQ) || b.kode.includes(searchQ));

  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Katalog Master Barang</h3>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <div style="position:relative;flex:1;min-width:180px;max-width:280px;">
            <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;">🔍</span>
            <input type="text" value="${ADMIN_STATE.searchBarang||''}" placeholder="Cari nama / kode barang..."
              style="width:100%;padding:7px 10px 7px 30px;font-size:13px;border:1px solid var(--gray-300);border-radius:8px;"
              id="admin-search-input" oninput="adminSearchInput(this.value)">
          </div>
          <select style="font-size:12px;padding:5px 8px;border:1px solid var(--gray-300);border-radius:6px;" onchange="ADMIN_STATE.filterDivisi=this.value;renderAdminTab()">
            <option value="Semua" ${filterDiv==='Semua'?'selected':''}>Semua Divisi</option>
            ${MASTER_SEKSI.map(d=>`<option value="${d.id}" ${filterDiv==d.id?'selected':''}>${d.kode_bon} — ${d.nama}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="showFormBarang(null)">+ Tambah Barang</button>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th style="width:44px;"></th>
          <th>Nama Barang</th>
          <th>Kode Barang</th>
          <th>Divisi</th>
          <th>Satuan</th>
          <th>Stok</th>
          <th>Rak</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr></thead>
        <tbody id="barang-tbody">
          ${list.map(b => {
            const d = getDivisi(b.divisi_id);
            const stokClass = b.stok===0 ? 'stok-zero' : b.stok<5 ? 'stok-low' : 'stok-ok';
            return `<tr>
              <td><div class="barang-thumb">${b.emoji||'📦'}</div></td>
              <td style="font-size:13px;font-weight:500;max-width:200px;">${b.nama}</td>
              <td style="font-family:monospace;font-size:11px;color:var(--gray-500);">${b.kode}</td>
              <td style="font-size:12px;">${d?d.icon+' '+d.kode_bon:'—'}</td>
              <td style="font-size:12px;">${b.satuan}</td>
              <td><span class="stok-pill ${stokClass}">${b.stok} ${b.satuan.toLowerCase()}</span></td>
              <td style="font-size:12px;color:var(--gray-500);">${b.rak||'—'}</td>
              <td>
                <div class="toggle-wrap" onclick="toggleBarangStatus(${b.id})">
                  <div class="toggle-track ${b.aktif!==false?'toggle-on':'toggle-off'}">
                    <div class="toggle-thumb ${b.aktif!==false?'thumb-on':'thumb-off'}"></div>
                  </div>
                  <span style="font-size:11px;color:var(--gray-500);">${b.aktif!==false?'Aktif':'Nonaktif'}</span>
                </div>
              </td>
              <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                  <button class="btn btn-secondary btn-sm" onclick="showKartuBarang(${b.id})" title="Kartu Barang / Riwayat Stok">📋</button>
                  <button class="btn btn-secondary btn-sm" onclick="showFormBarang(${b.id})">✏ Edit</button>
                  <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="konfirmasiHapusBarang(${b.id})">🗑</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>`;
}

function toggleBarangStatus(id) {
  const b = BARANG_DB.find(x=>x.id===id);
  if (b) { b.aktif = b.aktif === false ? true : false; renderAdminTab(); showToast(`${b.nama.split(' ').slice(0,3).join(' ')} — status diubah`); }
}

function konfirmasiHapusBarang(id) {
  const b = BARANG_DB.find(x=>x.id===id);
  showModal(`
    <div class="modal-body" style="padding:28px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">⚠️</div>
      <h3 style="font-weight:700;margin-bottom:8px;">Hapus Barang?</h3>
      <p style="font-size:13px;color:var(--gray-600);margin-bottom:20px;"><strong>${b.nama}</strong> akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.</p>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="hapusBarang(${id})">Hapus Permanen</button>
      </div>
    </div>`);
}

function hapusBarang(id) {
  const idx = BARANG_DB.findIndex(x=>x.id===id);
  if (idx !== -1) { const nama = BARANG_DB[idx].nama; BARANG_DB.splice(idx,1); closeModal(); showToast(nama.split(' ').slice(0,3).join(' ')+' dihapus'); renderAdminTab(); }
}

// ---- FORM TAMBAH / EDIT BARANG ----
function showFormBarang(id) {
  const b = id ? BARANG_DB.find(x=>x.id===id) : null;
  const isEdit = !!b;
  showModal(`
    <div class="modal-header">
      <h3>${isEdit?'Edit Barang':'Tambah Barang Baru'}</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group" style="grid-column:1/-1;">
          <label>Nama Barang (Deskripsi) <span style="color:var(--danger)">*</span></label>
          <input id="fb-nama" value="${b?b.nama:''}" placeholder="Nama lengkap barang sesuai SAKTI">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kode Barang Persediaan <span style="color:var(--danger)">*</span></label>
          <input id="fb-kode" value="${b?b.kode:''}" placeholder="Kode SAKTI (16 digit)">
        </div>
        <div class="form-group">
          <label>Kode Sub-Sub Kel. Barang</label>
          <input id="fb-subkel" value="${b?b.subkel||b.kode.slice(0,10):''}" placeholder="10 digit">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Satuan <span style="color:var(--danger)">*</span></label>
          <select id="fb-satuan">
            ${['BUAH','KALENG','PCS','LEMBAR','PASANG','SET','METER','BUNGKUS'].map(s=>`<option ${b&&b.satuan===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>

      </div>
      <div class="form-row">

        <div class="form-group">
          <label>Lokasi Rak</label>
          <input id="fb-rak" value="${b?b.rak||'':''}" placeholder="Contoh: Rak A1-01">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Divisi <span style="color:var(--danger)">*</span></label>
          <select id="fb-divisi">
            ${MASTER_SEKSI.map(d=>`<option value="${d.id}" ${b&&b.divisi_id===d.id?'selected':''}>${d.kode_bon} — ${d.nama}</option>`).join('')}
          </select>
        </div>

      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label>Deskripsi Barang<br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">tampil di bawah nama di katalog pemohon</span></label>
        <textarea id="fb-deskripsi" style="min-height:60px;" placeholder="Contoh: Cat anti-korosi untuk lambung kapal. Tahan air laut & UV.">${b?b.deskripsi||'':''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="simpanBarang(${id||'null'})">${isEdit?'💾 Simpan Perubahan':'➕ Tambah Barang'}</button>
    </div>`, false);
}

function simpanBarang(id) {
  const nama   = document.getElementById('fb-nama')?.value.trim();
  const kode   = document.getElementById('fb-kode')?.value.trim();
  const satuan = document.getElementById('fb-satuan')?.value;
  const rak    = document.getElementById('fb-rak')?.value.trim();
  const divisi_id = parseInt(document.getElementById('fb-divisi')?.value);
  const subkel = document.getElementById('fb-subkel')?.value.trim();
  const deskripsi = document.getElementById('fb-deskripsi')?.value.trim()||'';
  if (!nama||!kode||!satuan) { showToast('Nama, kode, dan satuan wajib diisi'); return; }

  if (id) {
    const b = BARANG_DB.find(x=>x.id===id);
    if (b) { Object.assign(b, {nama,kode,satuan,rak,divisi_id,subkel,deskripsi}); }
    showToast('Data barang berhasil diperbarui ✓');
  } else {
    const newId = Math.max(...BARANG_DB.map(b=>b.id))+1;
    BARANG_DB.push({id:newId,kode,nama,subkel,satuan,stok:0,rak,divisi_id,aktif:true,deskripsi});
    showToast('Barang baru berhasil ditambahkan ✓');
  }
  closeModal();
  renderAdminTab();
}

// ---- STOCK OPNAME ----
function renderStockOpname(c) {
  const filterDiv = ADMIN_STATE.filterDivisiOpname || 'Semua';
  let list = [...BARANG_DB];
  if (filterDiv !== 'Semua') list = list.filter(b => b.divisi_id === parseInt(filterDiv));

  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Stock Opname — Update Stok Manual</h3>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select style="font-size:12px;padding:5px 8px;border:1px solid var(--gray-300);border-radius:6px;" onchange="ADMIN_STATE.filterDivisiOpname=this.value;renderAdminTab()">
            <option value="Semua">Semua Divisi</option>
            ${MASTER_SEKSI.map(d=>`<option value="${d.id}" ${filterDiv==d.id?'selected':''}>${d.kode_bon} — ${d.nama}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="simpanSemuaOpname()">💾 Simpan Semua Perubahan</button>
        </div>
      </div>
      <div style="padding:12px 20px;background:var(--warning-light);border-bottom:1px solid #fcd34d;">
        <p style="font-size:12px;color:var(--warning);">⚠ Isi kolom "Stok Baru" untuk item yang ingin diupdate. Kosongkan jika tidak ada perubahan. Semua perubahan dicatat di log sistem.</p>
      </div>
      <div>
        ${list.map(b => {
          const d = getDivisi(b.divisi_id);
          const newStok = ADMIN_STATE.opnameChanges[b.id];
          const delta = newStok !== undefined ? newStok - b.stok : 0;
          const deltaClass = delta > 0 ? 'delta-pos' : delta < 0 ? 'delta-neg' : 'delta-zero';
          const deltaStr = delta > 0 ? '+'+delta : delta === 0 ? '—' : delta.toString();
          return `<div class="opname-row">
            <div class="barang-thumb">${b.emoji||'📦'}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;">${b.nama}</div>
              <div style="font-size:11px;color:var(--gray-400);">${d?d.kode_bon+' · ':''} Rak: ${b.rak||'—'} · ${b.satuan}</div>
            </div>
            <div style="text-align:right;margin-right:16px;">
              <div style="font-size:11px;color:var(--gray-500);">Stok saat ini</div>
              <div style="font-size:16px;font-weight:700;">${b.stok}</div>
            </div>
            <div style="text-align:center;margin-right:16px;">
              <div style="font-size:11px;color:var(--gray-500);margin-bottom:4px;">Stok baru</div>
              <input class="opname-input" type="number" min="0" placeholder="${b.stok}"
                value="${newStok !== undefined ? newStok : ''}"
                oninput="ADMIN_STATE.opnameChanges[${b.id}]=this.value===''?undefined:parseInt(this.value);updateOpnameDelta(${b.id},this.value,${b.stok})"
                id="opname-${b.id}">
            </div>
            <div style="min-width:52px;text-align:center;">
              <div style="font-size:10px;color:var(--gray-400);margin-bottom:2px;">Selisih</div>
              <div class="opname-delta ${deltaClass}" id="delta-${b.id}">${deltaStr}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function updateOpnameDelta(id, val, oldStok) {
  const el = document.getElementById('delta-'+id);
  if (!el) return;
  if (val === '') { el.textContent = '—'; el.className = 'opname-delta delta-zero'; return; }
  const n = parseInt(val);
  const d = n - oldStok;
  el.textContent = d > 0 ? '+'+d : d === 0 ? '—' : d.toString();
  el.className = 'opname-delta ' + (d > 0 ? 'delta-pos' : d < 0 ? 'delta-neg' : 'delta-zero');
}

function simpanSemuaOpname() {
  const changes = ADMIN_STATE.opnameChanges;
  const keys = Object.keys(changes).filter(k => changes[k] !== undefined);
  if (!keys.length) { showToast('Tidak ada perubahan untuk disimpan'); return; }
  let count = 0;
  keys.forEach(id => {
    const b = BARANG_DB.find(x=>x.id===parseInt(id));
    if (b && changes[id] !== undefined) {
      const stok_sblm = b.stok;
      b.stok = Math.max(0, changes[id]);
      STOCK_LOG.push({ id:++STOCK_LOG_SEQ, barang_id:b.id, tgl:new Date().toISOString().slice(0,10),
        jenis:'OPNAME', jumlah:Math.abs(b.stok-stok_sblm),
        keterangan:'Stock Opname — stok ' + (b.stok>stok_sblm?'ditambah':'dikurangi') + ' dari '+stok_sblm+' ke '+b.stok,
        ref_bon:'OPNAME', stok_sebelum:stok_sblm, stok_sesudah:b.stok });
      count++;
    }
  });
  ADMIN_STATE.opnameChanges = {};
  closeModal();
  showToast(`✓ ${count} item stok berhasil diperbarui`);
  renderAdminTab();
}

// ---- LAPORAN TRANSAKSI (Admin) ----
function downloadAdminLaporanCSV() {
  const dari    = S.laporanDari    || '2026-01-01';
  const sampai  = S.laporanSampai  || '2026-12-31';
  const filterDiv = ADMIN_STATE.filterDivisiLaporan || 'Semua';

  const completed = BON_LIST.filter(b => b.status === 'COMPLETED');
  let rows = [];
  completed.forEach(b => {
    b.items.forEach(it => {
      const tgl = b.tanggal || '';
      if (tgl < dari || tgl > sampai) return;
      rows.push({
        bon:     b.bon_number || '—',
        tanggal: tgl,
        pemohon: b.pemohon_nama  || '—',
        unit:    b.pemohon_unit  || '—',
        kode:    it.kode  || '—',
        nama:    it.nama,
        jumlah:  it.jumlah,
        satuan:  it.satuan,
        divisi_id: b.divisi_id
      });
    });
  });

  if (filterDiv !== 'Semua') rows = rows.filter(r => r.divisi_id === parseInt(filterDiv));
  if (!rows.length) { showToast('Tidak ada data untuk diunduh'); return; }

  const headers = ['Nomor Bon','Tanggal','Pemohon','Unit','Kode Barang','Nama Barang','Jumlah','Satuan'];
  const escape  = v => '"' + String(v).replace(/"/g, '""') + '"';
  const lines   = [
    headers.map(escape).join(','),
    ...rows.map(r => [r.bon, r.tanggal, r.pemohon, r.unit, "'" + r.kode, r.nama, r.jumlah, r.satuan].map(escape).join(','))
  ];
  const csv = String.fromCharCode(0xFEFF) + lines.join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const divLabel = filterDiv !== 'Semua' ? '_Div' + filterDiv : '';
  a.href     = url;
  a.download = 'Laporan_Admin' + divLabel + '_' + dari.replace(/-/g,'') + '-' + sampai.replace(/-/g,'') + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  showToast('\u2713 CSV berhasil diunduh \u2014 buka dengan Excel');
}

function renderAdminLaporan(c) {
  const dari = S.laporanDari || '2026-01-01';
  const sampai = S.laporanSampai || '2026-04-13';
  const completed = BON_LIST.filter(b => b.status === 'COMPLETED');
  let rows = [];
  completed.forEach(b => {
    b.items.forEach(it => {
      const bar = BARANG_DB.find(x=>x.id===it.barang_id)||{};
      const tgl = b.tgl_selesai||b.tanggal;
      if (tgl >= dari && tgl <= sampai) {
        rows.push({bon:b.bon_number, tgl, kode:it.kode, nama:it.nama, jumlah:it.jumlah, satuan:it.satuan, divisi_id:b.divisi_id});
      }
    });
  });
  const totalNilai = rows.reduce((s,r)=>s+r.total, 0);
  const filterDiv = ADMIN_STATE.filterDivisiLaporan || 'Semua';
  let filteredRows = rows;
  if (filterDiv !== 'Semua') filteredRows = rows.filter(r => r.divisi_id === parseInt(filterDiv));

  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Laporan Transaksi Barang Keluar</h3>
        <button class="btn btn-success btn-sm" onclick="downloadAdminLaporanCSV()">⬇ Download CSV (Excel)</button>
      </div>
      <div style="padding:16px 20px;border-bottom:1px solid var(--gray-100);display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:12px;">Dari</label>
          <input type="date" value="${dari}" onchange="S.laporanDari=this.value;renderAdminTab()" style="width:auto;font-size:12px;padding:6px 10px;border:1px solid var(--gray-300);border-radius:6px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:12px;">Sampai</label>
          <input type="date" value="${sampai}" onchange="S.laporanSampai=this.value;renderAdminTab()" style="width:auto;font-size:12px;padding:6px 10px;border:1px solid var(--gray-300);border-radius:6px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:12px;">Divisi</label>
          <select style="font-size:12px;padding:6px 10px;border:1px solid var(--gray-300);border-radius:6px;" onchange="ADMIN_STATE.filterDivisiLaporan=this.value;renderAdminTab()">
            <option value="Semua">Semua Divisi</option>
            ${MASTER_SEKSI.map(d=>`<option value="${d.id}" ${filterDiv==d.id?'selected':''}>${d.kode_bon}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;padding:14px 20px;border-bottom:1px solid var(--gray-100);">
        <div style="background:var(--gray-50);border-radius:8px;padding:12px;border:1px solid var(--gray-200);">
          <div style="font-size:20px;font-weight:800;">${filteredRows.length}</div>
          <div style="font-size:11px;color:var(--gray-500);">Total Item Keluar</div>
        </div>
        
        <div style="background:var(--gray-50);border-radius:8px;padding:12px;border:1px solid var(--gray-200);">
          <div style="font-size:20px;font-weight:800;">${new Set(filteredRows.map(r=>r.bon)).size}</div>
          <div style="font-size:11px;color:var(--gray-500);">Jumlah Bon</div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Nomor Bon</th><th>Tanggal</th><th>Kode Barang</th><th>Nama Barang</th>
            <th style="text-align:right;">Jumlah</th><th>Satuan</th>
            
          </tr></thead>
          <tbody>
            ${filteredRows.length ? filteredRows.map(r=>`<tr>
              <td style="font-family:monospace;font-size:11px;">${r.bon}</td>
              <td style="font-size:12px;">${fmtDate(r.tgl)}</td>
              <td style="font-family:monospace;font-size:11px;color:var(--gray-400);">${r.kode}</td>
              <td style="font-size:12px;">${r.nama}</td>
              <td style="text-align:right;font-weight:600;">${r.jumlah}</td>
              <td style="font-size:12px;">${r.satuan}</td>
              
            </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400);">Tidak ada data pada rentang tanggal ini</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ================================================================
// ================= PORTAL SUPER ADMIN ===========================
// ================================================================

function renderSuperAdminDashboard() {
  hideKeranjang();
  const perRole = {};
  USERS.forEach(u => { perRole[u.role] = (perRole[u.role]||0)+1; });
  const aktif = USERS.filter(u=>u.aktif!==false).length;

  setContent(`
    <div style="background:linear-gradient(135deg,#0c4a6e 0%,#0284c7 55%,#38bdf8 100%);box-shadow:0 8px 32px rgba(2,132,199,0.28);border-radius:20px;padding:22px 26px;margin-bottom:20px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;position:relative;overflow:hidden;">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:0.7;margin-bottom:4px;">SUPER ADMIN</div>
        <div style="font-family:var(--font-head);font-size:20px;font-weight:800;color:#fff;margin-bottom:3px;">👑 Portal Super Admin</div>
        <div style="font-size:12px;opacity:0.75;">Manajemen akun login seluruh pengguna sistem</div>
      </div>
      <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px 20px;backdrop-filter:blur(8px);">
        <div style="font-family:var(--font-head);font-size:26px;font-weight:800;color:#fff;">${USERS.length}</div>
        <div style="font-size:10px;opacity:0.8;font-weight:600;">Total Akun</div>
      </div>
    </div>
    <div class="admin-stat-grid">
      <div class="admin-stat-card">
        <div class="asc-num">${USERS.length}</div>
        <div class="asc-label">Total Akun</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-num" style="color:var(--success);">${aktif}</div>
        <div class="asc-label">Akun Aktif</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-num" style="color:var(--danger);">${USERS.length-aktif}</div>
        <div class="asc-label">Akun Nonaktif</div>
      </div>
      <div class="admin-stat-card">
        <div class="asc-num">${perRole['ASSESSOR']||0}</div>
        <div class="asc-label">Staff Assessor</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Manajemen Akun</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <div style="position:relative;">
            <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;">🔍</span>
            <input id="sa-search" type="text" placeholder="Cari nama atau email..." style="padding:6px 10px 6px 30px;font-size:12px;border:1px solid var(--gray-300);border-radius:6px;width:200px;" oninput="renderUserTable()">
          </div>
          <select id="sa-role-filter" style="font-size:12px;padding:6px 8px;border:1px solid var(--gray-300);border-radius:6px;" onchange="renderUserTable()">
            <option value="Semua">Semua Role</option>
            <option>PEMOHON</option><option>ASSESSOR</option><option>GUDANG</option><option>ADMIN_GUDANG</option>
          </select>
          <select id="sa-status-filter" style="font-size:12px;padding:6px 8px;border:1px solid var(--gray-300);border-radius:6px;" onchange="renderUserTable()">
            <option value="Semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="showFormUser(null)">+ Tambah User</button>
        </div>
      </div>
      <div id="user-table-wrap"></div>
    </div>`);
  renderUserTable();
}

const ROLE_BADGE = {
  PEMOHON:     '<span class="role-badge rb-pemohon">Pemohon</span>',
  ASSESSOR:    '<span class="role-badge rb-assessor">Assessor</span>',
  GUDANG:      '<span class="role-badge rb-gudang">Staff Gudang</span>',
  ADMIN_GUDANG:'<span class="role-badge rb-admin">Admin Gudang</span>',
  SUPER_ADMIN: '<span class="role-badge rb-superadmin">Super Admin</span>',
};

function renderUserTable() {
  const c = document.getElementById('user-table-wrap'); if (!c) return;
  const q = (document.getElementById('sa-search')?.value||'').toLowerCase();
  const rf = document.getElementById('sa-role-filter')?.value||'Semua';
  const sf = document.getElementById('sa-status-filter')?.value||'Semua';

  let list = USERS.filter(u => {
    const matchQ = !q || u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchR = rf==='Semua' || u.role===rf;
    const matchS = sf==='Semua' || (sf==='aktif'&&u.aktif!==false) || (sf==='nonaktif'&&u.aktif===false);
    return matchQ && matchR && matchS;
  });

  c.innerHTML = `<div class="table-wrap"><table>
    <thead><tr>
      <th>No</th><th>Nama Lengkap</th><th>Username / Email</th><th>Role</th>
      <th>Divisi</th><th>Status</th><th>Aksi</th>
    </tr></thead>
    <tbody>
      ${list.map((u,i)=>{
        const d = u.divisi_id ? getDivisi(u.divisi_id) : null;
        const isAktif = u.aktif !== false;
        return `<tr style="${!isAktif?'opacity:0.55;':''}">
          <td style="color:var(--gray-400);font-size:12px;">${i+1}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${u.avatar||'?'}</div>
              <div><div style="font-size:13px;font-weight:500;">${u.nama}</div><div style="font-size:11px;color:var(--gray-400);">${u.jabatan}</div></div>
            </div>
          </td>
          <td style="font-size:12px;font-family:monospace;">${u.email}</td>
          <td>${ROLE_BADGE[u.role]||u.role}</td>
          <td style="font-size:12px;">${d?d.icon+' '+d.kode_bon:'<span style="color:var(--gray-300);">—</span>'}</td>
          <td>
            <div class="toggle-wrap" onclick="toggleUserStatus(${u.id})">
              <div class="toggle-track ${isAktif?'toggle-on':'toggle-off'}">
                <div class="toggle-thumb ${isAktif?'thumb-on':'thumb-off'}"></div>
              </div>
              <span style="font-size:11px;color:var(--gray-500);">${isAktif?'Aktif':'Nonaktif'}</span>
            </div>
          </td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-secondary btn-sm" onclick="showFormUser(${u.id})">✏ Edit</button>
              <button class="btn btn-secondary btn-sm" onclick="resetPassword(${u.id})">🔑 Reset PW</button>
            </div>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

function toggleUserStatus(id) {
  const u = USERS.find(x=>x.id===id);
  if (!u) return;
  if (u.id === S.user.id) { showToast('Tidak bisa menonaktifkan akun sendiri'); return; }
  u.aktif = u.aktif === false ? true : false;
  renderUserTable();
  showToast(`${u.nama} — akun ${u.aktif?'diaktifkan':'dinonaktifkan'}`);
}

function resetPassword(id) {
  const u = USERS.find(x=>x.id===id);
  showModal(`
    <div class="modal-body" style="text-align:center;padding:28px 24px;">
      <div style="font-size:32px;margin-bottom:10px;">🔑</div>
      <h3 style="font-weight:700;margin-bottom:8px;">Reset Password</h3>
      <p style="font-size:13px;color:var(--gray-600);margin-bottom:16px;">Password <strong>${u.nama}</strong> akan di-reset ke password sementara dan dikirim ke email pengguna.</p>
      <div style="background:var(--gray-50);border-radius:8px;padding:10px;margin-bottom:16px;font-size:12px;color:var(--gray-600);">
        Email: <strong>${u.email}</strong>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('Password reset. Email dikirim ke '+USERS.find(x=>x.id==${id}).email)">Kirim Reset Password</button>
      </div>
    </div>`);
}

function showFormUser(id) {
  const u = id ? USERS.find(x=>x.id===id) : null;
  const isEdit = !!u;
  const roles = {PEMOHON:'Pemohon', ASSESSOR:'Staff Assessor', GUDANG:'Staff Gudang', ADMIN_GUDANG:'Admin Gudang', SUPER_ADMIN:'Super Admin'};
  showModal(`
    <div class="modal-header">
      <h3>${isEdit?'Edit Akun — '+u.nama:'Tambah Akun Baru'}</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Nama Lengkap <span style="color:var(--danger)">*</span></label>
          <input id="fu-nama" value="${u?u.nama:''}" placeholder="Nama lengkap pengguna">
        </div>
        <div class="form-group">
          <label>Username <span style="color:var(--danger)">*</span></label>
          <input id="fu-email" value="${u?u.email:''}" placeholder="Contoh: pemohon1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Jabatan</label>
          <input id="fu-jabatan" value="${u?u.jabatan:''}" placeholder="Jabatan pengguna">
        </div>
        <div class="form-group">
          <label>Password ${isEdit?'<span style="font-size:10px;color:var(--gray-400);">(kosong = tidak diubah)</span>':'<span style="color:var(--danger)">*</span>'}</label>
          <input id="fu-pass" type="password" placeholder="${isEdit?'Kosongkan jika tidak ingin diubah':'Masukkan password'}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Role <span style="color:var(--danger)">*</span></label>
          <select id="fu-role" onchange="toggleDivisiField()">
            ${Object.entries(roles).map(([r,label])=>`<option value="${r}" ${u&&u.role===r?'selected':''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="divisi-field" style="${!u||u.role!=='ASSESSOR'?'visibility:hidden;':''}">
          <label>Divisi <span style="font-size:10px;color:var(--gray-400);">(hanya untuk Assessor)</span></label>
          <select id="fu-divisi">
            <option value="">— Tidak ada —</option>
            ${MASTER_SEKSI.map(d=>`<option value="${d.id}" ${u&&u.divisi_id===d.id?'selected':''}>${d.kode_bon} — ${d.nama}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Status</label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
          <div class="toggle-wrap" onclick="this.querySelector('.toggle-track').classList.toggle('toggle-on');this.querySelector('.toggle-track').classList.toggle('toggle-off');this.querySelector('.toggle-thumb').classList.toggle('thumb-on');this.querySelector('.toggle-thumb').classList.toggle('thumb-off');document.getElementById('fu-aktif').value=this.querySelector('.toggle-track').classList.contains('toggle-on')?'1':'0'">
            <div class="toggle-track ${u===null||u.aktif!==false?'toggle-on':'toggle-off'}">
              <div class="toggle-thumb ${u===null||u.aktif!==false?'thumb-on':'thumb-off'}"></div>
            </div>
          </div>
          <span style="font-size:13px;">Aktif</span>
          <input type="hidden" id="fu-aktif" value="${u===null||u.aktif!==false?'1':'0'}">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Batalkan</button>
      <button class="btn btn-primary" onclick="simpanUser(${id||'null'})">${isEdit?'💾 Simpan Perubahan':'➕ Buat Akun'}</button>
    </div>`);
}

function toggleDivisiField() {
  const role = document.getElementById('fu-role')?.value;
  const df = document.getElementById('divisi-field');
  if (df) df.style.visibility = role==='ASSESSOR' ? 'visible' : 'hidden';
}

function simpanUser(id) {
  const nama    = document.getElementById('fu-nama')?.value.trim();
  const email   = document.getElementById('fu-email')?.value.trim();
  const jabatan = document.getElementById('fu-jabatan')?.value.trim();
  const pass    = document.getElementById('fu-pass')?.value;
  const role    = document.getElementById('fu-role')?.value;
  const divisi  = document.getElementById('fu-divisi')?.value;
  const aktif   = document.getElementById('fu-aktif')?.value !== '0';
  if (!nama || !email) { showToast('Nama dan username wajib diisi'); return; }
  if (!id && !pass) { showToast('Password wajib diisi untuk akun baru'); return; }
  if (USERS.find(x => x.email === email && x.id !== id)) { showToast('Username sudah digunakan'); return; }

  if (id) {
    const u = USERS.find(x=>x.id===id);
    if (u) {
      Object.assign(u, {nama, email, jabatan:jabatan||u.jabatan, role, divisi_id:divisi?parseInt(divisi):null, aktif, avatar:nama.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()});
      if (pass) u.pass = pass;
    }
    showToast('Akun berhasil diperbarui ✓');
  } else {
    const newId = Math.max(...USERS.map(x=>x.id))+1;
    USERS.push({id:newId, email, pass, nama, jabatan:jabatan||'—', unit:'-', role, avatar:nama.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(), divisi_id:divisi?parseInt(divisi):null, aktif:true});
    showToast('Akun baru berhasil dibuat ✓');
  }
  closeModal();
  renderSuperAdminDashboard();
}

// ================================================================
// ══════════════ FASE 5 — NOTIFIKASI, AUDIT, POLISH ══════════════
// ================================================================

// ── NOTIFIKASI PANEL ──
const NOTIF_ICONS = {
  submitted:'📬', approved:'✅', completed:'🎉', rejected:'❌',
  revision:'↩️', sent_gudang:'📦'
};
const AUDIT_LABELS = {
  SUBMITTED:'Diajukan Pemohon', APPROVED:'Disetujui Assessor',
  SENT_GUDANG:'Diajukan ke Gudang', COMPLETED:'Selesai — SPMB Terbit',
  NEEDS_REVISION:'Revisi dari Gudang', REVISION_SENT:'Diajukan Ulang ke Gudang',
  REJECTED_ASSESSOR:'Ditolak Assessor', REJECTED_GUDANG:'Ditolak Gudang',
};

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  const backdrop = document.getElementById('notif-backdrop');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    closeNotifPanel();
  } else {
    renderNotifPanel();
    panel.classList.add('open');
    if (backdrop) backdrop.style.display = 'block';
  }
}
function closeNotifPanel() {
  const panel = document.getElementById('notif-panel');
  const backdrop = document.getElementById('notif-backdrop');
  if (panel) panel.classList.remove('open');
  if (backdrop) backdrop.style.display = 'none';
}
function markAllRead() {
  getMyNotifs().forEach(n => n.read_by.add(S.user.id));
  refreshNotifBadge();
  renderNotifPanel();
}
function renderNotifPanel() {
  const c = document.getElementById('notif-list');
  if (!c || !S.user) return;
  const notifs = getMyNotifs();
  if (!notifs.length) {
    c.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--gray-400);font-size:13px;">Tidak ada notifikasi</div>';
    return;
  }
  c.innerHTML = notifs.map(n => {
    const unread = !n.read_by.has(S.user.id);
    return `<div class="notif-item ${unread?'unread':''}" onclick="notifClick(${n.id},${n.bon_id})">
      <div class="notif-icon ni-${n.type}">${NOTIF_ICONS[n.type]||'🔔'}</div>
      <div class="notif-body">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${fmtTs(n.timestamp)}</div>
      </div>
      ${unread ? '<div class="notif-unread-dot"></div>' : ''}
    </div>`;
  }).join('');
}
function notifClick(notifId, bonId) {
  const n = NOTIF_LIST.find(x=>x.id===notifId);
  if (n) n.read_by.add(S.user.id);
  refreshNotifBadge();
  closeNotifPanel();
  if (bonId) setTimeout(() => showAuditTrail(bonId), 80);
}

// ── AUDIT TRAIL MODAL ──
function showAuditTrail(bonId) {
  const b = getBon(bonId);
  if (!b) { showToast('Data bon tidak ditemukan'); return; }
  closeModal();
  const d = getDivisi(b.divisi_id);
  const logs = getAuditForBon(bonId);
  showModal(`
    <div class="modal-header">
      <div>
        <h3>Riwayat & Audit Trail</h3>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;">
          ${b.bon_number ? `<span class="bon-chip">📄 ${b.bon_number}</span>` : '<span style="color:var(--gray-400);">Nomor belum terbit</span>'}
          &nbsp;·&nbsp; ${d?d.icon+' '+d.nama:'—'}
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <!-- Bon info card -->
      <div style="background:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.8);border-radius:12px;padding:12px 16px;margin-bottom:18px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:12px;">
          <div><span style="color:var(--gray-500);">Pemohon:</span> <strong>${b.pemohon_nama}</strong></div>
          <div><span style="color:var(--gray-500);">Unit:</span> ${b.pemohon_unit}</div>
          <div><span style="color:var(--gray-500);">Status:</span> ${STATUS_BADGE[b.status]||b.status}</div>
          <div><span style="color:var(--gray-500);">Revisi:</span> ${b.revision_count||0}x</div>
          ${b.bon_number?`<div><span style="color:var(--gray-500);">Bon:</span> <span class="bon-chip">📄 ${b.bon_number}</span></div>`:''}
          ${b.spmb_number?`<div><span style="color:var(--gray-500);">SPMB:</span> <span class="spmb-chip">📑 ${b.spmb_number}</span></div>`:''}
        </div>
      </div>

      <!-- Timeline -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-500);margin-bottom:12px;">Timeline Proses</div>
      ${logs.length ? `<div class="audit-timeline">
        ${logs.map(log => `
          <div class="audit-item">
            <div class="audit-dot ${log.action}"></div>
            <div class="audit-content">
              <div class="audit-action">${AUDIT_LABELS[log.action]||log.action}</div>
              <div class="audit-detail">${log.detail}</div>
              <div class="audit-meta">
                <span class="audit-actor">👤 ${log.actor}</span>
                <span>🕐 ${fmtTs(log.timestamp)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>` : '<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:12px;">Belum ada riwayat untuk bon ini</div>'}

      <!-- Item list -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-500);margin:16px 0 10px;">Daftar Item Bon</div>
      <div style="background:var(--gray-50);border-radius:8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:7px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:var(--gray-500);text-align:left;border-bottom:1px solid var(--gray-200);">Item</th>
            <th style="padding:7px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);text-align:right;border-bottom:1px solid var(--gray-200);">Jumlah</th>
            <th style="padding:7px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);text-align:left;border-bottom:1px solid var(--gray-200);">Satuan</th>
          </tr></thead>
          <tbody>${b.items.map(it=>`<tr>
            <td style="padding:7px 12px;font-size:12px;">${it.emoji||''} ${it.nama}</td>
            <td style="padding:7px 12px;font-size:12px;font-weight:600;text-align:right;">${it.jumlah}</td>
            <td style="padding:7px 12px;font-size:12px;">${it.satuan}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      ${b.bon_number ? `<button class="btn btn-secondary btn-sm" onclick="generateBonHTML(${b.id})">📄 Download Bon</button>` : ''}
      ${b.spmb_number ? `<button class="btn btn-secondary btn-sm" onclick="generateSpmbHTML(${bonId})">📑 Preview SPMB</button>` : ''}
      <div style="flex:1"></div>
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
    </div>`, true);
}

// ── AUDIT TRAIL button on bon detail (pemohon) ──
// Patch showDetailBon to include audit trail button
const _origShowDetailBon = showDetailBon;
showDetailBon = function(id) {
  _origShowDetailBon(id);
  // inject audit button into footer after render
  setTimeout(() => {
    const footer = document.querySelector('.modal .modal-footer');
    if (footer && !footer.querySelector('.audit-btn')) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-sm audit-btn';
      btn.textContent = '🕐 Riwayat';
      btn.onclick = () => { closeModal(); showAuditTrail(id); };
      footer.insertBefore(btn, footer.firstChild);
    }
  }, 50);
}

function showDetailReadonly(id) {
  const b = getBon(id);
  const d = getDivisi(b.divisi_id);
  const isGudang = b.status === 'IN_REVIEW_GUDANG';
  showModal(`
    <div class="modal-header">
      <div>
        <h3>Review Request — ${b.bon_number||'[Pending]'}</h3>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;">
          ${isGudang ? '📦 Sedang diverifikasi gudang — tidak dapat diubah' : '✅ Sudah disetujui — menunggu pengajuan ke gudang'}
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="alert ${isGudang ? 'alert-info' : 'alert-success'}">
        ${isGudang
          ? 'Bon ini sedang diverifikasi lapangan oleh Staff Gudang. Assessor tidak dapat mengubah bon pada tahap ini.'
          : 'Request telah disetujui dan bon diterbitkan. Gunakan tombol "→ Gudang" untuk mengajukan ke gudang.'}
      </div>
      <div style="background:var(--gray-50);border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 16px;">
          <div><span style="color:var(--gray-500);">Pemohon:</span> <strong>${b.pemohon_nama}</strong></div>
          <div><span style="color:var(--gray-500);">Unit:</span> ${b.pemohon_unit}</div>
          <div><span style="color:var(--gray-500);">Jabatan:</span> ${b.pemohon_jabatan}</div>
          <div><span style="color:var(--gray-500);">Status:</span> ${STATUS_BADGE[b.status]}</div>
          <div style="grid-column:1/-1;"><span style="color:var(--gray-500);">Keterangan:</span> <em>${b.keterangan}</em></div>
        </div>
      </div>
      <div style="overflow-x:auto;margin-bottom:12px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;" colspan="2">Item</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);">Kode</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:center;">Stok</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:center;">Jumlah</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);">Satuan</th>
            <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);">Rak</th>
          </tr></thead>
          <tbody>${b.items.map((it,idx)=>{
            const bar = BARANG_DB.find(x=>x.id===it.barang_id)||{};
            return `<tr class="review-item-row">
              <td style="padding:8px;" width="38">
                <div class="item-thumb">${it.emoji||bar.emoji||'📦'}</div>
              </td>
              <td style="padding:8px;font-size:12px;font-weight:500;line-height:1.3;">${it.nama}</td>
              <td style="padding:8px;font-family:monospace;font-size:10px;color:var(--gray-400);">${it.kode}</td>
              <td style="padding:8px;text-align:center;font-size:12px;">${bar.stok||'—'}</td>
              <td style="padding:8px;text-align:center;">
                <span style="font-size:14px;font-weight:700;padding:4px 10px;background:var(--gray-100);border-radius:6px;display:inline-block;">${it.jumlah}</span>
              </td>
              <td style="padding:8px;font-size:12px;">${it.satuan}</td>
              <td style="padding:8px;font-size:12px;color:var(--gray-500);">${it.rak||bar.rak||'—'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      ${b.bon_number ? `<button class="btn btn-secondary btn-sm" onclick="generateBonHTML(${b.id})">📄 Download Bon</button>` : ''}
      <div style="flex:1"></div>
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
    </div>`, true);
}



// ── REVISI 4: Katalog Barang read-only untuk Assessor ──
function renderKatalogBarangAssessor(c) {
  if (!window._aKatalog) window._aKatalog = {filterDiv:'Semua', filterSat:'Semua', search:''};
  const st = window._aKatalog;
  const satuans = ['Semua',...new Set(BARANG_DB.map(b=>b.satuan))];
  let list = [...BARANG_DB];
  if (st.filterDiv !== 'Semua') list = list.filter(b => b.divisi_id === parseInt(st.filterDiv));
  if (st.filterSat !== 'Semua') list = list.filter(b => b.satuan === st.filterSat);
  if (st.search) {
    const q = st.search.toLowerCase();
    list = list.filter(b => b.nama.toLowerCase().includes(q) || b.kode.includes(q));
  }

  c.innerHTML = `
    <div class="alert alert-info" style="margin-bottom:12px;">👁 Tampilan read-only. Untuk perubahan data barang, hubungi Admin Gudang.</div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
      <div style="position:relative;flex:1;min-width:160px;">
        <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;">🔍</span>
        <input type="text" value="${st.search}" placeholder="Cari nama atau kode barang..."
          style="width:100%;padding:7px 10px 7px 30px;font-size:12px;border:1px solid var(--gray-300);border-radius:7px;"
          oninput="window._aKatalog.search=this.value;renderAssessorTab()">
      </div>
      <select style="font-size:12px;padding:7px 10px;border:1px solid var(--gray-300);border-radius:7px;"
        onchange="window._aKatalog.filterDiv=this.value;renderAssessorTab()">
        <option value="Semua">Semua Divisi</option>
        ${MASTER_SEKSI.map(d=>`<option value="${d.id}" ${st.filterDiv==d.id?'selected':''}>${d.kode_bon} — ${d.nama}</option>`).join('')}
      </select>
      <select style="font-size:12px;padding:7px 10px;border:1px solid var(--gray-300);border-radius:7px;"
        onchange="window._aKatalog.filterSat=this.value;renderAssessorTab()">
        ${satuans.map(s=>`<option ${st.filterSat===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr>
          <th style="width:38px;"></th>
          <th>Nama Barang</th>
          <th>Kode Barang</th>
          <th>Divisi</th>
          <th>Satuan</th>
          <th>Stok</th>
          <th>Rak</th>
        </tr></thead>
        <tbody>${list.length ? list.map(b => {
          const d = getDivisi(b.divisi_id);
          const sc = b.stok===0?'stok-zero':b.stok<5?'stok-low':'stok-ok';
          return `<tr>
            <td><div style="width:36px;height:36px;border-radius:6px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:20px;">${b.emoji||'📦'}</div></td>
            <td style="font-size:12px;font-weight:500;">${b.nama}</td>
            <td style="font-family:monospace;font-size:11px;color:var(--gray-500);">${b.kode}</td>
            <td style="font-size:12px;">${d?d.icon+' '+d.kode_bon:'—'}</td>
            <td style="font-size:12px;">${b.satuan}</td>
            <td><span class="stok-pill ${sc}">${b.stok} ${b.satuan.toLowerCase()}</span></td>
            <td style="font-size:12px;color:var(--gray-500);">${b.rak||'—'}</td>
          </tr>`;
        }).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400);">Tidak ada barang ditemukan</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ================================================================
// ═══ KARTU BARANG DIGITAL ═══════════════════════════════════════
// ================================================================
function printKartuBarang(barangId) {
  const b    = BARANG_DB.find(x => x.id === barangId); if (!b) return;
  const d    = getDivisi(b.divisi_id);
  const logs = STOCK_LOG.filter(l => l.barang_id === barangId).sort((a,c) => a.tgl.localeCompare(c.tgl));

  const saldoAwal  = logs.filter(l => l.jenis==='SALDO_AWAL').reduce((s,l) => s+l.jumlah, 0);
  const totalMasuk = logs.filter(l => l.jenis==='MASUK').reduce((s,l) => s+l.jumlah, 0);
  const totalKeluar= logs.filter(l => l.jenis==='KELUAR').reduce((s,l) => s+l.jumlah, 0);
  const stokNow    = b.stok;

  const rowsHtml = logs.map(l => `
    <tr>
      <td>${l.tgl}</td>
      <td><span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;background:${
        l.jenis==='SALDO_AWAL'?'#ede9fe':l.jenis==='MASUK'?'#d1fae5':l.jenis==='KELUAR'?'#fee2e2':'#fef9c3'
      };color:${
        l.jenis==='SALDO_AWAL'?'#6d28d9':l.jenis==='MASUK'?'#065f46':l.jenis==='KELUAR'?'#991b1b':'#92400e'
      };">${l.jenis.replace('_',' ')}</span></td>
      <td style="text-align:center;font-weight:700;color:${l.jenis==='KELUAR'?'#dc2626':'#059669'};">${l.jenis==='KELUAR'?'-':'+'}${l.jumlah}</td>
      <td style="text-align:center;font-weight:600;">${l.stok_sesudah!==undefined?l.stok_sesudah:"—"}</td>
      <td>${l.keterangan||'—'}</td>
      <td style="f<td style="font-size:10px;">${l.ref_bon && l.ref_bon !== '—' ? `<span class="ref-bon-link" data-bon="${l.ref_bon}" style="color:var(--primary);cursor:pointer;text-decoration:underline;font-size:10px;">${l.ref_bon}</span>` : (l.ref_bon||'—')}</td>
    </tr>`).join('');

  const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Kartu Barang — ${b.nama}</title>
<style>
  @page { size:A4; margin:1.5cm 2cm; }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Times New Roman',Times,serif;font-size:11pt;color:#000;filter:grayscale(100%);}
  h2{font-size:13pt;margin-bottom:2pt;}
  .sub{font-size:9pt;color:#6b7280;margin-bottom:12pt;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8pt;margin-bottom:14pt;}
  .stat{border-radius:8pt;padding:10pt;text-align:center;}
  .stat .num{font-size:18pt;font-weight:800;}
  .stat .lbl{font-size:8pt;margin-top:2pt;}
  table{width:100%;border-collapse:collapse;font-size:10pt;}
  th{background:#f3f4f6;border:1px solid #d1d5db;padding:5pt 6pt;text-align:left;font-size:9pt;text-transform:uppercase;letter-spacing:0.3pt;}
  td{border:1px solid #e5e7eb;padding:4pt 6pt;vertical-align:top;}
  tr:nth-child(even) td{background:#f9fafb;}
  .section-title{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.4pt;color:#6b7280;margin-bottom:6pt;}
  @media print{body{margin:0!important;}}
</style></head><body>
<h2>📋 Kartu Barang — ${b.nama}</h2>
<div class="sub">${b.kode} &nbsp;·&nbsp; ${d?d.nama:'—'} &nbsp;·&nbsp; Rak: ${b.rak||'—'} &nbsp;·&nbsp; Dicetak: ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</div>
<div class="stats">
  <div class="stat" style="background:#ede9fe;">
    <div class="num" style="color:#6d28d9;">${saldoAwal}</div>
    <div class="lbl" style="color:#6d28d9;">Saldo Awal</div>
  </div>
  <div class="stat" style="background:#d1fae5;">
    <div class="num" style="color:#059669;">+${totalMasuk}</div>
    <div class="lbl" style="color:#059669;">Total Masuk</div>
  </div>
  <div class="stat" style="background:#fee2e2;">
    <div class="num" style="color:#dc2626;">-${totalKeluar}</div>
    <div class="lbl" style="color:#dc2626;">Total Keluar</div>
  </div>
  <div class="stat" style="background:#dbeafe;">
    <div class="num" style="color:#1d4ed8;">${stokNow}</div>
    <div class="lbl" style="color:#1d4ed8;">Stok Sekarang</div>
  </div>
</div>
<div class="section-title">Riwayat Mutasi Stok</div>
<table>
  <thead><tr><th>Tanggal</th><th>Jenis</th><th>Jml</th><th>Saldo</th><th>Keterangan</th><th>Referensi</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script>
</body></html>`;

  const blob = new Blob([printHtml], {type:'text/html'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

function openRefPembelian(noDok) {
  const p = PEMBELIAN_LOG.find(function(x) { return x.no_dok === noDok; });
  if (!p) { showToast('Dokumen ' + noDok + ' tidak ditemukan'); return; }
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const tgl   = new Date(p.tgl);
  const tglStr = tgl.getDate() + ' ' + bulan[tgl.getMonth()] + ' ' + tgl.getFullYear();
  const rows = p.items.map(function(it) {
    return '<tr><td style="padding:6px 10px;font-size:12px;">' + it.nama + '</td>' +
           '<td style="padding:6px 10px;font-size:12px;text-align:center;font-weight:600;">' + it.jumlah + '</td></tr>';
  }).join('');
  showModal(
    '<div class="modal-header"><h3>📦 Detail Pembelian</h3>' +
    '<button class="modal-close" onclick="closeModal()">×</button></div>' +
    '<div class="modal-body">' +
    '<div class="info-row"><div class="info-label">No. Dokumen</div><div class="info-value" style="font-family:monospace;font-weight:600;">' + p.no_dok + '</div></div>' +
    '<div class="info-row"><div class="info-label">Tanggal</div><div class="info-value">' + tglStr + '</div></div>' +
    (p.keterangan ? '<div class="info-row"><div class="info-label">Keterangan</div><div class="info-value" style="font-style:italic;">' + p.keterangan + '</div></div>' : '') +
    '<div style="margin-top:14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--gray-500);margin-bottom:6px;">Item Masuk</div>' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<thead><tr><th style="padding:6px 10px;background:var(--gray-50);font-size:11px;text-align:left;">Nama Barang</th>' +
    '<th style="padding:6px 10px;background:var(--gray-50);font-size:11px;text-align:center;">Jumlah</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '</div>' +
    '<div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Tutup</button></div>'
  );
}

function openRefBon(bonNumber) {
  closeModal();
  setTimeout(function() {
    var bon = BON_LIST.find(function(x) { return x.bon_number === bonNumber; });
    if (bon) showDetailBon(bon.id);
    else showToast('Bon ' + bonNumber + ' tidak ditemukan');
  }, 200);
}

function showKartuBarang(barangId) {
  const b = BARANG_DB.find(x=>x.id===barangId); if (!b) return;
  const d = getDivisi(b.divisi_id);
  const logs = STOCK_LOG.filter(l=>l.barang_id===barangId).sort((a,c)=>a.tgl.localeCompare(c.tgl));

  // Summary stats
  const saldoAwal = logs.filter(l=>l.jenis==='SALDO_AWAL').reduce((s,l)=>s+l.jumlah,0);
  const totalMasuk = logs.filter(l=>l.jenis==='MASUK').reduce((s,l)=>s+l.jumlah,0);
  const totalKeluar = logs.filter(l=>l.jenis==='KELUAR').reduce((s,l)=>s+l.jumlah,0);

  const jenisBadge = {
    SALDO_AWAL: '<span style="font-size:10px;font-weight:700;background:#ede9fe;color:#6d28d9;padding:2px 7px;border-radius:10px;">Saldo Awal</span>',
    MASUK:      '<span style="font-size:10px;font-weight:700;background:var(--success-light);color:var(--success);padding:2px 7px;border-radius:10px;">Masuk</span>',
    KELUAR:     '<span style="font-size:10px;font-weight:700;background:var(--danger-light);color:var(--danger);padding:2px 7px;border-radius:10px;">Keluar</span>',
    OPNAME:     '<span style="font-size:10px;font-weight:700;background:var(--warning-light);color:var(--warning);padding:2px 7px;border-radius:10px;">Opname</span>',
  };

  showModal(`
    <div class="modal-header">
      <div>
        <h3>📋 Kartu Barang — ${b.nama}</h3>
        <div style="font-size:11px;color:var(--gray-500);margin-top:2px;">
          ${b.kode} &nbsp;·&nbsp; ${d?d.icon+' '+d.nama:'—'} &nbsp;·&nbsp; Rak: ${b.rak||'—'}
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">

      <!-- Summary cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
        <div style="background:#ede9fe;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:#6d28d9;">${saldoAwal}</div>
          <div style="font-size:10px;color:#6d28d9;margin-top:2px;">Saldo Awal</div>
        </div>
        <div style="background:var(--success-light);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--success);">+${totalMasuk}</div>
          <div style="font-size:10px;color:var(--success);margin-top:2px;">Total Masuk</div>
        </div>
        <div style="background:var(--danger-light);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--danger);">-${totalKeluar}</div>
          <div style="font-size:10px;color:var(--danger);margin-top:2px;">Total Keluar</div>
        </div>
        <div style="background:var(--primary-light);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--primary);">${b.stok}</div>
          <div style="font-size:10px;color:var(--primary);margin-top:2px;">Stok Sekarang</div>
        </div>
      </div>

      <!-- Tabel riwayat -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--gray-500);margin-bottom:8px;">Riwayat Mutasi Stok</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Tanggal</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);">Jenis</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:right;">Jml</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:right;">Saldo</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Keterangan</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:var(--gray-500);background:var(--gray-50);border-bottom:1px solid var(--gray-200);text-align:left;">Referensi</th>
          </tr></thead>
          <tbody>
            ${logs.length ? logs.map(l => `<tr>
              <td style="padding:8px 10px;font-size:12px;">${fmtDate(l.tgl)}</td>
              <td style="padding:8px 10px;">${jenisBadge[l.jenis]||l.jenis}</td>
              <td style="padding:8px 10px;text-align:right;font-size:13px;font-weight:700;
                color:${l.jenis==='KELUAR'?'var(--danger)':l.jenis==='MASUK'?'var(--success)':'var(--purple)'};">
                ${l.jenis==='KELUAR'?'-':'+'}${l.jumlah}
              </td>
              <td style="padding:8px 10px;text-align:right;font-size:13px;font-weight:700;color:var(--gray-800);">
                ${l.stok_sesudah}
              </td>
              <td style="padding:8px 10px;font-size:12px;color:var(--gray-600);">${l.keterangan}</td>
              <td style="padding:8px 10px;font-size:11px;font-family:monospace;">${l.ref_bon && l.ref_bon !== '—' ?
              (l.jenis === 'KELUAR'
                ? `<span data-bon="${l.ref_bon}" style="color:var(--primary);cursor:pointer;text-decoration:underline;">${l.ref_bon}</span>`
                : `<span data-pbdok="${l.ref_bon}" style="color:var(--success);cursor:pointer;text-decoration:underline;">${l.ref_bon}</span>`)
              : (l.ref_bon || '—')}</td>
            </tr>`).join('')
            : '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400);">Belum ada riwayat mutasi</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary btn-sm" onclick="printKartuBarang(${b.id})">📥 Export PDF</button>
      <div style="flex:1"></div>
      <button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
    </div>`, true);

}

function tambahStokMasuk(barangId) {
  const jumlah = parseInt(document.getElementById('kb-jumlah-'+barangId)?.value)||0;
  const ket    = document.getElementById('kb-ket-'+barangId)?.value.trim();
  if (jumlah <= 0) { showToast('Jumlah harus lebih dari 0'); return; }
  if (!ket) { showToast('Keterangan wajib diisi'); return; }
  const b = BARANG_DB.find(x=>x.id===barangId); if (!b) return;
  STOCK_LOG.push({
    id:++STOCK_LOG_SEQ, barang_id:barangId,
    tgl:new Date().toISOString().slice(0,10),
    jenis:'MASUK', jumlah, keterangan:ket, ref_bon:'Manual',
    stok_sebelum:b.stok, stok_sesudah:b.stok+jumlah
  });
  b.stok += jumlah;
  showToast(`✓ +${jumlah} ${b.satuan.toLowerCase()} ${b.nama.split(' ').slice(0,3).join(' ')} ditambahkan`);
  showKartuBarang(barangId); // refresh modal
}

// ================================================================
// ═══ INPUT PEMBELIAN / PENGADAAN ════════════════════════════════
// ================================================================

function renderInputPembelian(c) {
  const riwayat = [...PEMBELIAN_LOG].sort((a,b) => b.tgl.localeCompare(a.tgl));
  c.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">

      <!-- FORM INPUT KIRI -->
      <div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-header"><h3>🛒 Input Pembelian / Pengadaan</h3></div>
          <div style="padding:16px 18px;">

            <div class="form-group">
              <label>Nomor Dokumen <span style="color:var(--danger)">*</span>
                <br><span style="font-size:10px;font-weight:400;color:var(--gray-400)">No. SPK / Nota / BAST / SP2D dll.</span>
              </label>
              <input id="pb-nodok" placeholder="Contoh: SPK-2026/042" style="font-family:monospace;">
            </div>

            <div class="form-group">
              <label>Tanggal Dokumen <span style="color:var(--danger)">*</span></label>
              <input id="pb-tgl" type="date" value="${new Date().toISOString().slice(0,10)}">
            </div>

            <div class="form-group">
              <label>Keterangan</label>
              <input id="pb-ket" placeholder="Contoh: Pengadaan Q2 2026 — Pemeliharaan Kapal">
            </div>

            <!-- Daftar item -->
            <div style="font-size:12px;font-weight:600;color:var(--gray-700);margin-bottom:8px;">
              Daftar Barang yang Dibeli
              <span style="font-weight:400;color:var(--gray-400);font-size:11px;">(${ADMIN_STATE.pembelianItems.length} item)</span>
            </div>

            <div id="pb-items-list" style="margin-bottom:10px;">
              ${ADMIN_STATE.pembelianItems.length ? ADMIN_STATE.pembelianItems.map((it,i) => {
                const b = BARANG_DB.find(x=>x.id===it.barang_id)||{};
                return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--gray-50);border-radius:8px;margin-bottom:6px;border:1px solid var(--gray-200);">
                  <span style="font-size:18px;">${b.emoji||'📦'}</span>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:12px;font-weight:500;">${b.nama||it.nama}</div>
                    <div style="font-size:10px;color:var(--gray-400);">${b.satuan||''}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;">
                    <button onclick="decPbItem(${i})" style="width:22px;height:22px;border-radius:5px;border:1px solid var(--gray-300);background:#fff;cursor:pointer;font-size:14px;">−</button>
                    <input type="number" min="1" value="${it.jumlah}"
                      oninput="setPbItem(${i},this.value)"
                      style="width:48px;text-align:center;border:1px solid var(--gray-300);border-radius:5px;padding:2px;font-size:12px;font-weight:700;">
                    <button onclick="incPbItem(${i})" style="width:22px;height:22px;border-radius:5px;border:1px solid var(--primary);background:var(--primary);color:#fff;cursor:pointer;font-size:14px;">+</button>
                  </div>
                  <button onclick="removePbItem(${i})" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--gray-200);background:#fff;cursor:pointer;color:var(--danger);font-size:14px;display:flex;align-items:center;justify-content:center;">🗑</button>
                </div>`;
              }).join('') : '<div style="text-align:center;padding:20px;color:var(--gray-400);font-size:12px;border:2px dashed var(--gray-200);border-radius:8px;">Belum ada item — klik "+ Tambah Barang" di bawah</div>'}
            </div>

            <button class="btn btn-secondary btn-sm" onclick="showPilihBarangPembelian()" style="width:100%;justify-content:center;margin-bottom:14px;">
              + Tambah Barang dari Katalog
            </button>

            <button class="btn btn-primary btn-full" onclick="simpanPembelian()" style="font-size:14px;padding:11px;">
              ✓ Simpan & Update Stok
            </button>
          </div>
        </div>
      </div>

      <!-- RIWAYAT KANAN -->
      <div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-header"><h3>📑 Riwayat Pembelian</h3></div>
          <div style="max-height:560px;overflow-y:auto;">
            ${riwayat.length ? riwayat.map(p => `
              <div style="padding:12px 16px;border-bottom:1px solid var(--gray-100);">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
                  <div>
                    <div style="font-family:monospace;font-size:13px;font-weight:700;color:var(--primary);">${p.no_dok}</div>
                    <div style="font-size:11px;color:var(--gray-500);margin-top:1px;">${fmtDate(p.tgl)} ${p.keterangan?'· '+p.keterangan:''}</div>
                  </div>
                  <span style="font-size:11px;background:var(--success-light);color:var(--success);padding:2px 8px;border-radius:10px;font-weight:600;white-space:nowrap;">${p.items.length} item</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:3px;">
                  ${p.items.map(it => {
                    const b = BARANG_DB.find(x=>x.id===it.barang_id)||{};
                    return `<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-600);padding:3px 8px;background:var(--gray-50);border-radius:5px;">
                      <span>${b.emoji||'📦'} ${it.nama||b.nama}</span>
                      <span style="font-weight:600;color:var(--success);">+${it.jumlah} ${b.satuan||''}</span>
                    </div>`;
                  }).join('')}
                </div>
              </div>`) .join('')
            : '<div style="text-align:center;padding:32px;color:var(--gray-400);">Belum ada riwayat pembelian</div>'}
          </div>
        </div>
      </div>

    </div>`;
}

function showPilihBarangPembelian() {
  const divFilter = ADMIN_STATE.filterDivisi || 'Semua';
  let list = [...BARANG_DB];
  if (divFilter !== 'Semua') list = list.filter(b => b.divisi_id === parseInt(divFilter));
  showModal(`
    <div class="modal-header"><h3>Pilih Barang</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="margin-bottom:10px;position:relative;">
        <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--gray-400);">🔍</span>
        <input type="text" id="pb-search" placeholder="Cari nama atau kode barang..."
          style="width:100%;padding:7px 10px 7px 30px;font-size:12px;border:1px solid var(--gray-300);border-radius:7px;"
          oninput="filterPbSearch()">
      </div>
      <div id="pb-barang-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;max-height:340px;overflow-y:auto;">
        ${list.map(b => `
          <div onclick="addPbItem(${b.id})" style="border:1px solid var(--gray-200);border-radius:8px;padding:10px;cursor:pointer;text-align:center;transition:all 0.1s;"
            onmouseover="this.style.borderColor='var(--primary)';this.style.background='var(--primary-light)'"
            onmouseout="this.style.borderColor='var(--gray-200)';this.style.background='#fff'">
            <div style="font-size:26px;margin-bottom:4px;">${b.emoji||'📦'}</div>
            <div style="font-size:11px;font-weight:600;line-height:1.3;margin-bottom:3px;">${b.nama}</div>
            <div style="font-size:10px;color:var(--gray-400);">Stok: ${b.stok} ${b.satuan}</div>
          </div>`).join('')}
      </div>
    </div>`);
}

function filterPbSearch() {
  const q = document.getElementById('pb-search')?.value.toLowerCase()||'';
  document.querySelectorAll('#pb-barang-grid > div').forEach(el => {
    const txt = el.textContent.toLowerCase();
    el.style.display = txt.includes(q) ? '' : 'none';
  });
}

function addPbItem(barangId) {
  const b = BARANG_DB.find(x=>x.id===barangId); if (!b) return;
  // Jika sudah ada, tambah jumlah
  const existing = ADMIN_STATE.pembelianItems.find(x=>x.barang_id===barangId);
  if (existing) { existing.jumlah++; }
  else { ADMIN_STATE.pembelianItems.push({barang_id:barangId, nama:b.nama, jumlah:1}); }
  closeModal();
  renderAdminTab();
  showToast(`${b.emoji||'📦'} ${b.nama.split(' ').slice(0,3).join(' ')} ditambahkan`);
}

function incPbItem(i) {
  if (ADMIN_STATE.pembelianItems[i]) ADMIN_STATE.pembelianItems[i].jumlah++;
  renderAdminTab();
}
function decPbItem(i) {
  if (ADMIN_STATE.pembelianItems[i]) {
    ADMIN_STATE.pembelianItems[i].jumlah = Math.max(1, ADMIN_STATE.pembelianItems[i].jumlah - 1);
  }
  renderAdminTab();
}
function setPbItem(i, val) {
  if (ADMIN_STATE.pembelianItems[i]) ADMIN_STATE.pembelianItems[i].jumlah = Math.max(1, parseInt(val)||1);
}
function removePbItem(i) {
  ADMIN_STATE.pembelianItems.splice(i, 1);
  renderAdminTab();
}

function simpanPembelian() {
  const noDok = document.getElementById('pb-nodok')?.value.trim();
  const tgl   = document.getElementById('pb-tgl')?.value;
  const ket   = document.getElementById('pb-ket')?.value.trim()||'';
  const items = ADMIN_STATE.pembelianItems;

  if (!noDok) { showToast('Nomor dokumen wajib diisi'); return; }
  if (!tgl)   { showToast('Tanggal wajib diisi'); return; }
  if (!items.length) { showToast('Tambahkan minimal 1 barang'); return; }

  // Cek duplikasi nomor dok
  if (PEMBELIAN_LOG.find(p => p.no_dok === noDok)) {
    showToast('Nomor dokumen sudah ada — gunakan nomor lain'); return;
  }

  // Tambah stok + catat STOCK_LOG
  const savedItems = items.map(it => ({...it}));
  items.forEach(it => {
    const b = BARANG_DB.find(x=>x.id===it.barang_id); if (!b) return;
    const stok_sblm = b.stok;
    b.stok += it.jumlah;
    STOCK_LOG.push({
      id: ++STOCK_LOG_SEQ,
      barang_id: b.id,
      tgl,
      jenis: 'MASUK',
      jumlah: it.jumlah,
      keterangan: noDok + (ket ? ' — ' + ket : ''),
      ref_bon: noDok,
      stok_sebelum: stok_sblm,
      stok_sesudah: b.stok
    });
  });

  // Catat ke PEMBELIAN_LOG
  PEMBELIAN_LOG.push({ id:++PEMBELIAN_SEQ, no_dok:noDok, tgl, keterangan:ket, items:savedItems });

  // Reset form
  ADMIN_STATE.pembelianItems = [];

  // Sukses
  closeModal();
  showModal(`
    <div class="modal-body" style="text-align:center;padding:36px 24px;">
      <div style="font-size:44px;margin-bottom:12px;">✅</div>
      <h3 style="font-weight:700;margin-bottom:8px;">Pembelian Tersimpan!</h3>
      <div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--primary);background:var(--primary-light);padding:10px 20px;border-radius:8px;display:inline-block;margin-bottom:14px;">${noDok}</div>
      <div style="background:var(--success-light);border-radius:10px;padding:12px 16px;margin-bottom:16px;text-align:left;font-size:12px;color:var(--success);">
        <div style="font-weight:600;margin-bottom:6px;">✓ Stok bertambah:</div>
        ${savedItems.map(it=>{const b=BARANG_DB.find(x=>x.id===it.barang_id)||{};return `<div>• ${b.emoji||''} ${it.nama||b.nama}: +${it.jumlah} ${b.satuan||''}</div>`;}).join('')}
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-secondary" onclick="closeModal();renderAdminTab()">Kembali ke Form</button>
        <button class="btn btn-primary" onclick="closeModal();ADMIN_STATE.adminTab='barang';renderAdminGudangDashboard()">📦 Lihat Katalog</button>
      </div>
    </div>`);
}


// ================================================================
// ═══ GENERATE BON DOCX ══════════════════════════════════════════
// ================================================================

const LOGO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAR0AAAELBAMAAAAWy0/OAAAAMFBMVEUAAAAAAP+AAACAgAD//wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcTt0eAAAW0klEQVR4Xu1cSbKkMLKk2z6nexs2nJINm3c6etFyj0ERGsixutq+tVtVJggRcsWkAV7+Y1/+m3D9sy35y/gfn3v8f+VztAVv4kt8ruVsi97Dl/ichdFX8B0+IPMdBX2Fz3Wu+3Z9hdBX+JzLtqzfsdg3+FyFzFIofUNBX+BTrLWVr/UrFvsCH6FDQs2VN/A5n2MBHeTD9QtZ8WM+4jySD7/gQh/zobWK58B5vmCxT/mItaAWUPncYh/yuRbML4UEPvdPLfYZnxLq+NQzutCHQf8ZHyTmOnKJxT5zoY/4RGsBX7DYJ3yytYDPLfYBHxknUusa9B8Q+oBPch5dxn3sQu/zscRMrOS2qMU+cKH3+cgwKi2XQx1UqaAP0vTbfOowukAjUJGWf5Sm3+WTrCXOoy70mcXe5ZOspWXfsNibfDprAd+w2Ht8jt5a4Ugs9h6ht/hc1ImmPbMWoBY7WfqWC73F56QmtD2zFqDcoLj9vaz4Dh+xltojqsfJ4dp7FnuDz8XcZ4k5qqeewmJvBf0bfNK4lekki701jr3O54iTnn43VEtkKvS6xV7m0wyjParF3knTr/LRxbG00ziPIA+srxJ6lY84j6pnRMeVBiavu9CLfGTGrL3unUcg5az08mz6RT6cMTfDaI9qseXVgfU1PsNhtMcHA+tLfCTUu2G0x/sD6yt8NNQfWQtQi50vp+lX+Nwm5oy30/QLfB4k5ox30/TzfAYz5jskF3reYk/zuWitp5xHEFwoL2Jv8TSf6RxshvfmZs/ySXOwx9YCggs9H/RP8slzsHxtCtXiS0H/HB9xnlesBeSgf47Qc3zEeV6yFpCC/jkXeopP2gd71lqAalIIPaWgZ/ikfbDhHGyGML1/ct/sCT4587xCx6vLQPYMoSf4vJx5Il4dyB7zeTiBv0e02BMu9JBP3rV8VT1VQU9a7CGfuJ6oof5QboXeQ4s9nr0+4pNmqDXztHKPYz4ghCz0ePb6gI+uJ+TkdecRBBd6mIUe8InrieA8rXpwPm8oxNjD9cY9n4PO49YK7phb5/P3VFJxSb5Y1GLbvcVu+VxUiTa0tyTucXjlK00W13spd3yuk84j9+/ZSjNtGI5Q4zRCFLXfBv0dn3YxGl4a2bcotDRe1BENgWOtIXdB0c+40A2fm8Vo7qERqYRKTm8cSn36YdDP+aRQD4eKelamsjsQJqVIosFRaKZ4OLfYlI9MMoK1/D2EWkLIVBZFzfhktTUrJ4tNCU35SOtDaylUQzKVBXwAl7hcs0KjxeYuNOPThjoRk6MdiVkFZghRrcHoPhX0Ez4p1EU6GZYChFJAFqwdCPq8autSeh/0Ez7JeYL0BVJLE+flXVwvvizBf9piqB1hk0V8zCw25pPGCUM1QtNu0dhVGOJzjNyh26Af8knOE+fkgv36dXVfy8+vcV+3mV8MRE2CfsRH1xNSX2Uc3ssVyi7Hl+rrLCxK7ln3ZVu1z+pwrtDVdB2m95OgH/FJU0KVkJxiXeR58kjgGKf5opxC2Hh6P+CTrWWlIg+lZejC6HVuqrDiNiXkrgMHEXJHvY+we5aJxXo+I2uN7jRs2yqk/QDaxCiq91oZ8chi/9cWtM/VCdEvVaNnDnDwhrfrVw7O6tl2nwblWmWMLNbpZzyqN0NXDf1GJNtCLF+yYeSoArQYLQx2Flv9dKM6kQeA5dilAtvoRJoaQxcAJ77LHdDXdqrWHI1++lFd4HchC7NbsEC93gI9cbsQnTBarEvTDZ/x45sriivD9s7Q0pQi/3b0Vm+Bm+7NfGwL9FUWzrsEmvmkxzehR3Yo34c6sZVuGNJOFhK+oJCrzbcfDgfWxCdbqwrIt3DahYuscMEJYMH98jE2e5uh6utmYE18xFptbDXHsNgJq+mQuNrAgDwpFXJ1RSSpx4OBNfKZPb6RftTzheFlSgsK90Pk655AUPN0Nh34zJxHITw10FGJmma9C12UaRppX5iCiJz4GSHd69N0zT8z5+mwwmLLppmYVZFFYDWVfK4/p2aZGWKajmu5qh8ZJ9pQJ3plEVUMqtdK24KRrEstQ5mQEYPe+eioruqxUoJl6rP4YENn154DivbG2/scUqO1mPFJ1kpd6ZtV/XLKX2T5/L4cTTRpqHrwPovFvBHzn2StmM7QW6HnQw28J0qmO0dgvrH+VG4itiSG1LcwjpWg1zZVPzpZkVaaTmaX4sTmBCmptmKmKihjhnRqQ7xTlt4bnCVAJLKKB73oR601yIQDc2F4P5P7GiEpO4szr5ssUVqk4VxFUDWmcNHP3FoBxmz19Y62r+WBOzQVOtLoxRGyoqVp8rmz1kgWieiFq9I4x7UjGm1rv/ChFqO9orU6Ndu2QOSJbFcSoopzEnZwYUkW65vMFAYLGmNBsBj0Iw1mt62wZQQhU94yfm2IIWESPYmf5cKhSaBufgA+I6kl8oXKYjHoJz78a++ICq7OuB041LpND0xdtXgsQxBWCDyk/0DwKLYm2E4sCGd1Tyyb18euJLAYs3P157vYytslAmYgLa8Ni5Bt3fZtsB/dLMgUNcboxeBTq7XWkiK9Hi+uwTXdn+O8IUHvrKIiclFe7/TVZbEqx/KF/YNwXk7CeAEBWDavPyShd8gNUVRA7SZuBh8kuIFmhqBaxL7FqTkHqhlCBmvWsATOz76bHbjLtTTz5wmptCiBbPGeqw9fAM68m1uEGmP3WRq2zgelrTLbgRu08D/vnDb+UzIl6EgrqNhIzduPi0q0E/pPmzYNo2LaiA9pTqPV0I4xOtJg22uFeFm7fm8gLSlfUoH/YjgoRRrSjf/oVEbE887gziHTjJH8p4F3JDpQiR6smHmxTbbEtpTB4hRvSTtUXnmkdoPy0XBoazbtufS4KRMSH1UAGWkiKEJD5zJ4AeHFxmivtorBA8gXN4aDD5x0jphMUHSH+Vo/k3ZZtmc1hM9XB4CL6GHu3aYGHD3gP+HQ7lLVolYT/mdlEXpd/Bmdxf+uZuolT6TK9rvWix5QVBRL01acc+pOABDBPSLtzp8r0tBJAWhO1FOdnS6g7sRmeSjn02zY4EG8m+cEB9LDMKNv8g+fxcjFkDiloHerBqIf76N1tUIlahQ4av8bYOf7SJdIoRescPkivOpnzNwXE4TeLN0u5hJdRf/BlRUKc3FRJTOr1dJH9tLcnMmi6MK/vg8nYms0EWKTD81V1++pNGA4C8SMFdck79klniDUVzxcCRdM/Ew9S62q+pkGvMHGLuLCjt1y/mhJ8GdtMTU75UCASA33Gu+1Lw00gOXzJLFN3z4YtxQk/VgeEn3OzeV6UP1MK5pHtxXErdRsyouTwvPnkglAjxtzed9CPpQu1HOHqSaCu3Qj+xZSx5k3VozJVHag+UR+ltr81BtXaKbY8RCtXcd5LAf3pSAe4R8sEzTbKnkA56M9Sh2TE40wnuADptol1n+84mG93+uGUN120KWFdCepSU+8zPKPBViFdh7XYmzxeyt1i3Dd4Qr+s2AzbatPAfQKUXUmT/cdKLdrd/ZyYe5ALpEv0WD6k7qwNPolNtVMvXJntsqnlYzuSpm0GrtKmRjeWWgtqYS0gIj8RAIfZjaotcxeUWcdZJjiTdz5Zo+RDjU31XyIeGc1uo4JzGcdwNN6241fozk6x08TJ8dIM/W6qOkEs4uPmhXBT8bJpzNvtVd3Ke6UmYahEBBLsrUiBlJ8Vw6baQUVqnq6LbjgK2l92qBOOmmXGH4YwHi6xTtLk/uOoVQ2fg1iaDvLW2YKJ5viCxWzA6qUEEe0hT/WZLHdYnXW3eu75dxceZKCasmvgv/0nlOfvMjqRo5PvMuyM/doSZyv1n1nf8cCNgu+3TUTdeD6GQZYzi+b18CrazIsyMbKtu4bv+DQtpfpN0UDDdw61ejzYRTmT16EGP6v8I3VlqiiwH3F7wOknIuL2KZfpPdGQx8EGLoYGvAx0If9yQvlwwLak51TRBUunC86B7cO3YBtAteXMTpDOIL/XNbdCH/ywgiLF1ggbNOGney9Bmc88ccgwkCUmgHnqmdVP1az0aHGmPXI3ZIn9sZYg2A6u87vbgFgRGpxl59beBJC0zIYyNPTostNt+xqfrZ7eIO85QETq3qGqSej6qc1tZ3rgw4xDQ7pV0JyrB6AF6y2QmKyj7F4nv156GfChPRIBWc29AuUnFyDMxkJtAP34UFnLUHmNrCXdppTHEAm9HkP6NpOISR13J9lY/GnCSCeXm6t056cNa4KBP2EjS6gnkkS4hsSroq0grD3e3WGKI7kSvOalWRU7pLM0uSfrDy9zRdR9cp2/aL9TjJ8GyGfuibTQ1dP7vaaZQzs1WtxP2CxjbuT5sLQFryIF3QeLeluDS/+8w6d16f8TXSd6fST4WLVlCZTNbOhPI6lGWIF/UO0+jpZP1uNCHzagF/qvXx2R4E6oK2rvkLGQveftjHNy5ioxUVIRgr/Rj8azMCGp8R2N5OQvBElP8V2sVqb4MoNMnZQjv1oG12k0in2DOGVBYz8p2Ldy6pTTWSaqlOiX0QcW9fxiwrG7tjKNC7V+eWp58iPE3pE/TRUtai2FcJywdRHroOfX9GO57ztCyO3ekYsSvZKkcXeon9CiI5jFczkZUXIgw3+w+J9tWdNpsezOjPobI3DNFHWxhdqRlpYi4tHbLppgbkXK3HJrP0GcI1uR4XAxGqtQ80GY0UmqNSqq+UToEGOv6uQO9kR7Y3+XVDqW3MGaNfYS/ydBs9upmOJjwd8lrvmSJBVVmHD9Ch1Ge9aPUIb5tfZOqhyzdZr9ROoOz01GSZ+4ACjnDQW4bEUsXHI3EhaFmM1shKBTPFBvBvK2kaWMTaqA787XoeSTorLD6a7lhERDCMFdkj6yWS5FhdYZoRsK5NNHAxhplO/3R1EU4JmQbtq9BXJm7K9Lr09nAuKdpj0rElcCHpX/4kjjh2htYO75Aonox3MOn1gL3utK+RlUOEz7QOv2MnE1dvAnqK2jPD0tgZ0xkj6GcSh3+7NSCOnNNiYGOtWDPm60+HDxC2dJKKJr6g8LIKpa4HKhAujCOvB0xJ0iHdMBaxfNkw4HT5o4dLa4S4haONdZAkHrDZFRgRlb8l9WB+Cy/empZTTKBx9223ThESqCMUD/+FOqbsERawkyjkfPITzIOeMwYTzyFNnKEsMyGi4CbJ+UBv/tWFIggRvjqJF5FkXeQ7RPe+Qo1ooyiEdVSyFWyVHY6/GmgATB4RhS16FyFyVLLVlHyjV35gp2Tp38qVLaTRVhO4Anf8E2AKIKxnIQ1fsfp1pUEtITkiLq1Sjp2utRVhROerxd8NpwyfXdLESaAtf2GYLXFygNOuTGVPWp7pmP2WqK2ElldrVcj5r9aPZX4jUFWLNPnyBAynmklJewYRev8WjWcNG3yjA1UPRbYd6Pg1qOpTBSjlSOEygV6+jbtLZa7xUj0Zh8JxBQoxo+GTl0XMNYv1VprHVCfIdBDxK1qSWjerQrl5e0ThTq59Wf2G5pCs7ikN7VJSKk/TMIkxkja/aPtCp4gTt+SAfYuSstOCeLk+DDK+/lZG22/1B6YWFx6ZDGHJxNVAyFYg0ugEGfAJ0UKeguqhiS+fJi0pcm8JKHq8+cyCtXT9/ghoGJAIaPl7Z+o64kMYu6P2SrYOiILA5sBHPirvrjhN9rCzAFHFexvy6ynWDuQEaHXf6Sa8iyiETtBZsmFodXPCdlbUBy/RLGgN9TAuthts83NKHe88nw2dh7Jo0v2HnRXVm9ZQu9MI7OLHQ7tS9BNbwwyHa+GoQZ6AqiTaxsryhjKBzp0UlvVjrtMm5Q8vHUrL1vKZoO4bAOnwqJN7DwCU1JN6DSvxY63XqavkAsa3+74wlEa82H5TL3PxknBMyenRTuUadLRdgxCch/AoBen/GVtjqgfkpxvdNY6xmK1SOJmr+5nKElk90GC0IGlIqrHJB22w73cEXsa3CYuqUwy66e3caxZdY3WpumLDWhIbMwhP8URXiLtlEvEhqMwnhiDVY6OpxT2zR6qcHZIRhZ1MdXuZb9Zez7Fe4NiqIfa/2oYgRg4yRfoguUzHIRRmyVb+VJSEeSdRVu9jWtgeVCzg+HEYdHR9Iz/sCvq/UAxsN4VQmyaHARNHPmmeD4NuF+xP2ynABQrnNQxZdnXafRaefHs3uv0GNgpGUQz3fQlYMNl7Qg5b8AJ1+GgUAtqIERtSsmU75S5QSHze5lI5hxwciGsFJQdljBHTXzmebup16BqP7kE8PTzL4Om6iI+Hy+oA9HHyAnk+nwgVl3M7FDmn9a7jH2Fmfd46Hir5s4M+X+GNUJqZhEIvFFfIfOPN6sp2MJkzRC9o68Zx51adRKWfI9UG4j/iMINtjKlPN1fsRUYulR+nWh+jt5Uhegp64TJxk+e32c6zB21L1gR8bev1Az70el0onDcqVhibC2gub66uGWiC8eqX1fKYwOmJ1NDHwbH3eIeO3/VrDsHtjPM2njJ1s/nBidpqx1/SAaZpWGjAH/tU13xUI2gBj0SEPUShbNjkGYA3VDIfb/MezBHTLor71vmQ8+NAL0vitc8Wm5yx0oniJ6pgG1yDcR3xmoFuaaHZRj2GOC2v3Q57FwadVuXxxdEJniAGfaYBVZaieigG5z2oPe1Z5EWKFA6nP8HiEcXjd5Z/pMGVmw76B+cLvycPz5NhALmEmn3GTfm75tNCXWmCCHYbYtmLBH79M1eAAduXjVKl+236Lgb2IgVNf1Awv7BfnIOelbwVoBbEy31EqYxdetZPHLe22w6LEBxjpp10zJ5zwiavYpRADAeF9Yc9w484h3wgAWW4TN3cT2tVReA35TKD7bphCYIb/e62l95yqXkg5rCI1SgVuv0rhsz8lTLzAZ+HvaHFCs5W4wm9slekHfRqkZEN8gTEXXjvOa8UMaBRGU4z8xx2zt3sx1e+G/Te+ycYnT8w58idoqiOoB/TwmwWDgYLaQtVO+jLmMyLiKDTwcGeHRlaQiPNmvIyEwFpPELzwAuXISYixEcd8pijagTXKyCEvgza5TjZj8dskdPVCOr+5/xhDPt2fLwrQI+wc4uXD356MQrPhhteiJFKDAiOGmhvyMV22Ki3jCELqR37MwugEDWgR9l0XDgcwfCdFv17gs4wSIp/7XdSdvyHWDJWWlLELjQzO3yjpphvLRDfAlE8Pyti41y1shuM21h8nPIljrfz436jeBMP8UwM+FXPdjLGfdHSPcADZW7xOeSc5rpOB23Af82mJKETuil9nsX2MGThW2DR12HDrVYoJnwm4/87ZxrCNAHvqGvcinsGYj7U26MQTyhGoijoYv7FLT/z5GgXYogH9DJsFrI9ZjkKyHPMZ62cCUduTdBarOW54gjGfOxHP07mvO/bAMZ8b3DXR47Xay5yPOk/nQ6820NWfDEWGiT+XUWFgs6fiqsHwlm3qEjP9KGbdeB+dxjNmfBDwbdnXgHBvyxQzPn8LEz4T634RE+1P+MwD7EM8CK85nz+po4lugBmfm1u+gllnZ3zmGv0Kpm4w5bOIjr5NC0RmugFmfO7u+QZm/jDj45hq9i08VPecz2iZ8h0MHzQppnxmCv0Opl2d8vlLmPN5lEnfwsOsP+UDjf4Zm91KnvL5S7jh81C3r+OxD0zmqwGjNd2fw1w/201UfoRbwXM+d1r9EDcucMPnr+CezzQsP8DcVsCcz/19n2HezzmfPzWi3o2mt/GOncvh6vJj3HTzTj9/A3d87vT6Lv613Ib7LZ8/gRv/IG74dK9GfgnD57iGW77/2aGLuNHPXTc+wk143fL5G/jHn8kw7+L6b9PP//jc49/+pOxofRzdagAAAABJRU5ErkJggg==';



function generateSpmbHTML(bonId) {
  const b = getBon(bonId);
  if (!b) { showToast('Bon tidak ditemukan'); return; }
  const d = getDivisi(b.divisi_id);
  if (!d) { showToast('Divisi tidak ditemukan'); return; }
  if (!SPMB_SCRIPT_URL || SPMB_SCRIPT_URL.includes('PASTE_SPMB')) {
    showToast('SPMB Generator URL belum dikonfigurasi');
    return;
  }
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  const tgl    = new Date(b.tanggal);
  const tglStr = tgl.getDate() + ' ' + bulan[tgl.getMonth()] + ' ' + tgl.getFullYear();
  // Format nomor SPMB: SPMB-(nomor bon)/PSO.11/(kode divisi)/2026
  const bonSeq     = b.bon_number ? b.bon_number.split('/')[0].replace('BON-','') : '';
  const kodeSpmb   = d.kode_spmb || d.kode_bon || '';
  const tahun      = new Date(b.tanggal).getFullYear();
  const spmbNumber = b.spmb_number || ('SPMB-' + bonSeq + '/' + kodeSpmb + '/' + tahun);

  const payload = {
    spmb_number:  spmbNumber,
    bon_number:   b.bon_number   || '',
    tanggal:      b.tanggal,
    tgl_str:      tglStr,
    divisi_nama:  d.nama,
    kepala_nama:  d.kepala       || '',
    pemohon_nama: b.pemohon_nama || '',
    staf_gudang:  b.gudang_staf  || '',
    keterangan:   b.keterangan   || '',
    items: b.items.map(function(it) { return {
      nama:       it.nama,
      jumlah:     it.jumlah,
      satuan:     it.satuan,
      keterangan: it.keterangan || ''
    }; })
  };
  window.open(SPMB_SCRIPT_URL + '?data=' + encodeURIComponent(JSON.stringify(payload)), '_blank');
}

function generateBonHTML(bonId) {
  const b = getBon(bonId);
  if (!b) { showToast('Bon tidak ditemukan'); return; }
  const d = getDivisi(b.divisi_id);
  if (!d) { showToast('Divisi tidak ditemukan'); return; }

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('PASTE_YOUR')) {
    generateBonFallback(bonId);
    return;
  }

  const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  const tgl    = new Date(b.tanggal);
  const tglStr = tgl.getDate() + ' ' + bulan[tgl.getMonth()] + ' ' + tgl.getFullYear();

  const payload = {
    bon_id:       String(b.id),
    bon_number:   b.bon_number,
    tanggal:      b.tanggal,
    tgl_str:      tglStr,
    divisi_nama:  d.nama,
    kepala_nama:  d.kepala || '',
    pemohon_nama: b.pemohon_nama,
    keterangan:   b.keterangan || '',
    items: b.items.map(function(it) { return {
      nama:       it.nama,
      jumlah:     it.jumlah,
      satuan:     it.satuan,
      keterangan: it.keterangan || ''
    }; })
  };

  // window.open dipanggil LANGSUNG dari event klik — tidak diblokir popup blocker
  const url = APPS_SCRIPT_URL + '?data=' + encodeURIComponent(JSON.stringify(payload));
  window.open(url, '_blank');
}


function generateBonFallback(bonId) {
  const b = getBon(bonId);
  if (!b) return;
  const d = getDivisi(b.divisi_id);
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember'];
  const tgl    = new Date(b.tanggal);
  const tglStr = `${tgl.getDate()} ${bulan[tgl.getMonth()]} ${tgl.getFullYear()}`;
  const kepalaLabel = d.id===1 ? 'Kepala Subbagian Umum dan<br>Kepatuhan Internal' : `Kepala ${d.nama}`;
  const itemRows = b.items.map((it, i) => `
    <tr>
      <td style="border:1px solid #000;padding:4px 6px;text-align:center;vertical-align:top;">${i+1}</td>
      <td style="border:1px solid #000;padding:4px 6px;vertical-align:top;">${it.nama}</td>
      <td style="border:1px solid #000;padding:4px 6px;text-align:center;vertical-align:top;">${it.jumlah}</td>
      <td style="border:1px solid #000;padding:4px 6px;text-align:center;vertical-align:top;">${it.satuan}</td>
      <td style="border:1px solid #000;padding:4px 6px;vertical-align:top;">${it.keterangan||b.keterangan||''}</td>
    </tr>`).join('');
  const bonHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${b.bon_number}</title>
<style>
  @page{size:A4;margin:1.8cm 2.2cm;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Times New Roman',Times,serif;font-size:11pt;color:#000;background:#fff;}
  table{border-collapse:collapse;}
  @media print{body{margin:0!important;}}
</style></head><body>
<table style="width:100%;margin-bottom:6pt;">
  <tr>
    <td style="width:85pt;text-align:center;vertical-align:middle;padding-right:10pt;">
      <img src="data:image/png;base64,${LOGO_B64}" style="width:78pt;height:78pt;">
    </td>
    <td style="text-align:center;vertical-align:middle;line-height:1.45;">
      <div style="font-size:12.5pt;font-weight:bold;">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</div>
      <div style="font-size:11pt;font-weight:bold;">DIREKTORAT JENDERAL BEA DAN CUKAI</div>
      <div style="font-size:11pt;font-weight:bold;">KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI KHUSUS KEPULAUAN RIAU</div>
      <div style="font-size:11pt;font-weight:bold;">PANGKALAN SARANA OPERASI BEA DAN CUKAI TIPE A TANJUNG BALAI KARIMUN</div>
      <div style="font-size:8pt;margin-top:3pt;">JALAN JENDERAL A. YANI, MERAL, TANJUNG BALAI KARIMUN 29664</div>
      <div style="font-size:8pt;">TELEPON (0777) 21010; FAKSIMILE (0777) 21010; LAMAN www.psobctbk.co.id</div>
      <div style="font-size:8pt;">PUSAT KONTAK LAYANAN 1500225; SUREL bcpsotbk&#64;customs.go.id</div>
    </td>
  </tr>
</table>
<hr style="border:none;border-top:2.5pt solid #000;margin-bottom:10pt;">
<div style="text-align:center;font-size:12pt;font-weight:bold;margin-bottom:6pt;">BON PERMOHONAN BARANG PERSEDIAAN</div>
<table style="margin:0 0 10pt 50pt;">
  <tr><td style="width:65pt;font-size:11pt;">Nomor</td><td style="width:18pt;font-size:11pt;">:</td><td style="font-size:11pt;">${b.bon_number}</td></tr>
  <tr><td style="font-size:11pt;">Tanggal</td><td style="font-size:11pt;">:</td><td style="font-size:11pt;">${tglStr}</td></tr>
</table>
<div style="margin-bottom:6pt;font-size:11pt;">Yth. Kepala Subbagian Umum dan Kepatuhan Internal</div>
<div style="margin-bottom:10pt;font-size:11pt;text-align:justify;">Diajukan permohonan permintaan barang tersebut di bawah ini untuk keperluan operasional ${d.nama}.</div>
<table style="width:100%;margin-bottom:16pt;">
  <thead><tr>
    <th style="border:1px solid #000;padding:4pt 6pt;text-align:center;font-size:11pt;width:28pt;">No</th>
    <th style="border:1px solid #000;padding:4pt 6pt;text-align:center;font-size:11pt;">Nama Barang</th>
    <th style="border:1px solid #000;padding:4pt 6pt;text-align:center;font-size:11pt;width:52pt;">Jumlah</th>
    <th style="border:1px solid #000;padding:4pt 6pt;text-align:center;font-size:11pt;width:62pt;">Satuan</th>
    <th style="border:1px solid #000;padding:4pt 6pt;text-align:center;font-size:11pt;width:90pt;">Keterangan</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
</table>
<table style="width:100%;">
  <tr><td style="width:50%;font-size:11pt;">${kepalaLabel}</td><td style="font-size:11pt;">Yang Mengajukan</td></tr>
  <tr><td style="height:55pt;"></td><td></td></tr>
  <tr>
    <td style="font-style:italic;color:#999;font-size:9pt;">Ditandatangani secara elektronik</td>
    <td style="font-style:italic;color:#999;font-size:9pt;">Ditandatangani secara elektronik</td>
  </tr>
  <tr>
    <td style="font-weight:bold;font-size:11pt;">${d.kepala||''}</td>
    <td style="font-weight:bold;font-size:11pt;">${b.pemohon_nama}</td>
  </tr>
</table>
\x3cscript\x3ewindow.onload=function(){setTimeout(function(){window.print();},400);}\x3c/script\x3e
</body></html>`;
  const finalHtml = bonHtml.split("${LOGO_B64}").join(LOGO_B64);
  const blob = new Blob([finalHtml], {type:'text/html'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.target='_blank'; a.rel='noopener';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 8000);
}


