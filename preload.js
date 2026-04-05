const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем API для рендер-процесса
contextBridge.exposeInMainWorld('electronAPI', {
    // Управление окном
    reloadWindow: () => ipcRenderer.send('reload-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // Получить состояние максимизации
    isMaximized: () => ipcRenderer.invoke('is-maximized'),
    
    // Слушатель изменения состояния максимизации
    onUpdateMaximize: (callback) => {
        ipcRenderer.on('window-maximized', (event, isMaximized) => {
            callback(isMaximized);
        });
    },

    // ===== МЕТОДЫ ДЛЯ НАСТРОЕК СЕРВЕРА =====
    // Получить текущую конфигурацию сервера
    getServerConfig: () => ipcRenderer.invoke('get-server-config'),

    // Сохранить новую конфигурацию сервера
    saveServerConfig: (config) => ipcRenderer.send('save-server-config', config),

    // Перезапустить приложение
    relaunchApp: () => ipcRenderer.send('relaunch-app')
});

// Добавляем обработчик контекстного меню (правая кнопка мыши)
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    ipcRenderer.send('show-context-menu');
});