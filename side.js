// 側欄 Tab 切換
function switchTab(tabId) {
    const tabs = document.querySelectorAll(".tab-content");
    const buttons = document.querySelectorAll(".tab-buttons button");

    tabs.forEach(tab => tab.classList.remove("active"));
    buttons.forEach(button => button.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    document.getElementById(`${tabId}-tab`).classList.add("active");
}

// 展覽切換
function toggleExhibitionView(viewType) {
    document.getElementById("exhibition-upcoming-btn").classList.remove("active");
    document.getElementById("exhibition-ongoing-btn").classList.remove("active");
    if (viewType === "upcoming") {
        document.addEventListener("DOMContentLoaded", function() {
            loadExhibitions("coming"); // 預設載入進行中
        });
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            loadExhibitions("now"); // 預設載入進行中
        });
    }
}

function toggleEventView(viewType) {
    document.getElementById("event-upcoming-btn").classList.remove("active");
    document.getElementById("event-ongoing-btn").classList.remove("active");
    if (viewType === "upcoming") {
        document.getElementById("event-upcoming-btn").classList.add("active");
        loadEvents("coming");
    } else {
        document.getElementById("event-ongoing-btn").classList.add("active");
        loadEvents("now");
    }
}
