import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";

/**
 * The beneficiary journey is intentionally limited to five memorable stages.
 * Operational details belong inside the relevant page, not inside this tracker.
 */
const majorStages = [
  { key: "profile", label: "بياناتك", href: "/start" },
  { key: "programs", label: "البرنامج", href: "/programs" },
  { key: "application", label: "الطلب", href: "/application" },
  { key: "unit", label: "المسكن", href: "/unit" },
  { key: "care", label: "العناية", href: "/unit/maintenance" },
] as const;

function toMajorStep(currentStep: number) {
  const safe = Math.max(0, Math.min(currentStep, 6));
  if (safe <= 1) return safe;
  if (safe <= 3) return 2;
  if (safe <= 5) return 3;
  return 4;
}

export function JourneyNavigator({ currentStep }: { currentStep: number }) {
  const safeStep = toMajorStep(currentStep);
  const current = majorStages[safeStep];

  return (
    <section className="journey-navigator" aria-label="رحلتك السكنية">
      <div className="journey-navigator-head">
        <div className="journey-current-copy">
          <span className="journey-kicker">رحلتك السكنية</span>
          <strong>{current.label}</strong>
        </div>
        <span className="journey-step-count">{safeStep + 1} من {majorStages.length}</span>
      </div>

      <ol className="journey-stage-list">
        {majorStages.map((stage, index) => {
          const state = index < safeStep ? "done" : index === safeStep ? "current" : "next";
          const content = (
            <>
              <span className="journey-stage-node" aria-hidden="true">
                {state === "done" ? <Check size={13} /> : index + 1}
              </span>
              <span className="journey-stage-copy"><strong>{stage.label}</strong></span>
              <span className="sr-only">{state === "done" ? "مكتمل" : state === "current" ? "المرحلة الحالية" : "مرحلة لاحقة"}</span>
            </>
          );

          return (
            <li key={stage.key} className={state} aria-current={state === "current" ? "step" : undefined}>
              {index <= safeStep ? <Link href={stage.href}>{content}</Link> : <span>{content}</span>}
              {index < majorStages.length - 1 && <i className="journey-stage-connector" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function JourneyContinuation({ currentStep }: { currentStep: number }) {
  const safeStep = toMajorStep(currentStep);
  const previous = safeStep > 0 ? majorStages[safeStep - 1] : null;
  const next = safeStep < majorStages.length - 1 ? majorStages[safeStep + 1] : null;
  if (!previous && !next) return null;

  return (
    <nav className="journey-continuation" aria-label="السابق والتالي في الرحلة">
      {previous ? (
        <Link className="journey-back-link" href={previous.href}>
          <ArrowRight size={17} />
          <span>السابق: {previous.label}</span>
        </Link>
      ) : <span />}
      {next && (
        <Link className="journey-next-link" href={next.href}>
          <span>التالي: {next.label}</span>
          <ArrowLeft size={18} />
        </Link>
      )}
    </nav>
  );
}
