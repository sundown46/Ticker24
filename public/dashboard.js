let chart; // Chart.js-Instanz

async function fetchTeamData() {
  const res = await fetch('/api/teams');
  return await res.json();
}

async function fetchEventData() {
  const res = await fetch('/api/event');
  return await res.json();
}

async function updateChart() {
  const data = await fetchTeamData();
  const eventData = await fetchEventData();

  // Teams sortieren nach Anzahl Bahnen (absteigend)
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

  const labels = sorted.map(([team]) => team);
  const values = sorted.map(([_, count]) => count);

  // Farben anhand der Badekappenfarbe aus event.json setzen
  const colorMap = {};
  eventData.teams.forEach(team => {
    colorMap[team.name] = team.color;
  });

  const backgroundColors = labels.map(team => {
    let color = colorMap[team] || 'rgba(0, 200, 255, 0.8)'; // fallback
    if (color.toLowerCase() === 'schwarz' || color.toLowerCase() === 'black') {
      color = '#777'; // helleres Grau für schwarze Balken
    }
    return color;
  });

  if (!chart) {
    // Chart zum ersten Mal erstellen
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Anzahl Bahnen',
          data: values,
          backgroundColor: backgroundColors,
        }]
      },
      options: {
        indexAxis: 'y', // Horizontale Balken
        animation: {
          duration: 500,
        },
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.x} Bahnen`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Bahnen',
              color: '#ccc'
            }
          },
          y: {
            ticks: {
              color: '#fff'
            }
          }
        }
      }
    });
  } else {
    // Chart updaten
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = backgroundColors;
    chart.update();
  }
}

// Beim Laden + alle 5 Sekunden
updateChart();
setInterval(updateChart, 5000);
