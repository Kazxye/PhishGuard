import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Type,
  Calendar,
  Lock,
  Building2,
  FileText,
  Radar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { AnalysisResult } from "../../shared/types";

interface AnalysisDetailsProps {
  analysis: AnalysisResult;
  detailed: boolean;
}

interface CheckItem {
  label: string;
  status: "success" | "warning" | "error" | "info";
  value: string;
  icon: React.ReactNode;
  details?: string[];
}

export default function AnalysisDetails({ analysis, detailed }: AnalysisDetailsProps) {
  const checks: CheckItem[] = [
    {
      label: "Homógrafos",
      icon: <Type className="w-4 h-4" />,
      status: !analysis.homograph.has_homographs ? "success" : "error",
      value: analysis.homograph.has_homographs
          ? `Detectados (${analysis.homograph.suspicious_characters.length})`
          : "Nenhum detectado",
      details:
          detailed && analysis.homograph.has_homographs
              ? analysis.homograph.suspicious_characters.map(
                  (c) => `"${c.character}" parece "${c.looks_like}" (${c.script})`
              )
              : undefined,
    },
    {
      label: "Idade do domínio",
      icon: <Calendar className="w-4 h-4" />,
      status: !analysis.domain_age.is_new_domain ? "success" : "warning",
      value: analysis.domain_age.age_days
          ? `${analysis.domain_age.age_days.toLocaleString()} dias`
          : "Não disponível",
      details:
          detailed && analysis.domain_age.registrar
              ? [`Registrar: ${analysis.domain_age.registrar}`]
              : undefined,
    },
    {
      label: "Certificado SSL",
      icon: <Lock className="w-4 h-4" />,
      status: analysis.ssl.has_ssl && analysis.ssl.is_valid ? "success" : "warning",
      value: !analysis.ssl.has_ssl
          ? "Não possui"
          : analysis.ssl.is_valid
              ? "Válido"
              : "Inválido/Expirado",
      details:
          detailed && analysis.ssl.has_ssl
              ? ([
                analysis.ssl.issuer && `Emissor: ${analysis.ssl.issuer}`,
                analysis.ssl.days_until_expiry !== null &&
                `Expira em: ${analysis.ssl.days_until_expiry} dias`,
              ].filter(Boolean) as string[])
              : undefined,
    },
    {
      label: "Similaridade com marcas",
      icon: <Building2 className="w-4 h-4" />,
      status: !analysis.brand_similarity.is_suspicious ? "success" : "error",
      value: analysis.brand_similarity.is_suspicious
          ? `Similar a "${analysis.brand_similarity.matched_brand}" (${Math.round(
              analysis.brand_similarity.highest_similarity * 100
          )}%)`
          : "Nenhuma similaridade",
      details:
          detailed && analysis.brand_similarity.matches.length > 0
              ? analysis.brand_similarity.matches
                  .slice(0, 3)
                  .map((m) => `${m.brand}: ${Math.round(m.similarity * 100)}%`)
              : undefined,
    },
  ];

  if (analysis.form_analysis) {
    const formStatus: "success" | "warning" =
        analysis.form_analysis.external_actions.length === 0 &&
        analysis.form_analysis.password_fields <= 1
            ? "success"
            : "warning";

    checks.push({
      label: "Formulários",
      icon: <FileText className="w-4 h-4" />,
      status: formStatus,
      value:
          analysis.form_analysis.total_forms === 0
              ? "Nenhum formulário"
              : `${analysis.form_analysis.total_forms} formulário(s)`,
      details: detailed
          ? ([
            analysis.form_analysis.password_fields > 0 &&
            `Campos de senha: ${analysis.form_analysis.password_fields}`,
            analysis.form_analysis.hidden_fields > 0 &&
            `Campos ocultos: ${analysis.form_analysis.hidden_fields}`,
            analysis.form_analysis.external_actions.length > 0 &&
            `Ações externas: ${analysis.form_analysis.external_actions.join(", ")}`,
          ].filter((item): item is string => Boolean(item)))
          : undefined,
    });
  }

  if (analysis.virustotal) {
    const vt = analysis.virustotal;
    const threats = vt.malicious + vt.suspicious;

    const vtStatus: "success" | "warning" | "error" | "info" =
        vt.malicious >= 3
            ? "error"
            : vt.malicious >= 1 || vt.suspicious >= 1
                ? "warning"
                : "success";

    checks.push({
      label: "VirusTotal",
      icon: <Radar className="w-4 h-4" />,
      status: vtStatus,
      value:
          threats > 0
              ? `${threats}/${vt.total_engines} detecções`
              : `Limpo (${vt.total_engines} engines)`,
      details: detailed
          ? ([
            `Maliciosos: ${vt.malicious}`,
            `Suspeitos: ${vt.suspicious}`,
            `Taxa de detecção: ${vt.detection_rate.toFixed(1)}%`,
            ...(vt.flagged_engines.length > 0
                ? [`Engines: ${vt.flagged_engines.slice(0, 5).join(", ")}`]
                : []),
          ])
          : undefined,
    });
  }

  return (
      <div className="card divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {checks.map((check, idx) => (
            <CheckItemComponent key={idx} {...check} />
        ))}
      </div>
  );
}

interface CheckItemComponentProps {
  label: string;
  status: "success" | "warning" | "error" | "info";
  value: string;
  icon: React.ReactNode;
  details?: string[];
}

function CheckItemComponent({ label, status, value, icon, details }: CheckItemComponentProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = details && details.length > 0;

  const StatusIcon = getStatusIcon(status);
  const statusColors = {
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
    info: "text-blue-500",
  };

  const bgColors = {
    success: "bg-green-50 dark:bg-green-900/20",
    warning: "bg-yellow-50 dark:bg-yellow-900/20",
    error: "bg-red-50 dark:bg-red-900/20",
    info: "bg-blue-50 dark:bg-blue-900/20",
  };

  return (
      <div
          className={`transition-colors duration-200 ${
              hasDetails ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""
          }`}
          onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColors[status]}`}>
              <span className={statusColors[status]}>{icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
              </span>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={`w-4 h-4 ${statusColors[status]}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {value}
                </span>
                  {hasDetails && (
                      expanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                      )
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasDetails && expanded && (
              <ul className="mt-2 ml-11 space-y-1 animate-fade-in">
                {details.map((detail, idx) => (
                    <li
                        key={idx}
                        className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-400" />
                      {detail}
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
  );
}

function getStatusIcon(status: "success" | "warning" | "error" | "info") {
  switch (status) {
    case "success":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    case "info":
      return Info;
  }
}