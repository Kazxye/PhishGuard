import { useEffect, useState } from "react";
import { ShieldQuestion, ListPlus, Lightbulb } from "lucide-react";
import { storage } from "../shared/storage";
import { ACCENT_COLORS } from "../shared/constants";
import type { AnalysisResult, HistoryEntry, Settings } from "../shared/types";
import Header from "./components/Header";
import RiskGauge from "./components/RiskGauge";
import AnalysisDetails from "./components/AnalysisDetails";
import History from "./components/History";
import SettingsPanel from "./components/Settings";
import ReportButton from "./components/ReportButton";
import Loading from "./components/Loading";

type View = "main" | "history" | "settings";

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentView, setCurrentView] = useState<View>("main");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (settings?.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings?.darkMode]);

  useEffect(() => {
    if (settings?.accentColor) {
      const color = ACCENT_COLORS[settings.accentColor];
      if (color) {
        document.documentElement.style.setProperty("--accent-primary", color.primary);
        document.documentElement.style.setProperty("--accent-dark", color.dark);
      }
    }
  }, [settings?.accentColor]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await storage.getAll();
      setAnalysis(data.currentAnalysis);
      setHistory(data.history);
      setSettings(data.settings);
    } catch (err) {
      setError("Erro ao carregar dados");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSettingsChange(updates: Partial<Settings>) {
    if (!settings) return;
    const updated = await storage.updateSettings(updates);
    setSettings(updated);
  }

  async function handleClearHistory() {
    await storage.clearHistory();
    setHistory([]);
  }

  async function handleWhitelistAdd(domain: string) {
    await storage.addToWhitelist(domain);
    const updated = await storage.getSettings();
    setSettings(updated);
  }

  async function handleWhitelistRemove(domain: string) {
    await storage.removeFromWhitelist(domain);
    const updated = await storage.getSettings();
    setSettings(updated);
  }

  if (loading) {
    return <Loading />;
  }

  const accentColor = settings?.accentColor || "purple";

  return (
    <div className="min-h-[200px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <Header
        darkMode={settings?.darkMode ?? false}
        onToggleDarkMode={() => handleSettingsChange({ darkMode: !settings?.darkMode })}
        currentView={currentView}
        onViewChange={setCurrentView}
        accentColor={accentColor}
      />

      <main className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
            <span className="text-red-500">⚠</span>
            {error}
          </div>
        )}

        {currentView === "main" && (
          <MainView
            analysis={analysis}
            detailedView={settings?.detailedView ?? false}
            onToggleDetailedView={() =>
              handleSettingsChange({ detailedView: !settings?.detailedView })
            }
            onWhitelistAdd={handleWhitelistAdd}
            accentColor={accentColor}
          />
        )}

        {currentView === "history" && (
          <History entries={history} onClear={handleClearHistory} />
        )}

        {currentView === "settings" && settings && (
          <SettingsPanel
            settings={settings}
            onChange={handleSettingsChange}
            onWhitelistRemove={handleWhitelistRemove}
          />
        )}
      </main>
    </div>
  );
}

interface MainViewProps {
  analysis: AnalysisResult | null;
  detailedView: boolean;
  onToggleDetailedView: () => void;
  onWhitelistAdd: (domain: string) => void;
  accentColor: string;
}

function MainView({
  analysis,
  detailedView,
  onToggleDetailedView,
  onWhitelistAdd,
  accentColor,
}: MainViewProps) {
  const color = ACCENT_COLORS[accentColor]?.primary || ACCENT_COLORS.purple.primary;

  if (!analysis) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ShieldQuestion className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
          Nenhuma análise disponível
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Navegue para um site para analisá-lo automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <RiskGauge
        riskLevel={analysis.risk_level}
        riskScore={analysis.risk_score}
        domain={analysis.domain}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={onToggleDetailedView}
          className="text-sm font-medium transition-colors hover:opacity-80 flex items-center gap-1.5"
          style={{ color }}
        >
          {detailedView ? (
            <>
              <Lightbulb className="w-4 h-4" />
              Visão simplificada
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
              Ver detalhes
            </>
          )}
        </button>

        <button
          onClick={() => onWhitelistAdd(analysis.domain)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5 transition-colors"
        >
          <ListPlus className="w-4 h-4" />
          Whitelist
        </button>
      </div>

      <AnalysisDetails analysis={analysis} detailed={detailedView} />

      {analysis.recommendations.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" style={{ color }} />
            Recomendações
          </h3>
          <ul className="space-y-2">
            {analysis.recommendations.slice(0, 3).map((rec, idx) => (
              <li
                key={idx}
                className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2 leading-relaxed"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReportButton url={analysis.url} />
    </div>
  );
}
