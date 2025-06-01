let eventHighlightMarker = null;
let allEvents = [];
const EVENT_JSON = "../json/travel_taipei.json";


function getMapInstance() {
    return window.map;
}


async function fetchAllEvents() {
    if (allEvents.length) return;
    try {
        const res = await fetch(EVENT_JSON);
        allEvents = await res.json();
    } catch {
        allEvents = [];
    }
}


function isEventInMapView(ev, mapInstance) {
    if (!mapInstance) return true;
    if (typeof ev.lat === "undefined" || typeof ev.lng === "undefined") return false;
    const latlng = L.latLng(ev.lat, ev.lng);
    return mapInstance.getBounds().contains(latlng);
}

function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}


function renderEventCards(events) {
    const container = document.getElementById("event-content");
    if (!events.length) {
        container.innerHTML = "<p>目前畫面內無符合條件的活動。</p>";
        // 也移除 marker
        if (eventHighlightMarker && getMapInstance()) {
            getMapInstance().removeLayer(eventHighlightMarker);
            eventHighlightMarker = null;
        }
        return;
    }
    container.innerHTML = events.map((ev, idx) => `
    <div class="event-card" id="event-card-${idx}" style="border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:6px;position:relative;transition:box-shadow 0.2s;">
      <a href="${escapeHtml(ev["活動連結"] || ev["url"] || "#")}" target="_blank"><img src="${escapeHtml(ev["封面照片"] || ev["img"] || "")}" alt="${escapeHtml(ev["活動名稱"] || ev["title"] || "")}" style="width:100%;object-fit:cover;max-height:120px;border-radius:4px;"></a>
      <h4 style="margin:0.5em 0 0.2em 0;">${escapeHtml(ev["活動名稱"] || ev["title"] || "無標題")}</h4>
      <p style="margin:0.2em 0;"><b>時間：</b>${escapeHtml(ev["活動時間"] || ev["date"] || "")}</p>
      <p style="margin:0.2em 0;"><b>地點：</b>${escapeHtml(ev["舉辦地點"] || ev["location"] || "")}</p>
      <button class="event-locate-btn" data-lat="${ev.lat}" data-lng="${ev.lng}" data-title="${escapeHtml(ev["活動名稱"] || ev["title"] || "")}" style="margin-bottom:0.5em;">查看地點</button>
      <div class="event-intro" style="max-height:3.2em;overflow:hidden;transition:max-height 0.3s;" id="event-intro-${idx}">
        ${escapeHtml(ev["活動簡介"] || ev["description"] || "")}
      </div>
      <button class="event-more-btn" data-idx="${idx}" style="margin-top:0.4em;display:inline-block;">閱讀更多</button>
    </div>
  `).join("");


    container.querySelectorAll('.event-locate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const title = this.dataset.title || "活動地點";
            const mapInstance = getMapInstance();
            if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
                mapInstance.flyTo([lat, lng], 17, { duration: 1.2 });
                // 移除舊 marker
                if (eventHighlightMarker) {
                    mapInstance.removeLayer(eventHighlightMarker);
                }
                // 建立綠色 marker
                const greenIcon = L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    shadowSize: [41, 41],
                    className: 'leaflet-marker-green'
                });
                eventHighlightMarker = L.marker([lat, lng], { icon: greenIcon })
                    .addTo(mapInstance)
                    .bindPopup(title)
                    .openPopup();
            }
        });
    });


    container.querySelectorAll('.event-more-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = this.dataset.idx;
            const introDiv = document.getElementById(`event-intro-${idx}`);
            const cardDiv = document.getElementById(`event-card-${idx}`);
            if (introDiv.style.maxHeight === 'none') {
                introDiv.style.maxHeight = '3.2em';
                btn.textContent = "閱讀更多";
                cardDiv.style.boxShadow = "";
                cardDiv.style.zIndex = "";
            } else {
                introDiv.style.maxHeight = 'none';
                btn.textContent = "收合";
                cardDiv.style.boxShadow = "0 4px 24px 0 rgba(0,0,0,0.18)";
                cardDiv.style.zIndex = "11";
            }
        });
    });
}


async function loadEventsNow() {
    await fetchAllEvents();
    const mapInstance = getMapInstance();
    const events = allEvents.filter(ev => isEventInMapView(ev, mapInstance));
    renderEventCards(events);
}


function updateEventsOnMapMove() {
    loadEventsNow();
}


document.addEventListener("DOMContentLoaded", function() {
    loadEventsNow();
    let retryCount = 0;
    let interval = setInterval(() => {
        const mapInstance = getMapInstance();
        if (mapInstance) {
            mapInstance.on("moveend", updateEventsOnMapMove);
            clearInterval(interval);
        }
        if (++retryCount > 30) clearInterval(interval);
    }, 150);
});
