/**
 * 100xFounder → Google Sheet: receives leads from the article unlock forms.
 *
 * A standalone project (script.google.com → New project), so it never touches
 * the CRM script already bound to the sheet. It writes only to the
 * "100xfounder" tab of the Website CRM OS sheet.
 *
 * Setup (once): paste this file, Save, then Deploy → New deployment → Web app → Execute as: Me, Who has
 * access: Anyone → Deploy, and authorise. Copy the Web app URL
 * (https://script.google.com/macros/s/…/exec) into 100xFounder → Settings →
 * "Google Sheet for form leads".
 *
 * Every lead stays in WordPress (Leads) too; the sheet is a copy.
 */
var SHEET_ID = '1gwznWhPkcu6AzV0DHgC_bhA36CH0NdvGwrEOFfD2Id0';
var TAB = '100xfounder';
var HEADERS = ['Time', 'Name', 'Email', 'Phone', 'Institution', 'List', 'Page',
  'Digihandler may contact', 'Newsletter', 'Consent (request)', 'Consent (partner)'];
var KEYS = ['time', 'name', 'email', 'phone', 'institution', 'list', 'page',
  'partner_contact', 'newsletter', 'consent', 'partner_consent'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    if (!data.email) {
      return out({ ok: false });
    }
    var book = SpreadsheetApp.openById(SHEET_ID);
    var sheet = book.getSheetByName(TAB) || book.insertSheet(TAB);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(KEYS.map(function (k) {
      var v = String(data[k] == null ? '' : data[k]).slice(0, 500);
      return /^[=+\-@]/.test(v) ? "'" + v : v; // never let a lead's text run as a formula
    }));
    return out({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
