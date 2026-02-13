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
  Globe,
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
  const accentPrimary =
      ACCENT_COLORS[settings.accentColor]?.primary || ACCENT_COLORS.purple.primary;

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
        <section className="card p-4 space-y-3">
          <SectionHeader icon={<Palette className="w-4 h-4" />} title="Cor do Tema" />

          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ACCENT_COLORS).map(([key, { name, primary }]) => {
              const isActive = settings.accentColor === key;

              return (
                  <button
                      key={key}
                      onClick={() => onChange({ accentColor: key })}
                      className={`relative h-9 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                          isActive
                              ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800"
                              : "hover:brightness-110"
                      }`}
                      style={{
                        backgroundColor: primary,
                        ...(isActive && { ringColor: primary }),
                      }}
                      title={name}
                  >
                    {isActive && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                    )}
                  </button>
              );
            })}
          </div>
        </section>

        <section className="card p-4 space-y-0.5">
          <SectionHeader
              icon={<Sparkles className="w-4 h-4" />}
              title="Preferências"
              className="mb-2"
          />

          <ToggleOption
              icon={<Moon className="w-4 h-4" />}
              label="Modo escuro"
              description="Alterna o tema da extensão"
              checked={settings.darkMode}
              onChange={(checked) => onChange({ darkMode: checked })}
              accentColor={accentPrimary}
          />

          <ToggleOption
              icon={<Bell className="w-4 h-4" />}
              label="Notificações"
              description="Alertas para sites de alto risco"
              checked={settings.notificationsEnabled}
              onChange={(checked) => onChange({ notificationsEnabled: checked })}
              accentColor={accentPrimary}
          />

          <ToggleOption
              icon={<Eye className="w-4 h-4" />}
              label="Visão detalhada"
              description="Mostra mais informações por padrão"
              checked={settings.detailedView}
              onChange={(checked) => onChange({ detailedView: checked })}
              accentColor={accentPrimary}
          />
        </section>

        <section className="card p-4 space-y-3">
          <div>
            <SectionHeader icon={<Shield className="w-4 h-4" />} title="Whitelist" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Sites na whitelist não serão analisados
            </p>
          </div>

          <form onSubmit={handleAddWhitelist} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="exemplo.com"
                  className="input text-sm w-full pl-8"
              />
            </div>
            <button
                type="submit"
                disabled={!newDomain.trim()}
                className="text-sm px-3 rounded-lg text-white transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                style={{ backgroundColor: accentPrimary }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {settings.whitelist.length > 0 ? (
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {settings.whitelist.map((domain) => (
                    <li
                        key={domain}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg group transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/60"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: accentPrimary }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {domain}
                  </span>
                      </div>
                      <button
                          onClick={() => onWhitelistRemove(domain)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                ))}
              </ul>
          ) : (
              <div className="text-center py-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Nenhum domínio na whitelist
                </p>
              </div>
          )}
        </section>

        <section className="card p-4 space-y-2">
          <SectionHeader icon={<Server className="w-4 h-4" />} title="API Backend" />
          <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => onChange({ apiUrl: e.target.value })}
              className="input text-sm"
              placeholder="http://localhost:8000/api/v1"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-0.5">
            URL do servidor PhishGuard
          </p>
        </section>

        <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-2 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" />
          PhishGuard v1.0.0
        </footer>
      </div>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  className?: string;
}

function SectionHeader({ icon, title, className = "" }: SectionHeaderProps) {
  return (
      <h2
          className={`text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 ${className}`}
      >
        {icon}
        {title}
      </h2>
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
  return (
      <div
          className="flex items-center justify-between cursor-pointer group py-2.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => onChange(!checked)}
      >
        <div className="flex items-center gap-3 min-w-0">
        <span className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0">
          {icon}
        </span>
          <div className="min-w-0">
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
            onClick={(e) => {
              e.stopPropagation();
              onChange(!checked);
            }}
            className={`relative flex-shrink-0 w-[42px] h-[24px] rounded-full transition-colors duration-300 ease-in-out ${
                checked ? "" : "bg-gray-300 dark:bg-gray-700"
            }`}
            style={{ backgroundColor: checked ? accentColor : undefined }}
        >
        <span
            className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                checked ? "translate-x-[18px]" : "translate-x-0"
            }`}
        />
        </button>
      </div>
  );
}