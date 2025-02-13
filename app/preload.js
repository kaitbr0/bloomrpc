const Store = require('electron-store');
const store = new Store({
  name: 'editor-store',
  defaults: {}
});

process.once('loaded', () => {
  global.electronStore = store;
}); 
