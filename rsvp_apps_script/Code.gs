/**
 * Google Apps Script untuk form RSVP / Ucapan undangan.
 *
 * CARA PAKAI:
 * 1. Buat Google Spreadsheet baru (bebas namanya).
 * 2. Di spreadsheet: Extensions > Apps Script.
 * 3. Tempel semua kode ini, lalu SAVE.
 * 4. Ganti SPREADSHEET_ID di bawah dengan ID spreadsheet kamu
 *    (ID = bagian URL setelah /d/ dan sebelum /edit, misal:
 *     https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXX/edit
 *     -> ID-nya XXXXXX...).
 * 5. Deploy > New deployment > pilih type "Web app".
 *    - Execute as  -> "Me"
 *    - Who has access -> "Anyone" (atau "Anyone with link")
 *    lalu klik Deploy, izinkan akses, dan salin URL "Web app" -nya.
 * 6. URL itu tempel ke index.html menggantikan "__SCRIPT_URL__".
 *
 * Pada submit, otomatis mencatat tanggal & jam kirim (kolom pertama).
 */

var SPREADSHEET_ID = '1pey0-C97q1jWps4r0MlA7oW2Os4yOhvIbslGkS-ZIgc';
var SHEET_NAME = 'RSVP';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Tanggal & Jam Kirim', 'Nama', 'Kehadiran', 'Jumlah Tamu', 'Ucapan / Doa']);
    } else if (sheet.getLastRow() === 0) {
      // Pastikan header ada di baris pertama
      sheet.appendRow(['Tanggal & Jam Kirim', 'Nama', 'Kehadiran', 'Jumlah Tamu', 'Ucapan / Doa']);
    }

    var now = new Date();
    sheet.appendRow([
      Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      (data.nama || '').toString(),
      (data.kehadiran || '').toString(),
      (data.jumlahTamu || '').toString(),
      (data.ucapan || '').toString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doGet — untuk menampilkan daftar ucapan (dipanggil dari index.html
 * dengan fetch GET ke URL web app). Mengembalikan JSON array ucapan,
 * terbaru di urutan pertama.
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var list = [];

    if (sheet) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var range = sheet.getRange(2, 1, lastRow - 1, 5);
        var values = range.getValues();
        for (var i = values.length - 1; i >= 0; i--) {
          var row = values[i];
          var ucapan = (row[4] || '').toString().trim();
          var nama = (row[1] || '').toString().trim();
          if (nama || ucapan) {
            list.push({
              waktu: (row[0] || '').toString(),
              nama: nama,
              kehadiran: (row[2] || '').toString(),
              jumlahTamu: (row[3] || '').toString(),
              ucapan: ucapan
            });
          }
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', data: list }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Opsional: untuk test cepat di editor Apps Script (jalankan lalu lihat Log)
function testAppend() {
  var data = { nama: 'Contoh', kehadiran: 'Hadir', jumlahTamu: '2', ucapan: 'Selamat menempuh hidup baru!' };
  var fakeE = { postData: { contents: JSON.stringify(data) } };
  Logger.log(doPost(fakeE).getContent());
}
