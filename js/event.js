let eventMark = null;
let allEvents = [];
const eventjs = "json/travel_taipei.json";

function getMap() {
    return window.map;
}

async function infoEvents() {
    if (allEvents.length) return;
    try {
        const res = await fetch(eventjs);
        allEvents = await res.json();
    } catch {
        allEvents = [];
    }
}

function EventView(ev, mapIns) {
    if (!mapIns) return true;
    if (typeof ev.lat === "undefined" || typeof ev.lng === "undefined") return false;
    const latlng = L.latLng(ev.lat, ev.lng);
    return mapIns.getBounds().contains(latlng);
}

function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

function Cards(events) {
    const container = document.getElementById("event-content");
    if (!events.length) {
        container.innerHTML = "<p>目前畫面內無符合條件的活動。</p>";
        // 也移除 marker
        if (eventMark && getMap()) {
            getMap().removeLayer(eventMark);
            eventMark = null;
        }
        return;
    }
    container.innerHTML = events.map((ev, idx) => `
    <div class="evcard" id="evcard-${idx}" style="border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:6px;position:relative;transition:box-shadow 0.2s;">
      <a href="${escapeHtml(ev["活動連結"] || ev["url"] || "#")}" target="_blank"><img src="${escapeHtml(ev["封面照片"] || ev["img"] || "")}" alt="${escapeHtml(ev["活動名稱"] || ev["title"] || "")}" style="width:100%;object-fit:cover;max-height:120px;border-radius:4px;"></a>
      <h4 style="margin:0.5em 0 0.2em 0;">${escapeHtml(ev["活動名稱"] || ev["title"] || "無標題")}</h4>
      <p style="margin:0.2em 0;"><b>時間：</b>${escapeHtml(ev["活動時間"] || ev["date"] || "")}</p>
      <p style="margin:0.2em 0;"><b>地點：</b>${escapeHtml(ev["舉辦地點"] || ev["location"] || "")}</p>
      <button class="evlocate" data-lat="${ev.lat}" data-lng="${ev.lng}" data-title="${escapeHtml(ev["活動名稱"] || ev["title"] || "")}" style="margin-bottom:0.5em;">查看地點</button>
      <div class="evintr" style="max-height:3.2em;overflow:hidden;transition:max-height 0.3s;" id="evintr-${idx}">
        ${escapeHtml(ev["活動簡介"] || ev["description"] || "")}
      </div>
      <button class="evmore" data-idx="${idx}" style="margin-top:0.4em;display:inline-block;">閱讀更多</button>
    </div>
  `).join("");

    container.querySelectorAll('.evlocate').forEach(btn => {
        btn.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const title = this.dataset.title || "活動地點";
            const mapIns = getMap();
            if (mapIns && !isNaN(lat) && !isNaN(lng)) {
                mapIns.flyTo([lat, lng], 17, { duration: 1.2 });
                // 移除舊 marker
                if (eventMark) {
                    mapIns.removeLayer(eventMark);
                }
                // 建立綠色 marker
                const greenIcon = L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    shadowSize: [41, 41],
                    className: 'marker'
                });
                eventMark = L.marker([lat, lng], { icon: greenIcon })
                    .addTo(mapIns)
                    .bindPopup(title)
                    .openPopup();
            }
        });
    });

    container.querySelectorAll('.evmore').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = this.dataset.idx;
            const introDiv = document.getElementById(`evintr-${idx}`);
            const cardDiv = document.getElementById(`evcard-${idx}`);
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

async function loadinfo() {
    await infoEvents();
    const mapIns = getMap();
    const events = allEvents.filter(ev => EventView(ev, mapIns));
    Cards(events);
}

function infoOnMap() {
    loadinfo();
}

document.addEventListener("DOMContentLoaded", function() {
    loadinfo();
    let retryCount = 0;
    let interval = setInterval(() => {
        const mapIns = getMap();
        if (mapIns) {
            mapIns.on("moveend", infoOnMap);
            clearInterval(interval);
        }
        if (++retryCount > 30) clearInterval(interval);
    }, 150);
});