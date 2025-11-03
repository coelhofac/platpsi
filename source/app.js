// app.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirva sua pasta "theme" como site estático (mantém o design)
app.use(express.static(path.join(__dirname, 'theme')));

// Rotas da API (implementar abaixo)
app.use('/api', require('./routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
