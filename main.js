
const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  })
  //win.setMenu(null);
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)
app.allowRendererProcessReuse = false;


