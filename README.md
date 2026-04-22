# BC Goods Approval — Sistem Permintaan Barang
**PSO Bea dan Cukai Tipe A Tanjung Balai Karimun**

Aplikasi web untuk manajemen permintaan barang persediaan (bon) internal.

---

## File Structure

```
├── bc-goods-revisi.html     # Main web app (single file, open in browser)
├── BonGenerator.gs          # Google Apps Script — generate PDF BON
├── SPMBGenerator.gs         # Google Apps Script — generate PDF SPMB
└── README.md
```

---

## Setup

### 1. Web App
Buka `bc-goods-revisi.html` langsung di browser. Tidak perlu server.

**Demo accounts:**
| Username | Password | Role |
|---|---|---|
| pemohon | admin123 | Pemohon |
| assessor | admin123 | Assessor |
| gudang | admin123 | Staff Gudang |
| admingudang | admin123 | Admin Gudang |
| superadmin | admin123 | Super Admin |

### 2. BonGenerator (Google Apps Script)
1. Buka [script.google.com](https://script.google.com) → New project
2. Paste isi `BonGenerator.gs`
3. Deploy → Web app → Execute as: Me → Anyone
4. Copy URL → paste ke `APPS_SCRIPT_URL` di `bc-goods-revisi.html`

**Template Spreadsheet BON:**
`https://docs.google.com/spreadsheets/d/1xTsvUapjNgLPabruYUBvXqKsa_MwJ_F1QcaCXuqSvoU`

### 3. SPMBGenerator (Google Apps Script)
1. Buka [script.google.com](https://script.google.com) → New project (terpisah)
2. Paste isi `SPMBGenerator.gs`
3. Deploy → Web app → Execute as: Me → Anyone
4. Copy URL → paste ke `SPMB_SCRIPT_URL` di `bc-goods-revisi.html`

**Template Spreadsheet SPMB:**
`https://docs.google.com/spreadsheets/d/12ylq7BmAB3xNIBIsYb-Zo8lhfANWdZJsISmtG-L3Zes`

---

## Features

### Portal Pemohon
- Ajukan bon baru (pilih divisi → katalog barang → submit)
- Pantau status bon berjalan
- Upload lampiran TTD via Google Form
- Download PDF BON
- Notifikasi real-time

### Portal Assessor
- Review & approve/tolak/revisi bon
- Laporan transaksi dengan filter unit & tanggal
- Export laporan CSV

### Portal Staff Gudang
- Verifikasi lapangan dengan checklist
- Approve & terbitkan SPMB
- Download PDF BON & SPMB
- Riwayat verifikasi

### Portal Admin Gudang
- Manajemen master data barang
- Input pembelian & stok masuk
- Kartu barang per item (export PDF)
- Laporan transaksi (export CSV)

### Portal Super Admin
- Manajemen akun pengguna

---

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (single file)
- **Fonts:** Plus Jakarta Sans, DM Sans (Google Fonts)
- **PDF Generation:** Google Apps Script + Google Sheets
- **Storage:** Client-side (in-memory, no backend)
