/** عناصر مشتركة لعرض مخرجات الذكاء الاصطناعي بشفافية: مصدر النتيجة وتنبيه القرار. */
import { Info, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import type { AiSource } from "@shared/ai";

/**
 * شارة تُظهر مصدر النتيجة.
 * الشفافية مقصودة: المستخدم يعرف متى قرأ تحليلًا ذكيًا ومتى قرأ قاعدة ثابتة.
 */
export function AiBadge({ source, loading }: { source: AiSource; loading?: boolean }) {
  if (loading) {
    return (
      <span className="ai-badge loading">
        <Loader2 size={13} className="ai-spin" />
        جارٍ التحليل
      </span>
    );
  }
  return source === "ai" ? (
    <span className="ai-badge ai">
      <Sparkles size={13} />
      تحليل ذكي
    </span>
  ) : (
    <span className="ai-badge rules">
      <ShieldCheck size={13} />
      قواعد أساسية
    </span>
  );
}

/** تنبيه ثابت: ما يظهر ترشيح وتفسير، وليس قرار أهلية. */
export function AiDecisionNotice({ text }: { text: string }) {
  return (
    <p className="ai-decision-notice">
      <Info size={15} />
      <span>{text}</span>
    </p>
  );
}

/** أسباب الترشيح كوسوم قصيرة. */
export function AiFactors({ factors }: { factors: string[] }) {
  if (!factors.length) return null;
  return (
    <ul className="ai-factors" aria-label="العوامل التي بُني عليها الترشيح">
      {factors.map(factor => (
        <li key={factor}>{factor}</li>
      ))}
    </ul>
  );
}
