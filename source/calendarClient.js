const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '../secrets/credentials.json');
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || path.join(__dirname, '../secrets/token.json');
const KEYFILEPATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../services/contadeserviçoconcordia.json');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

// Cria um cliente autenticado usando a Conta de Serviço
function getAuthClient() {
  return new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
}

function buildOAuthClient() {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  const { installed, web } = JSON.parse(content);
  const data = installed || web;
  const oAuth2Client = new google.auth.OAuth2(
    data.client_id,
    data.client_secret,
    // usar o primeiro redirect_uri das credenciais
    data.redirect_uris
  );
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));
  }
  return oAuth2Client;
}

async function generateAuthUrl() {
  const oAuth2Client = buildOAuthClient();
  return oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
}

async function exchangeCodeForToken(code) {
  const oAuth2Client = buildOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  oAuth2Client.setCredentials(tokens);
  return true;
}

async function getFreeBusy(calendarIds, timeMin, timeMax, timeZone = 'America/Sao_Paulo') {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone,
      items: calendarIds.map(id => ({ id })),
    },
  });
  return res.data.calendars;
}

async function createEvent({ calendarId, summary, description, startISO, endISO, attendees = [] }) {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary,
    description,
    start: { dateTime: startISO },
    end: { dateTime: endISO },
    attendees,
  };

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: 'all',
  });
  return res.data;
}

// As funções de OAuth não são mais necessárias
module.exports = { getFreeBusy, createEvent };