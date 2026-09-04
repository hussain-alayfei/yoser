/**
 * الميزة 2 — اكتشاف الطلبات المتوقفة.
 *
 * تراقب الحالات وتُظهر للجمعية ما يحتاج متابعة، قبل أن يشتكي المستفيد.
 *
 * الإشارات المرصودة: بقاء أطول من المعتاد في مرحلة، غياب التحديث، اكتمال
 * مستند دون تحرّك الطلب، تكرار تحويل الحالة، وتكرار تواصل المستفيد بلا تقدّم.
 *
 * القواعد العددية تُحسب هنا في الخادم قبل النموذج، والنموذج يفسّرها ويرتّب
 * الأولوية. هكذا تبقى الأرقام صحيحة دائمًا ولا يخترعها النموذج.
 */

import type {
  StallSeverity,
  StalledCaseFinding,
  StalledCaseInput,
  StalledCasesRequest,
  StalledCasesResult,
  StallThresholds,
} from "../../shared/ai.js";
import { handlePost, json, readJson } from "../_lib/http.js";
import { ask, type JsonSchema } from "../_lib/openai.js";

const SEVERITY: StallSeverity[] = ["تحتاج تدخل", "تحتاج متابعة", "عادية"];

const schema: JsonSchema = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      description: "تقييم لكل حالة وردت، بنفس المعرّفات.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "معرّف الحالة كما ورد حرفيًا." },
          needsFollowUp: { type: "boolean", description: "هل تحتاج هذه الحالة متابعة من الجمعية الآن؟" },
          severity: { type: "string", enum: SEVERITY },
          summary: { type: "string", description: "جملة واحدة تشرح لماذا تبدو الحالة متوقفة." },
          recommendedAction: { type: "string", description: "إجراء تشغيلي واحد ملموس تنفّذه الجمعية." },
        },
        required: ["id", "needsFollowUp", "severity", "summary", "recommendedAction"],
        additionalProperties: false,
      },
    },
  },
  required: ["findings"],
  additionalProperties: false,
};

const SYSTEM = `أنت مساعد تشغيلي لجمعية إسكان سعودية. مهمتك مراجعة حالات الطلبات وتحديد ما توقّف منها ويحتاج متابعة.

قواعد صارمة:
- اعتمد على الإشارات المعطاة لكل حالة فقط. الأرقام محسوبة مسبقًا؛ لا تعِد حسابها ولا تخترع أرقامًا جديدة.
- «تحتاج تدخل» للحالات التي توقّفت فعلًا ويضرّ تأخّرها بالمستفيد. «تحتاج متابعة» لما يقترب من التوقّف. «عادية» لما يسير طبيعيًا.
- إذا كانت المسؤولية على المستفيد، اجعل الإجراء تذكيرًا أو تواصلًا معه. إذا كانت على الجهة المختصة، اجعله مراجعة أو استعلامًا من الجهة. لا تطلب من الجمعية ما ليس في يدها.
- الإجراء المقترح جملة واحدة قابلة للتنفيذ فورًا، لا نصيحة عامة.
- لا تصدر حكمًا على أهلية المستفيد ولا على قبول طلبه. أنت تراقب سير الإجراء فقط.
- اكتب بالعربية الفصحى المبسطة.`;

/** يحسب الإشارات عدديًا — مصدر الحقيقة للأرقام، خارج النموذج. */
function detectSignals(item: StalledCaseInput, t: StallThresholds): string[] {
  const signals: string[] = [];

  if (item.daysInStage > t.maxStageDays) {
    signals.push(`بقي الطلب ${item.daysInStage} يومًا في مرحلة «${item.stage}» والحدّ المعتاد ${t.maxStageDays} يومًا`);
  }
  if (item.daysSinceUpdate > t.maxDaysWithoutUpdate) {
    signals.push(`لا يوجد تحديث منذ ${item.daysSinceUpdate} يومًا`);
  }
  if (item.requirement === "مكتمل" && item.daysSinceUpdate > t.maxDaysWithoutUpdate) {
    signals.push("المتطلبات مكتملة لكن الطلب لم يتحرك");
  }
  if (item.requirement !== "مكتمل") {
    signals.push(`متطلب غير مكتمل (${item.requirement}) يمنع تقدّم الطلب`);
  }
  if (item.reassignments > 1) {
    signals.push(`تم تحويل الحالة ${item.reassignments} مرات بين الجهات`);
  }
  if (item.beneficiaryContacts > 1) {
    signals.push(`تواصل المستفيد ${item.beneficiaryContacts} مرات دون تقدّم`);
  }

  return signals;
}

/** تصنيف احتياطي بالقواعد وحدها، يُستخدم إن تعذّر النموذج. */
function ruleSeverity(signals: string[]): StallSeverity {
  if (signals.length >= 3) return "تحتاج تدخل";
  if (signals.length >= 1) return "تحتاج متابعة";
  return "عادية";
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handlePost(request, async req => {
      const input = await readJson<StalledCasesRequest>(req);
      const thresholds = input.thresholds;

      const enriched = input.cases.map(c => ({ case: c, signals: detectSignals(c, thresholds) }));

      const user = `الحدود التشغيلية: أقصى مدة في المرحلة ${thresholds.maxStageDays} يومًا، وأقصى مدة بلا تحديث ${thresholds.maxDaysWithoutUpdate} يومًا.

الحالات:
${enriched
  .map(
    e => `— المعرّف ${e.case.id} | ${e.case.name} | المرحلة: ${e.case.stage} | المسؤول: ${e.case.owner} | آخر إجراء: ${e.case.lastAction}
  الإشارات المرصودة: ${e.signals.length ? e.signals.join(" · ") : "لا توجد إشارات توقّف"}`
  )
  .join("\n")}

قيّم كل حالة.`;

      const result = await ask<{ findings: Omit<StalledCaseFinding, "signals">[] }>({
        system: SYSTEM,
        user,
        schemaName: "stalled_cases",
        schema,
        effort: "low",
        verbosity: "low",
        maxOutputTokens: 3000,
      });

      // الإشارات تأتي من الحساب العددي، لا من النموذج.
      const byId = new Map(enriched.map(e => [e.case.id, e.signals]));
      const findings: StalledCaseFinding[] = result.findings.map(f => ({
        ...f,
        signals: byId.get(f.id) ?? [],
      }));

      return json({ findings, source: "ai" } satisfies StalledCasesResult);
    });
  },
};

export { detectSignals, ruleSeverity };
