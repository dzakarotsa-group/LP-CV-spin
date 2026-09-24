/*
  Castila Village backend for Google Apps Script.
  Create sheets named "Config", "Leads", and "Admins", then deploy as Web app.
  Add allowed Google email addresses to the Admins sheet.
*/
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Config')) {
    const sheet = ss.insertSheet('Config');
    sheet.appendRow(['key', 'value']);
    const defaults = {
      name: 'Castila Village',
      location: 'Perak - Jombang',
      phone: '628123456789',
      promos1: JSON.stringify(['Gratis biaya akad', 'DP ringan mulai 5%', 'Gratis kanopi rumah', 'Cashback Rp5 juta', 'Voucher furniture']),
      promos2: JSON.stringify(['Free biaya KPR', 'Gratis pagar rumah', 'Bonus kitchen set', 'Gratis AJB & SHM', 'Subsidi angsuran 3 bulan', 'Voucher pindahan']),
      chatTemplate: 'Halo Admin Castila Village, saya {nama} ({nomor}) dari {alamat}. Saya mau ambil promo {promo1} dan {promo2} yang saya dapat dari spin promo. Mohon info selanjutnya ya.'
    };
    Object.keys(defaults).forEach(key => sheet.appendRow([key, defaults[key]]));
  }
  if (!ss.getSheetByName('Leads')) {
    ss.insertSheet('Leads').appendRow(['createdAt', 'name', 'phone', 'address', 'promo1', 'promo2']);
  }
  if (!ss.getSheetByName('Admins')) {
    ss.insertSheet('Admins').appendRow(['email']);
  }
}

function doGet(e) {
  const p = e.parameter || {};
  if (!p.action) return adminPage_();
  let result;
  if (p.action === 'config') result = { ok: true, config: readConfig_() };
  else if (p.action === 'leads') result = authorized_() ? { ok: true, leads: readLeads_() } : { ok: false, error: 'Unauthorized' };
  else result = { ok: true, service: 'Castila Village API' };
  return jsonp_(result, p.callback);
}

function doPost(e) {
  let p;
  try {
    p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return jsonp_({ ok: false, error: 'Payload JSON tidak valid' }, e && e.parameter && e.parameter.callback);
  }
  let result;
  if (p.action === 'lead') result = saveLead_(p.lead);
  else if (p.action === 'saveConfig') result = authorized_() ? saveConfig_(p.config) : { ok: false, error: 'Unauthorized' };
  else result = { ok: false, error: 'Unknown action' };
  return jsonp_(result, p.callback);
}

function authorized_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Admins');
  if (!email || !sheet || sheet.getLastRow() < 1) return false;
  return sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues()
    .flat()
    .map(value => String(value).trim().toLowerCase())
    .filter(value => value && value !== 'email')
    .includes(email);
}

function adminPage_() {
  if (!authorized_()) {
    return HtmlService.createHtmlOutput('<h2>Akses admin ditolak</h2><p>Login dengan akun Google yang sudah terdaftar di sheet Admins.</p>')
      .setTitle('Castila Village Admin');
  }
  return HtmlService.createTemplateFromFile('AdminUI').evaluate().setTitle('Castila Village Admin');
}

function readConfig_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet || sheet.getLastRow() < 2) return {};
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const config = {};
  values.forEach(row => {
    if (row[0]) {
      try { config[row[0]] = ['promos1', 'promos2'].includes(row[0]) ? JSON.parse(row[1]) : row[1]; }
      catch (error) { config[row[0]] = row[1]; }
    }
  });
  return config;
}

function readConfigForAdmin() {
  if (!authorized_()) throw new Error('Unauthorized');
  return readConfig_();
}

function saveConfigForAdmin(config) {
  if (!authorized_()) throw new Error('Unauthorized');
  return saveConfig_(config);
}

function uploadImageForAdmin(dataUrl, fileName) {
  if (!authorized_()) throw new Error('Unauthorized');
  if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.length > 7 * 1024 * 1024) {
    throw new Error('Ukuran gambar terlalu besar (maksimal 5 MB)');
  }
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Format gambar tidak valid');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(match[1].toLowerCase())) throw new Error('Format gambar harus JPG, PNG, atau WEBP');
  const bytes = Utilities.base64Decode(match[2]);
  if (bytes.length > 5 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 5 MB');
  const safeName = String(fileName || 'castila-greeting-image')
    .replace(/[^\w.\- ]/g, '_')
    .slice(0, 100);
  const blob = Utilities.newBlob(bytes, match[1], safeName || 'castila-greeting-image');
  const file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
}

function saveConfig_(config) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet) throw new Error('Sheet Config belum tersedia. Jalankan setup() terlebih dahulu.');
  if (!config || !String(config.name || '').trim() || !String(config.location || '').trim() ||
      !String(config.phone || '').trim() || !String(config.chatTemplate || '').trim()) {
    throw new Error('Nama, lokasi, nomor WhatsApp, dan format chat wajib diisi');
  }
  if (!Array.isArray(config.promos1) || config.promos1.length !== 5 ||
      !Array.isArray(config.promos2) || config.promos2.length !== 6) {
    throw new Error('Spin promo harus berisi tepat 5 dan 6 pilihan');
  }
  const allowedKeys = ['name', 'location', 'phone', 'promos1', 'promos2', 'chatTemplate', 'image'];
  Object.keys(config || {}).filter(key => allowedKeys.includes(key)).forEach(key => {
    const keys = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues().flat();
    const rowIndex = keys.findIndex(value => String(value).trim() === key);
    const value = ['promos1', 'promos2'].includes(key) ? JSON.stringify(config[key]) : config[key];
    if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 2).setValue(value);
    else sheet.appendRow([key, value]);
  });
  return { ok: true, config: readConfig_() };
}

function saveLead_(lead) {
  if (!lead || !lead.name || !lead.phone || !lead.address || !lead.promo1 || !lead.promo2) return { ok: false, error: 'Data lead tidak lengkap' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) return { ok: false, error: 'Sheet Leads belum tersedia. Jalankan setup() terlebih dahulu.' };
  sheet.appendRow([
    lead.createdAt || new Date().toISOString(), lead.name, lead.phone, lead.address, lead.promo1, lead.promo2
  ]);
  return { ok: true };
}

function readLeads_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues().map(row => ({
    createdAt: row[0], name: row[1], phone: row[2], address: row[3], promo1: row[4], promo2: row[5]
  }));
}

function jsonp_(data, callback) {
  const payload = JSON.stringify(data);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${payload})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}
