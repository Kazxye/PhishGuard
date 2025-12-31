import { Shield, Sun, Moon, BarChart3, History, Settings } from "lucide-react";
import { ACCENT_COLORS } from "../../shared/constants";

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentView: "main" | "history" | "settings";
  onViewChange: (view: "main" | "history" | "settings") => void;
  accentColor: string;
}

export default function Header({
  darkMode,
  onToggleDarkMode,
  currentView,
  onViewChange,
  accentColor,
}: HeaderProps) {
  const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.purple;

  return (
    <header
      className="text-white px-4 py-3 transition-colors duration-300"
      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">PhishGuard</h1>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200 active:scale-95"
          title={darkMode ? "Modo claro" : "Modo escuro"}
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex gap-1">
        <NavButton
          active={currentView === "main"}
          onClick={() => onViewChange("main")}
          icon={<BarChart3 className="w-4 h-4" />}
        >
          Análise
        </NavButton>
        <NavButton
          active={currentView === "history"}
          onClick={() => onViewChange("history")}
          icon={<History className="w-4 h-4" />}
        >
          Histórico
        </NavButton>
        <NavButton
          active={currentView === "settings"}
          onClick={() => onViewChange("settings")}
          icon={<Settings className="w-4 h-4" />}
        >
          Config
        </NavButton>
      </nav>
    </header>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavButton({ active, onClick, icon, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-white/25 text-white shadow-sm"
          : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
