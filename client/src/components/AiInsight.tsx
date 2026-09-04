/** Shared UI for transparent AI-assisted guidance. */
import { Compass, Info, Loader2, ShieldCheck } from "lucide-react";
import type { AiSource } from "@shared/ai";

/**
 * Always name the product capability, not just the technology. The user should
 * understand that "مساعد يسر" is guidance layered on top of deterministic rules.
 */
export function AiBadge({ source, loading, notConfigured }: { source: AiSource; loading?: boolean; notConfigured?: boolean }) {
  if (loading) {
    return (
      <span className="ai-badge loading" title="يحلل مساعد يسر البيانات المعروضة في هذه الصفحة">
        <Loader2 size={13} className="ai-spin" />
        مساعد يسر · جارٍ التحليل
      </span>
    );
  }

  if (notConfigured) {
    return (
      <span className="ai-badge rules" title="الذكاء الاصطناعي غير مفعّل حاليًا؛ النتيجة المعروضة محسوبة بالقواعد الأساسية.">
        <ShieldCheck size={13} />
        مساعد يسر · قواعد أساسية
      </span>
    );
  }

  return source === "ai" ? (
    <span className="ai-badge ai" title="صياغة وتحليل مساعد من النموذج، مع بقاء القرار النهائي للجهة المختصة">
      <Compass size={13} />
      مساعد يسر · تحليل ذكي
    </span>
  ) : (
    <span className="ai-badge rules" title="النتيجة محسوبة من قواعد النظام دون استدعاء النموذج">
      <ShieldCheck size={13} />
      مساعد يسر · قواعد أساسية
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
