export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface HomographAnalysis {
  has_homographs: boolean;
  suspicious_characters: Array<{
    position: number;
    character: string;
    looks_like: string;
    script: string;
    unicode: string;
  }>;
  original_domain: string;
  punycode_domain: string | null;
  score: number;
}

export interface DomainAgeAnalysis {
  creation_date: string | null;
  age_days: number | null;
  is_new_domain: boolean;
  registrar: string | null;
  score: number;
}

export interface SSLAnalysis {
  has_ssl: boolean;
  issuer: string | null;
  subject: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_valid: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
  score: number;
}

export interface BrandSimilarityAnalysis {
  matches: Array<{
    brand: string;
    similarity: number;
    is_exact: boolean;
  }>;
  highest_similarity: number;
  matched_brand: string | null;
  is_suspicious: boolean;
  score: number;
}

export interface FormAnalysis {
  total_forms: number;
  password_fields: number;
  hidden_fields: number;
  external_actions: string[];
  suspicious_patterns: string[];
  score: number;
}

export interface AnalysisResult {
  url: string;
  domain: string;
  risk_level: RiskLevel;
  risk_score: number;
  homograph: HomographAnalysis;
  domain_age: DomainAgeAnalysis;
  ssl: SSLAnalysis;
  brand_similarity: BrandSimilarityAnalysis;
  form_analysis: FormAnalysis | null;
  analyzed_at: string;
  recommendations: string[];
}

export interface HistoryEntry {
  id: string;
  url: string;
  domain: string;
  risk_level: RiskLevel;
  risk_score: number;
  analyzed_at: string;
}

export interface Settings {
  darkMode: boolean;
  detailedView: boolean;
  notificationsEnabled: boolean;
  whitelist: string[];
  apiUrl: string;
  accentColor: string;
}

export interface StorageData {
  currentAnalysis: AnalysisResult | null;
  history: HistoryEntry[];
  settings: Settings;
}

export interface MessageRequest {
  type: "ANALYZE_URL" | "GET_ANALYSIS" | "REPORT_SITE" | "UPDATE_SETTINGS" | "PAGE_HAS_FORMS" | "EXTRACT_PAGE_DATA";
  payload?: unknown;
}

export interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}