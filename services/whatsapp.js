const axios = require('axios');
const WABA_TOKEN = process.env.WABA_TOKEN;
const WABA_PHONE_ID = process.env.WABA_PHONE_ID;

async function sendWhatsAppText(toE164, body) {
  const url = `https://graph.facebook.com/v20.0/${WABA_PHONE_ID}/messages`;
  const res = await axios.post(url, {
    messaging_product: 'whatsapp',
    to: toE164,
    type: 'text',
    text: { body }
  }, { headers: { Authorization: `Bearer ${WABA_TOKEN}` } });
  return res.data;
}

module.exports = { sendWhatsAppText };
