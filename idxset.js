let stations = [];
let selectedStation = localStorage.getItem('selectedStation') || "";
let futureMin = 10; // 預測的默認分鐘數

async function fetchStations() {
    const resp = await fetch('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
    stations = await resp.json();
    updateStationSelect();
    updateStationInfo(); // 初始化時顯示選中的站點資訊或第一個站點
    await sendInitialPrediction(); // 初次預測 API 請求
}

function updateStationSelect() {
    const select = document.getElementById('stationSelect');
    const search = document.getElementById('stationSearch');
    const filter = search.value.toLowerCase();
    select.innerHTML = "";

    stations
        .filter(station => station.sna.toLowerCase().includes(filter) || station.sno.includes(filter))
        .forEach(station => {
            const opt = document.createElement('option');
            opt.value = station.sno;
            opt.textContent = `${station.sna} (${station.sno})`;
            select.appendChild(opt);
        });

    // 如果之前有選擇站點，預設選擇
    if (selectedStation) {
        select.value = selectedStation;
    } else if (stations.length > 0) {
        selectedStation = stations[0].sno; // 默認選擇第一個站點
        select.value = selectedStation;
    }
}

function updateStationInfo() {
    const select = document.getElementById('stationSelect');
    selectedStation = select.value;
    localStorage.setItem('selectedStation', selectedStation); // 保存選擇的站點到 localStorage
    const station = stations.find(s => s.sno === selectedStation);

    if (!station) {
        document.getElementById('stationInfo').innerHTML = "無此站點資料";
        return;
    }

    const totalSpaces = parseInt(station.total, 10);
    const availableRentBikes = parseInt(station.available_rent_bikes, 10);
    const availableSpaces = totalSpaces - availableRentBikes;

    document.getElementById('stationInfo').innerHTML =
        `站點：${station.sna} (${selectedStation})<br>` +
        `總停車格數：<b>${totalSpaces}</b><br>` +
        `目前可借：${availableRentBikes} 輛<br>` +
        `目前可停車位：${availableSpaces} 格`;
}

async function sendInitialPrediction() {
    if (!selectedStation) return;

    const station = stations.find(s => s.sno === selectedStation);
    const now = new Date();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    const isWeekend = (now.getDay() === 6 || now.getDay() === 0) ? 1 : 0;
    const availableRentBikes = parseInt(station.available_rent_bikes, 10);

    const apiUrl = "https://youbike-api-257250837377.asia-east1.run.app/predict";
    const body = {
        sno: selectedStation,
        minute_of_day: minuteOfDay,
        is_weekend: isWeekend,
        available_rent_bikes: availableRentBikes,
        future_minutes: futureMin
    };

    try {
        await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        console.log("初次預測 API 請求已送出。");
    } catch (error) {
        console.error("初次預測 API 請求失敗：", error);
    }
}

async function predict() {
    const select = document.getElementById('stationSelect');
    const sno = select.value;
    const futureMinInput = parseInt(document.getElementById('futureMin').value, 10);
    futureMin = futureMinInput || futureMin; // 更新預測分鐘數
    const station = stations.find(s => s.sno === sno);

    const now = new Date();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    const isWeekend = (now.getDay() === 6 || now.getDay() === 0) ? 1 : 0;
    const availableRentBikes = parseInt(station.available_rent_bikes, 10);
    const totalSpaces = parseInt(station.total, 10);

    const apiUrl = "https://youbike-api-257250837377.asia-east1.run.app/predict";
    const body = {
        sno,
        minute_of_day: minuteOfDay,
        is_weekend: isWeekend,
        available_rent_bikes: availableRentBikes,
        future_minutes: futureMin
    };

    const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const result = await resp.json();

    const predictedRentBikes = result.predicted_rent_bikes;
    const predictedAvailableSpaces = totalSpaces - predictedRentBikes;

    document.getElementById('result').innerHTML =
        `<h3>預測結果</h3>
    <p>${futureMin} 分鐘後預測可借：<b>${predictedRentBikes}</b> 輛</p>
    <p>${futureMin} 分鐘後預測可停車位：<b>${predictedAvailableSpaces}</b> 格</p>`;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchStations();
    document.getElementById('stationSelect').addEventListener('change', async () => {
        updateStationInfo();
        await sendInitialPrediction(); // 切換站點後重新送出 API 請求
    });
    document.getElementById('stationSearch').addEventListener('input', updateStationSelect);
});