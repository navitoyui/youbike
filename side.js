function switchTab(tabId) {
    const tabs = document.querySelectorAll(".tab-content");
    const buttons = document.querySelectorAll(".tab-buttons button");

    tabs.forEach(tab => tab.classList.remove("active"));
    buttons.forEach(button => button.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    document.getElementById(`${tabId}-tab`).classList.add("active");
}

function switchExhibit(viewType) {
    document.getElementById("exhibit-coming").classList.remove("active");
    document.getElementById("exhibit-now").classList.remove("active");
    if (viewType === "upcoming") {
        document.addEventListener("DOMContentLoaded", function() {
            loadinfo("coming");
        });
    } else {
        document.addEventListener("DOMContentLoaded", function() {
            loadinfo("now");
        });
    }
}