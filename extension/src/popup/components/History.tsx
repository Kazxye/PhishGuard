import { ClipboardList, Trash2, Clock, ExternalLink } from "lucide-react";
import type { HistoryEntry } from "../../shared/types";
import { RISK_COLORS, RISK_LABELS } from "../../shared/constants";

interface HistoryProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

export default function History({ entries, onClear }: HistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
          Histórico vazio
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          As últimas 10 análises aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Últimas análises ({entries.length})
        </h2>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {entries.map((entry, idx) => (
          <HistoryItem key={entry.id} entry={entry} index={idx} />
        ))}
      </div>
    </div>
  );
}

interface HistoryItemProps {
  entry: HistoryEntry;
  index: number;
}

function HistoryItem({ entry, index }: HistoryItemProps) {
  const color = RISK_COLORS[entry.risk_level];
  const label = RISK_LABELS[entry.risk_level];
  const date = new Date(entry.analyzed_at);
  const timeAgo = formatTimeAgo(date);

  return (
    <div
      className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: color }}
      >
        {entry.risk_score}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {entry.domain}
          </p>
          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span
            className="px-1.5 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "Ontem";
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
