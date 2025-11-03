// services/pagarme.js

const axios = require('axios');

const API_KEY = process.env.PAGARME_API_KEY;
const encodedApiKey = Buffer.from(`${API_KEY}:`).toString('base64');

const pagarme = axios.create({
  baseURL: 'https://api.pagar.me/core/v5',
  headers: {
    'Authorization': `Basic ${encodedApiKey}`,
    'Content-Type': 'application/json'
  }
});

// --- VERSÃO FINAL E CORRIGIDA DA FUNÇÃO ---
async function createPixOrder({ amountInCents, customer, metadata }) {
  const body = {
    customer: customer,
    items: [
      {
        amount: amountInCents,
        description: "Agendamento de Consulta",
        quantity: 1
      }
    ],
    // --- NOME DO CAMPO CORRIGIDO DE "charges" PARA "payments" ---
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: 3600 // QR Code expira em 1 hora
        }
        // O metadata da cobrança pode ser colocado aqui, se necessário,
        // mas o metadata do pedido principal já é suficiente.
      }
    ]
    // O metadata principal do pedido é enviado aqui, se necessário.
    // metadata: metadata 
  };

  // Adicionamos um log para ver exatamente o que está sendo enviado
  console.log('Enviando para o Pagar.me:', JSON.stringify(body, null, 2));

  const res = await pagarme.post('/orders', body);
  return res.data;
}

async function getOrder(orderId) {
  const res = await pagarme.get(`/orders/${orderId}`);
  return res.data;
}

module.exports = { createPixOrder, getOrder };
