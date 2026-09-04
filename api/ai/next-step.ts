/**
 * الميزة 3 — تحديد الخطوة التالية.
 *
 * يقرأ النموذج: المرحلة الحالية + المستندات + آخر إجراء + حالة الملف،
 * ثم يعيد إمّا إجراءً واحدًا واضحًا للمستفيد، أو تصريحًا بأن لا إجراء مطلوبًا
 * منه حاليًا لأن الطلب لدى جهة أخرى. الهدف إجابة سؤال «وش أسوي الحين؟».
 */

import type { NextStepRequest, NextStepResult } from "../../shared/ai.js";
import { handlePost, json, readJson } from "../_lib/http.js";
import { ask, type JsonSchema } from "../_lib/openai.js";

const HREFS = [
  "/start",
  "/programs",
  "/application",
  "/requirements",
  "/notifications",
  "/unit",
  "/unit/maintenance",
  "/unit/maintenance/new",
];

const OWNERS = ["المستفيد", "الجمعية", "الجهة المختصة", "مقدم الخدمة", "لا أحد"];

const schema: JsonSchema = {
  type: "object",
  properties: {
    actionRequired: {
      type: "boolean",
      description: "true فقط إذا كان على المستفيد نفسه تنفيذ شيء الآن.",
    },
    title: { type: "string", description: "عنوان قصير جدًا للخطوة، بصيغة الأمر، دون نقطة في آخره." },
    description: { type: "string", description: "جملة أو جملتان توضحان سبب هذه الخطوة بلغة غير تقنية." },
    href: { type: "string", enum: HREFS, description: "المسار الذي ينفّذ فيه المستفيد الخطوة." },
    label: { type: "string", description: "نص الزر، كلمتان أو ثلاث." },
    waitingOn: { type: "string", enum: OWNERS, description: "الجهة التي ينتظرها الطلب الآن." },
  },
  required: ["actionRequired", "title", "description", "href", "label", "waitingOn"],
  additionalProperties: false,
};

const SYSTEM = `أنت مساعد داخل منصّة إسكان سعودية اسمها «يسر». مهمتك تحديد الخطوة التالية للمستفيد.

اقرأ حالة الطلب المعطاة وأعد خطوة واحدة فقط — الأهم الآن.

قواعد صارمة:
- إذا كان الطلب لدى الجهة المختصة أو الجمعية ولا يحتاج شيئًا من المستفيد، اجعل actionRequired = false، واكتب بوضوح أنه لا يوجد إجراء مطلوب منه حاليًا، وحدّد من ينتظره الطلب. لا تخترع مهمة لملء الفراغ.
- لا تَعِد بمواعيد أو مدد زمنية غير موجودة في البيانات.
- لا تقرر أهلية ولا رفضًا ولا قبولًا. أنت ترشد إلى إجراء فقط.
- اكتب بالعربية الفصحى المبسطة، بضمير المخاطب للمستفيد، دون مصطلحات إدارية معقّدة.
- العنوان قصير: من كلمتين إلى خمس كلمات.
- اختر href المسار الذي ينفَّذ فيه الإجراء فعلًا. إذا لم يكن هناك إجراء، اختر مسار متابعة مثل /notifications أو /application.`;

function buildUser(input: NextStepRequest): string {
  const docs = input.documents.length
    ? input.documents.map(d => `- ${d.name}: ${d.status}`).join("\n")
    : "- لا توجد مستندات مسجّلة";

  return `حالة الطلب:
- المرحلة الحالية: ${input.stage} (${input.stageNumber} من ${input.totalStages})
- الجهة المسؤولة الآن: ${input.owner}
- آخر إجراء: ${input.lastAction}
- عدد الأيام منذ آخر تحديث: ${input.daysSinceUpdate}
- أكمل بياناته الشخصية: ${input.hasProfile ? "نعم" : "لا"}
- البرنامج المختار: ${input.selectedProgram ?? "لم يختر بعد"}
- قدّم الطلب: ${input.hasApplication ? "نعم" : "لا"}
- سياق الصفحة: ${input.context}${input.handover ? " (بعد استلام المسكن)" : ""}

المستندات:
${docs}

حدّد الخطوة التالية.`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handlePost(request, async req => {
      const input = await readJson<NextStepRequest>(req);

      const result = await ask<Omit<NextStepResult, "source">>({
        system: SYSTEM,
        user: buildUser(input),
        schemaName: "next_step",
        schema,
        effort: "low",
        verbosity: "low",
        maxOutputTokens: 1200,
      });

      return json({ ...result, source: "ai" } satisfies NextStepResult);
    });
  },
};
