const statusEl = document.getElementById('status');

function setStatus(msg) { statusEl.textContent = msg; }

const map = L.map('map', { zoomControl: true });

// Bạn chỉnh center/zoom theo khu bạn render tiles
map.setView([21.0285, 105.8542], 13); // Hanoi demo

// Tiles local (đã extract từ MBTiles)
const tiles = L.tileLayer('./tiles/{z}/{x}/{y}.png', {
  minZoom: 0,
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
});
tiles.addTo(map);

// đăng ký service worker để offline sau lần mở đầu
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    setStatus('SW ready (offline cache enabled)');
  }).catch(err => {
    console.error(err);
    setStatus('SW failed');
  });
} else {
  setStatus('No service worker');
}
