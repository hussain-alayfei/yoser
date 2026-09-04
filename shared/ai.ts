/**
 * عقود الذكاء الاصطناعي المشتركة بين العميل والخادم.
 *
 * قاعدة أساسية تحكم كل ما في هذا الملف: الذكاء الاصطناعي لا يصدر قرار أهلية.
 * هو يعطي ترشيحًا + تفسيرًا فقط، والقرار النهائي يعود دائمًا للجهة المختصة.
 * لذلك لا يوجد في أي نوع هنا حقل بمعنى «مقبول» أو «مرفوض» أو «مؤهل».
 */

/** المسار الذي يوجّه إليه أي إجراء مقترح — مقيّد بمسارات التطبيق الفعلية. */
export type AiHref =
  | "/start"
  | "/programs"
  | "/application"
  | "/requirements"
  | "/notifications"
  | "/unit"
  | "/unit/maintenance"
  | "/unit/maintenance/new";

export const AI_HREFS: AiHref[] = [
  "/start",
  "/programs",
  "/application",
  "/requirements",
  "/notifications",
  "/unit",
  "/unit/maintenance",
  "/unit/maintenance/new",
];

/** الجهة التي ينتظرها الطلب الآن. */
export type AiOwner = "المستفيد" | "الجمعية" | "الجهة المختصة" | "مقدم الخدمة" | "لا أحد";

/** مصدر النتيجة: نموذج لغوي، أو القواعد المحلية عند تعذّر الاتصال. */
export type AiSource = "ai" | "rules";

/* ------------------------------------------------------------------ */
/* 1 — اقتراح البرامج المناسبة                                          */
/* ------------------------------------------------------------------ */

export type ProgramSuitability = "ملاءمة مبدئية مرتفعة" | "ملاءمة مبدئية متوسطة" | "يحتاج تحقق إضافي" | "غير مناسب للحالة الحالية";

export type ProgramTone = "success" | "warning" | "muted";

export type ProgramCandidate = {
  name: string;
  description: string;
};

export type ProgramRecommendInput = {
  city: string;
  familyMembers: number;
  housingStatus: string;
  monthlyIncome: number;
  monthlySupport: number;
  monthlyExpenses: number;
  socialResearchStatus: string;
  programs: ProgramCandidate[];
};

export type ProgramRecommendation = {
  /** يجب أن يطابق اسم برنامج من القائمة المُرسلة. */
  name: string;
  suitability: ProgramSuitability;
  /** تفسير بلغة واضحة غير تقنية، لماذا ظهر هذا الترشيح. */
  explanation: string;
  /** نقاط البيانات التي بُني عليها الترشيح — للشفافية. */
  factors: string[];
};

export type ProgramRecommendResult = {
  recommendations: ProgramRecommendation[];
  /** تنبيه ثابت يظهر دائمًا في الواجهة. */
  disclaimer: string;
  source: AiSource;
};

export const PROGRAM_TONE: Record<ProgramSuitability, ProgramTone> = {
  "ملاءمة مبدئية مرتفعة": "success",
  "ملاءمة مبدئية متوسطة": "success",
  "يحتاج تحقق إضافي": "warning",
  "غير مناسب للحالة الحالية": "muted",
};

export const AI_DISCLAIMER = "هذا ترشيح إرشادي وتفسير له فقط، وليس قرار أهلية. القرار النهائي يعود للجهة المختصة بعد مراجعتها.";

/* ------------------------------------------------------------------ */
/* 2 — اكتشاف الطلبات المتوقفة                                          */
/* ------------------------------------------------------------------ */

export type StallSeverity = "تحتاج تدخل" | "تحتاج متابعة" | "عادية";

export type StalledCaseInput = {
  id: string;
  name: string;
  stage: string;
  daysInStage: number;
  daysSinceUpdate: number;
  requirement: string;
  owner: string;
  lastAction: string;
  /** عدد مرات إعادة تحويل الحالة بين الجهات. */
  reassignments: number;
  /** عدد مرات تواصل المستفيد دون تقدم. */
  beneficiaryContacts: number;
};

export type StallThresholds = {
  maxStageDays: number;
  maxDaysWithoutUpdate: number;
};

export type StalledCasesRequest = {
  cases: StalledCaseInput[];
  thresholds: StallThresholds;
};

export type StalledCaseFinding = {
  id: string;
  needsFollowUp: boolean;
  severity: StallSeverity;
  /** الإشارات المكتشفة، كل واحدة جملة قصيرة. */
  signals: string[];
  /** لماذا تبدو هذه الحالة متوقفة. */
  summary: string;
  /** ما الذي يُقترح أن تفعله الجمعية. */
  recommendedAction: string;
};

export type StalledCasesResult = {
  findings: StalledCaseFinding[];
  source: AiSource;
};

/* ------------------------------------------------------------------ */
/* 3 — تحديد الخطوة التالية                                             */
/* ------------------------------------------------------------------ */

export type NextStepRequest = {
  stage: string;
  stageNumber: number;
  totalStages: number;
  documents: { name: string; status: string }[];
  lastAction: string;
  daysSinceUpdate: number;
  owner: AiOwner;
  hasProfile: boolean;
  selectedProgram: string | null;
  hasApplication: boolean;
  context: "journey" | "unit" | "maintenance";
  handover: boolean;
};

export type NextStepResult = {
  /** false ⇒ لا يوجد إجراء مطلوب من المستفيد الآن. */
  actionRequired: boolean;
  title: string;
  description: string;
  href: AiHref;
  label: string;
  /** الجهة التي ينتظرها الطلب — تُعرض للمستفيد ليعرف أين وصل. */
  waitingOn: AiOwner;
  source: AiSource;
};

/* ------------------------------------------------------------------ */
/* أخطاء موحّدة                                                         */
/* ------------------------------------------------------------------ */

export type AiErrorBody = {
  error: string;
  /** true ⇒ المفتاح غير مُهيّأ بعد؛ الواجهة تسقط إلى القواعد بهدوء. */
  notConfigured?: boolean;
};
