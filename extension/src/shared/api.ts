import type { AnalysisResult } from "./types";
import { API_URL } from "./constants";

interface AnalyzeRequest {
  url: string;
  html_content?: string;
}

class PhishGuardAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async analyze(request: AnalyzeRequest): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}: Request failed`);
    }

    return response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async reportSite(url: string, reason: string): Promise<void> {
    console.log("Site reported:", { url, reason });
  }
}

export const api = new PhishGuardAPI();
export { PhishGuardAPI };
