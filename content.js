// Content script for Personal Information Mosaic Man
// Detects and blurs personal information on web pages

class MosaicMan {
  constructor() {
    this.enabled = true;
    this.patterns = {
      // 日本の電話番号
      phone: /(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4})/g,
      // メールアドレス
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      // 郵便番号
      postalCode: /(〒?\s?\d{3}[-\s]?\d{4})/g,
      // マイナンバー (12桁)
      mynumber: /(\d{4}[\s-]?\d{4}[\s-]?\d{4})/g,
      // クレジットカード番号
      creditCard: /(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})/g
    };

    this.init();
  }

  async init() {
    // Load settings
    const result = await chrome.storage.sync.get(['mosaicEnabled']);
    this.enabled = result.mosaicEnabled ?? true;

    if (this.enabled) {
      this.applyMosaic();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'toggleMosaic') {
        this.enabled = message.enabled;
        if (this.enabled) {
          this.applyMosaic();
        } else {
          this.removeMosaic();
        }
      }
    });
  }

  applyMosaic() {
    // Find all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      // Skip script and style elements
      if (node.parentElement &&
          !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) {
        nodesToProcess.push(node);
      }
    }

    nodesToProcess.forEach(textNode => this.processTextNode(textNode));
  }

  processTextNode(textNode) {
    const text = textNode.textContent;
    let hasMatch = false;

    // Check if text contains any personal information
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(text)) {
        hasMatch = true;
        break;
      }
    }

    if (!hasMatch) return;

    // Create a span wrapper with mosaic class
    const span = document.createElement('span');
    span.className = 'mosaic-wrapper';

    let html = text;
    for (const [type, pattern] of Object.entries(this.patterns)) {
      html = html.replace(pattern, (match) => {
        return `<span class="mosaic-blur" data-type="${type}" title="個人情報を検出しました">${match}</span>`;
      });
    }

    span.innerHTML = html;
    textNode.parentNode.replaceChild(span, textNode);
  }

  removeMosaic() {
    // Remove all mosaic effects
    const mosaicElements = document.querySelectorAll('.mosaic-blur');
    mosaicElements.forEach(el => {
      const text = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(text, el);
    });

    const wrappers = document.querySelectorAll('.mosaic-wrapper');
    wrappers.forEach(wrapper => {
      const text = document.createTextNode(wrapper.textContent);
      wrapper.parentNode.replaceChild(text, wrapper);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MosaicMan());
} else {
  new MosaicMan();
}
