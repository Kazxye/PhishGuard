import type { RiskLevel, Settings } from "./types";

export const API_URL = "http://localhost:8000/api/v1";

export const ACCENT_COLORS: Record<string, { name: string; primary: string; dark: string }> = {
  purple: { name: "Roxo", primary: "#8B5CF6", dark: "#7C3AED" },
  blue: { name: "Azul", primary: "#3B82F6", dark: "#2563EB" },
  green: { name: "Verde", primary: "#10B981", dark: "#059669" },
  red: { name: "Vermelho", primary: "#EF4444", dark: "#DC2626" },
  orange: { name: "Laranja", primary: "#F97316", dark: "#EA580C" },
  pink: { name: "Rosa", primary: "#EC4899", dark: "#DB2777" },
  cyan: { name: "Ciano", primary: "#06B6D4", dark: "#0891B2" },
  slate: { name: "Cinza", primary: "#64748B", dark: "#475569" },
};

export const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  detailedView: false,
  notificationsEnabled: true,
  whitelist: [],
  apiUrl: API_URL,
  accentColor: "purple",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  safe: "#22c55e",
  low: "#84cc16",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  safe: "Seguro",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

export const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  safe: "Nenhuma ameaça significativa detectada",
  low: "Algumas anomalias menores identificadas",
  medium: "Múltiplos indicadores de risco presentes",
  high: "Fortes indicadores de phishing detectados",
  critical: "Altamente provável ser uma tentativa de phishing",
};

export const BADGE_COLORS: Record<RiskLevel, string> = {
  safe: "#22c55e",
  low: "#84cc16",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export const HISTORY_MAX_ITEMS = 10;

export const STORAGE_KEYS = {
  CURRENT_ANALYSIS: "currentAnalysis",
  HISTORY: "history",
  SETTINGS: "settings",
} as const;

export const CHECK_ICONS = {
  success: "✓",
  warning: "⚠",
  error: "✗",
  info: "ℹ",
} as const;
