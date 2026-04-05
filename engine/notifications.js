// ==================== NOTIFICATIONS ====================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
        renderNotificationsList();
        markAllAsRead();
    }
}

function markAllAsRead() {
    notificationsHistory.forEach(n => n.read = true);
    unreadCount = 0;
    saveNotificationsHistory();
    updateNotificationBadge();
}

function clearAllNotifications() {
    notificationsHistory = [];
    unreadCount = 0;
    saveNotificationsHistory();
    renderNotificationsList();
    updateNotificationBadge();
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

function renderNotificationsList() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    if (notificationsHistory.length === 0) {
        list.innerHTML = '<div class="notifications-empty">Нет уведомлений</div>';
        return;
    }

    list.innerHTML = notificationsHistory.map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
            <div class="notification-item-icon">
                <i class="fas ${n.type === 'error' ? 'fa-exclamation-circle' : n.type === 'info' ? 'fa-info-circle' : 'fa-check-circle'}" style="color: ${n.type === 'error' ? '#ef4444' : n.type === 'info' ? '#3b82f6' : '#22c55e'};"></i>
            </div>
            <div class="notification-item-content">
                <div class="notification-item-message">${escapeHtml(n.message)}</div>
                <div class="notification-item-time">${escapeHtml(n.time)}</div>
            </div>
        </div>
    `).join('');
}

function showNotification(message, type = 'success') {
    try {
        if (!generalSettings.notifications && type !== 'error') {
            return;
        }
        
        const notificationIcon = document.getElementById('notificationIcon');
        const notificationText = document.getElementById('notificationText');
        const notificationEl = document.getElementById('notification');

        if (!notificationIcon || !notificationText || !notificationEl) return;

        notificationText.textContent = message;
        notificationIcon.className = type === 'error' 
            ? 'fas fa-exclamation-circle error' 
            : type === 'info'
                ? 'fas fa-info-circle info'
                : 'fas fa-check-circle success';

        notificationEl.classList.add('show');
        
        setTimeout(() => {
            notificationEl.classList.remove('show');
        }, 3000);

        const notif = {
            id: Date.now() + Math.random(),
            message,
            type,
            time: new Date().toLocaleString('ru'),
            read: false
        };
        notificationsHistory.unshift(notif);
        if (notificationsHistory.length > 50) notificationsHistory.pop();
        unreadCount++;
        saveNotificationsHistory();
        updateNotificationBadge();
    } catch (error) {
        console.warn('Failed to show notification:', error);
    }
}