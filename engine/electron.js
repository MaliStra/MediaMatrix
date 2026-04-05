// ==================== ELECTRON INTEGRATION ====================
    // Initialize title bar controls (Electron only)
    document.addEventListener('DOMContentLoaded', () => {
        const reloadBtn = document.getElementById('reload-btn');
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');
        const maximizeIcon = maximizeBtn?.querySelector('.maximize-icon');
        const restoreIcon = maximizeBtn?.querySelector('.restore-icon');
        
        // Проверяем, запущено ли приложение в Electron
        if (window.electronAPI) {
            // Electron version - показываем и настраиваем кнопки
            if (minimizeBtn) minimizeBtn.style.display = 'flex';
            if (maximizeBtn) maximizeBtn.style.display = 'flex';
            if (closeBtn) closeBtn.style.display = 'flex';
            if (reloadBtn) reloadBtn.style.display = 'flex';
            
            reloadBtn?.addEventListener('click', () => {
                window.electronAPI.reloadWindow();
            });
            
            minimizeBtn?.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });
            
            maximizeBtn?.addEventListener('click', () => {
                window.electronAPI.maximizeWindow();
            });
            
            closeBtn?.addEventListener('click', () => {
                window.electronAPI.closeWindow();
            });
            
            window.electronAPI.onUpdateMaximize?.((isMaximized) => {
                if (isMaximized) {
                    if (maximizeIcon) maximizeIcon.style.display = 'none';
                    if (restoreIcon) restoreIcon.style.display = 'block';
                    if (maximizeBtn) maximizeBtn.title = 'Восстановить';
                } else {
                    if (maximizeIcon) maximizeIcon.style.display = 'block';
                    if (restoreIcon) restoreIcon.style.display = 'none';
                    if (maximizeBtn) maximizeBtn.title = 'Развернуть';
                }
            });
        } else {
        // Опционально: можно скрыть весь titlebar или изменить его вид
           const titlebar = document.querySelector('.titlebar');
           if (titlebar) {
            titlebar.textContent = 'WebMediaMatrix - Внимание в веб версии доступны не все функции!'; 
            titlebar.style.fontWeight = 'bold';
            titlebar.style.color = '#fcaeae';
         }
        }
    });