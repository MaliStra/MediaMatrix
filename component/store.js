// ==================== STORE ====================
let storeInitialized = false;
let currentFilteredPlugins = [];
let searchTimeout;

function getStoreElements() {
    return {
        loading: document.getElementById('storeLoading'),
        error: document.getElementById('storeError'),
        grid: document.getElementById('storeGrid'),
        noResults: document.getElementById('storeNoResults'),
        searchInput: document.getElementById('storeSearchInput'),
        categoryFilter: document.getElementById('categoryFilter'),
        refreshBtn: document.getElementById('refreshStoreBtn'),
        errorMessage: document.getElementById('storeErrorMessage'),
        storeCount: document.getElementById('storeCount'),
        modal: document.getElementById('pluginDetailModal'),
        modalTitle: document.getElementById('pluginDetailTitle'),
        modalContent: document.getElementById('pluginDetailContent'),
        closeBtn: document.querySelector('#pluginDetailModal .close-modal'),
        settingsModal: document.getElementById('pluginSettingsModal'),
        settingsTitle: document.getElementById('pluginSettingsTitle'),
        settingsContent: document.getElementById('pluginSettingsContent')
    };
}

async function initStore() {
    if (storeInitialized) return;
    
    const elements = getStoreElements();
    
    // Инициализируем обработчики событий
    if (elements.searchInput) {
        elements.searchInput.removeEventListener('input', handleStoreSearch);
        elements.searchInput.addEventListener('input', handleStoreSearch);
    }
    
    if (elements.categoryFilter) {
        elements.categoryFilter.removeEventListener('change', filterStorePlugins);
        elements.categoryFilter.addEventListener('change', filterStorePlugins);
    }
    
    if (elements.refreshBtn) {
        elements.refreshBtn.removeEventListener('click', handleRefreshStore);
        elements.refreshBtn.addEventListener('click', handleRefreshStore);
    }
    
    if (elements.closeBtn) {
        elements.closeBtn.removeEventListener('click', closePluginDetail);
        elements.closeBtn.addEventListener('click', closePluginDetail);
    }
    
    // Закрытие модального окна по клику вне его
    if (elements.modal) {
        elements.modal.removeEventListener('click', handleModalClick);
        elements.modal.addEventListener('click', handleModalClick);
    }
    
    // Закрытие окна настроек по клику вне его
    if (elements.settingsModal) {
        elements.settingsModal.removeEventListener('click', handleSettingsModalClick);
        elements.settingsModal.addEventListener('click', handleSettingsModalClick);
    }
    
    // Загружаем данные магазина
    try {
        await refreshStore(true);
    } catch (error) {
        console.error('Failed to init store:', error);
        if (elements.storeCount) {
            elements.storeCount.textContent = '?';
        }
    }
    
    // Инициализируем настройки магазина
    initStoreSettings();
    
    storeInitialized = true;
}

function handleStoreSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterStorePlugins, 300);
}

function handleRefreshStore() {
    refreshStore(false);
}

function handleModalClick(e) {
    const modal = getStoreElements().modal;
    if (e.target === modal) {
        closePluginDetail();
    }
}

function handleSettingsModalClick(e) {
    const modal = getStoreElements().settingsModal;
    if (e.target === modal) {
        closePluginSettings();
    }
}

async function refreshStore(silent = false) {
    const elements = getStoreElements();
    
    if (!silent) {
        if (elements.loading) elements.loading.classList.remove('hidden');
        if (elements.error) elements.error.classList.add('hidden');
        if (elements.grid) elements.grid.classList.add('hidden');
        if (elements.noResults) elements.noResults.classList.add('hidden');
        if (elements.refreshBtn) {
            elements.refreshBtn.classList.add('loading');
            elements.refreshBtn.disabled = true;
        }
    }
    
    try {
        const storeUrl = storeSettings.storeUrl || 'https://gist.githubusercontent.com/MaliStra/4a1eae7ebb1ef6a35ba52e5c8749a05e/raw/store_v2.js';
        const response = await fetch(storeUrl + '?t=' + Date.now());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        storePlugins = data.plugins || [];
        
        // Обновляем категории в фильтре
        const categories = [...new Set(storePlugins.map(p => p.category).filter(Boolean))];
        updateCategoryFilter(categories);
        
        if (elements.storeCount) {
            elements.storeCount.textContent = storePlugins.length;
        }
        
        // Применяем текущие фильтры и отображаем
        filterStorePlugins();
        
        if (!silent) {
            if (elements.loading) elements.loading.classList.add('hidden');
            if (elements.grid) elements.grid.classList.remove('hidden');
            showNotification('Магазин обновлен', 'success');
        }
        
        // Проверка обновлений, если включено — используем уже загруженные данные
        if (storeSettings.autoUpdate) {
            checkForUpdates(true);
        }
        
    } catch (error) {
        console.error('Failed to load store:', error);
        
        if (!silent) {
            if (elements.loading) elements.loading.classList.add('hidden');
            if (elements.error) {
                elements.error.classList.remove('hidden');
                if (elements.errorMessage) {
                    elements.errorMessage.textContent = error.message || 'Не удалось загрузить список плагинов';
                }
            }
            showNotification('Ошибка загрузки магазина', 'error');
        }
    } finally {
        if (!silent && elements.refreshBtn) {
            elements.refreshBtn.classList.remove('loading');
            elements.refreshBtn.disabled = false;
        }
    }
}

function updateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const currentValue = categoryFilter.value;
    
    let options = '<option value="all">Все категории</option>';
    categories.sort().forEach(category => {
        options += `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
    });
    
    // Обновляем только если изменилось
    if (categoryFilter.innerHTML !== options) {
        categoryFilter.innerHTML = options;
        if (currentValue && categories.includes(currentValue)) {
            categoryFilter.value = currentValue;
        }
    }
}

function filterStorePlugins() {
    const elements = getStoreElements();
    if (!elements.grid) return;
    
    const searchTerm = elements.searchInput?.value.toLowerCase().trim() || '';
    const category = elements.categoryFilter?.value || 'all';
    
    let filtered = [...storePlugins];
    
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchTerm)) ||
            (p.description && p.description.toLowerCase().includes(searchTerm)) ||
            (p.author && p.author.toLowerCase().includes(searchTerm))
        );
    }
    
    // Добавляем флаг isInstalled
    filtered = filtered.map(plugin => ({
        ...plugin,
        isInstalled: plugins.some(p => 
            p.id === plugin.id || 
            p.name === plugin.name ||
            (p.storeId && p.storeId === plugin.id)
        )
    }));
    
    // Проверяем, изменились ли данные
    if (JSON.stringify(currentFilteredPlugins) !== JSON.stringify(filtered)) {
        currentFilteredPlugins = filtered;
        
        if (filtered.length === 0) {
            elements.grid.classList.add('hidden');
            if (elements.noResults) elements.noResults.classList.remove('hidden');
        } else {
            elements.grid.classList.remove('hidden');
            if (elements.noResults) elements.noResults.classList.add('hidden');
            renderStoreGrid();
        }
    }
}

function renderStoreGrid() {
    const elements = getStoreElements();
    if (!elements.grid) return;
    
    let html = '';
    
    for (const plugin of currentFilteredPlugins) {
        const installedPlugin = plugins.find(p => 
            p.id === plugin.id || 
            p.name === plugin.name ||
            (p.storeId && p.storeId === plugin.id)
        );
        
        const isInstalled = !!installedPlugin;
        
        html += `
            <div class="card store-card" data-plugin-id="${escapeHtml(plugin.id)}">
                <div class="store-card-header" onclick="openPluginDetail('${plugin.id}')">
                    <div class="store-card-icon" style="background: linear-gradient(135deg, #6366f1, #4f46e5);">
                        <i class="${plugin.icon || 'fas fa-puzzle-piece'}"></i>
                    </div>
                    <div class="store-card-info">
                        <h4 class="store-card-title">${escapeHtml(plugin.name || 'Без названия')}</h4>
                        <div class="store-card-meta">
                            <span class="store-card-version">v${escapeHtml(plugin.version || '1.0.0')}</span>
                            <span class="store-card-author">
                                <i class="fas fa-user"></i> ${escapeHtml(plugin.author || 'Unknown')}
                            </span>
                        </div>
                    </div>
                    ${plugin.category ? `<span class="store-card-category-badge">${escapeHtml(plugin.category)}</span>` : ''}
                </div>
                <p class="store-card-description" onclick="openPluginDetail('${plugin.id}')">${escapeHtml(plugin.description || 'Нет описания')}</p>
                ${plugin.screenshot ? `
                    <div class="store-card-screenshot" onclick="openPluginDetail('${plugin.id}')">
                        <img src="${escapeHtml(plugin.screenshot)}" alt="${escapeHtml(plugin.name)}" loading="lazy">
                    </div>
                ` : ''}
                <div class="store-card-actions">
                    ${isInstalled ? `
                        <span class="store-installed-badge">
                            <i class="fas fa-check-circle"></i> Установлено
                        </span>
                        <button class="btn btn-outline settings-btn" data-plugin-id="${escapeHtml(plugin.id)}" data-installed-id="${escapeHtml(installedPlugin?.id || '')}">
                            <i class="fas fa-cog"></i>
                        </button>
                    ` : `
                        <button class="btn btn-primary install-btn" data-plugin-id="${escapeHtml(plugin.id)}">
                            <i class="fas fa-download"></i> Установить
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    // Обновляем только если изменилось
    if (elements.grid.innerHTML !== html) {
        elements.grid.innerHTML = html;
        attachStoreCardEvents();
    }
}

function attachStoreCardEvents() {
    // Обработчики для кнопок установки
    document.querySelectorAll('.install-btn').forEach(btn => {
        btn.removeEventListener('click', handleInstallClick);
        btn.addEventListener('click', handleInstallClick);
    });
    
    // Обработчики для кнопок настроек
    document.querySelectorAll('.settings-btn').forEach(btn => {
        btn.removeEventListener('click', handleSettingsClick);
        btn.addEventListener('click', handleSettingsClick);
    });
}

function handleInstallClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const pluginId = btn.dataset.pluginId;
    if (pluginId) {
        installPluginFromStore(pluginId);
    }
}

function handleSettingsClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const pluginId = btn.dataset.pluginId;
    const installedId = btn.dataset.installedId;
    
    if (installedId) {
        openPluginSettings(installedId);
    } else if (pluginId) {
        openPluginSettingsFromStore(pluginId);
    }
}

function openPluginSettingsFromStore(pluginId) {
    const storePlugin = storePlugins.find(p => p.id === pluginId);
    if (!storePlugin) return;
    
    const installedPlugin = plugins.find(p => 
        p.id === pluginId || 
        p.name === storePlugin.name ||
        (p.storeId && p.storeId === pluginId)
    );
    
    if (installedPlugin) {
        openPluginSettings(installedPlugin.id);
    } else {
        showNotification('Плагин не найден', 'error');
    }
}

function openPluginDetail(pluginId) {
    const elements = getStoreElements();
    const plugin = storePlugins.find(p => p.id === pluginId);
    if (!plugin) return;
    
    const installedPlugin = plugins.find(p => 
        p.id === plugin.id || 
        p.name === plugin.name ||
        (p.storeId && p.storeId === plugin.id)
    );
    
    const isInstalled = !!installedPlugin;
    
    if (elements.modalTitle) {
        elements.modalTitle.textContent = plugin.name || 'Плагин';
    }
    
    if (elements.modalContent) {
        elements.modalContent.innerHTML = `
            <div class="plugin-detail-header">
                <div class="plugin-detail-icon" style="background: linear-gradient(135deg, #6366f1, #4f46e5);">
                    <i class="${plugin.icon || 'fas fa-puzzle-piece'}"></i>
                </div>
                <div class="plugin-detail-info">
                    <h2>${escapeHtml(plugin.name || 'Без названия')}</h2>
                    <div class="plugin-detail-meta">
                        <span class="plugin-detail-version">Версия ${escapeHtml(plugin.version || '1.0.0')}</span>
                        <span class="plugin-detail-author">
                            <i class="fas fa-user"></i> ${escapeHtml(plugin.author || 'Unknown')}
                        </span>
                        ${plugin.category ? `
                            <span class="plugin-detail-category">
                                <i class="fas fa-tag"></i> ${escapeHtml(plugin.category)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            ${plugin.screenshot ? `
                <div class="plugin-detail-screenshot">
                    <img src="${escapeHtml(plugin.screenshot)}" alt="${escapeHtml(plugin.name)}">
                </div>
            ` : ''}
            
            <div class="plugin-detail-section">
                <h3>Описание</h3>
                <p>${escapeHtml(plugin.description || 'Нет описания')}</p>
            </div>
            
            ${plugin.fullDescription ? `
                <div class="plugin-detail-section">
                    <h3>Подробнее</h3>
                    <p>${escapeHtml(plugin.fullDescription)}</p>
                </div>
            ` : ''}
            
            <div class="plugin-detail-actions">
                ${isInstalled ? `
                    <span class="installed-message">
                        <i class="fas fa-check-circle"></i> Плагин установлен (версия ${installedPlugin.version})
                    </span>
                    <button class="btn btn-outline" id="detailSettingsBtn" data-plugin-id="${plugin.id}" data-installed-id="${installedPlugin.id}">
                        <i class="fas fa-cog"></i> Настройки
                    </button>
                ` : `
                    <button class="btn btn-primary" id="detailInstallBtn" data-plugin-id="${plugin.id}">
                        <i class="fas fa-download"></i> Установить плагин
                    </button>
                    <button class="btn btn-outline" onclick="closePluginDetail()">
                        Закрыть
                    </button>
                `}
            </div>
        `;
        
        // Навешиваем обработчики на кнопки в модальном окне
        const installBtn = document.getElementById('detailInstallBtn');
        if (installBtn) {
            installBtn.onclick = function() {
                const pluginId = this.dataset.pluginId;
                installPluginFromStore(pluginId);
            };
        }
        
        const settingsBtn = document.getElementById('detailSettingsBtn');
        if (settingsBtn) {
            settingsBtn.onclick = function() {
                const installedId = this.dataset.installedId;
                closePluginDetail();
                openPluginSettings(installedId);
            };
        }
    }
    
    if (elements.modal) {
        elements.modal.classList.add('show');
    }
}

function closePluginDetail() {
    const elements = getStoreElements();
    if (elements.modal) {
        elements.modal.classList.remove('show');
    }
}

// Функция для извлечения настроек из комментария @settings (без флага s для совместимости)
function extractSettingsFromCode(code) {
    let customSettings = [];
    let defaultSettings = {};
    
    try {
        // Ищем блок @settings в коде. Используем [\s\S]*? вместо флага s
        const settingsMatch = code.match(/@settings\s+(\[.*?\])\s*\*\//) || 
                              code.match(/@settings\s+(\[.*?\])\s*\n/) ||
                              code.match(/@settings\s+(\[.*?\])\s*$/);
        
        if (settingsMatch && settingsMatch[1]) {
            // Парсим JSON из строки
            let settingsJson = settingsMatch[1]
                .replace(/\\n/g, '\\\\n')
                .replace(/\\"/g, '\\\\"')
                .replace(/\n/g, '')
                .replace(/\r/g, '');
            
            customSettings = JSON.parse(settingsJson);
            
            // Создаем настройки по умолчанию
            customSettings.forEach(setting => {
                if (setting.id) {
                    if (setting.type === 'switch') {
                        defaultSettings[setting.id] = setting.default !== undefined ? setting.default : false;
                    } else if (setting.type === 'select' && setting.options) {
                        defaultSettings[setting.id] = setting.default || setting.options[0]?.value || '';
                    } else {
                        defaultSettings[setting.id] = setting.default || '';
                    }
                }
            });
            
            console.log('Извлечены настройки из комментария:', customSettings);
            console.log('Настройки по умолчанию:', defaultSettings);
        }
    } catch (e) {
        console.error('Ошибка парсинга настроек:', e);
    }
    
    return { customSettings, defaultSettings };
}

async function installPluginFromStore(pluginId) {
    const plugin = storePlugins.find(p => p.id === pluginId);
    if (!plugin) return;
    
    // Проверяем, не установлен ли уже плагин
    if (plugins.some(p => 
        p.id === plugin.id || 
        p.name === plugin.name ||
        (p.storeId && p.storeId === plugin.id)
    )) {
        showNotification('Плагин уже установлен', 'error');
        return;
    }
    
    closePluginDetail();
    
    showNotification(`Загрузка плагина "${plugin.name}"...`, 'info');
    
    try {
        let code;
        
        if (plugin.code) {
            code = plugin.code;
        } else if (plugin.url) {
            const response = await fetch(plugin.url + '?t=' + Date.now());
            if (!response.ok) throw new Error('Не удалось загрузить плагин');
            code = await response.text();
        } else {
            throw new Error('Нет кода плагина');
        }
        
        // Извлекаем настройки из кода
        const { customSettings, defaultSettings } = extractSettingsFromCode(code);
        
        const newPlugin = {
            id: plugin.id || 'plugin_' + Date.now(),
            name: plugin.name || 'Без названия',
            description: plugin.description || 'Нет описания',
            version: plugin.version || '1.0.0',
            author: plugin.author || '',
            category: plugin.category || '',
            code: code,
            enabled: true,
            settings: defaultSettings,
            customSettings: customSettings,
            createdAt: new Date().toISOString(),
            storeId: plugin.id,
            installSource: 'store',
            lastChecked: new Date().toISOString(),
            updateAvailable: null
        };
        
        plugins.push(newPlugin);
        savePlugins();
        renderPlugins();
        updateStats();
        
        // Обновляем отображение магазина
        filterStorePlugins();
        
        showNotification(`Плагин "${plugin.name}" установлен`, 'success');
        
        if (newPlugin.enabled) {
            setTimeout(() => {
                try {
                    if (typeof executePlugin === 'function') {
                        executePlugin(newPlugin);
                    }
                } catch (error) {
                    console.error(`Error executing plugin ${newPlugin.name}:`, error);
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Failed to install plugin:', error);
        showNotification(`Ошибка установки: ${error.message}`, 'error');
    }
}

function openPluginSettings(pluginId) {
    const elements = getStoreElements();
    const plugin = plugins.find(p => p.id === pluginId);
    if (!plugin) return;
    
    if (elements.settingsTitle) {
        elements.settingsTitle.textContent = `Настройки: ${plugin.name}`;
    }
    
    if (elements.settingsContent) {
        elements.settingsContent.innerHTML = `
            <div class="plugin-settings-container">
                <div class="plugin-info">
                    <div class="plugin-version">Версия: ${plugin.version}</div>
                    <div class="plugin-author">Автор: ${plugin.author || 'Неизвестен'}</div>
                </div>
                <div id="pluginSettings" class="plugin-settings"></div>
            </div>
        `;
    }
    
    // Рендерим настройки
    setTimeout(() => {
        renderPluginSettings(pluginId);
    }, 50);
    
    if (elements.settingsModal) {
        elements.settingsModal.classList.add('show');
    }
}

function closePluginSettings() {
    const elements = getStoreElements();
    if (elements.settingsModal) {
        elements.settingsModal.classList.remove('show');
    }
}

function renderPluginSettings(pluginId) {
    const plugin = plugins.find(p => p.id === pluginId);
    if (!plugin) return;
    
    const settingsContainer = document.getElementById('pluginSettings');
    if (!settingsContainer) return;
    
    if (!plugin.customSettings || plugin.customSettings.length === 0) {
        settingsContainer.innerHTML = '<p class="text-secondary" style="padding: 20px; text-align: center;">У плагина нет настраиваемых параметров</p>';
        return;
    }
    
    let html = '<div class="plugin-settings-form">';
    
    plugin.customSettings.forEach(setting => {
        let value = plugin.settings?.[setting.id] !== undefined ? 
                     plugin.settings[setting.id] : setting.default;
        
        // Приводим к строке для безопасного отображения
        const stringValue = value !== null && value !== undefined ? String(value) : '';
        
        // Проверяем тип (поддерживаем и switch и checkbox)
        if (setting.type === 'switch' || setting.type === 'checkbox') {
            html += `
                <div class="plugin-setting-item switch-setting">
                    <div class="plugin-setting-info">
                        <div class="plugin-setting-label">${escapeHtml(setting.label || setting.id)}</div>
                        ${setting.hint ? `<div class="plugin-setting-hint">${escapeHtml(setting.hint)}</div>` : ''}
                    </div>
                    <label class="switch">
                        <input type="checkbox" 
                               data-setting="${setting.id}" 
                               ${value ? 'checked' : ''}
                               onchange="updatePluginSetting('${plugin.id}', '${setting.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            `;
        } else if (setting.type === 'select') {
            html += `
                <div class="plugin-setting-item">
                    <label class="plugin-setting-label">${escapeHtml(setting.label || setting.id)}</label>
                    <select class="plugin-setting-select" 
                            data-setting="${setting.id}"
                            onchange="updatePluginSetting('${plugin.id}', '${setting.id}', this.value)">
                        ${setting.options?.map(opt => {
                            const selected = String(value) === String(opt.value) ? 'selected' : '';
                            return `<option value="${escapeHtml(opt.value)}" ${selected}>${escapeHtml(opt.label)}</option>`;
                        }).join('')}
                    </select>
                    ${setting.hint ? `<div class="plugin-setting-hint">${escapeHtml(setting.hint)}</div>` : ''}
                </div>
            `;
        } else if (setting.type === 'textarea') {
            html += `
                <div class="plugin-setting-item">
                    <label class="plugin-setting-label">${escapeHtml(setting.label || setting.id)}</label>
                    <textarea class="plugin-setting-textarea" 
                              data-setting="${setting.id}"
                              placeholder="${escapeHtml(setting.placeholder || '')}"
                              rows="${setting.rows || 5}"
                              onchange="updatePluginSetting('${plugin.id}', '${setting.id}', this.value)">${escapeHtml(stringValue)}</textarea>
                    ${setting.hint ? `<div class="plugin-setting-hint">${escapeHtml(setting.hint)}</div>` : ''}
                </div>
            `;
        } else {
            // Обработка text, url и других типов
            html += `
                <div class="plugin-setting-item">
                    <label class="plugin-setting-label">${escapeHtml(setting.label || setting.id)}</label>
                    <input type="${setting.type === 'url' ? 'url' : 'text'}" 
                           class="plugin-setting-input" 
                           data-setting="${setting.id}"
                           value="${escapeHtml(stringValue)}"
                           placeholder="${escapeHtml(setting.placeholder || '')}"
                           onchange="updatePluginSetting('${plugin.id}', '${setting.id}', this.value)">
                    ${setting.hint ? `<div class="plugin-setting-hint">${escapeHtml(setting.hint)}</div>` : ''}
                </div>
            `;
        }
    });
    
    html += '</div>';
    settingsContainer.innerHTML = html;
}

function updatePluginSetting(pluginId, settingId, value) {
    const plugin = plugins.find(p => p.id === pluginId);
    if (!plugin) return;
    
    if (!plugin.settings) plugin.settings = {};
    plugin.settings[settingId] = value;
    
    savePlugins();
    
    // Уведомляем плагин об изменении настроек
    if (plugin.enabled) {
        try {
            if (typeof executePlugin === 'function') {
                executePlugin(plugin);
            }
        } catch (error) {
            console.error('Error updating plugin settings:', error);
        }
    }
    
    showNotification('Настройки сохранены', 'success');
}

// Исправленная функция checkForUpdates с параметром useExistingData
async function checkForUpdates(useExistingData = false) {
    if (!storeSettings.autoUpdate) return;
    
    const installedStorePlugins = plugins.filter(p => p.storeId || p.installSource === 'store');
    if (installedStorePlugins.length === 0) return;
    
    // Если не хотим использовать уже загруженные данные, обновляем список магазина
    if (!useExistingData) {
        try {
            await refreshStore(true);
        } catch (error) {
            console.error('Failed to refresh store for updates:', error);
            return;
        }
    }
    
    // Проверяем, что storePlugins не пуст (возможно, ошибка загрузки)
    if (!storePlugins || storePlugins.length === 0) {
        console.warn('No store plugins loaded, cannot check updates');
        return;
    }
    
    let updatesFound = 0;
    
    installedStorePlugins.forEach((installedPlugin) => {
        const storePlugin = storePlugins.find(p => p.id === installedPlugin.storeId || p.name === installedPlugin.name);
        
        if (storePlugin && storePlugin.version !== installedPlugin.version) {
            updatesFound++;
            showNotification(`Доступно обновление для "${installedPlugin.name}" v${storePlugin.version}`, 'info');
            
            installedPlugin.updateAvailable = storePlugin.version;
            installedPlugin.lastChecked = new Date().toISOString();
        }
    });
    
    if (updatesFound > 0) {
        savePlugins();
        renderPlugins();
        filterStorePlugins();
    }
    
    return updatesFound;
}

async function manualCheckForUpdates() {
    showNotification('Проверка обновлений...', 'info');
    const updatesFound = await checkForUpdates(false); // принудительно обновляем список
    if (updatesFound === 0) {
        showNotification('Все плагины обновлены', 'success');
    }
}

// Store settings functions
function initStoreSettings() {
    const autoUpdateToggle = document.getElementById('autoUpdateToggle');
    const storeUrlInput = document.getElementById('storeUrlInput');
    const saveUrlBtn = document.getElementById('saveStoreUrlBtn');
    const resetUrlBtn = document.getElementById('resetStoreUrlBtn');
    
    if (autoUpdateToggle) {
        autoUpdateToggle.classList.toggle('active', storeSettings.autoUpdate);
        autoUpdateToggle.onclick = function(e) {
            e.stopPropagation();
            toggleStoreSetting('autoUpdate', this);
        };
    }
    
    if (storeUrlInput) {
        storeUrlInput.value = storeSettings.storeUrl || '';
    }
    
    if (saveUrlBtn) {
        saveUrlBtn.onclick = saveStoreUrl;
    }
    
    if (resetUrlBtn) {
        resetUrlBtn.onclick = resetStoreUrl;
    }
}

function toggleStoreSetting(setting, element) {
    element.classList.toggle('active');
    storeSettings[setting] = element.classList.contains('active');
    saveStoreSettings();
    
    if (setting === 'autoUpdate') {
        showNotification(`Автопроверка обновлений ${storeSettings.autoUpdate ? 'включена' : 'отключена'}`, 'success');
        if (storeSettings.autoUpdate && storePlugins.length > 0) {
            checkForUpdates(true); // используем уже загруженные данные
        }
    }
}

function saveStoreUrl() {
    const storeUrlInput = document.getElementById('storeUrlInput');
    const newUrl = storeUrlInput.value.trim();
    
    if (newUrl) {
        storeSettings.storeUrl = newUrl;
        saveStoreSettings();
        showNotification('URL магазина сохранен', 'success');
        storePlugins = [];
        refreshStore();
    } else {
        showNotification('Введите корректный URL', 'error');
    }
}

function resetStoreUrl() {
    const defaultUrl = 'https://gist.githubusercontent.com/MaliStra/4a1eae7ebb1ef6a35ba52e5c8749a05e/raw/store_v2.js';
    storeSettings.storeUrl = defaultUrl;
    saveStoreSettings();
    
    const storeUrlInput = document.getElementById('storeUrlInput');
    if (storeUrlInput) {
        storeUrlInput.value = defaultUrl;
    }
    
    showNotification('URL магазина сброшен', 'success');
    storePlugins = [];
    refreshStore();
}

// Функция для обновления магазина после установки/удаления плагинов
function refreshStoreAfterPluginChange() {
    if (storeInitialized) {
        filterStorePlugins();
    }
}

// Экспортируем функции в глобальную область
window.initStore = initStore;
window.refreshStore = refreshStore;
window.filterStorePlugins = filterStorePlugins;
window.openPluginDetail = openPluginDetail;
window.closePluginDetail = closePluginDetail;
window.installPluginFromStore = installPluginFromStore;
window.openPluginSettings = openPluginSettings;
window.closePluginSettings = closePluginSettings;
window.updatePluginSetting = updatePluginSetting;
window.manualCheckForUpdates = manualCheckForUpdates;
window.saveStoreUrl = saveStoreUrl;
window.resetStoreUrl = resetStoreUrl;
window.toggleStoreSetting = toggleStoreSetting;