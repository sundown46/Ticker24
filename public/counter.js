// Token aus URL auslesen
function getToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }
  
  async function loadTeamsForLane() {
    const token = getToken();
    const response = await fetch(`/api/lane/${token}`);
    if (!response.ok) {
      document.getElementById('lane-info').textContent = '❌ Ungültiges Token!';
      return;
    }
  
    const laneData = await response.json();
    const laneInfo = document.getElementById('lane-info');
    laneInfo.textContent = `🏊‍♂️ Bahn ${laneData.lane}`;
  
    const teamButtons = document.getElementById('team-buttons');
    laneData.teams.forEach(team => {
      const btn = document.createElement('button');
      btn.textContent = `${team.name} (+1)`;
      btn.style.backgroundColor = team.color;
      btn.style.color = '#fff';
      btn.style.fontSize = '1.5rem';
      btn.style.padding = '1rem';
      btn.style.margin = '0.5rem';
      btn.style.border = 'none';
      btn.style.borderRadius = '10px';
      btn.style.boxShadow = '0 0 5px #000';
  
      btn.addEventListener('click', async () => {
        const originalColor = btn.style.backgroundColor;
        const status = document.getElementById('status');
      
        try {
          const res = await fetch(`/api/increment/${encodeURIComponent(team.name)}?token=${token}`, {
            method: 'POST'
          });
      
          if (res.ok) {
            const json = await res.json();
            status.textContent = `✅ ${json.team}: ${json.newCount} Bahnen`;
            status.style.color = 'green';
      
            // Button kurz grün blinken lassen
            btn.style.backgroundColor = 'limegreen';
            setTimeout(() => {
              btn.style.backgroundColor = originalColor;
            }, 300);
          } else {
            status.textContent = `❌ Fehler beim Zählen`;
            status.style.color = 'red';
      
            // Button kurz rot blinken lassen
            btn.style.backgroundColor = 'crimson';
            setTimeout(() => {
              btn.style.backgroundColor = originalColor;
            }, 500);
          }
        } catch (err) {
          status.textContent = `❌ Netzwerkfehler`;
          status.style.color = 'red';
      
          btn.style.backgroundColor = 'crimson';
          setTimeout(() => {
            btn.style.backgroundColor = originalColor;
          }, 500);
        }
      });
      
  
      teamButtons.appendChild(btn);
    });
  }
  
  loadTeamsForLane();
  