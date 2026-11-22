const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const DATA_FILE = path.join(__dirname, 'transaksi.json');

function loadTransaksi() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Gagal membaca transaksi.json:', err);
    return [];
  }
}

function saveTransaksi(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function formatRupiah(angka) {
  return 'Rp' + Number(angka).toLocaleString('id-ID');
}

function parseNominal(teksNominal) {
  const bersih = teksNominal.replace(/[^0-9]/g, '');
  const nilai = Number(bersih);
  return Number.isFinite(nilai) && nilai > 0 ? nilai : null;
}

const client = new Client({
  authStrategy: new LocalAuth(),
  authTimeoutMs: 120000,
  qrMaxRetries: 5,
  puppeteer: {
    headless: true,
    timeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('\nScan QR Code berikut menggunakan WhatsApp (Perangkat Tertaut):');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot pencatat keuangan sudah siap digunakan!');
});

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  if (chat.isGroup || msg.from === 'status@broadcast') {
    return;
  }

  const teksAsli = msg.body.trim();
  if (!teksAsli) return;

  const bagian = teksAsli.split(/\s+/);
  const perintah = bagian[0].toLowerCase();

  if (perintah === 'menu' || perintah === 'bantuan' || perintah === 'help') {
    const panduan = [
      '*BOT PENCATAT KEUANGAN*',
      '',
      'Format perintah:',
      '• *masuk <nominal> <keterangan>*',
      '  Contoh: `masuk 1500000 gaji`',
      '• *keluar <nominal> <keterangan>*',
      '  Contoh: `keluar 25000 kopi dan roti`',
      '• *saldo* — cek total masuk, keluar & sisa saldo',
      '• *riwayat* — lihat 10 transaksi terakhir',
      '• *menu* — tampilkan bantuan ini'
    ].join('\n');

    await msg.reply(panduan);
    return;
  }

  if (perintah === 'masuk' || perintah === 'keluar') {
    const nominal = parseNominal(bagian[1] || '');
    const keterangan = bagian.slice(2).join(' ').trim() || 'Tanpa keterangan';

    if (!nominal) {
      await msg.reply(
        `Format nominal belum valid.\nContoh: *${perintah} 25000 makan siang*`
      );
      return;
    }

    const daftar = loadTransaksi();
    const itemBaru = {
      id: Date.now(),
      tipe: perintah,
      nominal,
      keterangan,
      waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    };

    daftar.push(itemBaru);
    saveTransaksi(daftar);

    const labelTipe = perintah === 'masuk' ? 'PEMASUKAN' : 'PENGELUARAN';
    await msg.reply(
      `✅ *${labelTipe} TERSIMPAN*\n` +
      `Nominal: *${formatRupiah(nominal)}*\n` +
      `Keterangan: ${keterangan}\n` +
      `Waktu: ${itemBaru.waktu}`
    );
    return;
  }

  if (perintah === 'saldo' || perintah === 'rekap') {
    const daftar = loadTransaksi();
    let totalMasuk = 0;
    let totalKeluar = 0;

    for (const item of daftar) {
      if (item.tipe === 'masuk') totalMasuk += Number(item.nominal);
      if (item.tipe === 'keluar') totalKeluar += Number(item.nominal);
    }

    const saldoAkhir = totalMasuk - totalKeluar;

    await msg.reply(
      `📊 *RINGKASAN KEUANGAN*\n` +
      `• Total Pemasukan: *${formatRupiah(totalMasuk)}*\n` +
      `• Total Pengeluaran: *${formatRupiah(totalKeluar)}*\n` +
      `• Sisa Saldo: *${formatRupiah(saldoAkhir)}*`
    );
    return;
  }

  if (perintah === 'riwayat') {
    const daftar = loadTransaksi();
    if (daftar.length === 0) {
      await msg.reply('Belum ada transaksi yang tercatat.');
      return;
    }

    const terakhir = daftar.slice(-10).reverse();
    const baris = terakhir.map((item, idx) => {
      const tanda = item.tipe === 'masuk' ? '+' : '-';
      return `${idx + 1}. [${tanda}] ${formatRupiah(item.nominal)} — ${item.keterangan} (${item.waktu})`;
    });

    await msg.reply(`🧾 *10 TRANSAKSI TERAKHIR*\n\n${baris.join('\n')}`);
  }
});

client.initialize();