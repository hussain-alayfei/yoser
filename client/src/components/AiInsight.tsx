/** Shared UI for transparent AI-assisted guidance. */
import { Compass, Info, Loader2, ShieldCheck } from "lucide-react";
import type { AiSource } from "@shared/ai";

/**
 * A quiet provenance mark: visible enough to explain where assistance happened,
 * never styled as a decorative AI feature. When the model is unavailable we
 * say "قواعد" explicitly so the interface never implies AI ran when it did not.
 */
export function AiBadge({ source, loading, notConfigured }: { source: AiSource; loading?: boolean; notConfigured?: boolean }) {
  if (loading) {
    return (
      <span className="ai-badge loading" title="مساعد يسر يحلل البيانات المعروضة في هذه الصفحة">
        <Loader2 size={12} className="ai-spin" />
        مساعد يسر
      </span>
    );
  }

  if (notConfigured) {
    return (
      <span className="ai-badge rules" title="الذكاء الاصطناعي غير مفعّل حاليًا؛ النتيجة المعروضة محسوبة بالقواعد الأساسية.">
        <ShieldCheck size={12} />
        مساعد يسر · قواعد
      </span>
    );
  }

  return source === "ai" ? (
    <span className="ai-badge ai" title="تحليل مساعد من النموذج، مع بقاء القرار النهائي للجهة المختصة">
      <Compass size={12} />
      مساعد يسر
    </span>
  ) : (
    <span className="ai-badge rules" title="النتيجة محسوبة من قواعد النظام دون استدعاء النموذج">
      <ShieldCheck size={12} />
      مساعد يسر · قواعد
    </span>
  );
}

/** ثابت في المواضع التي قد يخلط فيها المستخدم بين الترشيح والقرار الرسمي. */
export function AiDecisionNotice({ text }: { text: string }) {
  return (
    <p className="ai-decision-notice">
      <Info size={15} />
      <span>{text}</span>
    </p>
  );
}

export function AiFactors({ factors }: { factors: string[] }) {
  if (!factors.length) return null;
  return (
    <ul className="ai-factors" aria-label="العوامل التي بُني عليها الترشيح">
      {factors.map(factor => <li key={factor}>{factor}</li>)}
    </ul>
  );
}
