import type { AnalysisResult, HistoryEntry, Settings, StorageData } from "./types";
import { DEFAULT_SETTINGS, HISTORY_MAX_ITEMS, STORAGE_KEYS } from "./constants";

class StorageService {
  private async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
    }
  }

  async getCurrentAnalysis(): Promise<AnalysisResult | null> {
    return this.get(STORAGE_KEYS.CURRENT_ANALYSIS, null);
  }

  async setCurrentAnalysis(analysis: AnalysisResult | null): Promise<void> {
    await this.set(STORAGE_KEYS.CURRENT_ANALYSIS, analysis);
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.get(STORAGE_KEYS.HISTORY, []);
  }

  async addToHistory(analysis: AnalysisResult): Promise<void> {
    const history = await this.getHistory();
    
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      url: analysis.url,
      domain: analysis.domain,
      risk_level: analysis.risk_level,
      risk_score: analysis.risk_score,
      analyzed_at: analysis.analyzed_at,
    };

    const existingIndex = history.findIndex((h) => h.domain === entry.domain);
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    history.unshift(entry);

    const trimmedHistory = history.slice(0, HISTORY_MAX_ITEMS);
    await this.set(STORAGE_KEYS.HISTORY, trimmedHistory);
  }

  async clearHistory(): Promise<void> {
    await this.set(STORAGE_KEYS.HISTORY, []);
  }

  async getSettings(): Promise<Settings> {
    return this.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  async isWhitelisted(domain: string): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.whitelist.some(
      (w) => domain === w || domain.endsWith(`.${w}`)
    );
  }

  async addToWhitelist(domain: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.whitelist.includes(domain)) {
      settings.whitelist.push(domain);
      await this.set(STORAGE_KEYS.SETTINGS, settings);
    }
  }

  async removeFromWhitelist(domain: string): Promise<void> {
    const settings = await this.getSettings();
    settings.whitelist = settings.whitelist.filter((w) => w !== domain);
    await this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  async getAll(): Promise<StorageData> {
    const [currentAnalysis, history, settings] = await Promise.all([
      this.getCurrentAnalysis(),
      this.getHistory(),
      this.getSettings(),
    ]);
    return { currentAnalysis, history, settings };
  }
}

export const storage = new StorageService();
