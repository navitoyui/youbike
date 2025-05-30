// == 展覽功能完整版 (只顯示地圖畫面內展覽、紅色地標、閱讀更多/收合) ==

// 儲存目前紅色展覽 marker
let exhibitionHighlightMarker = null;

let allExhibitions = {
    coming: [],
    now: []
};
let currentExhibitionState = "now"; // "now" or "coming"

// 取得全域地圖物件
function getMapInstance() {
    return window.map;
}

// 載入展覽資料並快取
async function fetchAllExhibitions() {
    if (allExhibitions.now.length && allExhibitions.coming.length) return;
    try {
        const [nowRes, comingRes] = await Promise.all([
            fetch("exhibitions_now_taipei.json"),
            fetch("exhibitions_coming_taipei.json")
        ]);
        allExhibitions.now = await nowRes.json();
        allExhibitions.coming = await comingRes.json();
    } catch {
        allExhibitions = { coming: [], now: [] };
    }
}

// 判斷展覽是否在目前地圖畫面範圍
function isExhibitionInMapView(ex, mapInstance) {
    if (!mapInstance) return true; // fallback: 全部顯示
    if (typeof ex.lat === "undefined" || typeof ex.lng === "undefined") return false;
    const latlng = L.latLng(ex.lat, ex.lng);
    return mapInstance.getBounds().contains(latlng);
}

function escapeHtml(html) {
    // 防止XSS
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// 展示展覽卡片，支援介紹收合/展開與地圖滑動
function renderExhibitionCards(exhibitions) {
    const container = document.getElementById("exhibition-content");
    if (!exhibitions.length) {
        container.innerHTML = "<p>目前畫面內無符合條件的展覽。</p>";
        // 也移除紅色 marker
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

    // 綁定查看地點按鈕
    container.querySelectorAll('.exhibition-locate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const title = this.dataset.title || "展覽地點";
            const mapInstance = getMapInstance();
            if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
                mapInstance.flyTo([lat, lng], 17, { duration: 1.2 });

                // 移除舊 marker
                if (exhibitionHighlightMarker) {
                    mapInstance.removeLayer(exhibitionHighlightMarker);
                }

                // 建立紅色 marker
                const greenIcon = L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    shadowSize: [41, 41]
                    className: 'leaflet-marker-green'
                });

                exhibitionHighlightMarker = L.marker([lat, lng], { icon: redIcon })
                    .addTo(mapInstance)
                    .bindPopup(title)
                    .openPopup();
            }
        });
    });

    // 綁定閱讀更多/收合
    container.querySelectorAll('.exhibition-more-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = this.dataset.idx;
            const introDiv = document.getElementById(`exhibition-intro-${idx}`);
            const cardDiv = document.getElementById(`exhibition-card-${idx}`);
            if (introDiv.style.maxHeight === 'none') {
                // 收合
                introDiv.style.maxHeight = '3.2em';
                btn.textContent = "閱讀更多";
                cardDiv.style.boxShadow = "";
                cardDiv.style.zIndex = "";
            } else {
                // 展開
                introDiv.style.maxHeight = 'none';
                btn.textContent = "收合";
                cardDiv.style.boxShadow = "0 4px 24px 0 rgba(0,0,0,0.18)";
                cardDiv.style.zIndex = "11";
            }
        });
    });
}

// 切換(進行中/即將展出)並自動過濾畫面內展覽
async function loadExhibitions(state = "now") {
    currentExhibitionState = state;
    await fetchAllExhibitions();
    const mapInstance = getMapInstance();
    const exhibitions = allExhibitions[state].filter(ex => isExhibitionInMapView(ex, mapInstance));
    renderExhibitionCards(exhibitions);
}

// 當地圖移動時，重新過濾展覽
function updateExhibitionsOnMapMove() {
    loadExhibitions(currentExhibitionState);
}

// 展覽切換按鈕
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

// 預設載入進行中展覽，並監聽地圖移動
document.addEventListener("DOMContentLoaded", function() {
    toggleExhibitionView('ongoing');
    // 監聽地圖移動後自動更新範圍內展覽
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
