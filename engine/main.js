// ==================== MAIN INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    setTheme(currentTheme);
    
    // Инициализируем все кроме menu-settings (оно запустится само)
    renderPlugins();
    updateStats();
    initNavigation();
    initMobileMenu();
    initStoreSettings();
    initGeneralSettings();
    initPanelSettings();
    initDateTime();
    initPanelButtons();
    updateNotificationBadge();
    
    // Применяем видимость карусели
    if (typeof applyShowCarousel === 'function') {
        applyShowCarousel();
    }
    
    // Карусель
    if (typeof initCarousel === 'function') {
        setTimeout(initCarousel, 100);
    }
    
    setTimeout(() => {
        plugins.filter(p => p.enabled).forEach(plugin => {
            try {
                executePlugin(plugin);
            } catch (error) {
                console.error(`Error executing plugin ${plugin.name}:`, error);
            }
        });
        
        if (typeof renderCarousel === 'function') {
            renderCarousel();
        }
    }, 500);
    
    initStore();

    // ===== Скрываем кнопки управления окном, если не в Electron =====
    if (!window.electronAPI) {
        const titlebarControls = document.querySelector('.titlebar-controls');
        if (titlebarControls) {
            titlebarControls.style.display = 'none';
        }
    }
});

function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const datetimeEl = document.getElementById('datetime');
    if (!datetimeEl) return;
    const now = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    datetimeEl.textContent = now.toLocaleString('ru', options).replace(',', '');
}

function initPanelButtons() {
    const homeBtn = document.getElementById('home-btn');
    const menuTogglePanel = document.getElementById('menu-toggle-panel');
    const panelSettingsBtn = document.getElementById('panel-settings-btn');
    const panelPluginsBtn = document.getElementById('panel-plugins-btn');
    const panelStoreBtn = document.getElementById('panel-store-btn');
    const panelNotificationsBtn = document.getElementById('panel-notifications-btn');
    const clearNotificationsBtn = document.getElementById('clear-notifications');

    
    if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        navigateTo('home');
    });
    }

    if (menuTogglePanel) {
        menuTogglePanel.addEventListener('click', toggleSidebar);
    }

    if (panelSettingsBtn) {
        panelSettingsBtn.addEventListener('click', () => navigateTo('settings'));
    }

    if (panelPluginsBtn) {
        panelPluginsBtn.addEventListener('click', () => navigateTo('plugins'));
    }

    if (panelStoreBtn) {
        panelStoreBtn.addEventListener('click', () => navigateTo('store'));
    }

    if (panelNotificationsBtn) {
        panelNotificationsBtn.addEventListener('click', toggleNotificationsDropdown);
    }

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    }

    // Закрытие дропдауна при клике вне его
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notifications-dropdown');
        const btn = document.getElementById('panel-notifications-btn');
        if (dropdown && !dropdown.contains(e.target) && btn && !btn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}