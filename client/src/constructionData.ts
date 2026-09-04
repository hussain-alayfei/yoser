/** بيانات تجريبية لتقدم بناء المسكن حسب الأدوار، منفصلة عن العرض لتسهيل الاختبار والتحديث. */
export const constructionFloors = [
  { key: "roof", name: "السطح والخدمات", status: "لم يبدأ", tone: "muted", progress: 0, enteredAt: "—", expectedAt: "بعد اكتمال الهيكل", completed: [], active: [], next: ["تمديدات السطح", "العزل المائي"] },
  { key: "second", name: "الدور الثاني", status: "قيد البناء", tone: "info", progress: 46, enteredAt: "18 أغسطس 2026", expectedAt: "10 سبتمبر 2026", completed: ["أعمدة الدور", "صب السقف الجزئي"], active: ["استكمال الجدران الخارجية", "تجهيز فتحات النوافذ"], next: ["التمديدات الكهربائية", "اختبار جودة الخرسانة"] },
  { key: "first", name: "الدور الأول", status: "مكتمل", tone: "success", progress: 100, enteredAt: "22 يوليو 2026", expectedAt: "اكتمل 16 أغسطس 2026", completed: ["الهيكل الإنشائي", "الجدران الخارجية", "فتحات الأبواب والنوافذ"], active: [], next: ["بدء التمديدات بعد اكتمال الدور الثاني"] },
  { key: "ground", name: "الدور الأرضي", status: "مكتمل", tone: "success", progress: 100, enteredAt: "1 يوليو 2026", expectedAt: "اكتمل 20 يوليو 2026", completed: ["الأعمدة والأسقف", "الجدران الخارجية", "السلم الداخلي"], active: [], next: ["بانتظار مرحلة التمديدات"] },
  { key: "foundation", name: "الأساسات", status: "مكتمل", tone: "success", progress: 100, enteredAt: "10 يونيو 2026", expectedAt: "اكتمل 29 يونيو 2026", completed: ["الحفر والتسوية", "القواعد الخرسانية", "العزل الأرضي"], active: [], next: ["لا يوجد إجراء مطلوب"] },
] as const;
