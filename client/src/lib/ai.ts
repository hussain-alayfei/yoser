/**
 * طبقة العميل لميزات الذكاء الاصطناعي.
 *
 * مبدأ ثابت: الواجهة لا تنكسر أبدًا بسبب الذكاء الاصطناعي.
 * كل خطّاف يستقبل نتيجة القواعد المحلية كقيمة أولية، ويعرضها فورًا،
 * ثم يستبدلها بنتيجة النموذج إن نجحت. أي فشل — مفتاح غير مضاف، انقطاع
 * شبكة، مهلة — يترك نتيجة القواعد كما هي مع بقاء source = "rules".
 */

import { useEffect, useRef, useState } from "react";
import type {
  AiErrorBody,
  NextStepRequest,
  NextStepResult,
  ProgramRecommendInput,
  ProgramRecommendResult,
  StalledCasesRequest,
  StalledCasesResult,
} from "@shared/ai";

export type AiState<T> = {
  data: T;
  /** جارٍ سؤال النموذج؛ البيانات المعروضة حاليًا من القواعد. */
  loading: boolean;
  /** المفتاح غير مُهيّأ بعد — تُستخدم لإظهار تلميح للمشرف فقط. */
  notConfigured: boolean;
};

/**
 * ذاكرة نتائج داخل الجلسة، مفتاحها المسار + بصمة المدخلات.
 *
 * بدونها يُعاد سؤال النموذج عند كل دخول للصفحة — والتنقّل ذهابًا وإيابًا
 * بين «مساري» و«مسكني» وحده كان يُطلق الطلب من جديد كل مرة. تُخزَّن الوعود
 * لا النتائج، فيلتحق أي طلب متزامن بنفس الوعد بدل فتح نداء ثانٍ.
 * أي إخفاق يُزال من الذاكرة فورًا حتى تبقى إعادة المحاولة ممكنة.
 */
const cache = new Map<string, Promise<unknown>>();

function cachedPost<TIn, TOut>(path: string, body: TIn, cacheKey: string): Promise<TOut> {
  const existing = cache.get(cacheKey);
  if (existing) return existing as Promise<TOut>;

  // لا نمرّر signal هنا: الوعد مشترك، وإلغاء أول مستهلك يجب ألّا يُسقط البقية.
  const pending = postJson<TIn, TOut>(path, body).catch(error => {
    cache.delete(cacheKey);
    throw error;
  });

  cache.set(cacheKey, pending);
  return pending as Promise<TOut>;
}

async function postJson<TIn, TOut>(path: string, body: TIn): Promise<TOut> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let payload: AiErrorBody | null = null;
    try {
      payload = (await response.json()) as AiErrorBody;
    } catch {
      /* ردّ غير JSON — نتعامل معه كفشل عام */
    }
    const error = new Error(payload?.error ?? `HTTP ${response.status}`) as Error & { notConfigured?: boolean };
    error.notConfigured = Boolean(payload?.notConfigured);
    throw error;
  }

  return (await response.json()) as TOut;
}

/**
 * خطّاف عام: يعرض القيمة الاحتياطية فورًا ثم يحدّثها من النموذج.
 * `key` يحدد متى يُعاد الطلب — نمرّر تمثيلًا نصيًا للمدخلات.
 */
function useAiResource<TIn, TOut>(
  path: string,
  input: TIn | null,
  fallback: TOut,
  key: string
): AiState<TOut> {
  const [data, setData] = useState<TOut>(fallback);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);

  // نُبقي أحدث قيمة احتياطية دون أن تُعيد تشغيل الطلب عند كل إعادة رسم.
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    if (!input) {
      setData(fallbackRef.current);
      return;
    }

    let active = true;
    setLoading(true);

    cachedPost<TIn, TOut>(path, input, `${path}::${key}`)
      .then(result => {
        if (active) setData(result);
      })
      .catch((error: Error & { notConfigured?: boolean }) => {
        if (!active) return;
        // الفشل متوقّع قبل إضافة المفتاح: نبقى على نتيجة القواعد بهدوء.
        setData(fallbackRef.current);
        setNotConfigured(Boolean(error.notConfigured));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // نكتفي بعَلَم الإلغاء: الوعد مشترك في الذاكرة، فلا نُجهضه لأن مكوّنًا
    // واحدًا خرج من الشجرة بينما قد ينتظره غيره.
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  return { data, loading, notConfigured };
}

/* ------------------------------------------------------------------ */
/* 1 — اقتراح البرامج                                                   */
/* ------------------------------------------------------------------ */

export function useProgramRecommendations(
  input: ProgramRecommendInput | null,
  fallback: ProgramRecommendResult
): AiState<ProgramRecommendResult> {
  const key = input
    ? [
        input.city,
        input.familyMembers,
        input.housingStatus,
        input.monthlyIncome,
        input.monthlySupport,
        input.monthlyExpenses,
        input.socialResearchStatus,
        input.programs.map(p => p.name).join("|"),
      ].join("~")
    : "none";

  return useAiResource("/api/ai/recommend-programs", input, fallback, key);
}

/* ------------------------------------------------------------------ */
/* 2 — الطلبات المتوقفة                                                 */
/* ------------------------------------------------------------------ */

export function useStalledCases(
  input: StalledCasesRequest | null,
  fallback: StalledCasesResult
): AiState<StalledCasesResult> {
  const key = input
    ? `${input.cases.map(c => `${c.id}:${c.daysInStage}:${c.daysSinceUpdate}`).join(",")}~${input.thresholds.maxStageDays}:${input.thresholds.maxDaysWithoutUpdate}`
    : "none";

  return useAiResource("/api/ai/stalled-cases", input, fallback, key);
}

/* ------------------------------------------------------------------ */
/* 3 — الخطوة التالية                                                   */
/* ------------------------------------------------------------------ */

export function useNextStep(
  input: NextStepRequest | null,
  fallback: NextStepResult
): AiState<NextStepResult> {
  const key = input
    ? [
        input.stage,
        input.stageNumber,
        input.context,
        input.handover,
        input.hasProfile,
        input.hasApplication,
        input.selectedProgram ?? "-",
        input.daysSinceUpdate,
        input.documents.map(d => `${d.name}:${d.status}`).join("|"),
      ].join("~")
    : "none";

  return useAiResource("/api/ai/next-step", input, fallback, key);
}
