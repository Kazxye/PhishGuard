import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, Shield } from "lucide-react";
import type { RiskLevel } from "../../shared/types";
import { RISK_COLORS, RISK_LABELS, RISK_DESCRIPTIONS } from "../../shared/constants";

interface RiskGaugeProps {
  riskLevel: RiskLevel;
  riskScore: number;
  domain: string;
}

export default function RiskGauge({ riskLevel, riskScore, domain }: RiskGaugeProps) {
  const color = RISK_COLORS[riskLevel];
  const label = RISK_LABELS[riskLevel];
  const description = RISK_DESCRIPTIONS[riskLevel];

  const circumference = 2 * Math.PI * 45;
  const progress = (riskScore / 100) * circumference;
  const offset = circumference - progress;

  const RiskIcon = getRiskIcon(riskLevel);

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold transition-colors duration-300"
              style={{ color }}
            >
              {riskScore}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-300"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <RiskIcon className="w-3.5 h-3.5" />
              {label}
            </div>
          </div>

          <h2 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
            {domain}
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            Seguro
          </span>
          <span className="flex items-center gap-1">
            Crítico
            <ShieldX className="w-3 h-3 text-red-500" />
          </span>
        </div>
        
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-green-500 to-lime-500" />
            <div className="flex-1 bg-gradient-to-r from-lime-500 to-yellow-500" />
            <div className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500" />
            <div className="flex-1 bg-gradient-to-r from-orange-500 to-red-500" />
          </div>
        </div>
        
        <div className="relative h-0">
          <div
            className="absolute -top-3 w-3 h-3 bg-gray-900 dark:bg-white rounded-full shadow-lg border-2 border-white dark:border-gray-800 transition-all duration-500 ease-out"
            style={{ left: `calc(${riskScore}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
}

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case "safe":
      return ShieldCheck;
    case "low":
      return Shield;
    case "medium":
      return AlertTriangle;
    case "high":
      return ShieldAlert;
    case "critical":
      return ShieldX;
    default:
      return Shield;
  }
}
