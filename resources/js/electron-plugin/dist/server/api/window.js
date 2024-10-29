import express from 'express';
import { BrowserWindow } from 'electron';
import state from '../state';
import { join } from "path";
import { notifyLaravel } from "../utils";
const router = express.Router();
import windowStateKeeper from "electron-window-state";
router.post('/maximize', (req, res) => {
    var _a;
    const { id } = req.body;
    (_a = state.windows[id]) === null || _a === void 0 ? void 0 : _a.maximize();
    res.sendStatus(200);
});
router.post('/minimize', (req, res) => {
    var _a;
    const { id } = req.body;
    (_a = state.windows[id]) === null || _a === void 0 ? void 0 : _a.minimize();
    res.sendStatus(200);
});
router.post('/resize', (req, res) => {
    var _a;
    const { id, width, height } = req.body;
    (_a = state.windows[id]) === null || _a === void 0 ? void 0 : _a.setSize(parseInt(width), parseInt(height));
    res.sendStatus(200);
});
router.post('/position', (req, res) => {
    var _a;
    const { id, x, y, animate } = req.body;
    (_a = state.windows[id]) === null || _a === void 0 ? void 0 : _a.setPosition(parseInt(x), parseInt(y), animate);
    res.sendStatus(200);
});
router.post('/reload', (req, res) => {
    var _a;
    const { id } = req.body;
    (_a = state.windows[id]) === null || _a === void 0 ? void 0 : _a.reload();
    res.sendStatus(200);
});
router.post('/close', (req, res) => {
    const { id } = req.body;
    if (state.windows[id]) {
        state.windows[id].close();
        delete state.windows[id];
    }
    return res.sendStatus(200);
});
router.post('/hide', (req, res) => {
    const { id } = req.body;
    if (state.windows[id]) {
        state.windows[id].hide();
    }
    return res.sendStatus(200);
});
router.get('/current', (req, res) => {
    const currentWindow = Object.values(state.windows).find(window => window.id === BrowserWindow.getFocusedWindow().id);
    const id = Object.keys(state.windows).find(key => state.windows[key] === currentWindow);
    res.json({
        id: id,
        x: currentWindow.getPosition()[0],
        y: currentWindow.getPosition()[1],
        width: currentWindow.getSize()[0],
        height: currentWindow.getSize()[1],
        title: currentWindow.getTitle(),
        alwaysOnTop: currentWindow.isAlwaysOnTop(),
    });
});
router.post('/always-on-top', (req, res) => {
    var _a;
    const { id, alwaysOnTop } = req.body;
    (_a = state.windows[id]) === null || _a === void 0 ? void 0 : _a.setAlwaysOnTop(alwaysOnTop);
    res.sendStatus(200);
});
router.post('/open', (req, res) => {
    let { id, x, y, frame, width, height, minWidth, minHeight, maxWidth, maxHeight, focusable, hasShadow, url, resizable, movable, minimizable, maximizable, closable, title, alwaysOnTop, titleBarStyle, trafficLightPosition, vibrancy, backgroundColor, transparency, showDevTools, fullscreen, fullscreenable, kiosk, autoHideMenuBar, } = req.body;
    if (state.windows[id]) {
        state.windows[id].show();
        state.windows[id].focus();
        return res.sendStatus(200);
    }
    let preloadPath = join(__dirname, '../../electron-plugin/dist/preload/index.js');
    let windowState = undefined;
    if (req.body.rememberState === true) {
        windowState = windowStateKeeper({
            file: `window-state-${id}.json`,
            defaultHeight: parseInt(height),
            defaultWidth: parseInt(width),
        });
    }
    const window = new BrowserWindow(Object.assign(Object.assign({ width: (windowState === null || windowState === void 0 ? void 0 : windowState.width) || parseInt(width), height: (windowState === null || windowState === void 0 ? void 0 : windowState.height) || parseInt(height), frame: frame !== undefined ? frame : true, x: (windowState === null || windowState === void 0 ? void 0 : windowState.x) || x, y: (windowState === null || windowState === void 0 ? void 0 : windowState.y) || y, minWidth: minWidth, minHeight: minHeight, maxWidth: maxWidth, maxHeight: maxHeight, show: false, title,
        backgroundColor, transparent: transparency, alwaysOnTop,
        resizable,
        movable,
        minimizable,
        maximizable,
        closable,
        hasShadow,
        titleBarStyle,
        trafficLightPosition,
        vibrancy,
        focusable,
        autoHideMenuBar }, (process.platform === 'linux' ? { icon: state.icon } : {})), { webPreferences: {
            backgroundThrottling: false,
            spellcheck: false,
            preload: preloadPath,
            sandbox: false,
            contextIsolation: false,
            nodeIntegration: true,
        }, fullscreen,
        fullscreenable,
        kiosk }));
    if ((process.env.NODE_ENV === 'development' || showDevTools === true) && showDevTools !== false) {
        window.webContents.openDevTools();
    }
    require("@electron/remote/main").enable(window.webContents);
    if (req.body.rememberState === true) {
        windowState.manage(window);
    }
    window.on('blur', () => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowBlurred',
            payload: [id]
        });
    });
    window.on('focus', () => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowFocused',
            payload: [id]
        });
    });
    window.on('minimize', () => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowMinimized',
            payload: [id]
        });
    });
    window.on('maximize', () => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowMaximized',
            payload: [id]
        });
    });
    window.on('show', () => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowShown',
            payload: [id]
        });
    });
    window.on('resized', () => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowResized',
            payload: [id, window.getSize()[0], window.getSize()[1]]
        });
    });
    window.on('page-title-updated', (evt) => {
        evt.preventDefault();
    });
    window.on('close', (evt) => {
        if (state.windows[id]) {
            delete state.windows[id];
        }
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowClosed',
            payload: [id]
        });
    });
    window.on('hide', (evt) => {
        notifyLaravel('events', {
            event: 'Native\\Laravel\\Events\\Windows\\WindowHidden',
            payload: [id]
        });
    });
    url += (url.indexOf('?') === -1 ? '?' : '&') + '_windowId=' + id;
    window.loadURL(url);
    window.webContents.on('did-finish-load', () => {
        window.show();
    });
    state.windows[id] = window;
    res.sendStatus(200);
});
export default router;