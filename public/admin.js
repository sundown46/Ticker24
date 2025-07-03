// Hilfsfunktionen
async function fetchEvent() {
    const res = await fetch('/api/event');
    return await res.json();
  }
  
  async function saveEvent(data) {
    await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
  
  async function deleteTeam(teamName) {
    if (!confirm(`Team "${teamName}" wirklich löschen?`)) return;
    await fetch(`/api/team/${encodeURIComponent(teamName)}`, { method: 'DELETE' });
    loadAdmin();
  }
  
  async function resetEvent() {
    if (!confirm('⚠️ Das Event wirklich zurücksetzen und alle Zählstände löschen?')) return;
    await fetch('/api/reset', { method: 'POST' });
    loadAdmin();
  }
  
  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    alert('📋 Link kopiert!');
  }
  
  function showQR(token) {
    const modal = document.getElementById('qr-modal');
    const img = document.getElementById('qr-code');
    img.src = `/api/qrcode/${token}`;
    modal.style.display = 'block';
  }
  
  // Admin laden
  async function loadAdmin() {
    const data = await fetchEvent();
  
    // Eventname
    document.getElementById('event-name').value = data.eventName;

// Farben anzeigen
const colorList = document.getElementById('color-list');
colorList.innerHTML = '';
data.colors.forEach(color => {
  const li = document.createElement('li');
  li.innerHTML = `<span style="display:inline-block;width:20px;height:20px;background:${color};border:1px solid #ccc;margin-right:5px;"></span> ${color}`;
  const delBtn = document.createElement('button');
  delBtn.textContent = '❌';
  delBtn.onclick = async () => {
    if (!confirm(`Farbe "${color}" löschen?`)) return;
    data.colors = data.colors.filter(c => c !== color);
    await saveEvent(data);
    loadAdmin();
  };
  li.appendChild(delBtn);
  colorList.appendChild(li);
});

// Neue Farben Dropdown aktualisieren
const colorSelect = document.getElementById('new-team-color');
colorSelect.innerHTML = '';
data.colors.forEach(color => {
  const opt = document.createElement('option');
  opt.value = color;
  opt.textContent = color;
  colorSelect.appendChild(opt);
});

// Typische Farbe hinzufügen
document.getElementById('add-preset-color').onclick = async () => {
  const selected = document.getElementById('preset-colors').value;
  if (selected && !data.colors.includes(selected)) {
    data.colors.push(selected);
    await saveEvent(data);
    loadAdmin();
  }
};

// Individuelle Farbe hinzufügen
document.getElementById('add-custom-color').onclick = async () => {
  const selected = document.getElementById('custom-color').value;
  if (selected && !data.colors.includes(selected)) {
    data.colors.push(selected);
    await saveEvent(data);
    loadAdmin();
  }
};
  
    // Teams
    const teamList = document.getElementById('team-list');
    teamList.innerHTML = '';
    data.teams.forEach(team => {
      const tr = document.createElement('tr');
  
      const nameTd = document.createElement('td');
      nameTd.textContent = team.name;
      tr.appendChild(nameTd);
  
      const colorTd = document.createElement('td');
      colorTd.textContent = team.color;
      tr.appendChild(colorTd);
  
      const laneTd = document.createElement('td');
      laneTd.textContent = team.lane;
      tr.appendChild(laneTd);
  
      const actionTd = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.textContent = '❌';
      delBtn.onclick = () => deleteTeam(team.name);
      actionTd.appendChild(delBtn);
      tr.appendChild(actionTd);
  
      teamList.appendChild(tr);
    });
  
    // Bahnen
    const laneList = document.getElementById('lane-list');
    laneList.innerHTML = '';
    data.lanes.forEach(lane => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>Bahn ${lane.number}</strong> – Token: ${lane.helperToken}
        <button onclick="copyToClipboard('${window.location.origin}/counter.html?token=${lane.helperToken}')">📋 Copy-Link</button>
        <button onclick="showQR('${lane.helperToken}')">📱 QR-Code</button>
      `;
      laneList.appendChild(li);
    });
  
    // Neue Team-Bahn Dropdown
    const laneSelect = document.getElementById('new-team-lane');
    laneSelect.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Bahn ${i}`;
      laneSelect.appendChild(opt);
    }
  
    // Save Eventname
    document.getElementById('save-event-name').onclick = async () => {
      data.eventName = document.getElementById('event-name').value;
      await saveEvent(data);
      alert('✅ Eventname gespeichert');
    };
  
  
    // Add Team
    document.getElementById('add-team').onclick = async () => {
      const name = document.getElementById('new-team-name').value.trim();
      const color = document.getElementById('new-team-color').value;
      const lane = parseInt(document.getElementById('new-team-lane').value);
  
      if (name && color && lane) {
        data.teams.push({ name, color, lane });
        await saveEvent(data);
        loadAdmin();
      }
    };
  
    // Reset Event
    document.getElementById('reset-event').onclick = resetEvent;
  }
  
  // QR Modal schließen
  document.querySelector('.close-btn').onclick = () => {
    document.getElementById('qr-modal').style.display = 'none';
  };
  
  // Laden
  loadAdmin();
  