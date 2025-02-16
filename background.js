chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download') {
    chrome.storage.sync.get({ askSave: false }, (settings) => {
      chrome.downloads.download({
        url: request.url,
        filename: request.filename,
        saveAs: settings.askSave 
      });
    });
  }
});