// ==================== SETTINGS.JS (ПОЛНАЯ ВЕРСИЯ) ====================

// ---------- Существующие функции (без изменений) ----------
function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    document.querySelectorAll('.theme-preview').forEach(el => {
        el.classList.toggle('selected', el.dataset.theme === theme);
    });
    
    const themeNameEl = document.getElementById('currentThemeName');
    if (themeNameEl) {
        themeNameEl.textContent = themeNames[theme] || theme;
    }
}

// Инициализация общих настроек (включая новый переключатель для карусели)
function initGeneralSettings() {
    const notificationsToggle = document.getElementById('notificationsToggle');
    const autoStartToggle = document.getElementById('autoStartToggle');
    const saveLogsToggle = document.getElementById('saveLogsToggle');
    const showCarouselToggle = document.getElementById('showCarouselToggle');

    if (notificationsToggle) {
        notificationsToggle.classList.toggle('active', generalSettings.notifications);
        notificationsToggle.onclick = function(e) {
            e.stopPropagation();
            toggleGeneralSetting('notifications', this);
        };
    }
    
    if (autoStartToggle) {
        autoStartToggle.classList.toggle('active', generalSettings.autoStart);
        autoStartToggle.onclick = function(e) {
            e.stopPropagation();
            toggleGeneralSetting('autoStart', this);
        };
    }
    
    if (saveLogsToggle) {
        saveLogsToggle.classList.toggle('active', generalSettings.saveLogs);
        saveLogsToggle.onclick = function(e) {
            e.stopPropagation();
            toggleGeneralSetting('saveLogs', this);
        };
    }

    // Новый переключатель для карусели
    if (showCarouselToggle) {
        showCarouselToggle.classList.toggle('active', generalSettings.showCarousel);
        showCarouselToggle.onclick = function(e) {
            e.stopPropagation();
            toggleGeneralSetting('showCarousel', this);
        };
    }
}

// Общая функция переключения настроек (добавлен case для showCarousel)
function toggleGeneralSetting(setting, element) {
    element.classList.toggle('active');
    generalSettings[setting] = element.classList.contains('active');
    saveGeneralSettings();
    
    let settingName = '';
    switch(setting) {
        case 'notifications':
            settingName = 'Уведомления';
            break;
        case 'autoStart':
            settingName = 'Автозапуск плагинов';
            break;
        case 'saveLogs':
            settingName = 'Сохранение логов';
            break;
        case 'showCarousel':
            settingName = 'Карусель плагинов';
            applyShowCarousel(); // немедленно применяем изменение
            break;
    }
    
    showNotification(`${settingName} ${generalSettings[setting] ? 'включены' : 'отключены'}`, 'success');
}

// Инициализация настроек верхней панели
function initPanelSettings() {
    const panel = generalSettings.panel;

    const toggleIds = {
        clock: 'panelClockToggle',
        back: 'panelBackToggle',
        menu: 'panelMenuToggle',
        settingsIcon: 'panelSettingsIconToggle',
        pluginsIcon: 'panelPluginsIconToggle',
        storeIcon: 'panelStoreIconToggle',
        notificationsIcon: 'panelNotificationsIconToggle'
    };

    Object.entries(toggleIds).forEach(([key, id]) => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.classList.toggle('active', panel[key]);
            toggle.onclick = (e) => {
                e.stopPropagation();
                toggle.classList.toggle('active');
                panel[key] = toggle.classList.contains('active');
                saveGeneralSettings();
                applyPanelSettings();
            };
        }
    });

    applyPanelSettings();
}

// Применение настроек панели
function applyPanelSettings() {
    const panel = generalSettings.panel;
    const leftGroup = document.querySelector('.top-panel-left');
    const rightGroup = document.querySelector('.top-panel-right');

    if (!leftGroup || !rightGroup) return;

    const backBtnEl = document.getElementById('back-btn');
    const menuBtnEl = document.getElementById('menu-toggle-panel');
    if (backBtnEl) backBtnEl.style.display = panel.back ? 'flex' : 'none';
    if (menuBtnEl) menuBtnEl.style.display = panel.menu ? 'flex' : 'none';

    const datetime = document.getElementById('datetime');
    const settingsBtn = document.getElementById('panel-settings-btn');
    const pluginsBtn = document.getElementById('panel-plugins-btn');
    const storeBtn = document.getElementById('panel-store-btn');
    const notificationsWrapper = document.querySelector('.notifications-wrapper');

    if (datetime) datetime.style.display = panel.clock ? 'block' : 'none';
    if (settingsBtn) settingsBtn.style.display = panel.settingsIcon ? 'flex' : 'none';
    if (pluginsBtn) pluginsBtn.style.display = panel.pluginsIcon ? 'flex' : 'none';
    if (storeBtn) storeBtn.style.display = panel.storeIcon ? 'flex' : 'none';
    if (notificationsWrapper) notificationsWrapper.style.display = panel.notificationsIcon ? 'block' : 'none';
}

// ==================== НАСТРОЙКИ СЕРВЕРА ====================

// Инициализация блока настроек сервера
async function initServerSettings() {
    if (!window.electronAPI) return;

    try {
        const config = await window.electronAPI.getServerConfig();

        const portInput = document.getElementById('serverPort');
        const corsToggle = document.getElementById('serverCorsToggle');
        const webSecurityToggle = document.getElementById('serverWebSecurityToggle');
        const localhostLink = document.getElementById('localhostLink');
        const copyUrlBtn = document.getElementById('copyUrlBtn');

        if (portInput) {
            portInput.value = config.port;
            portInput.addEventListener('input', updateLocalhostLink);
        }
        if (corsToggle) {
            corsToggle.classList.toggle('active', config.cors);
            corsToggle.onclick = (e) => {
                e.stopPropagation();
                corsToggle.classList.toggle('active');
            };
        }
        if (webSecurityToggle) {
            webSecurityToggle.classList.toggle('active', config.webSecurity);
            webSecurityToggle.onclick = (e) => {
                e.stopPropagation();
                webSecurityToggle.classList.toggle('active');
            };
        }

        // Обновляем ссылку на localhost
        updateLocalhostLink();

        // Кнопка копирования
        if (copyUrlBtn) {
            copyUrlBtn.onclick = copyLocalhostUrl;
        }

    } catch (error) {
        console.error('Failed to init server settings:', error);
    }
}

// Обновление текста ссылки localhost
function updateLocalhostLink() {
    const portInput = document.getElementById('serverPort');
    const localhostLink = document.getElementById('localhostLink');
    if (!portInput || !localhostLink) return;
    const port = portInput.value || '3000';
    const url = `http://localhost:${port}`;
    localhostLink.textContent = url;
    localhostLink.href = url;
}

// Копирование URL в буфер обмена
function copyLocalhostUrl() {
    const localhostLink = document.getElementById('localhostLink');
    if (!localhostLink) return;
    const url = localhostLink.href;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('URL скопирован в буфер обмена', 'success');
    }).catch(() => {
        showNotification('Не удалось скопировать URL', 'error');
    });
}

// Сохранить настройки сервера
function saveServerConfig() {
    if (!window.electronAPI) {
        alert('Эта функция доступна только в приложении Electron');
        return;
    }

    const port = parseInt(document.getElementById('serverPort').value, 10);
    if (isNaN(port) || port < 1024 || port > 65535) {
        showNotification('Порт должен быть числом от 1024 до 65535', 'error');
        return;
    }

    const cors = document.getElementById('serverCorsToggle').classList.contains('active');
    const webSecurity = document.getElementById('serverWebSecurityToggle').classList.contains('active');

    const config = { port, cors, webSecurity };
    window.electronAPI.saveServerConfig(config);
    showNotification('Настройки сервера сохранены. Перезапустите приложение для применения.', 'info');
}

// Перезапустить приложение
function relaunchApp() {
    if (!window.electronAPI) return;
    if (confirm('Перезапустить приложение сейчас?')) {
        window.electronAPI.relaunchApp();
    }
}

// ==================== УПРАВЛЕНИЕ ВИДИМОСТЬЮ КАРУСЕЛИ ====================

function applyShowCarousel() {
    const carouselSection = document.querySelector('.plugins-carousel-section');
    if (!carouselSection) return;
    
    if (generalSettings.showCarousel) {
        carouselSection.style.display = 'block';
        // Если карусель включаем, перерендериваем её (если функция доступна)
        if (typeof window.renderCarousel === 'function') {
            window.renderCarousel();
        }
    } else {
        carouselSection.style.display = 'none';
    }
}

// ==================== НАБЛЮДАТЕЛЬ ЗА СТРАНИЦЕЙ НАСТРОЕК ====================

document.addEventListener('DOMContentLoaded', () => {
    const settingsObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('active') && 
                mutation.target.id === 'settings') {
                setTimeout(() => {
                    if (typeof loadMenuSettings === 'function') {
                        loadMenuSettings();
                    }
                    if (typeof initServerSettings === 'function') {
                        initServerSettings();
                    }
                }, 100);
            }
        });
    });
    
    const settingsPage = document.getElementById('settings');
    if (settingsPage) {
        settingsObserver.observe(settingsPage, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
});

// ==================== ЭКСПОРТ ФУНКЦИЙ (опционально, для глобальной области) ====================
window.setTheme = setTheme;
window.initGeneralSettings = initGeneralSettings;
window.toggleGeneralSetting = toggleGeneralSetting;
window.initPanelSettings = initPanelSettings;
window.applyPanelSettings = applyPanelSettings;
window.initServerSettings = initServerSettings;
window.saveServerConfig = saveServerConfig;
window.relaunchApp = relaunchApp;
window.copyLocalhostUrl = copyLocalhostUrl;
window.applyShowCarousel = applyShowCarousel;