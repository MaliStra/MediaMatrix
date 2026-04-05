// ==================== НАСТРОЙКИ ПОРЯДКА МЕНЮ ====================

// Защита от множественных инициализаций
let menuSettingsInitialized = false;
let menuOrder = [];
let draggedItem = null;
let sidebarObserver = null;
let settingsObserver = null;

// Загружаем сохраненный порядок
try {
    menuOrder = JSON.parse(localStorage.getItem('menuOrder') || '[]');
} catch (e) {
    console.error('Error loading menu order:', e);
    menuOrder = [];
}

// Стандартные пункты меню
const DEFAULT_MENU_ITEMS = [
    { page: 'home', name: 'Главная', icon: 'fas fa-home', default: true },
    { page: 'store', name: 'Магазин', icon: 'fas fa-store', default: true },
    { page: 'plugins', name: 'Плагины', icon: 'fas fa-plug', default: true },
    { page: 'settings', name: 'Настройки', icon: 'fas fa-cog', default: true }
];

// Загружаем настройки меню
function loadMenuSettings() {
    if (!document.getElementById('menuItemsList')) return;
    
    try {
        const menuList = document.getElementById('menuItemsList');
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const menuItems = [];
        
        sidebarLinks.forEach(link => {
            const pageId = link.dataset.page;
            const icon = link.querySelector('i')?.className || 'fas fa-puzzle-piece';
            const name = link.querySelector('span')?.textContent || 'Пункт меню';
            const isDefault = DEFAULT_MENU_ITEMS.some(item => item.page === pageId);
            
            menuItems.push({
                page: pageId,
                name: name,
                icon: icon,
                default: isDefault
            });
        });
        
        const orderedItems = applyMenuOrder(menuItems);
        renderMenuSettings(orderedItems);
    } catch (e) {
        console.error('Error loading menu settings:', e);
    }
}

// Применяем сохраненный порядок
function applyMenuOrder(items) {
    if (!menuOrder || menuOrder.length === 0) return items;
    
    try {
        const itemsMap = new Map(items.map(item => [item.page, item]));
        const ordered = [];
        
        menuOrder.forEach(pageId => {
            if (itemsMap.has(pageId)) {
                ordered.push(itemsMap.get(pageId));
                itemsMap.delete(pageId);
            }
        });
        
        itemsMap.forEach(item => ordered.push(item));
        return ordered;
    } catch (e) {
        console.error('Error applying menu order:', e);
        return items;
    }
}

// Отрисовываем список
function renderMenuSettings(items) {
    const menuList = document.getElementById('menuItemsList');
    if (!menuList) return;
    
    try {
        let html = '';
        
        items.forEach((item, index) => {
            const isDefault = item.default ? 'default' : '';
            const defaultText = item.default ? 'Стандартный' : 'Плагин';
            
            html += `
                <div class="menu-item-settings" draggable="true" data-page="${item.page}" data-index="${index}">
                    <div class="menu-item-drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="menu-item-settings-icon">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="menu-item-settings-info">
                        <div class="menu-item-settings-name">${escapeHtml(item.name)}</div>
                        <span class="menu-item-settings-page">${item.page}</span>
                    </div>
                    <span class="menu-item-badge ${isDefault}">${defaultText}</span>
                </div>
            `;
        });
        
        menuList.innerHTML = html;
        initDragAndDrop();
    } catch (e) {
        console.error('Error rendering menu settings:', e);
    }
}

// Drag & Drop
function initDragAndDrop() {
    const items = document.querySelectorAll('.menu-item-settings');
    
    items.forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        item.removeEventListener('dragover', handleDragOver);
        item.removeEventListener('dragleave', handleDragLeave);
        item.removeEventListener('drop', handleDrop);
        
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.page);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.menu-item-settings').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedItem && this !== draggedItem) {
        const items = Array.from(document.querySelectorAll('.menu-item-settings'));
        const draggedIndex = items.indexOf(draggedItem);
        const targetIndex = items.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedItem, this);
        }
    }
}

// Сохраняем порядок
function saveMenuOrder() {
    try {
        const items = document.querySelectorAll('.menu-item-settings');
        const newOrder = [];
        
        items.forEach(item => {
            newOrder.push(item.dataset.page);
        });
        
        menuOrder = newOrder;
        localStorage.setItem('menuOrder', JSON.stringify(menuOrder));
        
        // Применяем к боковому меню
        applyOrderToSidebar();
        
        // Обновляем карусель
        if (typeof window.renderCarousel === 'function') {
            setTimeout(() => window.renderCarousel(), 50);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Порядок меню сохранен', 'success');
        }
    } catch (e) {
        console.error('Error saving menu order:', e);
    }
}

// Применяем порядок к боковому меню
function applyOrderToSidebar() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (!sidebar) return;
    
    try {
        const links = Array.from(document.querySelectorAll('.sidebar-link'));
        const linksMap = new Map(links.map(link => [link.dataset.page, link]));
        
        // Временно отключаем наблюдатель
        if (sidebarObserver) {
            sidebarObserver.disconnect();
        }
        
        sidebar.innerHTML = '';
        
        if (menuOrder && menuOrder.length > 0) {
            menuOrder.forEach(pageId => {
                if (linksMap.has(pageId)) {
                    sidebar.appendChild(linksMap.get(pageId));
                    linksMap.delete(pageId);
                }
            });
        }
        
        linksMap.forEach(link => {
            sidebar.appendChild(link);
        });
        
        // Восстанавливаем наблюдатель
        if (sidebarObserver) {
            sidebarObserver.observe(sidebar, { childList: true, subtree: true });
        }
        
        // Обновляем активный пункт
        const currentPage = document.querySelector('.page.active')?.id;
        if (currentPage) {
            document.querySelectorAll('.sidebar-link').forEach(l => {
                l.classList.toggle('active', l.dataset.page === currentPage);
            });
        }
    } catch (e) {
        console.error('Error applying order to sidebar:', e);
    }
}

// Сброс порядка
function resetMenuOrder() {
    try {
        menuOrder = [];
        localStorage.removeItem('menuOrder');
        
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar) {
            const links = Array.from(document.querySelectorAll('.sidebar-link'));
            
            // Временно отключаем наблюдатель
            if (sidebarObserver) {
                sidebarObserver.disconnect();
            }
            
            const defaultItems = [];
            const pluginItems = [];
            
            links.forEach(link => {
                if (DEFAULT_MENU_ITEMS.some(item => item.page === link.dataset.page)) {
                    defaultItems.push(link);
                } else {
                    pluginItems.push(link);
                }
            });
            
            const orderedDefaults = [];
            DEFAULT_MENU_ITEMS.forEach(item => {
                const found = defaultItems.find(link => link.dataset.page === item.page);
                if (found) orderedDefaults.push(found);
            });
            
            sidebar.innerHTML = '';
            orderedDefaults.forEach(item => sidebar.appendChild(item));
            pluginItems.forEach(item => sidebar.appendChild(item));
            
            // Восстанавливаем наблюдатель
            if (sidebarObserver) {
                sidebarObserver.observe(sidebar, { childList: true, subtree: true });
            }
        }
        
        loadMenuSettings();
        
        if (typeof window.renderCarousel === 'function') {
            setTimeout(() => window.renderCarousel(), 50);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Порядок меню сброшен', 'success');
        }
    } catch (e) {
        console.error('Error resetting menu order:', e);
    }
}

// Инициализация
function initMenuSettings() {
    if (menuSettingsInitialized) return;
    menuSettingsInitialized = true;
    
    try {
        // Применяем сохраненный порядок
        if (menuOrder.length > 0) {
            applyOrderToSidebar();
        }
        
        // Наблюдаем за открытием страницы настроек
        const settingsPage = document.getElementById('settings');
        if (settingsPage && !settingsObserver) {
            settingsObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('active')) {
                        setTimeout(loadMenuSettings, 100);
                    }
                });
            });
            
            settingsObserver.observe(settingsPage, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        }
        
        // Наблюдаем за изменениями в боковом меню
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar && !sidebarObserver) {
            sidebarObserver = new MutationObserver(() => {
                // Применяем порядок только если он есть
                if (menuOrder.length > 0) {
                    applyOrderToSidebar();
                }
                
                // Обновляем карусель
                if (typeof window.renderCarousel === 'function') {
                    window.renderCarousel();
                }
            });
            
            sidebarObserver.observe(sidebar, { childList: true, subtree: true });
        }
    } catch (e) {
        console.error('Error initializing menu settings:', e);
    }
}

// Запускаем после загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMenuSettings, 300);
    });
} else {
    setTimeout(initMenuSettings, 300);
}

// Экспортируем функции
window.loadMenuSettings = loadMenuSettings;
window.saveMenuOrder = saveMenuOrder;
window.resetMenuOrder = resetMenuOrder;