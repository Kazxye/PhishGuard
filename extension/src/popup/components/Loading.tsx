import { Shield, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[200px] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow">
          <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
        Carregando PhishGuard...
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Preparando análise de segurança
      </p>
    </div>
  );
}
