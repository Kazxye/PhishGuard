import { api } from "../shared/api";
import { storage } from "../shared/storage";
import { BADGE_COLORS, RISK_LABELS } from "../shared/constants";
import type { AnalysisResult, RiskLevel, MessageRequest, MessageResponse } from "../shared/types";

const analyzingTabs = new Set<number>();

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) return;

  if (analyzingTabs.has(tabId)) return;

  try {
    const url = new URL(tab.url);
    const domain = url.hostname.replace(/^www\./, "");

    const isWhitelisted = await storage.isWhitelisted(domain);
    if (isWhitelisted) {
      await updateBadge(tabId, "safe", "✓");
      return;
    }

    analyzingTabs.add(tabId);
    await updateBadge(tabId, null, "...");

    const htmlContent = await extractPageContent(tabId);
    const analysis = await api.analyze({
      url: tab.url,
      html_content: htmlContent ?? undefined,
    });

    await storage.setCurrentAnalysis(analysis);
    await storage.addToHistory(analysis);

    await updateBadge(tabId, analysis.risk_level, analysis.risk_score.toString());
    await checkAndNotify(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    await updateBadge(tabId, null, "!");
  } finally {
    analyzingTabs.delete(tabId);
  }
});

async function extractPageContent(tabId: number): Promise<string | null> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "EXTRACT_PAGE_DATA",
    });

    if (response?.success && response.data?.html) {
      return response.data.html;
    }
  } catch {
    // Content script not yet injected or tab not accessible
  }

  return null;
}

async function updateBadge(
    tabId: number,
    riskLevel: RiskLevel | null,
    text: string,
): Promise<void> {
  const color = riskLevel ? BADGE_COLORS[riskLevel] : "#6b7280";

  await chrome.action.setBadgeText({ tabId, text });
  await chrome.action.setBadgeBackgroundColor({ tabId, color });

  if (riskLevel) {
    const title = `PhishGuard - Risco: ${RISK_LABELS[riskLevel]}`;
    await chrome.action.setTitle({ tabId, title });
  }
}

async function checkAndNotify(analysis: AnalysisResult): Promise<void> {
  const settings = await storage.getSettings();

  if (!settings.notificationsEnabled) return;

  if (analysis.risk_level === "high" || analysis.risk_level === "critical") {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
      title: "⚠️ PhishGuard - Alerta de Segurança",
      message: `O site ${analysis.domain} apresenta risco ${RISK_LABELS[analysis.risk_level].toLowerCase()}! Tenha cuidado ao inserir informações pessoais.`,
      priority: 2,
    });
  }
}

interface PageFormPayload {
  url: string;
  html: string;
  hasPasswordFields: boolean;
  hasHiddenFields: boolean;
  externalActions: string[];
}

async function handleFormDetection(
    payload: PageFormPayload,
    tabId?: number,
): Promise<unknown> {
  if (!payload?.url || !payload?.html) return null;

  const currentAnalysis = await storage.getCurrentAnalysis();
  const isSamePage = currentAnalysis?.url === payload.url;
  const alreadyHasFormData = currentAnalysis?.form_analysis !== null;

  if (isSamePage && alreadyHasFormData) return currentAnalysis;

  try {
    const analysis = await api.analyze({
      url: payload.url,
      html_content: payload.html,
    });

    await storage.setCurrentAnalysis(analysis);
    await storage.addToHistory(analysis);

    if (tabId) {
      await updateBadge(tabId, analysis.risk_level, analysis.risk_score.toString());
      await checkAndNotify(analysis);
    }

    return analysis;
  } catch (error) {
    console.error("Form re-analysis failed:", error);
    return currentAnalysis;
  }
}

async function handleMessage(request: MessageRequest): Promise<unknown> {
  switch (request.type) {
    case "ANALYZE_URL": {
      const { url, htmlContent } = request.payload as {
        url: string;
        htmlContent?: string;
      };
      const analysis = await api.analyze({ url, html_content: htmlContent });
      await storage.setCurrentAnalysis(analysis);
      await storage.addToHistory(analysis);
      return analysis;
    }

    case "GET_ANALYSIS": {
      return storage.getCurrentAnalysis();
    }

    case "REPORT_SITE": {
      const { url, reason } = request.payload as { url: string; reason: string };
      await api.reportSite(url, reason);
      return { reported: true };
    }

    case "UPDATE_SETTINGS": {
      const updates = request.payload as Record<string, unknown>;
      return storage.updateSettings(updates);
    }

    default:
      throw new Error(`Unknown message type: ${request.type}`);
  }
}

chrome.runtime.onMessage.addListener(
    (
        request: MessageRequest,
        sender,
        sendResponse: (response: MessageResponse) => void,
    ) => {
      if (request.type === "PAGE_HAS_FORMS") {
        handleFormDetection(
            request.payload as PageFormPayload,
            sender.tab?.id,
        )
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      }

      handleMessage(request)
          .then((data) => sendResponse({ success: true, data }))
          .catch((error) => sendResponse({ success: false, error: error.message }));

      return true;
    },
);

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("PhishGuard installed successfully!");
    await storage.updateSettings({});
  }
});

export {};