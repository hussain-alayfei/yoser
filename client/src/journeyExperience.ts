export type JourneyStage = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
};

export const journeyStages: JourneyStage[] = [
  { key: "profile", label: "فهم احتياجك", shortLabel: "بياناتك", description: "بيانات مختصرة لفهم وضعك السكني.", href: "/start" },
  { key: "matching", label: "معرفة الخيارات", shortLabel: "ترشيحك", description: "مطابقة إرشادية للبرامج المحتملة.", href: "/programs" },
  { key: "apply", label: "تقديم الطلب", shortLabel: "التقديم", description: "مراجعة البيانات وإنشاء الطلب.", href: "/application" },
  { key: "tracking", label: "متابعة الطلب", shortLabel: "المتابعة", description: "معرفة الحالة والمدة والخطوة التالية.", href: "/application" },
  { key: "construction", label: "بناء المسكن", shortLabel: "البناء", description: "متابعة الإنجاز عبر التوأم الرقمي.", href: "/unit" },
  { key: "handover", label: "استلام المسكن", shortLabel: "الاستلام", description: "مراجعة الوحدة وتأكيد الاستلام.", href: "/unit" },
  { key: "settlement", label: "العناية بالمسكن", shortLabel: "الاستقرار", description: "الصيانة والبلاغات والعناية الوقائية.", href: "/unit/maintenance" },
];

export function getJourneyStep(pathname: string, hasApplication = false): number {
  if (pathname.startsWith("/unit/maintenance")) return 6;
  if (pathname.startsWith("/unit")) return 4;
  if (pathname.startsWith("/application")) return hasApplication ? 3 : 2;
  if (pathname.startsWith("/programs")) return 1;
  if (pathname.startsWith("/requirements") || pathname.startsWith("/notifications") || pathname.startsWith("/home") || pathname.startsWith("/profile")) return hasApplication ? 3 : 0;
  return 0;
}

export function getJourneyProgress(step: number): number {
  return Math.round(((Math.max(0, Math.min(step, journeyStages.length - 1)) + 1) / journeyStages.length) * 100);
}

export function getApplicationCreated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const demoActive = new URLSearchParams(window.location.search).get("demo") === "active";
    if (demoActive) sessionStorage.setItem("yusr-application-created", "true");
    return demoActive || sessionStorage.getItem("yusr-application-created") === "true";
  } catch { return false; }
}

export function setApplicationCreated(created: boolean): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem("yusr-application-created", String(created)); } catch { /* التخزين اختياري في النموذج الأولي */ }
}

export type JourneyActionInput = {
  hasProfile: boolean;
  selectedProgram: boolean;
  hasApplication: boolean;
  requirementUploaded?: boolean;
  context?: "journey" | "unit" | "maintenance";
  handover?: boolean;
};

export type JourneyAction = {
  key: string;
  title: string;
  description: string;
  href: string;
  label: string;
};

export function getJourneyAction(input: JourneyActionInput): JourneyAction {
  if (input.context === "maintenance") return { key: "track_ticket", title: "متابعة البلاغ المفتوح", description: "راجع آخر تحديث وموعد الإسناد المتوقع قبل إنشاء بلاغ جديد.", href: "/unit/maintenance/MT-1024", label: "عرض البلاغ" };
  if (input.context === "unit") return input.handover
    ? { key: "care_schedule", title: "جدولة أول فحص وقائي", description: "ابدأ العناية بالمسكن بحجز فحص التكييف بعد الاستلام.", href: "/unit/maintenance/new", label: "حجز فحص" }
    : { key: "construction_update", title: "متابعة اكتمال الدور الثاني", description: "لا يلزمك إجراء الآن؛ سنرسل تحديثًا عند انتقال المشروع للتمديدات.", href: "/notifications", label: "عرض التحديثات" };
  if (!input.hasProfile) return { key: "complete_profile", title: "أكمل بياناتك السكنية", description: "نحتاج بيانات الأسرة والسكن والدخل قبل عرض الخيارات المناسبة.", href: "/start", label: "تعبئة البيانات" };
  if (!input.selectedProgram) return { key: "choose_program", title: "اختر برنامجًا للمتابعة", description: "راجع المطابقة الإرشادية واختر خيارًا واحدًا قبل إعداد الطلب.", href: "/programs", label: "اختيار برنامج" };
  if (!input.hasApplication) return { key: "submit_application", title: "راجع وقدّم طلبك", description: "بياناتك واختيارك جاهزان؛ راجع الملخص قبل التقديم.", href: "/application", label: "مراجعة الطلب" };
  if (!input.requirementUploaded) return { key: "upload_requirement", title: "حدّث إثبات السكن", description: "هذا هو الإجراء الوحيد المطلوب لاستكمال مراجعة التخصيص.", href: "/requirements", label: "رفع المستند" };
  return { key: "await_review", title: "انتظر اعتماد المستند", description: "المستند قيد المراجعة، وسنبلغك فور انتقال الطلب للمرحلة التالية.", href: "/application", label: "حالة الطلب" };
}
