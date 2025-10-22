// グローバル変数
let personalInfo = [];
let isEnabled = true;

// 設定を読み込む
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      name: '',
      email: '',
      postalCode: '',
      phone: '',
      address: '',
      customInfo: '',
      enabled: true
    }, (items) => {
      isEnabled = items.enabled;
      personalInfo = [];

      // 各フィールドから情報を収集
      if (items.name) {
        items.name.split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) personalInfo.push(trimmed);
        });
      }

      if (items.email) {
        items.email.split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) personalInfo.push(trimmed);
        });
      }

      if (items.postalCode) {
        items.postalCode.split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) personalInfo.push(trimmed);
        });
      }

      if (items.phone) {
        items.phone.split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) personalInfo.push(trimmed);
        });
      }

      if (items.address) {
        items.address.split(',').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) personalInfo.push(trimmed);
        });
      }

      if (items.customInfo) {
        items.customInfo.split('\n').forEach(item => {
          const trimmed = item.trim();
          if (trimmed) personalInfo.push(trimmed);
        });
      }

      resolve();
    });
  });
}

// テキストノードを処理する
function processTextNode(node) {
  if (!isEnabled || personalInfo.length === 0) return;

  const text = node.textContent;
  let hasMatch = false;
  let replacedText = text;

  // 各個人情報をチェック
  personalInfo.forEach(info => {
    if (info && text.includes(info)) {
      hasMatch = true;
      // 個人情報をスパンで囲む
      const escapedInfo = info.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedInfo, 'g');
      replacedText = replacedText.replace(regex, `<span class="mosaic-man-blur">${info}</span>`);
    }
  });

  if (hasMatch) {
    // 新しいHTMLで置き換え
    const span = document.createElement('span');
    span.innerHTML = replacedText;
    node.parentNode.replaceChild(span, node);
  }
}

// DOM全体をスキャンする
function scanPage() {
  if (!isEnabled || personalInfo.length === 0) return;

  // すべてのテキストノードを取得
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // スクリプト、スタイル、既にボカシがかかっているノードは除外
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.classList.contains('mosaic-man-blur')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let currentNode;

  while (currentNode = walker.nextNode()) {
    textNodes.push(currentNode);
  }

  // テキストノードを処理
  textNodes.forEach(node => {
    processTextNode(node);
  });
}

// 既存のボカシをすべて削除
function removeAllBlurs() {
  const blurredElements = document.querySelectorAll('.mosaic-man-blur');
  blurredElements.forEach(element => {
    const textNode = document.createTextNode(element.textContent);
    element.parentNode.replaceChild(textNode, element);
  });
}

// MutationObserverで動的に追加されるコンテンツを監視
const observer = new MutationObserver((mutations) => {
  if (!isEnabled) return;

  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(
          node,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(n) {
              if (n.parentElement.tagName === 'SCRIPT' ||
                  n.parentElement.tagName === 'STYLE' ||
                  n.parentElement.classList.contains('mosaic-man-blur')) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        const textNodes = [];
        let currentNode;

        while (currentNode = walker.nextNode()) {
          textNodes.push(currentNode);
        }

        textNodes.forEach(textNode => {
          processTextNode(textNode);
        });
      }
    });
  });
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    removeAllBlurs();
    loadSettings().then(() => {
      scanPage();
    });
  } else if (request.action === 'toggleBlur') {
    isEnabled = request.enabled;
    if (isEnabled) {
      scanPage();
    } else {
      removeAllBlurs();
    }
  }
});

// bodyが利用可能になるまで待つ
function waitForBody() {
  return new Promise((resolve) => {
    if (document.body) {
      resolve();
    } else {
      const observer = new MutationObserver(() => {
        if (document.body) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.documentElement, {
        childList: true
      });
    }
  });
}

// 初期化
async function init() {
  // 設定を読み込む（非同期）
  const settingsPromise = loadSettings();

  // bodyが利用可能になるまで待つ
  await waitForBody();

  // 設定の読み込みが完了するまで待つ
  await settingsPromise;

  // すぐにスキャンを実行
  scanPage();

  // DOM監視を開始
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// できるだけ早く実行
init();
