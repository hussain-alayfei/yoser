import { ArrowLeft, Check, ChevronLeft, Circle } from "lucide-react";
import { Link } from "wouter";

/**
 * The application has seven internal operational stages, but exposing all seven
 * in the global navigation made the journey feel longer than it is and created
 * duplicate destinations (submission/tracking and construction/handover).
 *
 * This navigator intentionally shows five user-facing milestones with one
 * destination per milestone. Detailed operational stages still live inside the
 * application/status views where they belong.
 */
const majorStages = [
  { key: "profile", label: "بياناتك", description: "فهم احتياجك السكني", href: "/start" },
  { key: "programs", label: "البرامج", description: "مراجعة الخيارات المناسبة", href: "/programs" },
  { key: "application", label: "الطلب", description: "التقديم والمتابعة", href: "/application" },
  { key: "unit", label: "المسكن", description: "البناء ثم الاستلام", href: "/unit" },
  { key: "care", label: "العناية", description: "الصيانة بعد الاستلام", href: "/unit/maintenance" },
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
  const progress = Math.round(((safeStep + 1) / majorStages.length) * 100);

  return (
    <section className="journey-navigator" aria-label="مسار رحلتك السكنية">
      <div className="journey-navigator-head">
        <div>
          <span className="journey-kicker">مسار رحلتك</span>
          <strong>{current.label}</strong>
          <small>
            المرحلة {safeStep + 1} من {majorStages.length} · {current.description}
          </small>
        </div>
        <div className="journey-progress-compact" aria-label={`اكتمل ${progress}% من المسار`}>
          <span>{progress}%</span>
          <i><b style={{ width: `${progress}%` }} /></i>
        </div>
      </div>

      <ol className="journey-stage-list">
        {majorStages.map((stage, index) => {
          const state = index < safeStep ? "done" : index === safeStep ? "current" : "next";
          const content = (
            <>
              <span className="journey-stage-node">
                {state === "done" ? <Check size={13} /> : state === "current" ? <Circle size={10} fill="currentColor" /> : index + 1}
              </span>
              <span className="journey-stage-copy">
                <strong>{stage.label}</strong>
                <small>{state === "done" ? "مكتمل" : state === "current" ? "أنت هنا" : "لاحقًا"}</small>
              </span>
            </>
          );

          return (
            <li key={stage.key} className={state} aria-current={state === "current" ? "step" : undefined}>
              {index <= safeStep ? <Link href={stage.href}>{content}</Link> : <span>{content}</span>}
              {index < majorStages.length - 1 && <i className="journey-stage-connector" />}
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
    <nav className="journey-continuation" aria-label="الانتقال بين مراحل الرحلة">
      {previous ? (
        <Link className="journey-back-link" href={previous.href}>
          <ChevronLeft size={16} />
          <span><small>المرحلة السابقة</small><strong>{previous.label}</strong></span>
        </Link>
      ) : <span />}
      {next && (
        <Link className="journey-next-link" href={next.href}>
          <span><small>التالي في رحلتك</small><strong>{next.label}</strong></span>
          <ArrowLeft size={18} />
        </Link>
      )}
    </nav>
  );
}
