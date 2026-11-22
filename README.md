# Bot Pencatat Keuangan WhatsApp

Bot pencatat keuangan pribadi berbasis **Node.js** dan **whatsapp-web.js** untuk mencatat pemasukan, pengeluaran, cek saldo, dan melihat riwayat transaksi langsung melalui chat WhatsApp. Data transaksi disimpan secara lokal ke dalam file `transaksi.json`.

## Fitur & Perintah
- `menu` — Menampilkan daftar perintah bot
- `masuk <nominal> <keterangan>` — Mencatat pemasukan (contoh: `masuk 100000 saldo awal`)
- `keluar <nominal> <keterangan>` — Mencatat pengeluaran (contoh: `keluar 25000 kopi dan roti`)
- `saldo` — Menampilkan total pemasukan, total pengeluaran, dan sisa saldo
- `riwayat` — Menampilkan daftar transaksi yang tercatat

## Cara Menjalankan
1. Install dependensi:
   ```bash
   npm install