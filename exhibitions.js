
let exhibitionHighlightMarker = null;
let allExhibitions = {
    coming: [],
    now: []
};
let currentExhibitionState = "now"; // "now" or "coming"


function getMapInstance() {
    return window.map;
}


async function fetchAllExhibitions() {
    if (allExhibitions.now.length && allExhibitions.coming.length) return;
    try {
        const [nowRes, comingRes] = await Promise.all([
            fetch("../json/exhibitions_now_taipei.json"),
            fetch("../json/exhibitions_coming_taipei.json")
        ]);
        allExhibitions.now = await nowRes.json();
        allExhibitions.coming = await comingRes.json();
    } catch {
        allExhibitions = { coming: [], now: [] };
    }
}


function isExhibitionInMapView(ex, mapInstance) {
    if (!mapInstance) return true; // fallback: 全部顯示
    if (typeof ex.lat === "undefined" || typeof ex.lng === "undefined") return false;
    const latlng = L.latLng(ex.lat, ex.lng);
    return mapInstance.getBounds().contains(latlng);
}

function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}


function renderExhibitionCards(exhibitions) {
    const container = document.getElementById("exhibition-content");
    if (!exhibitions.length) {
        container.innerHTML = "<p>目前畫面內無符合條件的展覽。</p>";
        // 也移除 marker
        if (exhibitionHighlightMarker && getMapInstance()) {
            getMapInstance().removeLayer(exhibitionHighlightMarker);
            exhibitionHighlightMarker = null;
        }
        return;
    }
    container.innerHTML = exhibitions.map((ex, idx) => `
    <div class="exhibition-card" id="exhibition-card-${idx}" style="border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:6px;position:relative;transition:box-shadow 0.2s;">
      <a href="${escapeHtml(ex.Link)}" target="_blank"><img src="${escapeHtml(ex.Image)}" alt="${escapeHtml(ex.Title)}" style="width:100%;object-fit:cover;max-height:120px;border-radius:4px;"></a>
      <h4 style="margin:0.5em 0 0.2em 0;">${escapeHtml(ex.Title)}</h4>
      <p style="margin:0.2em 0;"><b>展期：</b>${escapeHtml(ex.Date)}</p>
      <p style="margin:0.2em 0;"><b>地點：</b>${escapeHtml(ex.Location)}</p>
      <button class="exhibition-locate-btn" data-lat="${ex.lat}" data-lng="${ex.lng}" data-title="${escapeHtml(ex.Title)}" style="margin-bottom:0.5em;">查看地點</button>
      <div class="exhibition-intro" style="max-height:3.2em;overflow:hidden;transition:max-height 0.3s;" id="exhibition-intro-${idx}">
        ${escapeHtml(ex.Article || "")}
      </div>
      <button class="exhibition-more-btn" data-idx="${idx}" style="margin-top:0.4em;display:inline-block;">閱讀更多</button>
    </div>
  `).join("");

    container.querySelectorAll('.exhibition-locate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const title = this.dataset.title || "展覽地點";
            const mapInstance = getMapInstance();
            if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
                mapInstance.flyTo([lat, lng], 17, { duration: 1.2 });


                if (exhibitionHighlightMarker) {
                    mapInstance.removeLayer(exhibitionHighlightMarker);
                }


                const greenIcon = L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    shadowSize: [41, 41],
                    className: 'leaflet-marker-green'
                });

                exhibitionHighlightMarker = L.marker([lat, lng], { icon: greenIcon })
                    .addTo(mapInstance)
                    .bindPopup(title)
                    .openPopup();
            }
        });
    });


    container.querySelectorAll('.exhibition-more-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = this.dataset.idx;
            const introDiv = document.getElementById(`exhibition-intro-${idx}`);
            const cardDiv = document.getElementById(`exhibition-card-${idx}`);
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


async function loadExhibitions(state = "now") {
    currentExhibitionState = state;
    await fetchAllExhibitions();
    const mapInstance = getMapInstance();
    const exhibitions = allExhibitions[state].filter(ex => isExhibitionInMapView(ex, mapInstance));
    renderExhibitionCards(exhibitions);
}


function updateExhibitionsOnMapMove() {
    loadExhibitions(currentExhibitionState);
}


function toggleExhibitionView(viewType) {
    document.getElementById("exhibition-upcoming-btn").classList.remove("active");
    document.getElementById("exhibition-ongoing-btn").classList.remove("active");
    if (viewType === "upcoming") {
        document.getElementById("exhibition-upcoming-btn").classList.add("active");
        loadExhibitions("coming");
    } else {
        document.getElementById("exhibition-ongoing-btn").classList.add("active");
        loadExhibitions("now");
    }
}


document.addEventListener("DOMContentLoaded", function() {
    toggleExhibitionView('ongoing');
    let retryCount = 0;
    let interval = setInterval(() => {
        const mapInstance = getMapInstance();
        if (mapInstance) {
            mapInstance.on("moveend", updateExhibitionsOnMapMove);
            clearInterval(interval);
        }
        if (++retryCount > 30) clearInterval(interval);
    }, 150);
});
