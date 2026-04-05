// ==================== STATE ====================
if (window.electronAPI) {
    document.body.classList.add('electron');
}
let plugins = JSON.parse(localStorage.getItem('plugins') || '[]');
let currentTheme = localStorage.getItem('theme') || 'light';
let selectedPluginFile = null;
let currentPluginMeta = null;
let pluginToDelete = null;

// Store state
let storePlugins = [];
let storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{"autoUpdate": true, "storeUrl": "https://gist.githubusercontent.com/MaliStra/4a1eae7ebb1ef6a35ba52e5c8749a05e/raw/store_v2.js"}');

// General settings – добавлено поле showCarousel
let generalSettings = JSON.parse(localStorage.getItem('generalSettings') || '{"notifications": true, "autoStart": true, "saveLogs": false, "panel": {"clock": true, "back": true, "menu": true, "settingsIcon": true, "pluginsIcon": true, "storeIcon": true, "notificationsIcon": true}}');
if (generalSettings.showCarousel === undefined) {
    generalSettings.showCarousel = true;
}

// История уведомлений
let notificationsHistory = JSON.parse(localStorage.getItem('notificationsHistory') || '[]');
let unreadCount = notificationsHistory.filter(n => !n.read).length;

// Theme names
const themeNames = {
    light: 'Светлая',
    dark: 'Тёмная',
    ocean: 'Океан',
    forest: 'Лес',
    sunset: 'Закат'
};

// ==================== SAVE FUNCTIONS ====================
function savePlugins() {
    localStorage.setItem('plugins', JSON.stringify(plugins));
}

function saveStoreSettings() {
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
}

function saveGeneralSettings() {
    localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
}

function saveNotificationsHistory() {
    localStorage.setItem('notificationsHistory', JSON.stringify(notificationsHistory));
}

// ==================== DATA MANAGEMENT ====================
function exportData() {
    const data = {
        plugins,
        theme: currentTheme,
        storeSettings,
        generalSettings,
        notificationsHistory,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plugin-manager-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Данные экспортированы');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.plugins) {
                plugins = data.plugins;
                savePlugins();
                renderPlugins();
                updateStats();
            }
            if (data.theme) {
                setTheme(data.theme);
            }
            if (data.storeSettings) {
                storeSettings = { ...storeSettings, ...data.storeSettings };
                saveStoreSettings();
                initStoreSettings();
            }
            if (data.generalSettings) {
                generalSettings = { ...generalSettings, ...data.generalSettings };
                if (generalSettings.showCarousel === undefined) generalSettings.showCarousel = true;
                saveGeneralSettings();
                initGeneralSettings();
                initPanelSettings();
                // Применяем видимость карусели
                if (typeof applyShowCarousel === 'function') {
                    applyShowCarousel();
                }
            }
            // Обновляем карусель
            if (typeof renderCarousel === 'function') {
                renderCarousel();
            }
            showNotification('Данные импортированы');

            // Перезагружаем окно после импорта
            if (window.electronAPI) {
                setTimeout(() => window.electronAPI.reloadWindow(), 500); // небольшая задержка, чтобы уведомление успело показаться
            }
        } catch (error) {
            showNotification('Ошибка импорта данных', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (confirm('Удалить все данные? Это действие нельзя отменить.')) {
        plugins = [];
        savePlugins();
        renderPlugins();
        updateStats();
        setTheme('light');
        
        storeSettings = {autoUpdate: true, storeUrl: 'https://gist.githubusercontent.com/MaliStra/4a1eae7ebb1ef6a35ba52e5c8749a05e/raw/store_v2.js'};
        generalSettings = {notifications: true, autoStart: true, saveLogs: false, panel: {clock: true, back: true, menu: true, settingsIcon: true, pluginsIcon: true, storeIcon: true, notificationsIcon: true}, showCarousel: true};
        notificationsHistory = [];
        unreadCount = 0;
        
        saveStoreSettings();
        saveGeneralSettings();
        saveNotificationsHistory();
        
        initStoreSettings();
        initGeneralSettings();
        initPanelSettings();
        // Применяем видимость карусели
        if (typeof applyShowCarousel === 'function') {
            applyShowCarousel();
        }
        // Обновляем карусель
        if (typeof renderCarousel === 'function') {
            renderCarousel();
        }
        updateNotificationBadge();
        
        showNotification('Все данные удалены');
    }
}