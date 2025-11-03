require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir seu site (theme/) preservando design
app.use(express.static(path.join(__dirname, 'theme')));

// Rotas de API
app.use('/api', require('./routes'));
app.use('/api/webhooks', require('./routes/pagarme'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
