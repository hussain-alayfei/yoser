/** مساعدات مشتركة لدوال Vercel: ردود JSON، وحراسة الطلب، وحدّ معدّل بسيط. */

import { AiNotConfiguredError, AiRequestError } from "./openai";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

/** حجم أقصى للجسم الوارد — يمنع إرسال حمولات ضخمة إلى المزوّد. */
const MAX_BODY_BYTES = 32_000;

export async function readJson<T>(request: Request): Promise<T> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new AiRequestError("حجم الطلب كبير جدًا", 413);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new AiRequestError("جسم الطلب ليس JSON صالحًا", 400);
  }
}

/**
 * حدّ معدّل تقريبي داخل الذاكرة.
 * دوال serverless عديمة الحالة وتتعدد نسخها، لذلك هذا حاجز أوّلي ضد التكرار
 * السريع من متصفح واحد، وليس ضمانة على مستوى النظام.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function rateLimited(request: Request): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.clear(); // حارس بسيط ضد تضخّم الذاكرة
  return recent.length > MAX_PER_WINDOW;
}

/** يغلّف معالج POST بالحراسات المشتركة وتحويل الأخطاء إلى ردود مفهومة. */
export async function handlePost(
  request: Request,
  run: (request: Request) => Promise<Response>
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "الطريقة غير مدعومة" }, 405);
  if (rateLimited(request)) return json({ error: "طلبات كثيرة، حاول بعد قليل" }, 429);

  try {
    return await run(request);
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      // ليست حالة فشل: المفتاح لم يُضف بعد، والواجهة تسقط إلى القواعد المحلية.
      return json({ error: "خدمة الذكاء الاصطناعي غير مُهيّأة بعد", notConfigured: true }, 503);
    }
    if (error instanceof AiRequestError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: "خطأ غير متوقع" }, 500);
  }
}
