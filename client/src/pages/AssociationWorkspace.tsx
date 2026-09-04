/**
 * Clean association workspace.
 *
 * This replaces query-string pseudo-pages with real routes and keeps the page
 * task-oriented: understand today's queue, see why a case needs attention, and
 * open the case. AI ranks/explains operational signals only; it never decides
 * beneficiary eligibility.
 */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AiBadge, AiDecisionNotice } from "@/components/AiInsight";
import { StatusBadge, toneForStatus } from "@/components/StatusBadge";
import {
  associationCases,
  associationDemoThresholds,
  type AssociationCase,
} from "@/data";
import { useStalledCases } from "@/lib/ai";
import type { StalledCasesRequest, StalledCasesResult } from "@shared/ai";

type AssociationView = "overview" | "cases" | "needs" | "delayed" | "ready";

const viewMeta: Record<AssociationView, { eyebrow: string; title: string; subtitle: string }> = {
  overview: {
    eyebrow: "مساحة الجمعية",
    title: "متابعة الحالات",
    subtitle: "ابدأ بالحالات التي تحتاج إجراءً واضحًا اليوم، ثم افتح الحالة لتسجيل المتابعة.",
  },
  cases: {
    eyebrow: "قائمة العمل",
    title: "كل الطلبات",
    subtitle: "الحالات المسندة للجمعية عبر مراحل الرحلة المختلفة.",
  },
  needs: {
    eyebrow: "أولوية المتابعة",
    title: "حالات تحتاج تدخل",
    subtitle: "حالات يظهر فيها تعطّل أو إجراء مطلوب قبل أن يحتاج المستفيد للتواصل.",
  },
  delayed: {
    eyebrow: "متابعة المدد",
    title: "الحالات المتأخرة",
    subtitle: "حالات تجاوزت مدة المتابعة أو لم يصلها تحديث خلال المدة التجريبية المحددة.",
  },
  ready: {
    eyebrow: "الانتقال للمرحلة التالية",
    title: "الجاهزة للمراجعة",
    subtitle: "حالات اكتملت متطلباتها وأصبحت جاهزة للمراجعة أو الانتقال.",
  },
};

function routeToView(location: string): AssociationView {
  if (location.startsWith("/association/cases")) return "cases";
  if (location.startsWith("/association/needs")) return "needs";
  if (location.startsWith("/association/delayed")) return "delayed";
  if (location.startsWith("/association/ready")) return "ready";
  return "overview";
}

function caseSignals(item: AssociationCase) {
  const signals: string[] = [];
  if (item.requirement === "ناقص") signals.push("متطلب ناقص يمنع تقدم الطلب");
  if (item.daysInStage > associationDemoThresholds.maxStageDays) {
    signals.push(`تجاوز مدة المرحلة (${item.daysInStage} يومًا)`);
  }
  if (item.daysSinceUpdate > associationDemoThresholds.maxDaysWithoutUpdate) {
    signals.push(`لا يوجد تحديث منذ ${item.daysSinceUpdate} يومًا`);
  }
  if (item.reassignments > 1) signals.push(`تحويل الحالة ${item.reassignments} مرات`);
  if (item.beneficiaryContacts > 1) signals.push(`تواصل المستفيد ${item.beneficiaryContacts} مرات دون تقدم`);
  return signals;
}

function useStalledAnalysis() {
  const ruleFindings = useMemo<StalledCasesResult>(() => ({
    findings: associationCases.map((item) => {
      const signals = caseSignals(item);
      return {
        id: item.id,
        needsFollowUp: signals.length > 0,
        severity:
          signals.length >= 3 || item.priority === "تحتاج تدخل"
            ? "تحتاج تدخل"
            : signals.length
              ? "تحتاج متابعة"
              : "عادية",
        signals,
        summary: signals.length ? item.alert : "تسير الحالة ضمن المدد المتوقعة.",
        recommendedAction: item.nextStep,
      };
    }),
    source: "rules",
  }), []);

  const request = useMemo<StalledCasesRequest>(() => ({
    thresholds: associationDemoThresholds,
    cases: associationCases.map((item) => ({
      id: item.id,
      name: item.name,
      stage: item.stage,
      daysInStage: item.daysInStage,
      daysSinceUpdate: item.daysSinceUpdate,
      requirement: item.requirement,
      owner: item.owner,
      lastAction: item.lastAction,
      reassignments: item.reassignments,
      beneficiaryContacts: item.beneficiaryContacts,
    })),
  }), []);

  return useStalledCases(request, ruleFindings);
}

function CaseRow({ item }: { item: AssociationCase }) {
  const [, navigate] = useLocation();
  const signals = caseSignals(item);

  return (
    <article
      className="association-case-row"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/association/cases/${item.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") navigate(`/association/cases/${item.id}`);
      }}
    >
      <div className="association-case-person">
        <div className="case-avatar"><UserRound size={17} /></div>
        <div><strong>{item.name}</strong><span>{item.id}</span></div>
      </div>
      <div><small className="table-label">المرحلة</small><strong>{item.stage}</strong></div>
      <div><small className="table-label">مدة المرحلة</small><strong>{item.daysInStage} يومًا</strong></div>
      <div>
        <StatusBadge tone={toneForStatus(item.status)}>{item.status}</StatusBadge>
        <span className="case-subtext">{signals[0] ?? item.alert}</span>
      </div>
      <div><small className="table-label">المسؤول</small><strong>{item.owner}</strong></div>
      <div className="association-case-action"><span>فتح الحالة</span><ArrowLeft size={16} /></div>
    </article>
  );
}

export function AssociationWorkspacePage() {
  const [location, navigate] = useLocation();
  const view = routeToView(location);
  const meta = viewMeta[view];
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("الكل");
  const { data, loading, notConfigured } = useStalledAnalysis();

  const filtered = useMemo(() => associationCases.filter((item) => {
    const matchesView =
      view === "overview" || view === "cases"
        ? true
        : view === "needs"
          ? item.priority === "تحتاج تدخل" || caseSignals(item).length >= 2
          : view === "delayed"
            ? item.status === "متأخرة" || item.daysInStage > associationDemoThresholds.maxStageDays || item.daysSinceUpdate > associationDemoThresholds.maxDaysWithoutUpdate
            : item.status === "جاهزة للانتقال";
    const matchesQuery = `${item.name} ${item.id}`.includes(query.trim());
    const matchesStage = stage === "الكل" || item.stage === stage;
    return matchesView && matchesQuery && matchesStage;
  }), [query, stage, view]);

  const stalled = data.findings.filter((item) => item.needsFollowUp);
  const byId = new Map(associationCases.map((item) => [item.id, item]));
  const delayedCount = associationCases.filter((item) => item.status === "متأخرة" || item.daysInStage > associationDemoThresholds.maxStageDays).length;
  const readyCount = associationCases.filter((item) => item.status === "جاهزة للانتقال").length;
  const needsCount = associationCases.filter((item) => item.priority === "تحتاج تدخل" || caseSignals(item).length >= 2).length;

  return (
    <AppShell
      variant="association"
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.subtitle}
      actions={<button className="secondary-btn" onClick={() => navigate("/home")}>عرض رحلة المستفيد <ArrowLeft size={16} /></button>}
    >
      <section className="association-kpi-grid" aria-label="ملخص الحالات">
        <button className="association-kpi mint" onClick={() => navigate("/association/cases")}>
          <span className="kpi-icon"><UsersRound size={18} /></span><span className="kpi-label">كل الحالات</span><strong>{associationCases.length}</strong><small>ضمن نطاق العرض</small>
        </button>
        <button className="association-kpi orange" onClick={() => navigate("/association/needs")}>
          <span className="kpi-icon"><ShieldAlert size={18} /></span><span className="kpi-label">تحتاج تدخل</span><strong>{needsCount}</strong><small>أولوية المتابعة</small>
        </button>
        <button className="association-kpi stone" onClick={() => navigate("/association/delayed")}>
          <span className="kpi-icon"><Clock3 size={18} /></span><span className="kpi-label">متأخرة</span><strong>{delayedCount}</strong><small>بحسب المدد التجريبية</small>
        </button>
        <button className="association-kpi green" onClick={() => navigate("/association/ready")}>
          <span className="kpi-icon"><CheckCircle2 size={18} /></span><span className="kpi-label">جاهزة للمراجعة</span><strong>{readyCount}</strong><small>مكتملة المتطلبات</small>
        </button>
      </section>

      {(view === "overview" || view === "needs") && (
        <section className="stalled-panel">
          <div className="association-section-heading">
            <div>
              <p className="eyebrow">رصد استباقي <AiBadge source={data.source} loading={loading} notConfigured={notConfigured} /></p>
              <h2>حالات يظهر فيها تعطل</h2>
              <p>الإشارات العددية تُحسب من بيانات الحالة أولًا، ثم يساعد مساعد يسر في ترتيب الأولوية وصياغة الإجراء.</p>
            </div>
            <span className="stalled-count">{stalled.length}</span>
          </div>

          <div className="stalled-list">
            {stalled.slice(0, view === "overview" ? 4 : stalled.length).map((finding) => {
              const item = byId.get(finding.id);
              if (!item) return null;
              return (
                <button
                  key={finding.id}
                  className={`stalled-card ${finding.severity === "تحتاج تدخل" ? "urgent" : "watch"}`}
                  onClick={() => navigate(`/association/cases/${finding.id}`)}
                >
                  <div className="stalled-card-head">
                    <div><strong>{item.name}</strong><small>{finding.id} · {item.stage}</small></div>
                    <StatusBadge tone={finding.severity === "تحتاج تدخل" ? "danger" : "warning"}>{finding.severity}</StatusBadge>
                  </div>
                  <p className="stalled-summary">{finding.summary}</p>
                  <ul className="stalled-signals">{finding.signals.slice(0, 3).map((signal) => <li key={signal}><AlertTriangle size={13} />{signal}</li>)}</ul>
                  <p className="stalled-action"><FileText size={14} /><span>{finding.recommendedAction}</span></p>
                </button>
              );
            })}
          </div>
          <AiDecisionNotice text="مساعد يسر يرصد سير الإجراء ويشرح الإشارات فقط؛ لا يقيّم أهلية المستفيد ولا يصدر قرارًا على الطلب." />
        </section>
      )}

      <section className="association-queue">
        <div className="association-section-heading">
          <div><p className="eyebrow">قائمة العمل</p><h2>{view === "overview" ? "الحالات المسندة" : meta.title}</h2><p>ابحث ثم افتح الحالة لتسجيل الإجراء أو المتابعة.</p></div>
          <span className="mock-tag">بيانات تجريبية</span>
        </div>

        <div className="association-filter-bar association-filter-bar--simple">
          <label className="association-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المستفيد أو رقم الطلب" /></label>
          <label><FileText size={15} /><select value={stage} onChange={(event) => setStage(event.target.value)}><option value="الكل">كل المراحل</option>{Array.from(new Set(associationCases.map((item) => item.stage))).map((value) => <option key={value}>{value}</option>)}</select></label>
          {(query || stage !== "الكل") && <button className="filter-reset" onClick={() => { setQuery(""); setStage("الكل"); }}>مسح التصفية</button>}
        </div>

        <div className="association-case-list">
          {filtered.length
            ? filtered.map((item) => <CaseRow item={item} key={item.id} />)
            : <div className="association-empty"><Search size={27} /><strong>لا توجد حالات بهذه التصفية</strong><p>جرّب مسح البحث أو تغيير المرحلة.</p></div>}
        </div>
      </section>
    </AppShell>
  );
}
