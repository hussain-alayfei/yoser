/** رحلة سكنية مضبوطة: الخط الزمني يبقى أفقيًا وخفيفًا، وتفاصيل المرحلة الحالية تُعرض في لوحة مستقلة. */
import { Check, ChevronLeft, Circle, CircleHelp, Clock3 } from "lucide-react";
import { applicationUpdates, stages } from "@/data";
import { Link } from "wouter";
import { StatusBadge, toneForStatus } from "./StatusBadge";

export function ApplicationUpdateLog() {
  return <section className="application-log">
    <div className="section-heading">
      <div><p className="eyebrow">سجل الطلب</p><h2>كل ما حدث في رحلتك</h2></div>
      <span className="log-count">{applicationUpdates.length} تحديثات</span>
    </div>
    <div className="application-log-list">
      {applicationUpdates.map((update) => <article key={`${update.date}-${update.title}`} className={`log-entry ${update.tone}`}>
        <div className="log-dot" />
        <div><time>{update.date}</time><h3>{update.title}</h3><p>{update.body}</p></div>
      </article>)}
    </div>
  </section>;
}

export function JourneyTimeline({ expanded = false }: { expanded?: boolean }) {
  const visibleStages = expanded ? stages : stages.slice(0, 6);
  const currentStage = stages.find((stage) => stage.status === "قيد الإجراء") ?? stages[0];

  return <section className={`journey-panel strict-journey-panel ${expanded ? "expanded" : ""}`}>
    <div className="section-heading journey-panel-heading">
      <div><p className="eyebrow">رحلتك من الأهلية إلى الاستقرار</p><h2>رحلتي السكنية</h2></div>
      {!expanded && <Link className="text-link" href="/application">عرض التفاصيل <ChevronLeft size={17} /></Link>}
    </div>

    <div className="journey-track" role="list" aria-label="مراحل الطلب السكني">
      {visibleStages.map((stage, index) => {
        const complete = stage.status === "مكتمل";
        const current = stage.status === "قيد الإجراء";
        return <article className={`journey-step ${complete ? "done" : ""} ${current ? "current" : ""}`} key={stage.number} role="listitem" aria-current={current ? "step" : undefined}>
          <div className="journey-step-head">
            <div className="step-marker">{complete ? <Check size={14} /> : current ? <span /> : <Circle size={12} />}</div>
            {index < visibleStages.length - 1 && <div className="step-line" aria-hidden="true" />}
          </div>
          <div className="step-copy">
            <span className="step-number">{stage.number.toString().padStart(2, "0")}</span>
            <h3>{stage.title}</h3>
            <StatusBadge tone={toneForStatus(stage.status)}>{stage.status}</StatusBadge>
            {expanded && stage.date && <small className="step-date">{stage.date}</small>}
          </div>
        </article>;
      })}
    </div>

    <div className="journey-current-detail" aria-label={`تفاصيل المرحلة الحالية: ${currentStage.title}`}>
      <div className="journey-current-detail-head">
        <div className="journey-current-number">{currentStage.number.toString().padStart(2, "0")}</div>
        <div>
          <p className="eyebrow">المرحلة الحالية</p>
          <h3>{currentStage.title}</h3>
          <p>{currentStage.description}</p>
        </div>
        <StatusBadge tone={toneForStatus(currentStage.status)}>{currentStage.status}</StatusBadge>
      </div>

      <div className="journey-current-meta">
        <span><Clock3 size={14} /><small>المدة المتوقعة</small><strong>{currentStage.expectedDuration}</strong></span>
        <span><small>الانتقال المتوقع</small><strong>{currentStage.estimatedNextDate}</strong></span>
      </div>

      <div className="journey-current-explanation">
        <details className="stage-why">
          <summary><CircleHelp size={14} /> لماذا أنا في هذه المرحلة؟</summary>
          <p>{currentStage.why}</p>
        </details>
        {currentStage.delayReason && <div className="stage-delay"><strong>سبب الانتظار</strong><p>{currentStage.delayReason}</p></div>}
      </div>
    </div>
  </section>;
}
