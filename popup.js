// Popup script for Personal Information Mosaic Man

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('mosaicToggle');
  const status = document.getElementById('status');

  // Load saved state
  const result = await chrome.storage.sync.get(['mosaicEnabled']);
  const isEnabled = result.mosaicEnabled ?? true;

  toggle.checked = isEnabled;
  updateStatus(isEnabled);

  // Handle toggle change
  toggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ mosaicEnabled: enabled });
    updateStatus(enabled);

    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleMosaic',
        enabled: enabled
      });
    }
  });

  function updateStatus(enabled) {
    if (enabled) {
      status.textContent = '有効';
      status.className = 'status active';
    } else {
      status.textContent = '無効';
      status.className = 'status inactive';
    }
  }
});
