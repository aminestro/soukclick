/**
 * Souk Click Google Sheets COD order webhook.
 *
 * Paste this file into Google Apps Script from the target Sheet.
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * Backend env:
 * ORDER_WEBHOOK_ENABLED=true
 * ORDER_WEBHOOK_URL=https://script.google.com/macros/s/...
 */

const SHEET_NAME = "Orders";

const HEADERS = [
  "order_id",
  "internal_id",
  "created_at",
  "updated_at",
  "customer_name",
  "phone_raw",
  "phone_normalized",
  "city",
  "address",
  "products",
  "quantities",
  "offer_selected",
  "upsell_status",
  "upsell_items",
  "items_json",
  "subtotal",
  "delivery_fee",
  "discount_total",
  "total",
  "currency",
  "payment_method",
  "order_status",
  "confirmation_status",
  "webhook_status",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "ttclid",
  "sc_click_id",
  "ip_address",
  "ip_country",
  "is_vpn",
  "is_proxy",
  "is_hosting",
  "user_agent",
  "fraud_status",
  "fraud_score",
  "fraud_flags",
  "fraud_reason",
  "notes",
];

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const sheet = getSheet();
    ensureHeaders(sheet);
    sheet.appendRow(HEADERS.map((key) => valueFor(payload, key)));

    return jsonResponse({ ok: true, order_id: payload.order_id || null });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing POST body");
  }

  return JSON.parse(e.postData.contents);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = firstRow.some(Boolean);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function valueFor(payload, key) {
  if (key === "items_json") {
    return JSON.stringify(payload.items || []);
  }

  const value = payload[key];

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value === null || value === undefined ? "" : value;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
