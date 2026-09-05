import { ArrowLeft, Check, ChevronLeft, Circle, Compass } from "lucide-react";
import { Link } from "wouter";

/**
 * Five user-facing milestones. Operational sub-stages stay inside the status
 * pages; this bar exists only to answer: where am I in the overall journey?
 */
const majorStages = [
  { key: "profile", label: "بياناتك", description: "فهم احتياجك السكني", href: "/start" },
  { key: "programs", label: "البرامج", description: "مراجعة الخيارات المناسبة", href: "/programs", assisted: true },
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

  return (
    <section className="journey-navigator" aria-label="مسار رحلتك السكنية">
      <div className="journey-navigator-head">
        <div className="journey-current-copy">
          <span className="journey-step-count">الخطوة {safeStep + 1} من {majorStages.length}</span>
          <div>
            <strong>{current.label}</strong>
            <small>{current.description}</small>
          </div>
        </div>
      </div>

      <ol className="journey-stage-list">
        {majorStages.map((stage, index) => {
          const state = index < safeStep ? "done" : index === safeStep ? "current" : "next";
          const content = (
            <>
              <span className="journey-stage-node">
                {state === "done" ? <Check size={13} /> : state === "current" ? <Circle size={9} fill="currentColor" /> : index + 1}
              </span>
              <span className="journey-stage-copy">
                <strong>
                  {stage.label}
                  {"assisted" in stage && stage.assisted && (
                    <span className="journey-ai-mark" title="يظهر مساعد يسر هنا لترتيب وشرح الخيارات" aria-label="يتضمن مساعدة من مساعد يسر">
                      <Compass size={9} />
                    </span>
                  )}
                </strong>
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
          <span><small>السابق</small><strong>{previous.label}</strong></span>
        </Link>
      ) : <span />}
      {next && (
        <Link className="journey-next-link" href={next.href}>
          <span><small>التالي</small><strong>{next.label}</strong></span>
          <ArrowLeft size={18} />
        </Link>
      )}
    </nav>
  );
}
