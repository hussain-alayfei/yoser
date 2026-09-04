export type StageStatus = "مكتمل" | "قيد الإجراء" | "بانتظار إجراء" | "لم يبدأ";

export const beneficiary = {
  id: "SKN-2841",
  name: "أحمد محمد",
  region: "منطقة الرياض",
  city: "الرياض",
  familyMembers: 5,
  housingStatus: "إيجار",
  socialResearchStatus: "مكتمل",
  profileCompletion: 86,
  monthlyIncome: 4200,
  monthlySupport: 1800,
  monthlyExpenses: 4100,
  applicationStage: "التخصيص",
  applicationStageNumber: 5,
  totalStages: 7,
};

export const stages: { number: number; title: string; status: StageStatus; date?: string; description: string; action?: string; expectedDuration: string; estimatedNextDate: string; why: string; delayReason?: string }[] = [
  { number: 1, title: "تقديم الطلب", status: "مكتمل", date: "12 يناير 2026", description: "تم استلام طلب الدعم السكني بنجاح.", expectedDuration: "يوم عمل واحد", estimatedNextDate: "12 يناير 2026", why: "تبدأ الرحلة بتسجيل بياناتك واختيار المسار المناسب لحالتك." },
  { number: 2, title: "التحقق والاعتماد", status: "مكتمل", date: "28 يناير 2026", description: "اكتملت مراجعة البيانات والبحث الاجتماعي.", expectedDuration: "حتى 15 يوم عمل", estimatedNextDate: "28 يناير 2026", why: "نتحقق من اكتمال البيانات والبحث الاجتماعي قبل الانتقال للمطابقة." },
  { number: 3, title: "تحديد الحل المناسب", status: "مكتمل", date: "11 فبراير 2026", description: "تمت المطابقة المبدئية مع الحلول المتاحة.", expectedDuration: "حتى 10 أيام عمل", estimatedNextDate: "11 فبراير 2026", why: "نقارن بياناتك بالحلول السكنية المتاحة في منطقتك." },
  { number: 4, title: "استكمال الإجراءات", status: "مكتمل", date: "4 مارس 2026", description: "اكتملت إجراءات الملف الأساسية.", expectedDuration: "حتى 14 يوم عمل", estimatedNextDate: "4 مارس 2026", why: "نغلق المتطلبات الأساسية ونثبت جاهزية الملف قبل التخصيص." },
  { number: 5, title: "التخصيص", status: "قيد الإجراء", description: "نعمل على مطابقة وحدة مناسبة لحالتك.", expectedDuration: "من 10 إلى 20 يوم عمل", estimatedNextDate: "25 أغسطس 2026", why: "أنت هنا لأن ملفك مكتمل مبدئيًا ونبحث عن وحدة تناسب احتياج أسرتك وموقعك.", delayReason: "تستغرق المطابقة وقتًا إضافيًا بسبب مراجعة توفر الوحدات المناسبة في النطاق المطلوب. لا يوجد إجراء مطلوب منك حاليًا." },
  { number: 6, title: "استلام الوحدة", status: "لم يبدأ", description: "ستظهر تفاصيل موعد الاستلام بعد التخصيص.", expectedDuration: "من 3 إلى 7 أيام عمل", estimatedNextDate: "بعد اعتماد التخصيص", why: "تبدأ هذه المرحلة بعد اعتماد الوحدة وتأكيد موعد الاستلام معك." },
  { number: 7, title: "الاستقرار السكني", status: "لم يبدأ", description: "تبدأ خدمات متابعة الوحدة بعد الاستلام.", expectedDuration: "متابعة مستمرة", estimatedNextDate: "بعد الاستلام", why: "بعد استلام البيت نتابع حالته وبلاغات الصيانة والتذكيرات الوقائية." },
];

export const applicationUpdates = [
  { date: "اليوم، 10:45 ص", title: "انتقل الطلب إلى التخصيص", body: "بدأت مطابقة الوحدة المناسبة لحالتك.", tone: "current" },
  { date: "4 مارس 2026", title: "اكتملت إجراءات الملف", body: "تم اعتماد المتطلبات الأساسية للانتقال إلى التخصيص.", tone: "success" },
  { date: "11 فبراير 2026", title: "ظهرت البرامج المرشحة", body: "تمت المطابقة المبدئية مع الحلول المتاحة.", tone: "success" },
  { date: "28 يناير 2026", title: "اكتمل التحقق والاعتماد", body: "تم تحديث نتيجة البحث الاجتماعي ومراجعة البيانات.", tone: "success" },
  { date: "12 يناير 2026", title: "تم تقديم الطلب", body: "تم استلام طلبك وفتح رحلة المتابعة.", tone: "success" },
];

export const programs = [
  { name: "التملك المباشر", match: "ملاءمة مبدئية مرتفعة", tone: "success", description: "تمت المطابقة مبدئيًا بناءً على بيانات الأسرة والوضع السكني والبحث الاجتماعي." },
  { name: "منتج وعد", match: "يحتاج تحقق إضافي", tone: "warning", description: "تحتاج بعض بيانات الدخل والسكن إلى مراجعة إضافية قبل اعتماد المطابقة." },
  { name: "برنامج الترميم", match: "غير مناسب للحالة الحالية", tone: "muted", description: "لا ينطبق هذا الحل على وضعك السكني الحالي في هذه المرحلة." },
];

export const requirements = [
  { name: "بيانات أفراد الأسرة", status: "مكتمل", detail: "تم التحقق من البيانات الأساسية." },
  { name: "البحث الاجتماعي", status: "مكتمل", detail: "آخر تحديث: 28 يناير 2026." },
  { name: "إثبات السكن", status: "يحتاج تحديث", detail: "آخر موعد للتحديث: 24 أغسطس." },
];

export const notifications = [
  { type: "update", title: "تم تحديث حالة طلبك", body: "انتقل طلبك إلى مرحلة التخصيص.", time: "اليوم، 10:45 ص", unread: true },
  { type: "action", title: "مطلوب تحديث مستند", body: "يرجى تحديث إثبات السكن قبل استكمال المراجعة.", time: "أمس، 02:15 م", unread: true },
  { type: "calendar", title: "تم تحديد موعد", body: "موعد معاينة الوحدة يوم الأحد 23 أغسطس.", time: "18 أغسطس", unread: false },
  { type: "maintenance", title: "بلاغ الصيانة", body: "تم إسناد البلاغ MT-1024 إلى فريق الصيانة.", time: "15 أغسطس", unread: false },
];

export const unitComponents = [
  { name: "الكهرباء", key: "electricity", status: "جيد", lastMaintenance: "20 مايو 2026", issues: 0, tone: "success" },
  { name: "السباكة", key: "plumbing", status: "يحتاج متابعة", lastMaintenance: "15 فبراير 2026", issues: 2, tone: "warning" },
  { name: "التكييف", key: "air", status: "جيد", lastMaintenance: "12 مايو 2026", issues: 1, tone: "success" },
  { name: "الجدران والتشطيبات", key: "finish", status: "جيد", lastMaintenance: "—", issues: 0, tone: "success" },
  { name: "الأبواب والنوافذ", key: "doors", status: "جيد", lastMaintenance: "8 يناير 2026", issues: 0, tone: "success" },
  { name: "المرافق", key: "facilities", status: "جيد", lastMaintenance: "22 أبريل 2026", issues: 0, tone: "success" },
];

export const maintenanceRequests = [
  { id: "MT-1024", category: "سباكة", location: "المطبخ", description: "تسرب مياه أسفل مغسلة المطبخ", status: "تم إسناده", createdAt: "15 أغسطس 2026", tone: "info" },
  { id: "MT-0988", category: "تكييف", location: "غرفة النوم", description: "ضعف تبريد غرفة النوم", status: "تم الحل", createdAt: "11 يوليو 2026", tone: "success" },
];

export const staffCases = [
  { name: "أحمد محمد", id: "SKN-2841", stage: "التخصيص", complete: "86%", duration: "12 يوم", action: "مراجعة مستند", cause: "إثبات السكن يحتاج تحديثًا", lastAction: "تم إرسال تنبيه", tone: "warning" },
  { name: "فاطمة العتيبي", id: "SKN-1907", stage: "استكمال الإجراءات", complete: "92%", duration: "8 أيام", action: "لا يوجد", cause: "—", lastAction: "اكتملت المراجعة", tone: "success" },
  { name: "سالم القحطاني", id: "SKN-3052", stage: "التحقق والاعتماد", complete: "71%", duration: "17 يوم", action: "تحديث بيانات", cause: "بيانات الدخل ناقصة", lastAction: "طلب استكمال", tone: "warning" },
  { name: "نورة الغامدي", id: "SKN-2261", stage: "التخصيص", complete: "100%", duration: "5 أيام", action: "مطابقة وحدة", cause: "بانتظار المطابقة", lastAction: "إضافة إلى قائمة التخصيص", tone: "info" },
  { name: "محمد الدوسري", id: "SKN-1419", stage: "تقديم الطلب", complete: "48%", duration: "22 يوم", action: "بحث اجتماعي", cause: "لم يحدد موعد البحث", lastAction: "إحالة للباحث", tone: "danger" },
  { name: "ريم الحربي", id: "SKN-3180", stage: "تم التسليم", complete: "100%", duration: "3 أيام", action: "متابعة الوحدة", cause: "اكتملت رحلة الطلب", lastAction: "تم تأكيد الاستلام", tone: "success" },
  { name: "عبدالله الشهري", id: "MT-1024", stage: "الصيانة", complete: "100%", duration: "يومان", action: "متابعة البلاغ", cause: "تسرب مياه بالمطبخ", lastAction: "تم إسناد البلاغ للفريق", tone: "info" },
];

export const fmtNumber = (value: number) => new Intl.NumberFormat("ar-SA").format(value);

export type AssociationCase = {
  id: string;
  name: string;
  stage: string;
  daysInStage: number;
  daysSinceUpdate: number;
  status: "تحتاج تدخل" | "متأخرة" | "تجاوزت مدة المرحلة" | "متطلبات ناقصة" | "جاهزة للانتقال" | "عادية";
  alert: string;
  action: string;
  owner: "المستفيد" | "الجمعية" | "الجهة المختصة" | "مقدم الخدمة";
  lastUpdated: string;
  priority: "عادية" | "تحتاج متابعة" | "تحتاج تدخل";
  region: string;
  requirement: string;
  nextStep: string;
  stageEntered: string;
  lastAction: string;
  history: { date: string; title: string; body: string; beneficiaryBody?: string; action?: string; responsible?: string; internal?: boolean }[];
};

export const associationDemoThresholds = { maxStageDays: 14, maxDaysWithoutUpdate: 7 };

export const associationCases: AssociationCase[] = [
  { id: "SKN-2841", name: "أحمد محمد", stage: "التخصيص", daysInStage: 18, daysSinceUpdate: 12, status: "تحتاج تدخل", alert: "لم يحدث تحديث على الطلب منذ 12 يومًا", action: "مراجعة حالة التخصيص", owner: "الجمعية", lastUpdated: "12 أغسطس 2026", priority: "تحتاج تدخل", region: "الرياض", requirement: "مكتمل", nextStep: "التواصل مع مسؤول التخصيص للتحقق من حالة الطلب.", stageEntered: "7 أغسطس 2026", lastAction: "تم إرسال تنبيه للجمعية", history: [{ date: "24 أغسطس 2026", title: "تمت مراجعة الحالة من الجمعية", body: "تم فتح الحالة للتدخل الاستباقي." }, { date: "18 أغسطس 2026", title: "انتقل الطلب إلى التخصيص", body: "بدأت مطابقة الوحدة المناسبة." }, { date: "12 أغسطس 2026", title: "لا يوجد تحديث جديد", body: "تم إنشاء تنبيه متابعة للجمعية." }] },
  { id: "SKN-2917", name: "فاطمة علي", stage: "استكمال المتطلبات", daysInStage: 6, daysSinceUpdate: 0, status: "جاهزة للانتقال", alert: "جميع المتطلبات مكتملة", action: "مراجعة الحالة", owner: "الجهة المختصة", lastUpdated: "24 أغسطس 2026", priority: "تحتاج متابعة", region: "الرياض", requirement: "مكتمل", nextStep: "مراجعة اكتمال الملف قبل الإحالة للمرحلة التالية.", stageEntered: "18 أغسطس 2026", lastAction: "تم استكمال إثبات السكن", history: [{ date: "24 أغسطس 2026", title: "اكتملت المتطلبات", body: "الحالة جاهزة للمراجعة وليست اعتمادًا نهائيًا." }, { date: "21 أغسطس 2026", title: "تم استكمال إثبات السكن", body: "تم تحديث المستند من المستفيد." }] },
  { id: "SKN-3052", name: "سالم القحطاني", stage: "التحقق من البيانات", daysInStage: 17, daysSinceUpdate: 15, status: "متطلبات ناقصة", alert: "متطلب ناقص يمنع تقدم الطلب", action: "متابعة المستند", owner: "المستفيد", lastUpdated: "9 أغسطس 2026", priority: "تحتاج متابعة", region: "الرياض", requirement: "ناقص", nextStep: "تذكير المستفيد بتحديث بيانات الدخل.", stageEntered: "8 أغسطس 2026", lastAction: "طلب استكمال بيانات الدخل", history: [{ date: "9 أغسطس 2026", title: "طلب استكمال بيانات الدخل", body: "ينتظر الطلب مستندًا من المستفيد." }] },
  { id: "SKN-3194", name: "سارة عبدالله", stage: "التحقق من البيانات", daysInStage: 14, daysSinceUpdate: 14, status: "متأخرة", alert: "إثبات السكن يحتاج تحديث", action: "عرض الحالة", owner: "المستفيد", lastUpdated: "10 أغسطس 2026", priority: "تحتاج تدخل", region: "الرياض", requirement: "قيد المراجعة", nextStep: "التحقق من وصول إثبات السكن المحدث.", stageEntered: "10 أغسطس 2026", lastAction: "إرسال تذكير بالمستند", history: [{ date: "10 أغسطس 2026", title: "إثبات السكن يحتاج تحديث", body: "أُرسل تنبيه للمستفيد." }] },
  { id: "SKN-3260", name: "محمد سالم", stage: "التخصيص", daysInStage: 21, daysSinceUpdate: 21, status: "تجاوزت مدة المرحلة", alert: "لا يوجد تحديث على الطلب منذ فترة", action: "تسجيل متابعة", owner: "الجهة المختصة", lastUpdated: "3 أغسطس 2026", priority: "تحتاج تدخل", region: "الرياض", requirement: "مكتمل", nextStep: "طلب مراجعة من الجهة للتحقق من حالة التخصيص.", stageEntered: "3 أغسطس 2026", lastAction: "إضافة إلى قائمة التخصيص", history: [{ date: "3 أغسطس 2026", title: "انتقل الطلب إلى التخصيص", body: "لم يصل تحديث منذ ذلك التاريخ." }] },
  { id: "SKN-3321", name: "ريم الحربي", stage: "استكمال الإجراءات", daysInStage: 4, daysSinceUpdate: 2, status: "عادية", alert: "تسير الحالة ضمن المدة التجريبية", action: "فتح الحالة", owner: "الجمعية", lastUpdated: "22 أغسطس 2026", priority: "عادية", region: "الرياض", requirement: "قيد المراجعة", nextStep: "متابعة اكتمال الإجراء الحالي.", stageEntered: "20 أغسطس 2026", lastAction: "تمت مراجعة الملف", history: [{ date: "22 أغسطس 2026", title: "تمت مراجعة الملف", body: "لا يوجد إجراء عاجل حاليًا." }] },
];
