/**
 * الميزة 1 — اقتراح البرامج المناسبة للمستفيد.
 *
 * يحلّل النموذج ملف المستفيد ويرتّب البرامج بدرجة ملاءمة مبدئية مع تفسير مكتوب.
 *
 * الضمانة الأهم هنا مزدوجة، في الموجّه وفي المخطط معًا:
 * لا يوجد حقل يعبّر عن «مؤهل» أو «مقبول» أو «مرفوض»، وقيم الملاءمة الأربع
 * المسموح بها كلها وصف مبدئي وليست قرارًا. القرار النهائي للجهة المختصة.
 */

import type { ProgramRecommendInput, ProgramRecommendResult } from "../../shared/ai";
import { AI_DISCLAIMER } from "../../shared/ai";
import { handlePost, json, readJson } from "../_lib/http";
import { ask, type JsonSchema } from "../_lib/openai";

const SUITABILITY = [
  "ملاءمة مبدئية مرتفعة",
  "ملاءمة مبدئية متوسطة",
  "يحتاج تحقق إضافي",
  "غير مناسب للحالة الحالية",
];

const schema: JsonSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      description: "ترشيح لكل برنامج في القائمة المُرسلة، بنفس الأسماء، مرتّبة من الأنسب للأقل.",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "اسم البرنامج كما ورد حرفيًا في القائمة." },
          suitability: { type: "string", enum: SUITABILITY },
          explanation: {
            type: "string",
            description: "سبب هذا الترشيح بلغة واضحة للمستفيد، جملة إلى جملتين، دون مصطلحات إدارية.",
          },
          factors: {
            type: "array",
            description: "من ٢ إلى ٤ عوامل من بيانات المستفيد بنيت عليها الملاءمة، كل عامل عبارة قصيرة.",
            items: { type: "string" },
          },
        },
        required: ["name", "suitability", "explanation", "factors"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
};

const SYSTEM = `أنت مساعد ترشيح داخل منصّة إسكان سعودية اسمها «يسر».

مهمتك: مقارنة ملف المستفيد بالبرامج المتاحة، وإعطاء درجة ملاءمة مبدئية وتفسيرًا لكل برنامج.

قواعد صارمة لا تُخالَف:
- أنت لا تقرر أهلية. لا تكتب أبدًا أن المستفيد «مؤهل» أو «مقبول» أو «مرفوض» أو «مستحق». كل ما تنتجه ترشيح مبدئي وتفسير له.
- استخدم صيغة الاحتمال دائمًا: «قد يناسب»، «يبدو مبدئيًا»، «تشير البيانات إلى». لا تستخدم صيغة الجزم.
- اذكر كل برنامج ورد في القائمة، ولا تخترع برنامجًا غير موجود، ولا تغيّر اسمه.
- ابنِ التفسير على البيانات المعطاة فقط: حجم الأسرة، الوضع السكني، الدخل، الدعم، المصروفات، حالة البحث الاجتماعي، المدينة. لا تفترض بيانات غائبة.
- إذا كانت البيانات ناقصة أو متعارضة لبرنامج ما، اجعل ملاءمته «يحتاج تحقق إضافي» واشرح أي بيان ينقص تحديدًا.
- اكتب بالعربية الفصحى المبسطة وبضمير المخاطب.
- رتّب النتائج من الأنسب إلى الأقل مناسبة.`;

function buildUser(input: ProgramRecommendInput): string {
  const net = input.monthlyIncome + input.monthlySupport - input.monthlyExpenses;
  const list = input.programs.map((p, i) => `${i + 1}. ${p.name} — ${p.description}`).join("\n");

  return `ملف المستفيد:
- المدينة: ${input.city}
- عدد أفراد الأسرة: ${input.familyMembers}
- الوضع السكني الحالي: ${input.housingStatus}
- الدخل الشهري: ${input.monthlyIncome} ريال
- الدعم الشهري: ${input.monthlySupport} ريال
- المصروفات الشهرية: ${input.monthlyExpenses} ريال
- الفائض الشهري التقريبي: ${net} ريال
- حالة البحث الاجتماعي: ${input.socialResearchStatus}

البرامج المتاحة:
${list}

أعطِ ترشيحًا وتفسيرًا لكل برنامج.`;
}

/**
 * حارس برمجي إضافي: يستبدل أي لفظ قرار تسرّب إلى النص رغم الموجّه.
 *
 * ملاحظة: لا نستخدم \b هنا لأن حدود الكلمات في JavaScript تُحسب على \w اللاتينية،
 * والحروف العربية خارجها، فلا يتحقق الحدّ أصلًا. نرتّب البدائل من الأطول للأقصر
 * حتى تُلتقط «غير مؤهل» قبل «مؤهل».
 */
const FORBIDDEN = /(غير مؤهل|تمت الموافقة|مرفوض|مقبول|مؤهل|مستحق|نرفض|نوافق)/g;

function sanitize(text: string): string {
  return text.replace(FORBIDDEN, "مناسب مبدئيًا");
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handlePost(request, async req => {
      const input = await readJson<ProgramRecommendInput>(req);

      const result = await ask<{ recommendations: ProgramRecommendResult["recommendations"] }>({
        system: SYSTEM,
        user: buildUser(input),
        schemaName: "program_recommendations",
        schema,
        effort: "low",
        verbosity: "low",
        maxOutputTokens: 2500,
      });

      const recommendations = result.recommendations.map(r => ({
        ...r,
        explanation: sanitize(r.explanation),
        factors: r.factors.map(sanitize),
      }));

      return json({
        recommendations,
        disclaimer: AI_DISCLAIMER,
        source: "ai",
      } satisfies ProgramRecommendResult);
    });
  },
};
