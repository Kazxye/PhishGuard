import { useState } from "react";
import { Flag, X, Send, CheckCircle, Loader2 } from "lucide-react";
import { api } from "../../shared/api";

interface ReportButtonProps {
  url: string;
}

export default function ReportButton({ url }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reason.trim()) return;

    setIsSubmitting(true);

    try {
      await api.reportSite(url, reason);
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setReason("");
      }, 2000);
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card p-4 text-center animate-fade-in">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Obrigado pelo report!
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Sua contribuição ajuda a manter a internet mais segura
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 flex items-center justify-center gap-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Flag className="w-4 h-4" />
        Reportar site suspeito
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-500" />
          Reportar site
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Por que este site é suspeito?"
          className="input text-sm resize-none h-20"
          required
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-secondary flex-1 text-sm py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
            className="btn-danger flex-1 text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
