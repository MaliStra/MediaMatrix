// ==================== UI RENDERING ====================
function renderPlugins() {
    const container = document.getElementById('pluginsList');
    const noPlugins = document.getElementById('noPlugins');

    if (plugins.length === 0) {
        if (container) container.classList.add('hidden');
        if (noPlugins) noPlugins.classList.remove('hidden');
        return;
    }

    if (container) container.classList.remove('hidden');
    if (noPlugins) noPlugins.classList.add('hidden');

    container.innerHTML = plugins.map(plugin => `
        <div class="card plugin-card">
            <div class="plugin-header">
                <div class="plugin-info">
                    <div class="plugin-icon ${plugin.enabled ? 'active' : 'inactive'}">
                        <i class="fas fa-puzzle-piece"></i>
                    </div>
                    <div>
                        <h4 class="plugin-name">${escapeHtml(plugin.name)}</h4>
                        <p class="plugin-version">v${escapeHtml(plugin.version)}</p>
                    </div>
                </div>
                <div class="toggle-switch ${plugin.enabled ? 'active' : ''}" onclick="togglePlugin('${plugin.id}')"></div>
            </div>
            <p class="plugin-desc">${escapeHtml(plugin.description)}</p>
            <div class="plugin-actions">
                <button onclick="openPluginSettings('${plugin.id}')" class="btn btn-outline">
                    <i class="fas fa-cog"></i> Настройки
                </button>
                ${plugin.updateAvailable ? `
                    <button onclick="updatePlugin('${plugin.id}')" class="btn btn-primary" style="background: #f59e0b;">
                        <i class="fas fa-arrow-up"></i> v${plugin.updateAvailable}
                    </button>
                ` : ''}
                <button onclick="deletePlugin('${plugin.id}')" class="btn btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            ${plugin.installSource === 'store' ? '<div class="plugin-store-badge"><i class="fas fa-store"></i> Из магазина</div>' : ''}
            ${plugin.category ? `<div class="plugin-category-badge">${escapeHtml(plugin.category)}</div>` : ''}
        </div>
    `).join('');
}

function updateStats() {
    const pluginCountEl = document.getElementById('pluginCount');
    const activeCountEl = document.getElementById('activeCount');
    
    if (pluginCountEl) pluginCountEl.textContent = plugins.length;
    if (activeCountEl) activeCountEl.textContent = plugins.filter(p => p.enabled).length;
}

// ===== ФУНКЦИЯ ДЛЯ УПРАВЛЕНИЯ ВИДИМОСТЬЮ КАРУСЕЛИ =====
function applyShowCarousel() {
    const carouselSection = document.querySelector('.plugins-carousel-section');
    if (!carouselSection) return;
    if (generalSettings.showCarousel) {
        carouselSection.style.display = 'block';
    } else {
        carouselSection.style.display = 'none';
    }
}