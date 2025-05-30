// 在檔案最上方加這行，儲存目前紅色 marker
let exhibitionHighlightMarker = null;

// ...其餘程式碼...

// 綁定查看地點按鈕
container.querySelectorAll('.exhibition-locate-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const lat = parseFloat(this.dataset.lat);
        const lng = parseFloat(this.dataset.lng);
        const mapInstance = getMapInstance();
        if (mapInstance && !isNaN(lat) && !isNaN(lng)) {
            mapInstance.flyTo([lat, lng], 17, { duration: 1.2 });

            // 移除舊 marker
            if (exhibitionHighlightMarker) {
                mapInstance.removeLayer(exhibitionHighlightMarker);
            }

            // 建立紅色 marker
            const redIcon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x-red.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                shadowSize: [41, 41]
            });

            exhibitionHighlightMarker = L.marker([lat, lng], { icon: redIcon }).addTo(mapInstance);
        }
    });
});
