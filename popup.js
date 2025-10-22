// 統計情報を更新
function updateStats() {
  chrome.storage.sync.get({
    name: '',
    email: '',
    postalCode: '',
    phone: '',
    address: '',
    customInfo: ''
  }, (items) => {
    let count = 0;
    const infoList = [];

    if (items.name) {
      const names = items.name.split(',').filter(item => item.trim());
      count += names.length;
      if (names.length > 0) infoList.push(`名前: ${names.length}件`);
    }

    if (items.email) {
      const emails = items.email.split(',').filter(item => item.trim());
      count += emails.length;
      if (emails.length > 0) infoList.push(`メール: ${emails.length}件`);
    }

    if (items.postalCode) {
      const postalCodes = items.postalCode.split(',').filter(item => item.trim());
      count += postalCodes.length;
      if (postalCodes.length > 0) infoList.push(`郵便番号: ${postalCodes.length}件`);
    }

    if (items.phone) {
      const phones = items.phone.split(',').filter(item => item.trim());
      count += phones.length;
      if (phones.length > 0) infoList.push(`電話: ${phones.length}件`);
    }

    if (items.address) {
      const addresses = items.address.split(',').filter(item => item.trim());
      count += addresses.length;
      if (addresses.length > 0) infoList.push(`住所: ${addresses.length}件`);
    }

    if (items.customInfo) {
      const customs = items.customInfo.split('\n').filter(item => item.trim());
      count += customs.length;
      if (customs.length > 0) infoList.push(`その他: ${customs.length}件`);
    }

    const statsElement = document.getElementById('statsInfo');
    if (count === 0) {
      statsElement.textContent = '設定されていません';
    } else {
      statsElement.innerHTML = infoList.join('<br>') + `<br><strong>合計: ${count}件</strong>`;
    }
  });
}

// トグルスイッチの状態を読み込む
function loadToggleState() {
  chrome.storage.sync.get({ enabled: true }, (items) => {
    document.getElementById('toggleBlur').checked = items.enabled;
  });
}

// トグルスイッチの変更を処理
function handleToggleChange(event) {
  const enabled = event.target.checked;

  chrome.storage.sync.set({ enabled: enabled }, () => {
    // 現在のタブにメッセージを送信
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleBlur',
          enabled: enabled
        });
      }
    });
  });
}

// 設定ページを開く
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// ページを再スキャン
function refreshPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings' });
    }
  });
}

// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  loadToggleState();

  document.getElementById('toggleBlur').addEventListener('change', handleToggleChange);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('refreshBtn').addEventListener('click', refreshPage);
});
