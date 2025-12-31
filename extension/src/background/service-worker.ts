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

    const analysis = await analyzeUrl(tab.url);
    
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

async function analyzeUrl(url: string, htmlContent?: string): Promise<AnalysisResult> {
  return api.analyze({ url, html_content: htmlContent });
}

async function updateBadge(
  tabId: number,
  riskLevel: RiskLevel | null,
  text: string
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

chrome.runtime.onMessage.addListener(
  (request: MessageRequest, _sender, sendResponse: (response: MessageResponse) => void) => {
    handleMessage(request)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    
    return true;
  }
);

async function handleMessage(request: MessageRequest): Promise<unknown> {
  switch (request.type) {
    case "ANALYZE_URL": {
      const { url, htmlContent } = request.payload as { url: string; htmlContent?: string };
      const analysis = await analyzeUrl(url, htmlContent);
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

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("PhishGuard installed successfully!");
    
    await storage.updateSettings({});
  }
});

export {};
