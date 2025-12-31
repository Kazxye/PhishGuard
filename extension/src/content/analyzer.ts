interface FormData {
  html: string;
  hasPasswordFields: boolean;
  hasHiddenFields: boolean;
  externalActions: string[];
}

function extractFormData(): FormData {
  const forms = document.querySelectorAll("form");
  const passwordFields = document.querySelectorAll('input[type="password"]');
  const hiddenFields = document.querySelectorAll('input[type="hidden"]');
  
  const externalActions: string[] = [];
  const currentHost = window.location.hostname;

  forms.forEach((form) => {
    const action = form.getAttribute("action");
    if (action && action.startsWith("http")) {
      try {
        const actionUrl = new URL(action);
        if (actionUrl.hostname !== currentHost) {
          externalActions.push(actionUrl.hostname);
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  });

  const relevantHtml = extractRelevantHtml();

  return {
    html: relevantHtml,
    hasPasswordFields: passwordFields.length > 0,
    hasHiddenFields: hiddenFields.length > 5,
    externalActions: [...new Set(externalActions)],
  };
}

function extractRelevantHtml(): string {
  const forms = document.querySelectorAll("form");
  
  if (forms.length === 0) {
    return "";
  }

  const container = document.createElement("div");
  
  forms.forEach((form) => {
    const clone = form.cloneNode(true) as HTMLElement;
    
    clone.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
    
    container.appendChild(clone);
  });

  const html = container.innerHTML;
  
  if (html.length > 50000) {
    return html.substring(0, 50000);
  }

  return html;
}

function detectSuspiciousElements(): string[] {
  const warnings: string[] = [];

  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute("src");
    if (src && src.startsWith("http") && !src.includes(window.location.hostname)) {
      warnings.push(`External iframe detected: ${src}`);
    }
  });

  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    const autocomplete = input.getAttribute("autocomplete");
    if (autocomplete === "off" && input.type === "password") {
      warnings.push("Password field with autocomplete disabled");
    }
  });

  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    const text = link.textContent?.toLowerCase() || "";
    
    if (href && text) {
      const suspiciousTexts = ["login", "sign in", "verify", "confirm", "update"];
      const hasSuspiciousText = suspiciousTexts.some((t) => text.includes(t));
      
      if (hasSuspiciousText && href.startsWith("http")) {
        try {
          const linkUrl = new URL(href);
          if (linkUrl.hostname !== window.location.hostname) {
            warnings.push(`Suspicious external link: "${text}" -> ${linkUrl.hostname}`);
          }
        } catch {
          // Invalid URL
        }
      }
    }
  });

  return warnings;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "EXTRACT_PAGE_DATA") {
    const formData = extractFormData();
    const warnings = detectSuspiciousElements();
    
    sendResponse({
      success: true,
      data: {
        ...formData,
        warnings,
        url: window.location.href,
        title: document.title,
      },
    });
  }
  
  return true;
});

(function init() {
  if (document.readyState === "complete") {
    notifyBackgroundScript();
  } else {
    window.addEventListener("load", notifyBackgroundScript);
  }
})();

function notifyBackgroundScript() {
  const formData = extractFormData();
  
  if (formData.hasPasswordFields || formData.externalActions.length > 0) {
    chrome.runtime.sendMessage({
      type: "PAGE_HAS_FORMS",
      payload: {
        url: window.location.href,
        ...formData,
      },
    }).catch(() => {
      // Background script might not be ready
    });
  }
}

export {};
