let exhibitMark = null;
let allExhibit = {
    coming: [],
    now: []
};
let currentState = "now"; // "now" or "coming"

function getMap() {
    return window.map;
}

async function infoExhibit() {
    if (allExhibit.now.length && allExhibit.coming.length) return;
    try {
        const [nowRes, comingRes] = await Promise.all([
            fetch("youbike/json/exhibitions_now_taipei.json"),
            fetch("youbike/json/exhibitions_coming_taipei.json")
        ]);
        allExhibit.now = await nowRes.json();
        allExhibit.coming = await comingRes.json();
    } catch {
        allExhibit = { coming: [], now: [] };
    }
}

function ExhibitView(ex, mapIns) {
    if (!mapIns) return true;
    if (typeof ex.lat === "undefined" || typeof ex.lng === "undefined") return false;
    const latlng = L.latLng(ex.lat, ex.lng);
    return mapIns.getBounds().contains(latlng);
}

function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

function Card(exhibitions) {
    const container = document.getElementById("exhibition-content");
    if (!exhibitions.length) {
        container.innerHTML = "<p>目前畫面內無符合條件的展覽。</p>";
        // 也移除 marker
        if (exhibitMark && getMap()) {
            getMap().removeLayer(exhibitMark);
            exhibitMark = null;
        }
        return;
    }
    container.innerHTML = exhibitions.map((ex, idx) => `
    <div class="excard" id="excard-${idx}" style="border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:6px;position:relative;transition:box-shadow 0.2s;">
      <a href="${escapeHtml(ex.Link)}" target="_blank"><img src="${escapeHtml(ex.Image)}" alt="${escapeHtml(ex.Title)}" style="width:100%;object-fit:cover;max-height:120px;border-radius:4px;"></a>
      <h4 style="margin:0.5em 0 0.2em 0;">${escapeHtml(ex.Title)}</h4>
      <p style="margin:0.2em 0;"><b>展期：</b>${escapeHtml(ex.Date)}</p>
      <p style="margin:0.2em 0;"><b>地點：</b>${escapeHtml(ex.Location)}</p>
      <button class="exlocate" data-lat="${ex.lat}" data-lng="${ex.lng}" data-title="${escapeHtml(ex.Title)}" style="margin-bottom:0.5em;">查看地點</button>
      <div class="exintr" style="max-height:3.2em;overflow:hidden;transition:max-height 0.3s;" id="exintr-${idx}">
        ${escapeHtml(ex.Article || "")}
      </div>
      <button class="exmore" data-idx="${idx}" style="margin-top:0.4em;display:inline-block;">閱讀更多</button>
    </div>
  `).join("");

    container.querySelectorAll('.exlocate').forEach(btn => {
        btn.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const title = this.dataset.title || "展覽地點";
            const mapIns = getMap();
            if (mapIns && !isNaN(lat) && !isNaN(lng)) {
                mapIns.flyTo([lat, lng], 17, { duration: 1.2 });

                if (exhibitMark) {
                    mapIns.removeLayer(exhibitMark);
                }

                const greenIcon = L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    shadowSize: [41, 41],
                    className: 'marker'
                });

                exhibitMark = L.marker([lat, lng], { icon: greenIcon })
                    .addTo(mapIns)
                    .bindPopup(title)
                    .openPopup();
            }
        });
    });

    container.querySelectorAll('.exmore').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = this.dataset.idx;
            const introDiv = document.getElementById(`exintr-${idx}`);
            const cardDiv = document.getElementById(`excard-${idx}`);
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

async function loadinfo(state = "now") {
    currentState = state;
    await infoExhibit();
    const mapIns = getMap();
    const exhibitions = allExhibit[state].filter(ex => ExhibitView(ex, mapIns));
    Card(exhibitions);
}

function infoOnMap() {
    loadinfo(currentState);
}

function switchView(viewType) {
    document.getElementById("exhibit-coming").classList.remove("active");
    document.getElementById("exhibit-now").classList.remove("active");
    if (viewType === "upcoming") {
        document.getElementById("exhibit-coming").classList.add("active");
        loadinfo("coming");
    } else {
        document.getElementById("exhibit-now").classList.add("active");
        loadinfo("now");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    switchView('ongoing');
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