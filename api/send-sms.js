// api/send-sms.js
// CellX (smsgw.in) se transactional SMS bhejta hai

const CELLX_USERNAME = 'Numberwale03';
const CELLX_PASSWORD = process.env.CELLX_PASSWORD;
const CELLX_SENDER   = 'WWIRES';
const CELLX_PE_ID    = '1705168743850569290';

// ── DLT Template IDs — STPL se approved Template ID daalo ──────────────────
const TEMPLATES = {
  order_confirm:  process.env.CELLX_TMPL_ORDER_CONFIRM,   // "Your order {#var#} of Rs.{#var#} is confirmed!..."
  order_delivered: process.env.CELLX_TMPL_ORDER_DELIVERED, // "Your order {#var#} has been delivered..."
  otp:            '1707177547575914691',                    // Already approved
};

const ALLOWED_ORIGINS = [
  process.env.SITE_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalisePhone(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function sendViaCellX(to, message, templateId) {
  const toNumber   = normalisePhone(to);
  const encoded    = encodeURIComponent(message);
  const url = `https://web.smsgw.in/smsapi/httpapi.jsp` +
    `?username=${CELLX_USERNAME}` +
    `&password=${CELLX_PASSWORD}` +
    `&from=${CELLX_SENDER}` +
    `&to=${toNumber}` +
    `&text=${encoded}` +
    `&pe_id=${CELLX_PE_ID}` +
    `&template_id=${templateId}` +
    `&coding=0`;

  const r    = await fetch(url);
  const text = await r.text();

  if (text.includes('ErrorCode') || text.includes('<e>')) {
    throw new Error(`CellX error: ${text}`);
  }
  return text;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { to, type, orderNum, total, name } = req.body ?? {};
  if (!to || !type) return res.status(400).json({ error: 'to and type required' });

  try {
    let message, templateId;

    if (type === 'order_confirm') {
      // DLT template: "Your order {#var#} of Rs.{#var#} is confirmed! Track: wavesandwires.in - WWIRES"
      message    = message = `Your order no. ${orderNum} of Rs.${total} is confirmed! Track: https://wavesandwires.in/ - WWIRES`;;
      templateId = TEMPLATES.order_confirm;

    } else if (type === 'order_delivered') {
      // DLT template: "Your order {#var#} has been delivered. Thank you for shopping with Waves & Wires! - WWIRES"
      message    = `Your order no. ${orderNum} has been delivered. Thank you for shopping with Waves & Wires! - WWIRES`
      templateId = TEMPLATES.order_delivered;

    } else {
      return res.status(400).json({ error: `Unknown SMS type: ${type}` });
    }

    if (!templateId) {
      console.warn(`[send-sms] Template ID missing for type: ${type}`);
      return res.status(500).json({ error: 'Template ID not configured in env' });
    }

    await sendViaCellX(to, message, templateId);
    console.log(`[send-sms] ${type} sent to ${to}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[send-sms Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Server-side direct call (webhook ke liye) ─────────────────────────────────
// Import karke directly call karo — no HTTP round-trip
export async function sendSmsServer(to, type, { orderNum, total } = {}) {
  try {
    let message, templateId;

    if (type === 'order_confirm') {
      message    = `Your order ${orderNum} of Rs.${total} is confirmed! Track: wavesandwires.in - WWIRES`;
      templateId = TEMPLATES.order_confirm;
    } else if (type === 'order_delivered') {
      message    = `Your order ${orderNum} has been delivered. Thank you for shopping with Waves & Wires! - WWIRES`;
      templateId = TEMPLATES.order_delivered;
    } else {
      throw new Error(`Unknown SMS type: ${type}`);
    }

    if (!templateId) throw new Error(`Template ID missing for: ${type}`);
    await sendViaCellX(to, message, templateId);
    console.log(`[sendSmsServer] ${type} sent to ${to}`);
  } catch (err) {
    console.error('[sendSmsServer Error]', err.message);
    // Fire-and-forget — don't throw
  }
}