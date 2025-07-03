const express = require('express');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode'); // 📱 QR-Code-Generator
const app = express();
const port = 3000;

const EVENT_FILE = './event.json'; // Event-Definition (Teams, Farben, Bahnen)
const DATA_FILE = './data.json';   // Aktueller Zählerstand (pro Team)

// 📖 Event-Daten laden
function readEvent() {
  try {
    const raw = fs.readFileSync(EVENT_FILE);
    return JSON.parse(raw);
  } catch (err) {
    console.error('Fehler beim Lesen von event.json:', err);
    return {
      eventName: '',
      colors: [],
      teams: [],
      lanes: []
    };
  }
}

// 💾 Event-Daten speichern
function writeEvent(data) {
  fs.writeFileSync(EVENT_FILE, JSON.stringify(data, null, 2));
}

// 📖 Zählerstände laden
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
  } catch (err) {
    console.error('Fehler beim Lesen von data.json:', err);
    return {};
  }
}

// 💾 Zählerstände speichern
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());               // JSON-Body-Parser aktivieren
app.use(express.static('public'));    // 📁 public-Ordner für statische Dateien

// 🏊 API: Teams einer Bahn anhand Token abrufen
app.get('/api/lane/:token', (req, res) => {
  const token = req.params.token;
  const eventData = readEvent(); // immer aktuell lesen

  const lane = eventData.lanes.find(l => l.helperToken === token);
  if (!lane) {
    return res.status(404).json({ error: 'Ungültiges Token' });
  }

  const teamsOnLane = eventData.teams.filter(t => t.lane === lane.number);
  res.json({
    lane: lane.number,
    teams: teamsOnLane
  });
});

// 🏊 API: Eine Bahn für ein Team zählen
app.post('/api/increment/:team', (req, res) => {
  const team = req.params.team;
  const token = req.query.token;
  const eventData = readEvent(); // immer aktuell lesen

  // 🛡️ Prüfen: Token gehört zur Bahn des Teams?
  const lane = eventData.lanes.find(l => l.helperToken === token);
  const allowedTeams = eventData.teams.filter(t => t.lane === lane?.number).map(t => t.name);

  if (!lane || !allowedTeams.includes(team)) {
    return res.status(403).json({ error: 'Ungültiges Token oder kein Zugriff auf dieses Team' });
  }

  const data = readData();
  if (!(team in data)) {
    return res.status(404).json({ error: `Team "${team}" nicht gefunden.` });
  }

  data[team]++;
  writeData(data);

  res.json({ team, newCount: data[team] });
});

// 📊 API: Alle Zählerstände abrufen (für Dashboard)
app.get('/api/teams', (req, res) => {
  const data = readData();
  res.json(data);
});

// 📋 API: Aktuelle Event-Daten abrufen (für Admin)
app.get('/api/event', (req, res) => {
  const eventData = readEvent();
  res.json(eventData);
});

// 💾 API: Event-Daten speichern (für Admin)
app.post('/api/event', (req, res) => {
  const eventData = req.body;
  writeEvent(eventData);

  // Prüfen: Existieren alle Teams im Zähler-File?
  const data = readData();
  eventData.teams.forEach(team => {
    if (!(team.name in data)) {
      data[team.name] = 0; // Neues Team hinzufügen mit 0 Bahnen
    }
  });
  writeData(data);

  res.json({ success: true });
});

// 🗑️ API: Team löschen (für Admin)
app.delete('/api/team/:team', (req, res) => {
  const teamName = req.params.team;
  const eventData = readEvent();

  // Team aus event.json entfernen
  eventData.teams = eventData.teams.filter(t => t.name !== teamName);
  writeEvent(eventData);

  // Team aus data.json entfernen
  const data = readData();
  delete data[teamName];
  writeData(data);

  res.json({ success: true });
});

// 🆕 API: Event zurücksetzen (neue Tokens + Zählerstände auf 0)
app.post('/api/reset', (req, res) => {
  const eventData = readEvent();

  // Neue Tokens für alle Bahnen generieren
  eventData.lanes.forEach(lane => {
    lane.helperToken = Math.random().toString(36).substring(2, 10);
  });

  // Zählerstände auf 0 zurücksetzen
  const data = {};
  eventData.teams.forEach(team => {
    data[team.name] = 0;
  });

  writeEvent(eventData);
  writeData(data);

  res.json({ success: true });
});

// 📱 API: QR-Code für einen Token generieren
app.get('/api/qrcode/:token', async (req, res) => {
  const token = req.params.token;
  const url = `${req.protocol}://${req.get('host')}/counter.html?token=${token}`;

  try {
    const qrCode = await qrcode.toDataURL(url);
    const img = Buffer.from(qrCode.split(",")[1], 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length
    });
    res.end(img);
  } catch (err) {
    console.error('QR-Code-Fehler:', err);
    res.status(500).send('QR-Code konnte nicht erstellt werden');
  }
});

// Server starten
app.listen(port, () => {
  console.log(`✅ Liveticker läuft auf http://localhost:${port}`);
});
