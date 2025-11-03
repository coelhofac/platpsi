const express = require('express');
const router = express.Router();
const { getFreeBusy } = require('../source/calendarClient'); // Ajuste o caminho se necessário
const { createPixOrder } = require('../services/pagarme'); // Ajuste o caminho se necessário

// Defina seus profissionais aqui com o ID real da agenda do Google Calendar
const professionals = [
  { id: 'cibele', name: 'Cibele', calendarId: '56782c759cbd259f772f2f43a29d9f7f37c386d767e36d2c1119ef97a8bab626@group.calendar.google.com' },
  { id: 'gustavo', name: 'Gustavo', calendarId: 'gustavo_google_calendar_id@group.calendar.google.com' },
  { id: 'bruna', name: 'Bruna', calendarId: 'bruna_google_calendar_id@group.calendar.google.com' },
  { id: 'lucas', name: 'Lucas', calendarId: 'lucas_google_calendar_id@group.calendar.google.com' }
];

router.get('/professionals', (_req, res) => {
  res.json(professionals);
});

router.get('/availability', async (req, res) => {
  try {
    const { professionalId, date } = req.query;
    const professional = professionals.find(p => p.id === professionalId);

    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const dayStart = new Date(`${date}T09:00:00-03:00`);
    const dayEnd = new Date(`${date}T18:00:00-03:00`);

    const calendarData = await getFreeBusy([professional.calendarId], dayStart.toISOString(), dayEnd.toISOString());
    const busySlots = calendarData[professional.calendarId]?.busy || [];

    const availableSlots = [];
    const slotDuration = 60 * 60 * 1000; // 1 hora em milissegundos

    for (let time = dayStart.getTime(); time < dayEnd.getTime(); time += slotDuration) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time + slotDuration);

      const isBusy = busySlots.some(busy =>
        (new Date(busy.start) < slotEnd) && (new Date(busy.end) > slotStart)
      );

      if (!isBusy) {
        availableSlots.push({ start: slotStart.toISOString() });
      }
    }
    res.json(availableSlots);
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({ error: 'Falha ao buscar horários.' });
  }
});

// Em routes/index.js

router.post('/checkout/pix', async (req, res) => {
  try {
    const { amountInCents, customer, metadata } = req.body;
    const order = await createPixOrder({ amountInCents, customer, metadata });

    // --- CORREÇÃO FINAL AQUI ---
    // O caminho correto para os dados do Pix na resposta do Pagar.me v5
    const pixData = order.charges[0].last_transaction;

    if (!pixData || !pixData.qr_code || !pixData.qr_code_url) {
      throw new Error('A resposta da API do Pagar.me não continha os dados do Pix.');
    }
    
    // Extraindo a imagem base64 do qr_code_url
    // O Pagar.me retorna uma URL para a imagem do QR Code. Vamos convertê-la para base64.
    const qrCodeUrl = pixData.qr_code_url;
    // Para simplificar, vamos enviar o "copia e cola" e deixar a imagem para um próximo passo,
    // ou você pode usar uma biblioteca para gerar o QR a partir do `qr_code`.

    res.json({
      // Para o QR Code, a forma mais robusta é gerar no frontend a partir do "copia e cola"
      qrCodePayload: pixData.qr_code, 
      pixCopyPaste: pixData.qr_code
    });

  } catch (error) {
    console.error('================ ERRO NO CHECKOUT PAGAR.ME ================');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Erro desconhecido:', error.message);
    }
    console.error('============================================================');
    
    res.status(500).json({ error: 'Falha ao gerar o Pix.' });
  }
});


module.exports = router;
