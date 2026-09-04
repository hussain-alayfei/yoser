import { ArrowLeft, Check, ChevronLeft, Circle } from "lucide-react";
import { Link } from "wouter";
import { getJourneyProgress, journeyStages } from "@/journeyExperience";

export function JourneyNavigator({ currentStep }: { currentStep: number }) {
  const safeStep = Math.max(0, Math.min(currentStep, journeyStages.length - 1));
  const current = journeyStages[safeStep];
  return <section className="journey-navigator" aria-label="مراحل رحلتك السكنية">
    <div className="journey-navigator-head">
      <div><span className="journey-kicker">رحلتك السكنية</span><strong>{current.label}</strong><small>المرحلة {safeStep + 1} من {journeyStages.length} · {current.description}</small></div>
      <div className="journey-progress-compact"><span>{getJourneyProgress(safeStep)}%</span><i><b style={{ width: `${getJourneyProgress(safeStep)}%` }} /></i></div>
    </div>
    <ol className="journey-stage-list">
      {journeyStages.map((stage, index) => {
        const state = index < safeStep ? "done" : index === safeStep ? "current" : "next";
        const content = <><span className="journey-stage-node">{state === "done" ? <Check size={13} /> : state === "current" ? <Circle size={11} fill="currentColor" /> : index + 1}</span><span className="journey-stage-copy"><strong>{stage.shortLabel}</strong><small>{state === "done" ? "مكتمل" : state === "current" ? "أنت هنا" : "قادم"}</small></span></>;
        return <li key={stage.key} className={state} aria-current={state === "current" ? "step" : undefined}>{index <= safeStep ? <Link href={stage.href}>{content}</Link> : <span>{content}</span>}{index < journeyStages.length - 1 && <i className="journey-stage-connector" />}</li>;
      })}
    </ol>
  </section>;
}

export function JourneyContinuation({ currentStep }: { currentStep: number }) {
  const previous = currentStep > 0 ? journeyStages[currentStep - 1] : null;
  const next = currentStep < journeyStages.length - 1 ? journeyStages[currentStep + 1] : null;
  if (!previous && !next) return null;
  return <nav className="journey-continuation" aria-label="الانتقال بين مراحل الرحلة">
    {previous ? <Link className="journey-back-link" href={previous.href}><ChevronLeft size={16} /><span><small>المرحلة السابقة</small><strong>{previous.label}</strong></span></Link> : <span />}
    {next && <Link className="journey-next-link" href={next.href}><span><small>التالي في رحلتك</small><strong>{next.label}</strong></span><ArrowLeft size={18} /></Link>}
  </nav>;
}
