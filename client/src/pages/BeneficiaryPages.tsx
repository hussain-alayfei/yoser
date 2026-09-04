/** أسلوب خريطة الاستقرار: صفحات المستفيد تجعل المرحلة والخطوة التالية محور المحتوى، مع لوحات RTL نظيفة ومتدرجة. */
import { AlertTriangle, ArrowLeft, Bell, Building2, CalendarClock, Check, CheckCircle2, ChevronLeft, CircleHelp, ClipboardList, Clock3, Compass, FileCheck2, FileText, Home, MapPin, PencilLine, Plus, Send, Sparkles, Upload, Wrench, X } from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ApplicationUpdateLog, JourneyTimeline } from "@/components/JourneyTimeline";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge, toneForStatus } from "@/components/StatusBadge";
import { ConstructionTwin, UnitTwin } from "@/components/UnitTwin";
import { AiBadge, AiDecisionNotice, AiFactors } from "@/components/AiInsight";
import { beneficiary, fmtNumber, maintenanceRequests, notifications, programs, requirements, stages, unitComponents } from "@/data";
import { getApplicationCreated, getJourneyAction, setApplicationCreated } from "@/journeyExperience";
import { useNextStep, useProgramRecommendations } from "@/lib/ai";
import { AI_DISCLAIMER, PROGRAM_TONE } from "@shared/ai";
import type { NextStepRequest, NextStepResult, ProgramRecommendation, ProgramRecommendInput, ProgramRecommendResult } from "@shared/ai";

function PrototypeNote() { return <div className="prototype-note-wrap"><p className="prototype-note"><CircleHelp size={15} />هذه النتائج إرشادية في النموذج الأولي، والقرار النهائي يعتمد على مراجعة الجهة المختصة.</p><details className="term-help"><summary>ما معنى المطابقة المبدئية؟</summary><p><strong>المطابقة المبدئية</strong> تقارن بيانات الأسرة والوضع السكني بالبرامج المحتملة. أما <strong>البحث الاجتماعي</strong> و<strong>التخصيص</strong> فهما مراحل مراجعة لاحقة لدى الجهة المختصة.</p></details></div>; }

function NextAction() {
  return <section className="next-action-card needs-action">
    <div className="action-accent"><Upload size={22} /></div>
    <div className="next-action-copy"><p className="eyebrow">الخطوة التالية</p><h2>تحديث إثبات السكن</h2><p>هذا هو المتطلب الوحيد الذي يحتاج تحديثًا قبل استكمال مراجعة الطلب.</p><Link href="/requirements" className="action-link">رفع المستند <ArrowLeft size={15} /></Link></div>
    <div className="action-state"><span>آخر موعد</span><strong>24 أغسطس</strong></div>
  </section>;
}

/**
 * الميزة 3 — الخطوة التالية.
 * تعرض قاعدة getJourneyAction فورًا، ثم تستبدلها بتحليل النموذج إن توفّر.
 * حين لا يكون على المستفيد إجراء، تقول ذلك صراحة وتوضّح من ينتظره الطلب.
 */
function AiNextAction({ icon, eyebrow, context, handover = false, className = "" }: { icon: ReactNode; eyebrow: string; context: "journey" | "unit" | "maintenance"; handover?: boolean; className?: string }) {
  const hasApplication = getApplicationCreated();
  const selectedProgram = useMemo(() => { try { return sessionStorage.getItem("yusr-selected-program") || null; } catch { return null; } }, []);
  const hasProfile = useMemo(() => { try { return Boolean(sessionStorage.getItem("sakan-profile")); } catch { return false; } }, []);

  const rule = getJourneyAction({ hasProfile: hasProfile || hasApplication, selectedProgram: Boolean(selectedProgram) || hasApplication, hasApplication, context, handover });
  const fallback = useMemo<NextStepResult>(() => ({
    actionRequired: rule.key !== "await_review" && rule.key !== "construction_update",
    title: rule.title,
    description: rule.description,
    href: rule.href as NextStepResult["href"],
    label: rule.label,
    waitingOn: rule.key === "await_review" || rule.key === "construction_update" ? "الجهة المختصة" : "المستفيد",
    source: "rules",
  }), [rule.key, rule.title, rule.description, rule.href, rule.label]);

  // الموضع الحقيقي للمستفيد في الرحلة. كانت هذه القيم ثوابت وقت ترجمة —
  // المرحلة «التخصيص» ورقمها ٥ دائمًا — فكان النموذج يوصي وهو لا يعرف أين
  // يقف المستفيد فعلًا. قبل إنشاء الطلب نشتقّها من تقدّمه المحفوظ.
  const position = useMemo(() => {
    if (hasApplication) return { stage: beneficiary.applicationStage, number: beneficiary.applicationStageNumber, owner: "الجهة المختصة" as const };
    if (selectedProgram) return { stage: "مراجعة الطلب قبل التقديم", number: 3, owner: "المستفيد" as const };
    if (hasProfile) return { stage: "معرفة الخيارات المتاحة", number: 2, owner: "المستفيد" as const };
    return { stage: "تعبئة البيانات", number: 1, owner: "المستفيد" as const };
  }, [hasApplication, hasProfile, selectedProgram]);

  const request = useMemo<NextStepRequest>(() => ({
    stage: position.stage,
    stageNumber: position.number,
    totalStages: beneficiary.totalStages,
    // قبل إنشاء الطلب لا توجد مستندات مرفوعة أصلًا، فإرسال قائمة المتطلبات
    // كأنها حالة قائمة يجعل النموذج يوصي بتحديث مستند لم يُطلب بعد.
    documents: hasApplication ? requirements.map((item) => ({ name: item.name, status: item.status })) : [],
    lastAction: hasApplication
      ? stages.filter((s) => s.status === "مكتمل").slice(-1)[0]?.title ?? "تقديم الطلب"
      : selectedProgram ? `اختيار برنامج ${selectedProgram}` : hasProfile ? "تعبئة البيانات السكنية" : "لم يبدأ بعد",
    daysSinceUpdate: hasApplication ? 12 : 0,
    owner: handover ? "مقدم الخدمة" : position.owner,
    hasProfile: hasProfile || hasApplication,
    selectedProgram,
    hasApplication,
    context,
    handover,
  }), [context, handover, hasApplication, hasProfile, position, selectedProgram]);

  const { data, loading, notConfigured } = useNextStep(request, fallback);

  return <section className={`unified-next-action ${className} ${data.actionRequired ? "" : "no-action"}`}>
    <div className="unified-next-icon">{icon}</div>
    <div className="unified-next-copy">
      <p className="eyebrow">{eyebrow}<AiBadge source={data.source} loading={loading} notConfigured={notConfigured} /></p>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      {!data.actionRequired && <p className="ai-waiting-on"><Clock3 size={14} />لا يلزمك إجراء الآن · الطلب لدى {data.waitingOn}</p>}
    </div>
    {/* حين لا يُطلب إجراء، الزر يصبح رابط متابعة ثانويًا: زرّ رئيسي بارز
        يناقض نصًّا يقول «لا يلزمك إجراء الآن» ويدفع المستفيد لفعل شيء بلا داعٍ. */}
    <Link className={data.actionRequired ? "primary-btn" : "secondary-btn"} href={data.href}>{data.actionRequired ? data.label : "عرض الحالة"} <ArrowLeft size={16} /></Link>
  </section>;
}

function UpdatesList({ limit }: { limit?: number }) {
  const associationUpdate = useMemo(() => { try { return JSON.parse(sessionStorage.getItem("yusr-association-update") ?? "null") as { title: string; body: string; time: string } | null; } catch { return null; } }, []);
  const items = associationUpdate ? [{ type: "update", title: associationUpdate.title, body: associationUpdate.body, time: associationUpdate.time, unread: true }, ...notifications] : notifications;
  return <div className="updates-list">{items.slice(0, limit ?? items.length).map((item) => <article className={`update-row ${item.unread ? "unread" : ""}`} key={`${item.title}-${item.time}`}><div className={`update-symbol ${item.type}`}>{item.type === "calendar" ? <CalendarClock size={17} /> : item.type === "maintenance" ? <Wrench size={17} /> : item.type === "action" ? <FileText size={17} /> : <Bell size={17} />}</div><div><h3>{item.title}</h3><p>{item.body}</p><time>{item.time}</time></div>{item.unread && <i aria-label="غير مقروء" />}</article>)}</div>;
}

export function JourneyStartPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ city: "", family: "", housing: "", income: "" });
  const canContinue = Object.values(form).every(Boolean);
  const completeness = Math.min(100, (form.city ? 25 : 0) + (form.family ? 25 : 0) + (form.housing ? 25 : 0) + (form.income ? 25 : 0));
  return <AppShell journeyStep={0} hideJourneyContinuation eyebrow="الخطوة 01 · فهم احتياجك" title="خلّنا نفهم احتياجك السكني" subtitle="عبّئ بيانات مختصرة، وسنعرّفك بالبرامج التي قد تناسب حالتك قبل إنشاء أي طلب."><div className="journey-start-layout"><section className="journey-start-form"><div className="section-heading"><div><p className="eyebrow">بيانات أساسية</p><h2>ملف سكني مختصر</h2></div><span className="completion-pill">{completeness}% مكتمل</span></div><div className="onboarding-fields"><label>المدينة<select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}><option value="" disabled>اختر المدينة</option><option value="الرياض">الرياض</option><option value="جدة">جدة</option><option value="الدمام">الدمام</option><option value="مكة المكرمة">مكة المكرمة</option></select></label><label>عدد أفراد الأسرة<select value={form.family} onChange={(event) => setForm({ ...form, family: event.target.value })}><option value="" disabled>اختر العدد</option><option value="1">فرد واحد</option><option value="3">3 أفراد</option><option value="5">5 أفراد</option><option value="7">7 أفراد أو أكثر</option></select></label><label>الحالة السكنية الحالية<select value={form.housing} onChange={(event) => setForm({ ...form, housing: event.target.value })}><option value="" disabled>اختر الحالة</option><option value="إيجار">إيجار</option><option value="مع الأسرة">مع الأسرة</option><option value="سكن غير ملائم">سكن غير ملائم</option></select></label><label>إجمالي الدخل الشهري<input inputMode="numeric" value={form.income} onChange={(event) => setForm({ ...form, income: event.target.value })} placeholder="مثال: 4500" /></label></div><p className="form-progress-help">{canContinue ? "اكتملت البيانات الأساسية. يمكنك الآن مشاهدة المطابقة الإرشادية." : `أكمل ${4 - Object.values(form).filter(Boolean).length} حقول للانتقال إلى الترشيح.`}</p><button className="primary-btn" disabled={!canContinue} onClick={() => { try { sessionStorage.setItem("sakan-profile", JSON.stringify(form)); } catch { /* التخزين المحلي اختياري في النموذج */ } navigate("/programs"); }}>اعرف البرامج التي قد تناسبني <ArrowLeft size={17} /></button></section><aside className="journey-start-result"><div className="result-orbit"><Sparkles size={22} /></div><p className="eyebrow">ماذا سيحدث بعد ذلك؟</p><h2>{canContinue ? "بياناتك جاهزة للمطابقة الإرشادية" : "أكمل بياناتك لنظهر لك الخيارات المناسبة"}</h2><p>لن نُنشئ أي طلب تلقائيًا. سترى البرامج أولًا، تختار ما تريد، ثم تراجع الطلب قبل تقديمه.</p><div className="result-route"><span>01</span><strong>بياناتك</strong><i /><span>02</span><strong>البرامج المرشحة</strong><i /><span>03</span><strong>مراجعة الطلب</strong></div><PrototypeNote /></aside></div></AppShell>;
}

export function HomePage() {
  const [, navigate] = useLocation();
  const hasApplication = getApplicationCreated();
  if (!hasApplication) return <AppShell journeyStep={0} hideJourneyContinuation eyebrow="ابدأ من هنا" title="مساء الخير، أحمد" subtitle="لم تنشئ طلبًا بعد. ابدأ ببيانات قصيرة ثم اعرف البرامج التي قد تناسبك."><AiNextAction icon={<Compass size={21} />} eyebrow="خطوتك التالية" context="journey" /><section className="journey-empty-state"><div className="journey-empty-symbol"><Compass size={27} /></div><div><p className="eyebrow">لا يوجد طلب نشط</p><h2>ابدأ رحلتك بخطوة واحدة واضحة</h2><p>سنحفظ تقدمك بين الصفحات: بياناتك أولًا، ثم الترشيح، وبعد مراجعتك فقط يتم إنشاء الطلب.</p></div><button className="primary-btn" onClick={() => navigate("/start")}>تعبئة بياناتي <ArrowLeft size={17} /></button></section><section className="metrics-section journey-preview-metrics"><MetricCard label="الخطوة الأولى" value="بياناتك" detail="أقل من دقيقتين" icon={<FileCheck2 size={18} />} tone="green" onClick={() => navigate("/start")} /><MetricCard label="بعدها مباشرة" value="الترشيح" detail="نتيجة إرشادية" icon={<Sparkles size={18} />} tone="mint" onClick={() => navigate("/start")} /><MetricCard label="أنت تقرر" value="إنشاء الطلب" detail="بعد المراجعة" icon={<FileText size={18} />} tone="stone" onClick={() => navigate("/start")} /></section></AppShell>;
  return <AppShell journeyStep={3} eyebrow="ملخص رحلتك" title="مساء الخير، أحمد" subtitle="طلبك في مرحلة التخصيص. هنا ترى الحالة والسبب والموعد وما يلزمك الآن.">
    <section className="home-hero connected-home-hero"><div className="home-hero-copy"><p className="eyebrow">الحالة الآن</p><h2>جاري <span>تخصيص المسكن</span></h2><p>تراجع الجمعية الخيارات المتاحة لمطابقة وحدة مناسبة لحالتك. لا يوجد قرار مطلوب منك في هذه اللحظة.</p><div className="hero-progress"><div><strong>4</strong><span>من 7 مراحل مكتملة</span></div><div className="progress-line"><i style={{ width: "57%" }} /></div><Link href="/application">كل تفاصيل المرحلة <ChevronLeft size={17} /></Link></div></div><div className="hero-waypoint"><span>04</span><div><i /><small>الانتقال المتوقع</small><strong>10 سبتمبر</strong></div></div></section>
    <AiNextAction icon={<Upload size={21} />} eyebrow="الإجراء المطلوب منك" context="journey" />
    <section className="metrics-section"><MetricCard label="اكتمال الملف" value="86%" detail="متطلب واحد متبقٍ" icon={<FileCheck2 size={18} />} tone="green" onClick={() => navigate("/requirements")} /><MetricCard label="مرحلة الطلب" value="04 / 07" detail="التخصيص" icon={<ClipboardList size={18} />} tone="mint" onClick={() => navigate("/application")} /><MetricCard label="موعد تقريبي" value="10 سبتمبر" detail="الانتقال المتوقع" icon={<CalendarClock size={18} />} tone="orange" onClick={() => navigate("/application")} /><MetricCard label="آخر تحديث" value="اليوم" detail="10:45 ص" icon={<Clock3 size={18} />} tone="stone" onClick={() => navigate("/notifications")} /></section>
    <div className="home-layout"><div className="home-main"><JourneyTimeline /></div><aside className="home-side"><section className="side-card"><div className="side-card-heading"><div><p className="eyebrow">آخر التحديثات</p><h2>ما الذي تغيّر؟</h2></div><Link href="/notifications" className="icon-link" aria-label="كل التحديثات"><ChevronLeft size={19} /></Link></div><UpdatesList limit={2} /></section><section className="side-card home-shortcuts"><p className="eyebrow">اختصارات مرتبطة بمرحلتك</p><Link href="/application">تفاصيل الطلب <ChevronLeft size={15} /></Link><Link href="/requirements">المتطلبات <ChevronLeft size={15} /></Link><Link href="/unit">معاينة متابعة البناء <ChevronLeft size={15} /></Link></section></aside></div>
  </AppShell>;
}

export function ProfilePage() {
  const [tab, setTab] = useState<"summary" | "income">("summary");
  const fields = [["رقم الحالة", beneficiary.id], ["المنطقة", beneficiary.region], ["المدينة", beneficiary.city], ["عدد أفراد الأسرة", `${beneficiary.familyMembers} أفراد`], ["الحالة السكنية الحالية", beneficiary.housingStatus], ["حالة البحث الاجتماعي", beneficiary.socialResearchStatus]];
  const hasProfile = (() => { try { return Boolean(sessionStorage.getItem("sakan-profile")); } catch { return false; } })();
  const selectedProgram = (() => { try { return Boolean(sessionStorage.getItem("yusr-selected-program")); } catch { return false; } })();
  const action = getJourneyAction({ hasProfile, selectedProgram, hasApplication: getApplicationCreated(), requirementUploaded: false });
  return <AppShell eyebrow="مساحتك الخاصة" title="ملفي السكني" subtitle="بيانات موحدة تساعدك على متابعة رحلتك بوضوح"><section className="unified-next-action profile-next-action"><div className="unified-next-icon"><Compass size={21} /></div><div className="unified-next-copy"><p className="eyebrow">خطوتك التالية</p><h2>{action.title}</h2><p>{action.description}</p></div><Link className="primary-btn" href={action.href}>{action.label} <ArrowLeft size={16} /></Link></section><div className="profile-layout"><section className="profile-main-card"><div className="profile-person"><div className="avatar-large">أم</div><div><p className="eyebrow">المستفيد</p><h2>{beneficiary.name}</h2><span>{beneficiary.id}</span></div><button className="outline-icon" onClick={() => toast("خاصية تعديل البيانات متاحة في النسخة المتكاملة.")} aria-label="تعديل الملف"><PencilLine size={18} /></button></div><div className="profile-tabs" role="tablist"><button onClick={() => setTab("summary")} className={tab === "summary" ? "active" : ""}>بيانات الملف</button><button onClick={() => setTab("income")} className={tab === "income" ? "active" : ""}>البيانات المالية</button></div>{tab === "summary" ? <dl className="profile-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <dl className="profile-fields financial-fields"><div><dt>إجمالي الدخل الشهري</dt><dd>{fmtNumber(beneficiary.monthlyIncome)} ر.س</dd></div><div><dt>المساعدات الشهرية</dt><dd>{fmtNumber(beneficiary.monthlySupport)} ر.س</dd></div><div><dt>المصروفات الأساسية</dt><dd>{fmtNumber(beneficiary.monthlyExpenses)} ر.س</dd></div><div><dt>مصدر الدخل</dt><dd>عمل حر ومساعدات اجتماعية</dd></div></dl>}</section><aside className="profile-side"><section className="completion-card"><p className="eyebrow">مستوى الجاهزية</p><div className="completion-figure"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" /><circle className="completion-progress" cx="60" cy="60" r="48" /></svg><div><strong>86%</strong><span>مكتمل</span></div></div><h3>ملفك السكني شبه مكتمل</h3><p>أكمل تحديث إثبات السكن للوصول إلى 100%.</p><Link href="/requirements" className="text-link">استكمال المتطلبات <ChevronLeft size={17} /></Link></section><section className="side-card security-card"><CheckCircle2 size={19} /><div><strong>بياناتك في عرض آمن</strong><p>لا نعرض المعلومات الحساسة في الصفحة الرئيسية.</p></div></section></aside></div></AppShell>;
}

export function ProgramsPage() {
  const [, navigate] = useLocation();
  const hasApplication = getApplicationCreated();
  const profile = useMemo(() => { try { return JSON.parse(sessionStorage.getItem("sakan-profile") ?? "null") as { city?: string; family?: string; housing?: string; income?: string } | null; } catch { return null; } }, []);
  const [selectedProgram, setSelectedProgram] = useState(() => { try { return sessionStorage.getItem("yusr-selected-program") ?? ""; } catch { return ""; } });
  const strongMatch = profile?.housing === "إيجار" && Number(profile?.income ?? 0) >= 3000;
  const visiblePrograms = programs.map((program) => program.name === "التملك المباشر" && !strongMatch ? { ...program, match: "يحتاج تحقق إضافي", tone: "warning", description: "تحتاج الحالة إلى تحقق إضافي بناءً على البيانات السكنية والدخل المدخلة." } : program);

  // الميزة 1 — الترشيح الذكي. القواعد أعلاه هي القيمة الاحتياطية المعروضة فورًا.
  const ruleRecommendations = useMemo<ProgramRecommendResult>(() => ({
    recommendations: visiblePrograms.map((program) => ({
      name: program.name,
      suitability: (program.tone === "success" ? "ملاءمة مبدئية مرتفعة" : program.tone === "warning" ? "يحتاج تحقق إضافي" : "غير مناسب للحالة الحالية") as ProgramRecommendation["suitability"],
      explanation: program.description,
      factors: [],
    })),
    disclaimer: AI_DISCLAIMER,
    source: "rules",
  }), [visiblePrograms]);

  const aiInput = useMemo<ProgramRecommendInput | null>(() => profile ? {
    city: profile.city ?? beneficiary.city,
    familyMembers: Number(profile.family ?? beneficiary.familyMembers) || beneficiary.familyMembers,
    housingStatus: profile.housing ?? beneficiary.housingStatus,
    monthlyIncome: Number(profile.income ?? beneficiary.monthlyIncome) || beneficiary.monthlyIncome,
    // نموذج /start يجمع المدينة وحجم الأسرة والوضع السكني والدخل فقط.
    // كانت هذه الثلاثة تُرسَل من سجل العرض التجريبي كأنها بيانات المستخدم،
    // فيبني النموذج ترشيحه على أرقام ليست له. نرسلها الآن كغير متوفرة
    // ليقول عنها «يحتاج تحقق إضافي» بدل أن يجزم بناءً على بيانات مفترضة.
    monthlySupport: hasApplication ? beneficiary.monthlySupport : 0,
    monthlyExpenses: hasApplication ? beneficiary.monthlyExpenses : 0,
    socialResearchStatus: hasApplication ? beneficiary.socialResearchStatus : "غير متوفر",
    programs: programs.map((program) => ({ name: program.name, description: program.description })),
  } : null, [hasApplication, profile]);

  const { data: aiResult, loading: aiLoading, notConfigured: aiUnset } = useProgramRecommendations(aiInput, ruleRecommendations);
  const cards = aiResult.recommendations.map((item) => ({ ...item, tone: PROGRAM_TONE[item.suitability] }));
  if (!profile) return <AppShell journeyStep={1} hideJourneyContinuation eyebrow="الخطوة 02 · معرفة الخيارات" title="أكمل بياناتك أولًا" subtitle="لا يمكن تقديم ترشيح واضح دون معرفة وضعك السكني الأساسي."><section className="journey-empty-state"><div className="journey-empty-symbol"><FileText size={25} /></div><div><p className="eyebrow">الخطوة السابقة غير مكتملة</p><h2>نحتاج بياناتك لعرض برامج مناسبة</h2><p>أكمل المدينة وحجم الأسرة والوضع السكني والدخل، ثم ستعود هنا تلقائيًا لرؤية الخيارات.</p></div><button className="primary-btn" onClick={() => navigate("/start")}>إكمال البيانات <ArrowLeft size={16} /></button></section></AppShell>;
  return <AppShell journeyStep={1} hideJourneyContinuation eyebrow="الخطوة 02 · معرفة الخيارات" title="البرامج التي قد تناسبك" subtitle={profile ? `النتيجة مبنية على بياناتك: ${profile.city} · ${profile.housing} · ${profile.family} أفراد` : "أكمل بياناتك أولًا لتحصل على مطابقة إرشادية أدق."}>
    <div className="program-choice-head"><div><p className="eyebrow">اختر برنامجًا للمتابعة</p><h2>يمكنك مراجعة الخيارات قبل تقديم الطلب</h2></div><div className="program-choice-meta"><AiBadge source={aiResult.source} loading={aiLoading} notConfigured={aiUnset} /><span>{selectedProgram ? "تم اختيار برنامج" : "لم تختر بعد"}</span></div></div>
    <AiDecisionNotice text={aiResult.disclaimer ?? AI_DISCLAIMER} />
    <section className="program-list" role="radiogroup" aria-label="البرامج المرشحة">{cards.map((program, i) => <article className={`program-card ${program.tone} ${selectedProgram === program.name ? "selected" : ""}`} key={program.name}><div className="program-index">0{i + 1}</div><div className="program-content"><div><p className="eyebrow">حل سكني محتمل</p><h2>{program.name}</h2></div><StatusBadge tone={program.tone as "success" | "warning" | "muted"}>{program.suitability}</StatusBadge><p>{program.explanation}</p><AiFactors factors={program.factors} /><div className="program-card-actions"><button className="text-link" onClick={() => toast(program.factors.length ? `بُني هذا الترشيح على: ${program.factors.join("، ")}.` : "ظهر هذا البرنامج بناءً على المدينة وحجم الأسرة والوضع السكني والدخل المدخل.")}>لماذا ظهر؟ <CircleHelp size={15} /></button><button className={`program-select ${selectedProgram === program.name ? "active" : ""}`} role="radio" aria-checked={selectedProgram === program.name} onClick={() => { setSelectedProgram(program.name); try { sessionStorage.setItem("yusr-selected-program", program.name); } catch { /* اختياري */ } }}>{selectedProgram === program.name ? <><Check size={15} /> تم الاختيار</> : "اختيار البرنامج"}</button></div></div></article>)}</section>
    <section className="unified-next-action"><div className="unified-next-icon"><FileCheck2 size={21} /></div><div className="unified-next-copy"><p className="eyebrow">الخطوة التالية</p><h2>{selectedProgram ? `راجع طلب ${selectedProgram}` : "اختر برنامجًا للمتابعة"}</h2><p>{selectedProgram ? "سننقل اختيارك وبياناتك إلى ملخص واحد قبل التقديم النهائي." : "اختيارك هنا لا يرسل طلبًا؛ ستراجع كل البيانات في الصفحة التالية."}</p><div className="unified-next-meta"><Link href="/start">تعديل بياناتي</Link></div></div><button className="primary-btn" disabled={!selectedProgram} onClick={() => navigate("/application")}>مراجعة وتقديم الطلب <ArrowLeft size={17} /></button></section><PrototypeNote />
  </AppShell>;
}

export function ApplicationPage() {
  const [submitted, setSubmitted] = useState(() => getApplicationCreated());
  const prerequisites = useMemo(() => { try { return { hasProfile: Boolean(sessionStorage.getItem("sakan-profile")), selectedProgram: sessionStorage.getItem("yusr-selected-program") ?? "" }; } catch { return { hasProfile: false, selectedProgram: "" }; } }, []);
  if (!submitted && (!prerequisites.hasProfile || !prerequisites.selectedProgram)) return <AppShell journeyStep={2} hideJourneyContinuation eyebrow="الخطوة 03 · تقديم الطلب" title="أكمل الخطوات السابقة" subtitle="سنحمي تسلسل رحلتك حتى لا يُقدّم طلب ناقص أو دون اختيار برنامج."><section className="journey-empty-state"><div className="journey-empty-symbol"><ClipboardList size={25} /></div><div><p className="eyebrow">الطلب غير جاهز</p><h2>{!prerequisites.hasProfile ? "بياناتك الأساسية غير مكتملة" : "لم تختر برنامجًا للمتابعة"}</h2><p>{!prerequisites.hasProfile ? "ابدأ ببياناتك ثم شاهد المطابقة الإرشادية قبل تقديم الطلب." : "ارجع إلى البرامج، اختر خيارًا واحدًا، ثم راجع الطلب هنا."}</p></div><Link className="primary-btn" href={!prerequisites.hasProfile ? "/start" : "/programs"}>{!prerequisites.hasProfile ? "تعبئة البيانات" : "اختيار برنامج"} <ArrowLeft size={16} /></Link></section></AppShell>;
  if (!submitted) return <AppShell journeyStep={2} hideJourneyContinuation eyebrow="الخطوة 03 · تقديم الطلب" title="راجع ثم قدّم طلبك" subtitle="أنت في آخر خطوة قبل إنشاء الطلب. راجع الملخص ثم أكّد التقديم."><section className="application-review-card"><div className="review-icon"><FileCheck2 size={24} /></div><div><p className="eyebrow">ملخص الطلب</p><h2>أحمد محمد · الرياض · 5 أفراد</h2><p>البرنامج المختار: التملك المباشر. ستتم مراجعة الأهلية والبيانات من الجهة المختصة بعد التقديم.</p><div className="unified-next-meta review-meta"><span>البيانات مكتملة</span><span>برنامج واحد مختار</span><span>يمكن التعديل قبل الإرسال</span></div></div><button className="primary-btn" onClick={() => { setApplicationCreated(true); setSubmitted(true); toast.success("تم تقديم الطلب التجريبي. يمكنك الآن متابعة مرحلته وموعده المتوقع."); }}>تقديم الطلب الآن <ArrowLeft size={17} /></button></section><Link className="secondary-btn" href="/programs">العودة وتعديل البرنامج <ArrowLeft size={16} /></Link></AppShell>;
  return <AppShell journeyStep={3} eyebrow="المرحلة 04 · متابعة الطلب" title="حالة طلبي" subtitle="كل ما يهمك عن المرحلة الحالية والسبب والموعد والخطوة التالية في مكان واحد."><section className="application-summary connected-application-summary"><div className="application-stage-number">04</div><div><p className="eyebrow">أنت هنا الآن</p><h2>التخصيص</h2><p>تراجع الجمعية الوحدات المتاحة لاختيار الأنسب لحالتك.</p><div className="application-stage-facts"><span><Clock3 size={14} /> المدة المتوقعة: 10–15 يومًا</span><span><CalendarClock size={14} /> الانتقال المتوقع: 10 سبتمبر 2026</span></div><div className="summary-delay"><strong>لماذا لم تنتقل المرحلة بعد؟</strong><span>{stages.find((stage) => stage.status === "قيد الإجراء")?.delayReason}</span></div></div><StatusBadge tone="info">قيد الإجراء</StatusBadge></section><section className="unified-next-action application-next-action"><div className="unified-next-icon"><Upload size={21} /></div><div className="unified-next-copy"><p className="eyebrow">مطلوب منك الآن</p><h2>تحديث إثبات السكن</h2><p>بعد رفع المستند تستكمل الجهة مراجعة التخصيص، وسيظهر التحديث هنا تلقائيًا.</p><div className="unified-next-meta"><span>آخر موعد: 24 أغسطس</span><span>المسؤول بعد الرفع: الجمعية</span></div></div><Link href="/requirements" className="primary-btn">رفع المستند <ArrowLeft size={16} /></Link></section><section className="beneficiary-association-card"><div className="association-card-icon"><Building2 size={19} /></div><div><p className="eyebrow">من يتابع هذه المرحلة؟</p><h2>جمعية الإسكان التنموي – الرياض</h2><p>آخر متابعة: 24 أغسطس 2026 · المسؤول الحالي: الجمعية</p><small>نعرض لك التحديثات المفيدة والخطوة التالية فقط، دون الملاحظات الداخلية.</small></div></section><JourneyTimeline expanded /><ApplicationUpdateLog /><section className="clarity-card"><CheckCircle2 size={21} /><div><strong>بعد التخصيص</strong><p>عند تحديد المسكن تنتقل إلى متابعة البناء عبر التوأم الرقمي.</p></div><Link className="secondary-btn" href="/unit">معاينة متابعة البناء <Home size={16} /></Link></section></AppShell>;
}

export function RequirementsPage() {
  const [updating, setUpdating] = useState(false); const [uploaded, setUploaded] = useState(false);
  const hasApplication = getApplicationCreated();
  const visibleRequirements = requirements.map((requirement) => uploaded && requirement.status !== "مكتمل" ? { ...requirement, status: "قيد المراجعة", detail: "تم الرفع اليوم، وستراجع الجهة المستند قبل اعتماده." } : requirement);
  if (!hasApplication) return <AppShell journeyStep={0} hideJourneyContinuation eyebrow="متطلبات الطلب" title="لا توجد متطلبات بعد" subtitle="تظهر المتطلبات بعد تقديم طلبك وبدء مراجعته."><section className="journey-empty-state"><div className="journey-empty-symbol"><ClipboardList size={25} /></div><div><p className="eyebrow">لا يوجد طلب نشط</p><h2>ابدأ رحلتك أولًا</h2><p>أكمل بياناتك واعرف البرامج المتاحة، ثم قدّم الطلب لتظهر المتطلبات المرتبطة به.</p></div><Link className="primary-btn" href="/start">بدء الرحلة <ArrowLeft size={16} /></Link></section></AppShell>;
  return <AppShell journeyStep={3} hideJourneyContinuation={!uploaded} eyebrow="جزء من مرحلة المتابعة" title="متطلبات طلبي" subtitle="اعرف المطلوب وسبب طلبه وما يحدث بعد إرساله."><section className="unified-next-action requirement-primary-action"><div className="unified-next-icon">{uploaded ? <Clock3 size={21} /> : <Upload size={21} />}</div><div className="unified-next-copy"><p className="eyebrow">{uploaded ? "تم الإرسال" : "مطلوب منك الآن"}</p><h2>{uploaded ? "إثبات السكن قيد المراجعة" : "تحديث إثبات السكن"}</h2><p>{uploaded ? "لا يلزمك إجراء حاليًا. سنحدّث حالة الطلب فور اعتماد المستند." : "نحتاج مستندًا حديثًا لتأكيد وضعك السكني قبل استكمال التخصيص."}</p><div className="unified-next-meta"><span>{uploaded ? "المدة المتوقعة: يومان" : "المدة: دقيقتان"}</span><span>يؤثر على: مرحلة التخصيص</span></div></div>{uploaded ? <Link className="primary-btn" href="/application">العودة إلى حالة الطلب</Link> : <button className="primary-btn" onClick={() => setUpdating(true)}>رفع المستند <Upload size={15} /></button>}</section><section className="requirements-card"><div className="requirements-head"><div><h2>حالة الملف</h2><p>{uploaded ? "جميع المتطلبات مكتملة أو قيد المراجعة." : "متطلب واحد فقط يحتاج إجراءك."}</p></div><div className="mini-progress"><span>{uploaded ? "100%" : "86%"}</span><i><b style={{ width: uploaded ? "100%" : "86%" }} /></i></div></div><div className="requirements-list">{visibleRequirements.map((requirement) => <article className="requirement-row" key={requirement.name}><div className={`requirement-check ${requirement.status === "مكتمل" ? "success" : uploaded ? "review" : "warning"}`}>{requirement.status === "مكتمل" ? <Check size={18} /> : uploaded ? <Clock3 size={18} /> : <AlertTriangle size={18} />}</div><div className="requirement-body"><h3>{requirement.name}</h3><p>{requirement.detail}</p></div><StatusBadge tone={requirement.status === "قيد المراجعة" ? "info" : toneForStatus(requirement.status)}>{requirement.status}</StatusBadge></article>)}</div></section>{updating && <div className="modal-backdrop" role="presentation"><section className="upload-modal" role="dialog" aria-modal="true" aria-label="رفع إثبات السكن"><button className="modal-close" onClick={() => setUpdating(false)} aria-label="إغلاق"><X size={20} /></button><div className="modal-symbol"><Upload size={22} /></div><p className="eyebrow">تحديث مستند</p><h2>إثبات السكن</h2><p>اختر ملفًا بصيغة PDF أو صورة واضحة، ثم أرسله للمراجعة.</p><label className="drop-zone"><Upload size={20} /><strong>اسحب الملف هنا أو اختر من الجهاز</strong><span>PDF أو JPG أو PNG — حتى 5 ميجابايت</span><input type="file" onChange={(event) => { if (event.target.files?.[0]) { setUpdating(false); setUploaded(true); toast.success("تم رفع المستند. انتقلت حالته إلى قيد المراجعة."); } }} /></label></section></div>}</AppShell>;
}

export function NotificationsPage() { const [showAll, setShowAll] = useState(true); const hasApplication = getApplicationCreated(); if (!hasApplication) return <AppShell journeyStep={0} hideJourneyContinuation eyebrow="سجل التحديثات" title="لا توجد تحديثات بعد" subtitle="ستظهر تحديثات طلبك هنا بعد تقديمه."><section className="journey-empty-state"><div className="journey-empty-symbol"><Bell size={25} /></div><div><p className="eyebrow">صندوق التحديثات فارغ</p><h2>ابدأ رحلتك لتتلقى تحديثات مرتبطة بمرحلتك</h2><p>ستجد هنا تغيّر حالة الطلب والمواعيد والمتطلبات وتقدم بناء المسكن.</p></div><Link className="primary-btn" href="/start">بدء الرحلة <ArrowLeft size={16} /></Link></section></AppShell>; return <AppShell journeyStep={3} eyebrow="سجل التحديثات" title="ما الجديد في رحلتك؟" subtitle="تحديثات مرتبطة بمراحل طلبك، مع رابط واضح للمكان الذي يحتاج انتباهك."><section className="notification-focus"><div><p className="eyebrow">أهم تحديث</p><h2>إثبات السكن يحتاج إلى تحديث</h2><p>هذا التحديث يؤثر على مرحلة التخصيص الحالية.</p></div><Link className="primary-btn" href="/requirements">تنفيذ الإجراء <ArrowLeft size={16} /></Link></section><div className="notification-toolbar"><button className={showAll ? "active" : ""} onClick={() => setShowAll(true)}>كل التحديثات <span>4</span></button><button className={!showAll ? "active" : ""} onClick={() => setShowAll(false)}>تحتاج انتباهك <span>2</span></button><button className="mark-read" onClick={() => toast.success("تم تعليم جميع التحديثات كمقروءة.")}>تعليم الكل كمقروء</button></div><section className="notifications-card tab-panel" key={showAll ? "all" : "attention"}><UpdatesList limit={showAll ? undefined : 2} /></section></AppShell>; }

export function UnitPage() {
  const [handover, setHandover] = useState(false);
  if (!getApplicationCreated()) return <AppShell journeyStep={0} hideJourneyContinuation eyebrow="مسكني" title="متابعة المسكن تبدأ بعد الطلب" subtitle="سيظهر التوأم الرقمي هنا عند تخصيص مسكن وربطه بطلبك."><section className="journey-empty-state"><div className="journey-empty-symbol"><Building2 size={26} /></div><div><p className="eyebrow">المسكن غير مرتبط بعد</p><h2>أكمل البيانات وقدّم طلبك أولًا</h2><p>بعد التخصيص ستتابع البناء دورًا بدور، ثم تنتقل إلى الاستلام والصيانة في نفس المساحة.</p></div><Link className="primary-btn" href="/start">بدء الرحلة <ArrowLeft size={16} /></Link></section></AppShell>;
  return <AppShell journeyStep={handover ? 5 : 4} eyebrow={handover ? "المرحلة 06 · الاستلام" : "المرحلة 05 · متابعة البناء"} title="مسكني" subtitle={handover ? "تابع حالة الوحدة واحتياجات الصيانة بعد الاستلام." : "شاهد تقدم بناء مسكنك وما اكتمل في كل دور والخطوة التالية."}>
    <section className="unit-overview construction-overview"><div className="unit-facts"><p className="eyebrow">بيانات المسكن</p><h2>مشروع سكني في الرياض</h2><div><span><MapPin size={16} />حي النرجس</span><span><Building2 size={16} />دوران سكنيان</span><span><CalendarClock size={16} />التسليم المتوقع: ديسمبر 2026</span></div></div><div className="unit-overview-actions"><StatusBadge tone={handover ? "success" : "info"}>{handover ? "تم الاستلام" : "قيد البناء · 67%"}</StatusBadge><button className="unit-demo-toggle" onClick={() => setHandover((current) => !current)}>{handover ? "العودة لمتابعة البناء" : "محاكاة ما بعد التسليم"}</button></div></section>
    <AiNextAction icon={handover ? <Wrench size={21} /> : <Bell size={21} />} eyebrow="خطوتك التالية" context="unit" handover={handover} className="unit-next-action" />
    {!handover ? <ConstructionTwin /> : <><UnitTwin /><section className="maintenance-calendar"><div className="section-heading"><div><p className="eyebrow">جدول العناية</p><h2>المواعيد القادمة</h2></div><Link className="text-link" href="/unit/maintenance">سجل الصيانة <ChevronLeft size={16} /></Link></div><div className="calendar-rows"><div><span className="calendar-date"><strong>28</strong><small>أغسطس</small></span><div><strong>فحص التكييف الدوري</strong><p>موعد مقترح · لم يتم الحجز بعد</p></div><Link className="secondary-btn compact-btn" href="/unit/maintenance/new">حجز الموعد</Link></div><div><span className="calendar-date"><strong>15</strong><small>سبتمبر</small></span><div><strong>مراجعة تسربات المياه</strong><p>تذكير وقائي · مرتبط بالمطبخ</p></div><Link className="secondary-btn compact-btn" href="/unit/maintenance/MT-1024">عرض البلاغ</Link></div></div></section></>}
  </AppShell>;
}

export function MaintenancePage() { return <AppShell journeyStep={6} eyebrow="المرحلة 07 · العناية بالمسكن" title="الصيانة والبلاغات" subtitle="تابع البلاغات الحالية وسجل أعمال الصيانة لوحدتك." actions={<Link className="primary-btn" href="/unit/maintenance/new"><Plus size={17} />بلاغ جديد</Link>}><AiNextAction icon={<Wrench size={21} />} eyebrow="الأولوية الآن" context="maintenance" className="maintenance-next-action" /><section className="maintenance-summary"><div><span>بلاغات مفتوحة</span><strong>1</strong></div><div><span>تم حلها</span><strong>1</strong></div><div><span>وقت الاستجابة المتوقع</span><strong>48 ساعة</strong></div></section><section className="tickets-card"><div className="section-heading"><div><p className="eyebrow">سجل البلاغات</p><h2>طلبات الصيانة</h2></div></div>{maintenanceRequests.map((ticket) => <article className="ticket-row" key={ticket.id}><div className={`ticket-symbol ${ticket.tone}`}><Wrench size={19} /></div><div className="ticket-detail"><div><h3>{ticket.category} <span>#{ticket.id}</span></h3><StatusBadge tone={ticket.tone as "success" | "info"}>{ticket.status}</StatusBadge></div><p>{ticket.description}</p><small>{ticket.location} · {ticket.createdAt}</small></div><Link className="text-link" href={`/unit/maintenance/${ticket.id}`}>عرض التفاصيل <ChevronLeft size={16} /></Link></article>)}</section><section className="maintenance-flow"><div><CheckCircle2 size={17} /><span>تم الاستلام</span></div><i /><div className="active"><Clock3 size={17} /><span>قيد الإجراء</span></div><i /><div><Wrench size={17} /><span>تم إسناده</span></div><i /><div><CalendarClock size={17} /><span>موعد الصيانة</span></div><i /><div><Check size={17} /><span>تم الحل</span></div></section></AppShell>; }

export function NewMaintenancePage() {
  const [, navigate] = useLocation(); const [type, setType] = useState(""); const [location, setLocation] = useState(""); const [description, setDescription] = useState(""); const [fileName, setFileName] = useState(""); const [submitted, setSubmitted] = useState(false);
  const priority = useMemo(() => type === "تسرب مياه" ? "تحتاج متابعة عاجلة" : "أولوية عادية", [type]);
  const submit = (event: FormEvent) => { event.preventDefault(); if (!type || !location || description.trim().length < 8) { toast.error("أكمل نوع المشكلة ومكانها ووصفًا واضحًا للبلاغ."); return; } setSubmitted(true); toast.success("تم استلام البلاغ بنجاح."); };
  if (submitted) return <AppShell eyebrow="العناية بالوحدة" title="تم استلام بلاغك"><section className="success-ticket"><div className="success-circle"><Check size={35} /></div><p className="eyebrow">تم استلام البلاغ بنجاح</p><h2>رقم البلاغ <span>#MT-1024</span></h2><p>سيقوم فريق الصيانة بمراجعة البلاغ وإبلاغك بالخطوة التالية.</p><div className="ticket-steps"><span className="active">تم الاستلام</span><i /><span>قيد الإجراء</span><i /><span>تم إسناده</span><i /><span>موعد الصيانة</span></div><div className="success-actions"><button className="secondary-btn" onClick={() => navigate("/unit/maintenance")}>متابعة البلاغات</button><button className="primary-btn" onClick={() => { setSubmitted(false); setType(""); setLocation(""); setDescription(""); }}>بلاغ جديد</button></div></section></AppShell>;
  return <AppShell eyebrow="بلاغ جديد" title="إنشاء بلاغ صيانة" subtitle="صف المشكلة بوضوح حتى يتم توجيهها إلى الفريق المناسب."><div className="new-ticket-layout"><form className="ticket-form" onSubmit={submit}><div className="form-row"><label>نوع المشكلة<select value={type} onChange={(event) => setType(event.target.value)}><option value="">اختر نوع المشكلة</option><option value="تسرب مياه">تسرب مياه</option><option value="تكييف">تكييف</option><option value="كهرباء">كهرباء</option><option value="أبواب ونوافذ">أبواب ونوافذ</option><option value="أخرى">أخرى</option></select></label><label>مكان المشكلة<select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">اختر المكان</option><option value="المطبخ">المطبخ</option><option value="غرفة النوم">غرفة النوم</option><option value="دورة المياه">دورة المياه</option><option value="الصالة">الصالة</option><option value="الممر">الممر</option></select></label></div><label>وصف المشكلة<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="مثال: يوجد تسرب مياه أسفل مغسلة المطبخ منذ صباح اليوم." rows={5} /></label><label className="ticket-upload"><Upload size={21} /><strong>{fileName || "إرفاق صورة (اختياري)"}</strong><span>أضف صورة واضحة تساعد الفريق على فهم المشكلة</span><input type="file" accept="image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} /></label><button className="primary-btn submit-ticket" type="submit"><Send size={17} />إرسال البلاغ</button></form><aside className="priority-panel"><p className="eyebrow">توصية مبدئية</p><h2>أولوية البلاغ</h2><StatusBadge tone={priority.includes("عاجلة") ? "warning" : "info"}>{priority}</StatusBadge><p>تُحدد الأولوية بناءً على المعلومات المدخلة، وقد تُراجع من فريق الصيانة.</p><div className="priority-note"><AlertTriangle size={17} /><span>في الحالات الخطرة أو الطارئة، تواصل مع الجهات المختصة مباشرة.</span></div></aside></div></AppShell>;
}


export function MaintenanceDetailPage() {
  const ticket = maintenanceRequests[0];
  return <AppShell eyebrow="تفاصيل البلاغ" title={`بلاغ #${ticket.id}`} subtitle="تتبع حالة الطلب وآخر تحديث من فريق الصيانة." actions={<Link className="secondary-btn" href="/unit/maintenance">العودة إلى السجل <ArrowLeft size={16} /></Link>}>
    <section className="ticket-detail-page"><div className="ticket-detail-hero"><div className="ticket-symbol info"><Wrench size={22} /></div><div><p className="eyebrow">{ticket.category} · {ticket.location}</p><h2>{ticket.description}</h2><span>تم الإنشاء في {ticket.createdAt}</span></div><StatusBadge tone="info">{ticket.status}</StatusBadge></div><div className="ticket-detail-grid"><div><p className="eyebrow">مسار البلاغ</p><div className="detail-status-line"><div className="completed"><CheckCircle2 size={17} /><span>تم الاستلام</span></div><i /><div className="completed"><CheckCircle2 size={17} /><span>قيد الإجراء</span></div><i /><div className="active"><Wrench size={17} /><span>تم إسناده</span></div><i /><div><CalendarClock size={17} /><span>موعد الصيانة</span></div><i /><div><Check size={17} /><span>تم الحل</span></div></div></div><aside className="ticket-next-step"><p className="eyebrow">التحديث التالي</p><h3>تم إسناد البلاغ إلى فريق الصيانة</h3><p>سيظهر موعد الزيارة هنا فور اعتماده.</p><button className="secondary-btn" onClick={() => toast("سنرسل لك إشعارًا عند تحديد الموعد.")}>تفعيل التذكير <Bell size={15} /></button></aside></div></section>
  </AppShell>;
}

export function MaintenanceInfoPage() { return <section />; }
