const express = require('express');
const router = express.Router();
const { createEvent } = require('../source/calendarClient');
const { sendWhatsAppText } = require('../services/whatsapp');

router.post('/pagarme', async (req, res) => {
  try {
    const evt = req.body; // valide assinatura conforme sua política
    const type = evt?.type || evt?.event;
    if (type === 'order.paid') {
      const meta = evt?.data?.metadata || evt?.metadata || {};
      const { calendarId, summary, description, startISO, endISO, attendeeEmail, attendeePhone } = meta;

      const created = await createEvent({
        calendarId,
        summary,
        description,
        startISO,
        endISO,
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : []
      });

      if (attendeePhone) {
        await sendWhatsAppText(attendeePhone, `Reserva confirmada: ${summary} em ${new Date(startISO).toLocaleString()}`);
      }
      return res.json({ ok: true, eventId: created.id });
    }
    return res.json({ ignored: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'webhook_failed' });
  }
});

module.exports = router;
