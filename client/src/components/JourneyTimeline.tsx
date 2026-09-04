/** أسلوب خريطة الاستقرار: خط رحلة متصل يقدّم المرحلة الحالية بصريًا قبل التفاصيل المساندة. */
import { Check, ChevronLeft, Circle, CircleHelp, Clock3 } from "lucide-react";
import { applicationUpdates, stages } from "@/data";
import { Link } from "wouter";
import { StatusBadge, toneForStatus } from "./StatusBadge";

export function ApplicationUpdateLog() { return <section className="application-log"><div className="section-heading"><div><p className="eyebrow">سجل الطلب</p><h2>كل ما حدث في رحلتك</h2></div><span className="log-count">{applicationUpdates.length} تحديثات</span></div><div className="application-log-list">{applicationUpdates.map((update) => <article key={`${update.date}-${update.title}`} className={`log-entry ${update.tone}`}><div className="log-dot" /><div><time>{update.date}</time><h3>{update.title}</h3><p>{update.body}</p></div></article>)}</div></section>; }

export function JourneyTimeline({ expanded = false }: { expanded?: boolean }) {
  const visibleStages = expanded ? stages : stages.slice(0, 6);
  return <section className={`journey-panel ${expanded ? "expanded" : ""}`}>
    <div className="section-heading"><div><p className="eyebrow">رحلتك من الأهلية إلى الاستقرار</p><h2>رحلتي السكنية</h2></div>{!expanded && <Link className="text-link" href="/application">عرض التفاصيل <ChevronLeft size={17} /></Link>}</div>
    <div className="journey-track" role="list" aria-label="مراحل الطلب السكني">
      {visibleStages.map((stage, index) => {
        const complete = stage.status === "مكتمل";
        const current = stage.status === "قيد الإجراء";
        return <article className={`journey-step ${complete ? "done" : ""} ${current ? "current" : ""}`} key={stage.number} role="listitem">
          <div className="step-marker">{complete ? <Check size={16} /> : current ? <span /> : <Circle size={14} />}</div>
          <div className="step-copy"><span className="step-number">{stage.number.toString().padStart(2, "0")}</span><h3>{stage.title}</h3><StatusBadge tone={toneForStatus(stage.status)}>{stage.status}</StatusBadge>{(expanded || current) && <p>{stage.description}</p>}{(expanded || current) && <div className="stage-meta"><span><Clock3 size={13} />المدة المتوقعة: {stage.expectedDuration}</span><span>الانتقال المتوقع: {stage.estimatedNextDate}</span></div>}{stage.date && expanded && <small>تاريخ الانتقال: {stage.date}</small>}{(expanded || current) && <details className="stage-why"><summary><CircleHelp size={14} />لماذا أنا في هذه المرحلة؟</summary><p>{stage.why}</p></details>}{current && stage.delayReason && <div className="stage-delay"><strong>سبب التأخير أو التعثر</strong><p>{stage.delayReason}</p></div>}</div>
          {index < visibleStages.length - 1 && <div className="step-line" />}
        </article>;
      })}
    </div>
  </section>;
}
