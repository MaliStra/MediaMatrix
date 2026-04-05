// ==================== PLUGINS MANAGEMENT ====================
function openInstallModal() {
    document.getElementById('installModal').classList.add('show');
    switchInstallTab('file');
    resetInstallForm();
}

function closeInstallModal() {
    document.getElementById('installModal').classList.remove('show');
    resetInstallForm();
}

function resetInstallForm() {
    document.getElementById('pluginName').value = '';
    document.getElementById('pluginDesc').value = '';
    document.getElementById('pluginVersion').value = '';
    document.getElementById('pluginCode').value = '';
    document.getElementById('pluginUrl').value = '';
    document.getElementById('selectedFileName').textContent = 'Файл не выбран';
    selectedPluginFile = null;
    currentPluginMeta = null;
    
    document.querySelectorAll('.plugin-meta-preview').forEach(p => {
        p.classList.remove('show', 'success', 'error');
        p.innerHTML = '';
    });
    
    const content = document.getElementById('manualOverrideContent');
    const override = document.querySelector('.manual-override');
    if (content) content.classList.remove('show');
    if (override) override.classList.remove('open');
}

function switchInstallTab(tab) {
    document.querySelectorAll('.install-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.install-tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    
    currentPluginMeta = null;
    document.querySelectorAll('.plugin-meta-preview').forEach(p => {
        p.classList.remove('show', 'success', 'error');
    });
}

function toggleManualOverride() {
    const content = document.getElementById('manualOverrideContent');
    const arrow = document.getElementById('manualOverrideArrow');
    const override = document.querySelector('.manual-override');
    
    if (content) content.classList.toggle('show');
    if (override) override.classList.toggle('open');
}

function showMetaPreview(containerId, meta, isError = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (isError) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
                <span>${meta}</span>
            </div>
        `;
        container.classList.add('show', 'error');
        container.classList.remove('success');
        return;
    }
    
    currentPluginMeta = meta;
    
    const tags = [];
    if (meta.version) tags.push(`v${meta.version}`);
    if (meta.author) tags.push(meta.author);
    if (meta.settings && meta.settings.length > 0) tags.push(`${meta.settings.length} настроек`);
    
    container.innerHTML = `
        <div class="plugin-meta-header">
            <div class="plugin-meta-icon">
                <i class="fas fa-puzzle-piece"></i>
            </div>
            <div>
                <div class="plugin-meta-title">${escapeHtml(meta.name) || 'Без названия'}</div>
                <div class="plugin-meta-version">Версия ${meta.version}</div>
            </div>
        </div>
        ${meta.description ? `<div class="plugin-meta-desc">${escapeHtml(meta.description)}</div>` : ''}
        <div class="plugin-meta-tags">
            ${tags.map(t => `<span class="plugin-meta-tag">${escapeHtml(t)}</span>`).join('')}
            <span class="plugin-meta-tag" style="background: #22c55e22; color: #22c55e; border-color: #22c55e;">
                <i class="fas fa-check"></i> Готово к установке
            </span>
        </div>
    `;
    container.classList.add('show', 'success');
    container.classList.remove('error');
}

async function loadPluginFromUrl() {
    const url = document.getElementById('pluginUrl').value.trim();
    
    if (!url) {
        showNotification('Введите ссылку на плагин', 'error');
        return;
    }
    
    const preview = document.getElementById('urlMetaPreview');
    preview.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="loading-spinner" style="width: 24px; height: 24px; border-width: 3px;"></div>
            <span>Загрузка плагина...</span>
        </div>
    `;
    preview.classList.add('show');
    preview.classList.remove('success', 'error');
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Не удалось загрузить файл');
        
        const code = await response.text();
        const meta = parsePluginMeta(code);
        
        document.getElementById('pluginCode').value = code;
        selectedPluginFile = code;
        
        showMetaPreview('urlMetaPreview', meta);
    } catch (error) {
        showMetaPreview('urlMetaPreview', error.message, true);
    }
}

function parseCodeMeta() {
    const code = document.getElementById('pluginCode').value.trim();
    if (!code) {
        showNotification('Введите код плагина', 'error');
        return;
    }
    
    const meta = parsePluginMeta(code);
    showMetaPreview('codeMetaPreview', meta);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('selectedFileName').textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedPluginFile = e.target.result;
            document.getElementById('pluginCode').value = selectedPluginFile;
            
            const meta = parsePluginMeta(selectedPluginFile);
            showMetaPreview('fileMetaPreview', meta);
        };
        reader.readAsText(file);
    }
}

function installPlugin() {
    const code = document.getElementById('pluginCode').value.trim() || selectedPluginFile;

    if (!code) {
        showNotification('Добавьте JavaScript код', 'error');
        return;
    }

    const meta = currentPluginMeta || parsePluginMeta(code);
    
    const name = document.getElementById('pluginName').value.trim() || meta.name || 'Без названия';
    const desc = document.getElementById('pluginDesc').value.trim() || meta.description || 'Без описания';
    const version = document.getElementById('pluginVersion').value.trim() || meta.version || '1.0.0';

    const plugin = {
        id: Date.now().toString(),
        name,
        description: desc,
        version,
        author: meta.author || '',
        code,
        enabled: true,
        settings: {},
        customSettings: meta.settings || [],
        createdAt: new Date().toISOString()
    };

    plugins.push(plugin);
    savePlugins();
    renderPlugins();
    updateStats();
    closeInstallModal();
    showNotification(`Плагин "${name}" установлен`);

    if (plugin.enabled) {
        setTimeout(() => {
            try {
                executePlugin(plugin);
            } catch (error) {
                console.error(`Error executing plugin ${plugin.name}:`, error);
            }
        }, 100);
    }
    
    // Обновляем карусель
    if (typeof renderCarousel === 'function') {
        renderCarousel();
    }
}

function togglePlugin(id) {
    const plugin = plugins.find(p => p.id === id);
    if (plugin) {
        plugin.enabled = !plugin.enabled;
        savePlugins();
        renderPlugins();
        updateStats();
        showNotification(`Плагин "${plugin.name}" ${plugin.enabled ? 'включён' : 'выключен'}`);
        
        // Обновляем карусель
        if (typeof renderCarousel === 'function') {
            renderCarousel();
        }
        
        // Перезагружаем окно после отключения плагина
        if (window.electronAPI) {
            setTimeout(() => window.electronAPI.reloadWindow(), 500);
        }
        
        if (plugin.enabled) {
            setTimeout(() => {
                try {
                    executePlugin(plugin);
                } catch (error) {
                    console.error(`Error executing plugin ${plugin.name}:`, error);
                }
            }, 100);
        }
    }
}

function deletePlugin(id) {
    const plugin = plugins.find(p => p.id === id);
    if (plugin) {
        pluginToDelete = plugin;
        document.getElementById('deletePluginName').textContent = plugin.name;
        document.getElementById('deleteConfirmModal').classList.add('show');
    }
}

function closeDeleteConfirm() {
    document.getElementById('deleteConfirmModal').classList.remove('show');
    pluginToDelete = null;
}

function confirmDeletePlugin() {
    if (!pluginToDelete) return;
    
    const pluginName = pluginToDelete.name;
    plugins = plugins.filter(p => p.id !== pluginToDelete.id);
    savePlugins();
    
    closeDeleteConfirm();
    showNotification(`Плагин "${pluginName}" удалён`);
    
    if (document.getElementById('store').classList.contains('active')) {
        filterStorePlugins();
    }
    
    renderPlugins();
    updateStats();
    // Обновляем карусель
    if (typeof renderCarousel === 'function') {
        renderCarousel();
    }

    // Перезагружаем окно после удаления плагина
    if (window.electronAPI) {
        setTimeout(() => window.electronAPI.reloadWindow(), 500);
    }
}

function openPluginSettings(id) {
    const plugin = plugins.find(p => p.id === id);
    if (!plugin) return;

    document.getElementById('pluginSettingsTitle').textContent = `Настройки: ${plugin.name}`;
    
    const hasCustomSettings = plugin.customSettings && plugin.customSettings.length > 0;
    const hasUpdate = plugin.updateAvailable;
    
    const content = document.getElementById('pluginSettingsContent');
    content.innerHTML = `
        <div class="plugin-settings-tabs">
            <button class="plugin-settings-tab active" onclick="switchPluginSettingsTab('info', this)">
                <i class="fas fa-info-circle"></i> Информация
            </button>
            <button class="plugin-settings-tab" onclick="switchPluginSettingsTab('custom', this)">
                <i class="fas fa-sliders-h"></i> Настройки плагина
            </button>
            <button class="plugin-settings-tab" onclick="switchPluginSettingsTab('code', this)">
                <i class="fas fa-code"></i> Код
            </button>
        </div>

        <!-- Info Tab -->
        <div id="pluginTab_info" class="plugin-settings-content active">
            <div class="form-group">
                <label class="form-label">Название</label>
                <input type="text" id="editPluginName" class="form-input" value="${escapeHtml(plugin.name)}">
            </div>
            <div class="form-group">
                <label class="form-label">Описание</label>
                <textarea id="editPluginDesc" class="form-textarea" rows="2">${escapeHtml(plugin.description)}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Версия</label>
                <input type="text" id="editPluginVersion" class="form-input" value="${escapeHtml(plugin.version)}">
            </div>
            <div class="info-box">
                <h4>Информация</h4>
                <p>ID: ${plugin.id}</p>
                <p>Создан: ${new Date(plugin.createdAt).toLocaleString('ru')}</p>
                <p>Статус: ${plugin.enabled ? 'Активен' : 'Отключён'}</p>
                ${plugin.author ? `<p>Автор: ${escapeHtml(plugin.author)}</p>` : ''}
                ${plugin.category ? `<p>Категория: ${escapeHtml(plugin.category)}</p>` : ''}
                ${plugin.installSource === 'store' ? '<p><i class="fas fa-store"></i> Из магазина</p>' : ''}
                ${hasUpdate ? `
                    <div class="update-available">
                        <i class="fas fa-arrow-up"></i>
                        <span>Доступно обновление до версии ${plugin.updateAvailable}</span>
                        <button onclick="updatePlugin('${plugin.id}')" class="btn btn-primary btn-sm">
                            Обновить
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Custom Settings Tab -->
        <div id="pluginTab_custom" class="plugin-settings-content">
            ${hasCustomSettings ? `
                <div class="custom-settings-list">
                    ${plugin.customSettings.map(setting => renderCustomSetting(setting, plugin.settings[setting.id])).join('')}
                </div>
            ` : `
                <div class="no-custom-settings">
                    <i class="fas fa-cog"></i>
                    <p>У этого плагина нет дополнительных настроек</p>
                </div>
            `}
        </div>

        <!-- Code Tab -->
        <div id="pluginTab_code" class="plugin-settings-content">
            <div class="form-group">
                <label class="form-label">Код плагина</label>
                <textarea id="editPluginCode" class="form-textarea code" rows="12">${escapeHtml(plugin.code)}</textarea>
            </div>
        </div>

        <div class="btn-group" style="margin-top: 24px;">
            <button onclick="savePluginSettings('${plugin.id}')" class="btn btn-primary" style="flex: 1;">
                <i class="fas fa-save"></i> Сохранить
            </button>
            <button onclick="closePluginSettings()" class="btn btn-outline" style="flex: 1;">
                Отмена
            </button>
        </div>
    `;

    document.getElementById('pluginSettingsModal').classList.add('show');
}

function renderCustomSetting(setting, value) {
    const id = `customSetting_${setting.id}`;
    const currentValue = value !== undefined ? value : (setting.default || '');
    
    let inputHtml = '';
    
    switch (setting.type) {
        case 'text':
        case 'password':
        case 'url':
            inputHtml = `
                <input type="${setting.type}" id="${id}" class="form-input" 
                       placeholder="${escapeHtml(setting.placeholder || '')}" 
                       value="${escapeHtml(currentValue)}">
            `;
            break;
        case 'textarea':
            inputHtml = `
                <textarea id="${id}" class="form-textarea" rows="3" 
                          placeholder="${escapeHtml(setting.placeholder || '')}">${escapeHtml(currentValue)}</textarea>
            `;
            break;
        case 'checkbox':
            inputHtml = `
                <div class="toggle-switch ${currentValue ? 'active' : ''}" 
                     id="${id}" 
                     onclick="this.classList.toggle('active')"></div>
            `;
            break;
        case 'select':
            inputHtml = `
                <select id="${id}" class="form-input">
                    ${(setting.options || []).map(opt => 
                        `<option value="${escapeHtml(opt.value)}" ${currentValue === opt.value ? 'selected' : ''}>
                            ${escapeHtml(opt.label)}
                        </option>`
                    ).join('')}
                </select>
            `;
            break;
        default:
            inputHtml = `
                <input type="text" id="${id}" class="form-input" 
                       placeholder="${escapeHtml(setting.placeholder || '')}" 
                       value="${escapeHtml(currentValue)}">
            `;
    }
    
    return `
        <div class="custom-setting-item" data-setting-id="${setting.id}" data-setting-type="${setting.type}">
            <label>${escapeHtml(setting.label)}</label>
            ${setting.hint ? `<div class="hint">${escapeHtml(setting.hint)}</div>` : ''}
            ${inputHtml}
        </div>
    `;
}

function switchPluginSettingsTab(tab, btn) {
    document.querySelectorAll('.plugin-settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.plugin-settings-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`pluginTab_${tab}`).classList.add('active');
}

function closePluginSettings() {
    document.getElementById('pluginSettingsModal').classList.remove('show');
}

function savePluginSettings(id) {
    const plugin = plugins.find(p => p.id === id);
    if (!plugin) return;

    plugin.name = document.getElementById('editPluginName').value.trim() || plugin.name;
    plugin.description = document.getElementById('editPluginDesc').value.trim() || plugin.description;
    plugin.version = document.getElementById('editPluginVersion').value.trim() || plugin.version;
    plugin.code = document.getElementById('editPluginCode').value;

    document.querySelectorAll('.custom-setting-item').forEach(item => {
        const settingId = item.dataset.settingId;
        const settingType = item.dataset.settingType;
        const input = item.querySelector(`#customSetting_${settingId}`);
        
        if (input) {
            if (settingType === 'checkbox') {
                plugin.settings[settingId] = input.classList.contains('active');
            } else {
                plugin.settings[settingId] = input.value;
            }
        }
    });

    savePlugins();
    renderPlugins();
    closePluginSettings();
    showNotification('Настройки сохранены');
    
    if (plugin.enabled) {
        setTimeout(() => {
            try {
                executePlugin(plugin);
            } catch (error) {
                console.error(`Error executing plugin ${plugin.name}:`, error);
            }
        }, 100);
    }
    
    // Обновляем карусель (на случай, если изменилось название или другие метаданные)
    if (typeof renderCarousel === 'function') {
        renderCarousel();
    }
}

function executePlugin(plugin) {
    if (!plugin || !plugin.code) {
        console.warn('Plugin has no code');
        return;
    }
    
    try {
        const pluginAPI = {
            id: plugin.id,
            showNotification: (message, type) => {
                try {
                    showNotification(message, type);
                } catch (e) {
                    console.warn('Failed to show notification:', e);
                }
            },
            getSettings: () => {
                try {
                    return plugin.settings || {};
                } catch (e) {
                    console.warn('Failed to get settings:', e);
                    return {};
                }
            },
            saveSettings: (settings) => {
                try {
                    const p = plugins.find(p => p.id === plugin.id);
                    if (p) {
                        p.settings = { ...p.settings, ...settings };
                        savePlugins();
                    }
                } catch (e) {
                    console.warn('Failed to save settings:', e);
                }
            },
            addMenuItem: (id, icon, label) => {
                try {
                    if (!id || !icon || !label) return;
                    if (document.querySelector(`[data-page="${id}"]`)) return;
                    
                    const nav = document.querySelector('.sidebar-nav');
                    if (!nav) return;
                    
                    const link = document.createElement('a');
                    link.href = '#';
                    link.className = 'sidebar-link';
                    link.dataset.page = id;
                    link.innerHTML = `<i class="${icon}"></i><span>${label}</span>`;
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        try {
                            navigateTo(id);
                        } catch (e) {
                            console.warn('Failed to navigate:', e);
                        }
                    });
                    nav.appendChild(link);
                    
                    // Обновляем карусель после добавления пункта
                    if (typeof renderCarousel === 'function') {
                        renderCarousel();
                    }
                } catch (e) {
                    console.warn('Failed to add menu item:', e);
                }
            },
            removeMenuItem: (id) => {
                try {
                    const link = document.querySelector(`[data-page="${id}"]`);
                    if (link) link.remove();
                    // Обновляем карусель после удаления пункта
                    if (typeof renderCarousel === 'function') {
                        renderCarousel();
                    }
                } catch (e) {
                    console.warn('Failed to remove menu item:', e);
                }
            },
            addPage: (id, content) => {
                try {
                    if (!id || !content) return;
                    if (document.getElementById(id)) return;
                    
                    const main = document.querySelector('.main-content');
                    if (!main) return;
                    
                    const page = document.createElement('section');
                    page.id = id;
                    page.className = 'page';
                    page.innerHTML = content;
                    main.appendChild(page);
                } catch (e) {
                    console.warn('Failed to add page:', e);
                }
            },
            removePage: (id) => {
                try {
                    const page = document.getElementById(id);
                    if (page) page.remove();
                } catch (e) {
                    console.warn('Failed to remove page:', e);
                }
            },
            updatePageContent: (id, content) => {
                try {
                    const page = document.getElementById(id);
                    if (page) page.innerHTML = content;
                } catch (e) {
                    console.warn('Failed to update page content:', e);
                }
            },
            navigateTo: (page) => {
                try {
                    navigateTo(page);
                } catch (e) {
                    console.warn('Failed to navigate:', e);
                }
            },
            getStorePlugins: () => {
                try {
                    return storePlugins || [];
                } catch (e) {
                    console.warn('Failed to get store plugins:', e);
                    return [];
                }
            },
            installFromStore: (pluginId) => {
                try {
                    installPluginFromStore(pluginId);
                } catch (e) {
                    console.warn('Failed to install from store:', e);
                }
            },
            checkForUpdates: () => {
                try {
                    checkForUpdates();
                } catch (e) {
                    console.warn('Failed to check for updates:', e);
                }
            },
            updatePlugin: (pluginId) => {
                try {
                    updatePlugin(pluginId);
                } catch (e) {
                    console.warn('Failed to update plugin:', e);
                }
            }
        };
        
        const func = new Function('pluginAPI', plugin.code);
        func(pluginAPI);
    } catch (error) {
        console.error(`Error executing plugin ${plugin.name}:`, error);
        try {
            showNotification(`Ошибка в плагине "${plugin.name}"`, 'error');
        } catch (e) {
            // Ignore
        }
    }
}

async function updatePlugin(pluginId) {
    const plugin = plugins.find(p => p.id === pluginId);
    if (!plugin) return;
    
    const storePlugin = storePlugins.find(p => p.id === plugin.storeId || p.name === plugin.name);
    if (!storePlugin) {
        showNotification('Плагин не найден в магазине', 'error');
        return;
    }
    
    showNotification(`Обновление плагина "${plugin.name}"...`, 'info');
    
    try {
        let code;
        
        if (storePlugin.code) {
            code = storePlugin.code;
        } else if (storePlugin.url) {
            const response = await fetch(storePlugin.url);
            if (!response.ok) throw new Error('Не удалось загрузить обновление');
            code = await response.text();
        } else {
            throw new Error('Нет кода плагина');
        }
        
        plugin.version = storePlugin.version;
        plugin.code = code;
        plugin.description = storePlugin.description || plugin.description;
        plugin.author = storePlugin.author || plugin.author;
        plugin.category = storePlugin.category || plugin.category;
        plugin.updatedAt = new Date().toISOString();
        delete plugin.updateAvailable;
        
        savePlugins();
        renderPlugins();
        filterStorePlugins();
        
        showNotification(`Плагин "${plugin.name}" обновлен до версии ${storePlugin.version}`, 'success');
        
        if (plugin.enabled) {
            setTimeout(() => {
                try {
                    executePlugin(plugin);
                } catch (error) {
                    console.error(`Error executing plugin ${plugin.name}:`, error);
                }
            }, 100);
        }
        
        // Обновляем карусель
        if (typeof renderCarousel === 'function') {
            renderCarousel();
        }
        
    } catch (error) {
        console.error('Failed to update plugin:', error);
        showNotification(`Ошибка обновления: ${error.message}`, 'error');
    }
}