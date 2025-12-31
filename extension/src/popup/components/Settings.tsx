import { useState } from "react";
import {
  Palette,
  Bell,
  Eye,
  Moon,
  Plus,
  X,
  Server,
  Shield,
  Sparkles,
  Check,
} from "lucide-react";
import type { Settings } from "../../shared/types";
import { ACCENT_COLORS } from "../../shared/constants";

interface SettingsProps {
  settings: Settings;
  onChange: (updates: Partial<Settings>) => void;
  onWhitelistRemove: (domain: string) => void;
}

export default function SettingsPanel({
  settings,
  onChange,
  onWhitelistRemove,
}: SettingsProps) {
  const [newDomain, setNewDomain] = useState("");

  function handleAddWhitelist(e: React.FormEvent) {
    e.preventDefault();
    const domain = newDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    if (domain && !settings.whitelist.includes(domain)) {
      onChange({ whitelist: [...settings.whitelist, domain] });
      setNewDomain("");
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cor do Tema */}
      <section className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Cor do Tema
        </h2>

        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ACCENT_COLORS).map(([key, { name, primary }]) => (
            <button
              key={key}
              onClick={() => onChange({ accentColor: key })}
              className={`relative p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                settings.accentColor === key
                  ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
                  : ""
              }`}
              style={{
                backgroundColor: primary,
                ...(settings.accentColor === key && { 
                  boxShadow: `0 0 0 2px ${primary}` 
                }),
              }}
              title={name}
            >
              {settings.accentColor === key && (
                <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Preferências */}
      <section className="card p-4 space-y-1">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" />
          Preferências
        </h2>

        <ToggleOption
          icon={<Moon className="w-4 h-4" />}
          label="Modo escuro"
          description="Alterna o tema da extensão"
          checked={settings.darkMode}
          onChange={(checked) => onChange({ darkMode: checked })}
          accentColor={settings.accentColor}
        />

        <ToggleOption
          icon={<Bell className="w-4 h-4" />}
          label="Notificações"
          description="Alertas para sites de alto risco"
          checked={settings.notificationsEnabled}
          onChange={(checked) => onChange({ notificationsEnabled: checked })}
          accentColor={settings.accentColor}
        />

        <ToggleOption
          icon={<Eye className="w-4 h-4" />}
          label="Visão detalhada"
          description="Mostra mais informações por padrão"
          checked={settings.detailedView}
          onChange={(checked) => onChange({ detailedView: checked })}
          accentColor={settings.accentColor}
        />
      </section>

      {/* Whitelist */}
      <section className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Whitelist
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Sites na whitelist não serão analisados
        </p>

        <form onSubmit={handleAddWhitelist} className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="exemplo.com"
            className="input flex-1 text-sm"
          />
          <button
            type="submit"
            className="btn-primary text-sm px-3 flex items-center gap-1"
            style={{
              backgroundColor: ACCENT_COLORS[settings.accentColor]?.primary,
            }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {settings.whitelist.length > 0 ? (
          <ul className="space-y-1.5 max-h-32 overflow-y-auto">
            {settings.whitelist.map((domain) => (
              <li
                key={domain}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {domain}
                </span>
                <button
                  onClick={() => onWhitelistRemove(domain)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">
            Nenhum domínio na whitelist
          </p>
        )}
      </section>

      {/* API Backend */}
      <section className="card p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Server className="w-4 h-4" />
          API Backend
        </h2>
        <input
          type="text"
          value={settings.apiUrl}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
          className="input text-sm"
          placeholder="http://localhost:8000/api/v1"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          URL do servidor PhishGuard
        </p>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-2 flex items-center justify-center gap-1.5">
        <Shield className="w-3 h-3" />
        PhishGuard v1.0.0
      </footer>
    </div>
  );
}

interface ToggleOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accentColor: string;
}

function ToggleOption({
  icon,
  label,
  description,
  checked,
  onChange,
  accentColor,
}: ToggleOptionProps) {
  const color = ACCENT_COLORS[accentColor]?.primary || ACCENT_COLORS.purple.primary;

  return (
    <label className="flex items-center justify-between cursor-pointer group py-2 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? "" : "bg-gray-300 dark:bg-gray-600"
        }`}
        style={{ backgroundColor: checked ? color : undefined }}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
