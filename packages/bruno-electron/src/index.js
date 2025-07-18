const fs = require('fs');
const path = require('path');
const isDev = require('electron-is-dev');

if (isDev) {
  if(!fs.existsSync(path.join(__dirname, '../../bruno-js/src/sandbox/bundle-browser-rollup.js'))) {
    console.log('JS Sandbox libraries have not been bundled yet');
    console.log('Please run the below command \nnpm run sandbox:bundle-libraries --workspace=packages/bruno-js');
    throw new Error('JS Sandbox libraries have not been bundled yet');
  }
}

const { format } = require('url');
const { BrowserWindow, app, session, Menu, ipcMain } = require('electron');
const { setContentSecurityPolicy } = require('electron-util');

if (isDev && process.env.ELECTRON_USER_DATA_PATH) {
  console.debug("`ELECTRON_USER_DATA_PATH` found, modifying `userData` path: \n"
    + `\t${app.getPath("userData")} -> ${process.env.ELECTRON_USER_DATA_PATH}`);

  app.setPath('userData', process.env.ELECTRON_USER_DATA_PATH);
}

const menuTemplate = require('./app/menu-template');
const { openCollection } = require('./app/collections');
const LastOpenedCollections = require('./store/last-opened-collections');
const registerNetworkIpc = require('./ipc/network');
const registerCollectionsIpc = require('./ipc/collection');
const registerPreferencesIpc = require('./ipc/preferences');
const collectionWatcher = require('./app/collection-watcher');
const { loadWindowState, saveBounds, saveMaximized } = require('./utils/window');
const registerNotificationsIpc = require('./ipc/notifications');
const registerGlobalEnvironmentsIpc = require('./ipc/global-environments');
const { safeParseJSON, safeStringifyJSON } = require('./utils/common');

const lastOpenedCollections = new LastOpenedCollections();

// Reference: https://content-security-policy.com/
const contentSecurityPolicy = [
  "default-src 'self'",
  "connect-src 'self' https://*.posthog.com",
  "font-src 'self' https: data:;",
  "frame-src data:",
  // this has been commented out to make oauth2 work
  // "form-action 'none'",
  // we make an exception and allow http for images so that
  // they can be used as link in the embedded markdown editors
  "img-src 'self' blob: data: http: https:",
  "media-src 'self' blob: data: https:",
  "style-src 'self' 'unsafe-inline' https:"
];

setContentSecurityPolicy(contentSecurityPolicy.join(';') + ';');

const menu = Menu.buildFromTemplate(menuTemplate);

let mainWindow;

// Prepare the renderer once the app is ready
app.on('ready', async () => {

  if (isDev) {
    const { installExtension, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
    try {
      const extensions = await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS], {
        loadExtensionOptions: {allowFileAccess: true},
      })
      console.log(`Added Extensions:  ${extensions.map(ext => ext.name).join(", ")}`)
      await require("node:timers/promises").setTimeout(1000);
      session.defaultSession.getAllExtensions().map((ext) => {
        console.log(`Loading Extension: ${ext.name}`);
        session.defaultSession.loadExtension(ext.path)
      });
    } catch (err) {
      console.error('An error occurred while loading extensions: ', err);
    }
  }

  Menu.setApplicationMenu(menu);
  const { maximized, x, y, width, height } = loadWindowState();

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    title: 'Bruno',
    icon: path.join(__dirname, 'about/256x256.png')
    // we will bring this back
    // see https://github.com/usebruno/bruno/issues/440
    // autoHideMenuBar: true
  });

  if (maximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  const url = isDev
    ? 'http://localhost:3000'
    : format({
        pathname: path.join(__dirname, '../web/index.html'),
        protocol: 'file:',
        slashes: true
      });

  mainWindow.loadURL(url).catch((reason) => {
    console.error(`Error: Failed to load URL: "${url}" (Electron shows a blank screen because of this).`);
    console.error('Original message:', reason);
    if (isDev) {
      console.error(
        'Could not connect to Next.Js dev server, is it running?' +
          ' Start the dev server using "npm run dev:web" and restart electron'
      );
    } else {
      console.error(
        'If you are using an official production build: the above error is most likely a bug! ' +
          ' Please report this under: https://github.com/usebruno/bruno/issues'
      );
    }
  });

  const handleBoundsChange = () => {
    if (!mainWindow.isMaximized()) {
      saveBounds(mainWindow);
    }
  };

  mainWindow.on('resize', handleBoundsChange);
  mainWindow.on('move', handleBoundsChange);

  mainWindow.on('maximize', () => saveMaximized(true));
  mainWindow.on('unmaximize', () => saveMaximized(false));
  mainWindow.on('close', (e) => {
    e.preventDefault();
    ipcMain.emit('main:start-quit-flow');
  });

  mainWindow.webContents.on('will-redirect', (event, url) => {
    event.preventDefault();
    if (/^(http:\/\/|https:\/\/)/.test(url)) {
      require('electron').shell.openExternal(url);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const { protocol } = new URL(url);
      if (['https:', 'http:'].includes(protocol)) {
        require('electron').shell.openExternal(url);
      }
    } catch (e) {
      console.error(e);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-finish-load', () => {
    let ogSend = mainWindow.webContents.send;
    mainWindow.webContents.send = function(channel, ...args) {
      return ogSend.apply(this, [channel, ...args?.map(_ => {
        // todo: replace this with @msgpack/msgpack encode/decode
        return safeParseJSON(safeStringifyJSON(_));
      })]);
    }
  });

  // register all ipc handlers
  registerNetworkIpc(mainWindow);
  registerGlobalEnvironmentsIpc(mainWindow);
  registerCollectionsIpc(mainWindow, collectionWatcher, lastOpenedCollections);
  registerPreferencesIpc(mainWindow, collectionWatcher, lastOpenedCollections);
  registerNotificationsIpc(mainWindow, collectionWatcher);
});

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit);

// Open collection from Recent menu (#1521)
app.on('open-file', (event, path) => {
  openCollection(mainWindow, collectionWatcher, path);
});
