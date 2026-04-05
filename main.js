const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const DEFAULT_PORT = 3000;
let mainWindow = null;
let server = null;
let tray = null;
let willQuit = false;

// ===== КОНФИГУРАЦИЯ СЕРВЕРА =====
let serverConfig = {
    port: DEFAULT_PORT,
    cors: true,
    webSecurity: false
};

// Загрузить конфигурацию из файла
function loadServerConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const loaded = JSON.parse(data);
            serverConfig = { ...serverConfig, ...loaded };
        } else {
            saveServerConfig(serverConfig);
        }
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Сохранить конфигурацию в файл
function saveServerConfig(config) {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        serverConfig = config;
    } catch (error) {
        console.error('Failed to save config:', error);
    }
}

// Запуск Express-сервера для раздачи статических файлов
function startServer() {
    return new Promise((resolve) => {
        const serverApp = express();

        if (serverConfig.cors) {
            serverApp.use(cors());
        }

        // Определяем правильную директорию для статических файлов
        let staticDir;
        if (app.isPackaged) {
            // В собранном приложении файлы лежат в папке resources
            staticDir = process.resourcesPath;
        } else {
            // В режиме разработки используем текущую директорию
            staticDir = path.join(__dirname, './');
        }
        console.log(`Serving static files from: ${staticDir}`);
        serverApp.use(express.static(staticDir));

        server = serverApp.listen(serverConfig.port, () => {
            console.log(`Start MediaMatrix server - ok  -> http://localhost:${serverConfig.port}`);
            resolve();
        });
    });
}

// ===== ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ЗНАЧКА В ТРЕЕ =====
function createTray() {
    const iconPath = path.join(__dirname, 'icon.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Открыть',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: 'Перезагрузить приложение',
            click: () => {
                app.relaunch();
                app.exit();
            }
        },
        {
            label: 'Выход',
            click: () => {
                willQuit = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('MediaMatrix');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        } else {
            createWindow();
        }
    });
}

// ===== ФУНКЦИИ СОЗДАНИЯ ОКОН =====
function createNewWindow(url, useCustomFrame = false) {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'build', 'icon.ico'),
        frame: !useCustomFrame,
        titleBarStyle: useCustomFrame ? 'hidden' : undefined,
        webPreferences: {
            webSecurity: serverConfig.webSecurity,
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    win.loadURL(url);

    win.once('ready-to-show', () => {
        win.show();
    });

    win.on('maximize', () => win.webContents.send('window-maximized', true));
    win.on('unmaximize', () => win.webContents.send('window-maximized', false));

    return win;
}

function createWindow() {
    mainWindow = createNewWindow(`http://localhost:${serverConfig.port}`, true);

    mainWindow.on('close', (event) => {
        if (!willQuit) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        createNewWindow(url, false);
        return { action: 'deny' };
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ===== КОНТЕКСТНОЕ МЕНЮ И IPC =====
function showContextMenu(win) {
    const menu = Menu.buildFromTemplate([
        { label: '⟳ Обновить страницу', click: () => win.reload() },
        { type: 'separator' },
        { label: '⌂ Главная страница', click: () => win.loadURL(`http://localhost:${serverConfig.port}`) },
        { label: '⭠ Назад', click: () => win.webContents.goBack() },
        { label: '⭢ Вперед', click: () => win.webContents.goForward() },
        { type: 'separator' },
        { label: '⎘ Копировать', click: () => win.webContents.copy() },
        { label: '⎙ Вставить', click: () => win.webContents.paste() },
        { label: '✄ Вырезать', click: () => win.webContents.cut() },
        { type: 'separator' },
        { label: '🛠 Открыть консоль разработчика', click: () => win.webContents.openDevTools() },
        { label: '♺ Перезагрузить приложение', click: () => { app.relaunch(); app.exit(); } },
        { label: 'X Закрыть приложение', click: () => app.exit() }
    ]);
    menu.popup({ window: win });
}

// ===== IPC HANDLERS =====
ipcMain.on('reload-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.reload();
});

ipcMain.on('minimize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.on('maximize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});

ipcMain.handle('is-maximized', () => {
    const win = BrowserWindow.getFocusedWindow();
    return win ? win.isMaximized() : false;
});

ipcMain.on('show-context-menu', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) showContextMenu(win);
});

ipcMain.handle('get-server-config', () => {
    return serverConfig;
});

ipcMain.on('save-server-config', (event, config) => {
    saveServerConfig(config);
});

ipcMain.on('relaunch-app', () => {
    app.relaunch();
    app.exit();
});

// ===== ЖИЗНЕННЫЙ ЦИКЛ =====
app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);

    loadServerConfig();
    await startServer();
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
        // На macOS ничего не делаем
    } else {
        // На Windows/Linux приложение продолжает работать в трее
    }
});

app.on('quit', () => {
    if (server) server.close();
});