// 設定を読み込む
function loadSettings() {
  chrome.storage.sync.get({
    name: '',
    email: '',
    postalCode: '',
    phone: '',
    address: '',
    customInfo: ''
  }, (items) => {
    document.getElementById('name').value = items.name;
    document.getElementById('email').value = items.email;
    document.getElementById('postalCode').value = items.postalCode;
    document.getElementById('phone').value = items.phone;
    document.getElementById('address').value = items.address;
    document.getElementById('customInfo').value = items.customInfo;
  });
}

// 設定を保存する
function saveSettings() {
  const settings = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    postalCode: document.getElementById('postalCode').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    customInfo: document.getElementById('customInfo').value
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('設定を保存しました', 'success');

    // すべてのタブにメッセージを送信して再スキャンさせる
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'updateSettings' }, () => {
          // エラーを無視（一部のタブではコンテンツスクリプトが実行されていない可能性があるため）
          if (chrome.runtime.lastError) {
            // エラーを無視
          }
        });
      });
    });
  });
}

// すべての設定をクリアする
function clearSettings() {
  if (confirm('すべての設定をクリアしてもよろしいですか？')) {
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('postalCode').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('address').value = '';
    document.getElementById('customInfo').value = '';

    chrome.storage.sync.clear(() => {
      showStatus('すべての設定をクリアしました', 'success');

      // すべてのタブにメッセージを送信
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings' }, () => {
            if (chrome.runtime.lastError) {
              // エラーを無視
            }
          });
        });
      });
    });
  }
}

// ステータスメッセージを表示する
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;

  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('clearBtn').addEventListener('click', clearSettings);
});
