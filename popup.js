function saveSettings() {
  const settings = {
    downloadPath: document.getElementById('downloadPath').value,
    askSave: document.getElementById('askSave').checked,
    addTitle: document.getElementById('addTitle').checked,
    subredditFolders: document.getElementById('subredditFolders').checked
  };

  chrome.storage.sync.set(settings);
}

function loadSettings() {
  chrome.storage.sync.get({
    downloadPath: 'Downloads/Savvit',  
    askSave: false,                    
    addTitle: true,                    
    subredditFolders: false
  }, (settings) => {
    document.getElementById('downloadPath').value = settings.downloadPath;
    document.getElementById('askSave').checked = settings.askSave;
    document.getElementById('addTitle').checked = settings.addTitle;
    document.getElementById('subredditFolders').checked = settings.subredditFolders;
  });
}

document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('downloadPath').addEventListener('change', saveSettings);
document.getElementById('askSave').addEventListener('change', saveSettings);
document.getElementById('addTitle').addEventListener('change', saveSettings);
document.getElementById('subredditFolders').addEventListener('change', saveSettings);