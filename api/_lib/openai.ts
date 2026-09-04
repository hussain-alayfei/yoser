/**
 * عميل مبسّط لواجهة OpenAI Responses مع مخرجات مُقيّدة بمخطط JSON.
 *
 * يستخدم fetch مباشرة بدل حزمة openai حتى تبقى دالة Vercel صغيرة وسريعة الإقلاع.
 * الموديل الافتراضي gpt-5-mini: نافذة 400k، ومخرجات مُهيكلة، وتكلفة منخفضة.
 */

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set");
    this.name = "AiNotConfiguredError";
  }
}

export class AiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

export type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

export type AskOptions = {
  system: string;
  user: string;
  schemaName: string;
  schema: JsonSchema;
  /** المهام هنا تصنيفية وقصيرة، لذلك الجهد المنخفض يكفي ويقلل الكمون. */
  effort?: "minimal" | "low" | "medium" | "high";
  verbosity?: "low" | "medium" | "high";
  maxOutputTokens?: number;
};

/**
 * تستخرج نص المخرجات من ردّ Responses API.
 * الردّ مصفوفة عناصر؛ نماذج الاستدلال تُدرج عناصر reasoning يجب تخطّيها،
 * والنص المطلوب يقع في عنصر message ضمن جزء من نوع output_text.
 */
function extractOutputText(payload: unknown): string {
  const root = payload as { output_text?: unknown; output?: unknown };

  // بعض الإصدارات تُرجع اختصارًا جاهزًا.
  if (typeof root.output_text === "string" && root.output_text.trim()) {
    return root.output_text;
  }

  const output = Array.isArray(root.output) ? root.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    const node = item as { type?: string; content?: unknown };
    if (node.type !== "message") continue;
    const content = Array.isArray(node.content) ? node.content : [];
    for (const part of content) {
      const p = part as { type?: string; text?: unknown };
      if ((p.type === "output_text" || p.type === "text") && typeof p.text === "string") {
        chunks.push(p.text);
      }
    }
  }

  return chunks.join("").trim();
}

export async function ask<T>(options: AskOptions): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();

  const body = {
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    input: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    reasoning: { effort: options.effort ?? "low" },
    text: {
      verbosity: options.verbosity ?? "low",
      format: {
        type: "json_schema",
        name: options.schemaName,
        strict: true,
        schema: options.schema,
      },
    },
    max_output_tokens: options.maxOutputTokens ?? 2000,
  };

  // مهلة صريحة حتى لا تُعلّق دالة serverless حتى انتهاء المهلة القصوى.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  let response: Response;
  try {
    response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new AiRequestError(aborted ? "انتهت مهلة الاتصال بالنموذج" : "تعذّر الاتصال بالنموذج", 504);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    // لا نُمرّر نص خطأ المزوّد كما هو حتى لا يتسرّب أي شيء عن الإعدادات.
    const detail = response.status === 401 ? "مفتاح الوصول غير صالح" : `رفض المزوّد الطلب (${response.status})`;
    throw new AiRequestError(detail, response.status === 429 ? 429 : 502);
  }

  const payload = (await response.json()) as unknown;
  const text = extractOutputText(payload);
  if (!text) throw new AiRequestError("جاء ردّ فارغ من النموذج", 502);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiRequestError("تعذّر تفسير ردّ النموذج", 502);
  }
}
