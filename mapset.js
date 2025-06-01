window.map = null;
let markers = [];
let stations = [];
let futureMin = 10;
let commonLocations = [];


function initMap() {
    map = L.map("map").setView([25.0330, 121.5654], 13)


    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    map.on("moveend", updateStationsInView);

    fetchStations();
}


async function fetchStations() {
    try {
        const resp = await fetch("https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json");
        const data = await resp.json();

        stations = data.filter(station => {
            const lat = parseFloat(station.latitude);
            const lng = parseFloat(station.longitude);
            return !isNaN(lat) && !isNaN(lng);
        });

        updateStationsInView();
    } catch (error) {
        console.error("error：", error);
    }
}

function updateStationsInView() {
    const bounds = map.getBounds();
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    stations.forEach(station => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);

        if (bounds.contains([lat, lng])) {
            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<div>
          <h3>${station.sna} (${station.sno})</h3>
          <p>目前可借：${station.available_rent_bikes} 輛</p>
          <p>目前可停車位：${parseInt(station.total, 10) - parseInt(station.available_rent_bikes, 10)} 格</p>
          <p id="prediction-${station.sno}">載入中...</p>
          <p><button onclick="addToCommonLocations('${station.sna}', ${lat}, ${lng})">儲存為常用地點</button></p>
        </div>`);

            marker.on("popupopen", function() {
                sendPredictionRequest(station);
            });

            markers.push(marker);
        }
    });
}


async function sendPredictionRequest(station) {
    const now = new Date();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    const isWeekend = now.getDay() === 6 || now.getDay() === 0 ? 1 : 0;
    const availableRentBikes = parseInt(station.available_rent_bikes, 10);
    const totalSpaces = parseInt(station.total, 10);

    const apiUrl = "https://youbike-api-257250837377.asia-east1.run.app/predict";
    const body = {
        sno: station.sno,
        minute_of_day: minuteOfDay,
        is_weekend: isWeekend,
        available_rent_bikes: availableRentBikes,
        future_minutes: futureMin,
    };

    try {
        const resp = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await resp.json();

        const predictedRentBikes = result.predicted_rent_bikes;
        const predictedAvailableSpaces = totalSpaces - predictedRentBikes;

        const predEl = document.getElementById(`prediction-${station.sno}`);
        if (predEl) {
            predEl.innerHTML =
                `<p>${futureMin} 分鐘後可借：${predictedRentBikes} 輛</p>
         <p>${futureMin} 分鐘後可停車位：${predictedAvailableSpaces} 格</p>`;
        }
    } catch (error) {
        const predEl = document.getElementById(`prediction-${station.sno}`);
        if (predEl) {
            predEl.innerHTML = `<p>請稍後再試</p>`;
        }
    }
}


function predict() {
    futureMin = parseInt(document.getElementById("futureMin").value, 10) || futureMin;
    updateStationsInView();
}


function addToCommonLocations(name, lat, lng) {
    if (!commonLocations.some(loc => loc.name === name && loc.lat === lat && loc.lng === lng)) {
        commonLocations.push({ name, lat, lng });
        renderCommonLocations();
    }
}


function renderCommonLocations() {
    const list = document.getElementById("common-locations-list");
    list.innerHTML = "";
    commonLocations.forEach((location, index) => {
        const item = document.createElement("li");
        item.textContent = location.name;
        const flyBtn = document.createElement("button");
        flyBtn.textContent = "定位";
        flyBtn.onclick = () => {
            map.setView([location.lat, location.lng], 17);
        };
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "移除";
        removeBtn.onclick = () => {
            commonLocations.splice(index, 1);
            renderCommonLocations();
        };
        item.appendChild(flyBtn);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
}


async function searchLocation() {
    const searchBox = document.getElementById("searchBox").value;
    if (!searchBox) {
        alert("請輸入地區或地址");
        return;
    }

    const apiKey = "65709399477a4393b245333d8c63ab80";
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(searchBox)}&key=${apiKey}&language=zh&countrycode=TW`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results.length > 0) {
            const result = data.results[0];
            const lat = result.geometry.lat;
            const lng = result.geometry.lng;
            map.flyTo([lat, lng], 18);
        } else {
            alert("找不到位置");
        }
    } catch (error) {
        console.error("搜尋失敗：", error);
        alert("請稍後再試");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    initMap();
    document.getElementById("searchBox").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            searchLocation();
        }
    });
    document.getElementById("searchBtn").addEventListener("click", searchLocation);
});
