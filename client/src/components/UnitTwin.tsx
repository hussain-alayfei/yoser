/**
 * Digital-twin surfaces. The current building renderer is intentionally CSS-based,
 * but its viewport and inspector are separated so the renderer can be replaced by
 * a React Three Fiber canvas later without redesigning the whole page.
 */
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3, DoorOpen, Fan, Grid2X2, Hammer, Info, Paintbrush, PlugZap, RotateCcw, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { unitComponents } from "@/data";
import { constructionFloors } from "@/constructionData";
import { StatusBadge } from "./StatusBadge";

const iconMap = { electricity: PlugZap, plumbing: Grid2X2, air: Fan, finish: Paintbrush, doors: DoorOpen, facilities: Building2 };

export function ConstructionTwin() {
  const [selectedKey, setSelectedKey] = useState("second");
  const [rotation, setRotation] = useState(-24);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);
  const rotationStart = useRef(0);
  const selected = constructionFloors.find((floor) => floor.key === selectedKey) ?? constructionFloors[1];

  return (
    <section className="construction-twin twin-workspace" aria-label="التوأم الرقمي لمتابعة البناء">
      <header className="twin-workspace-header">
        <div>
          <p className="eyebrow">متابعة البناء</p>
          <h2>التوأم الرقمي للمسكن</h2>
          <p>اختر دورًا من المجسم لرؤية ما اكتمل، وما يجري الآن، والخطوة القادمة.</p>
        </div>
        <div className="twin-overall-progress" aria-label="نسبة الإنجاز الإجمالي 67 بالمئة">
          <span>الإنجاز الإجمالي</span>
          <strong>67%</strong>
          <i><b style={{ width: "67%" }} /></i>
          <small>آخر تحديث · 24 أغسطس 2026</small>
        </div>
      </header>

      <p className="twin-disclaimer"><Info size={15} /><span>المجسم الحالي توضيحي. النسب والتواريخ تجريبية وليست تقريرًا هندسيًا معتمدًا.</span></p>

      <div className="twin-workspace-grid">
        <section className="twin-viewport-panel" aria-label="منطقة عرض المجسم">
          <div className="twin-viewport-toolbar">
            <div><strong>UNT-407</strong><span>المبنى السكني</span></div>
            <span className="twin-renderer-label">معاينة ثلاثية الأبعاد</span>
          </div>

          {/* Future R3F mount point: replace only the renderer inside this surface. */}
          <div className="twin-render-surface" data-renderer="css-prototype">
            <div
              className={`building-model-stage ${dragging ? "dragging" : ""}`}
              onPointerDown={(event) => {
                setDragging(true);
                dragStart.current = event.clientX;
                rotationStart.current = rotation;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (dragging) setRotation(rotationStart.current + (event.clientX - dragStart.current) * .45);
              }}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
            >
              <div className="building-ground-plane" />
              <div className="building-model" style={{ transform: `rotateX(-10deg) rotateY(${rotation}deg)` }}>
                {constructionFloors.slice().reverse().map((floor, index) => (
                  <button
                    key={floor.key}
                    className={`model-floor floor-${floor.key} ${floor.key === selectedKey ? "selected" : ""} ${floor.status === "مكتمل" ? "done" : floor.status === "قيد البناء" ? "building" : "waiting"}`}
                    style={{ bottom: `${index * 58}px` }}
                    onClick={(event) => { event.stopPropagation(); setSelectedKey(floor.key); }}
                    aria-label={`${floor.name}: ${floor.status} بنسبة ${floor.progress}%`}
                    aria-pressed={floor.key === selectedKey}
                  >
                    <span className="model-face model-front">
                      <span className="facade-shell">
                        <span className="facade-windows"><i /><i /><i /></span>
                        {floor.key !== "foundation" && floor.key !== "roof" && <span className="facade-balcony"><i /><i /><i /></span>}
                        {floor.key === "ground" && <span className="facade-entry"><i /><b /></span>}
                        {floor.key === "second" && <span className="construction-columns"><i /><i /><i /><i /></span>}
                        {floor.key === "roof" && <span className="roof-details"><i /><i /><b /></span>}
                        <span className="facade-label">{floor.name}<small>{floor.progress}%</small></span>
                      </span>
                    </span>
                    <span className="model-face model-back" />
                    <span className="model-face model-right"><span className="side-windows"><i /><i /></span></span>
                    <span className="model-face model-left"><span className="side-windows"><i /><i /></span></span>
                    <span className="model-face model-top" />
                    <span className="model-face model-bottom" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="twin-viewport-footer">
            <span className="twin-control-hint">اسحب أفقيًا لتدوير المجسم · اضغط على أي دور للتفاصيل</span>
            <div className="building-3d-controls" aria-label="التحكم في زاوية المجسم">
              <button type="button" onClick={() => setRotation((value) => value - 18)} aria-label="تدوير المبنى إلى اليمين"><RotateCw size={16} /></button>
              <button type="button" onClick={() => setRotation(-24)} aria-label="إعادة ضبط زاوية العرض"><RotateCcw size={16} /></button>
              <button type="button" onClick={() => setRotation((value) => value + 18)} aria-label="تدوير المبنى إلى اليسار"><RotateCw size={16} className="flip-icon" /></button>
            </div>
          </div>

          <div className="building-legend" aria-label="مفتاح حالات الأدوار">
            <span><i className="done" />مكتمل</span>
            <span><i className="building" />قيد البناء</span>
            <span><i className="waiting" />قادم</span>
          </div>
        </section>

        <aside className="twin-inspector floor-detail" aria-live="polite">
          <div className="floor-detail-title">
            <div><p className="eyebrow">الدور المحدد</p><h3>{selected.name}</h3></div>
            <StatusBadge tone={selected.tone as "success" | "info" | "muted"}>{selected.status}</StatusBadge>
          </div>

          <div className="floor-progress-large"><span><strong>{selected.progress}%</strong> نسبة الإنجاز</span><i><b style={{ width: `${selected.progress}%` }} /></i></div>

          <dl className="floor-dates">
            <div><dt><CalendarDays size={15} /> بداية المرحلة</dt><dd>{selected.enteredAt}</dd></div>
            <div><dt><Clock3 size={15} /> التاريخ المتوقع</dt><dd>{selected.expectedAt}</dd></div>
          </dl>

          <div className="floor-work-groups">
            <div>
              <h4>تم إنجازه</h4>
              {selected.completed.length ? selected.completed.map((item) => <span className="work-chip done" key={item}><CheckCircle2 size={14} />{item}</span>) : <span className="work-empty">لا توجد أعمال مكتملة بعد</span>}
            </div>
            <div>
              <h4>يجري الآن</h4>
              {selected.active.length ? selected.active.map((item) => <span className="work-chip active" key={item}><Hammer size={14} />{item}</span>) : <span className="work-empty">لا توجد أعمال جارية في هذا الدور</span>}
            </div>
            <div>
              <h4>الخطوة التالية</h4>
              {selected.next.map((item) => <span className="work-chip next" key={item}><ArrowLeft size={14} />{item}</span>)}
            </div>
          </div>
        </aside>
      </div>

      <div className="construction-lower-grid">
        <section className="construction-updates">
          <div className="section-heading compact-heading"><div><p className="eyebrow">سجل البناء</p><h2>آخر التحديثات</h2></div></div>
          <div className="construction-update-list">
            <article><i /><div><time>24 أغسطس 2026</time><strong>بدأ استكمال جدران الدور الثاني</strong><p>تم تحديث نسبة إنجاز الدور الثاني إلى 46%.</p></div></article>
            <article><i /><div><time>18 أغسطس 2026</time><strong>بدء أعمال الدور الثاني</strong><p>اكتملت فحوصات الدور الأول وبدأت أعمال الهيكل للدور التالي.</p></div></article>
            <article><i /><div><time>16 أغسطس 2026</time><strong>اكتمال الدور الأول</strong><p>تم اعتماد اكتمال الهيكل والجدران الخارجية للدور الأول.</p></div></article>
          </div>
        </section>

        <section className="construction-next-card">
          <div>
            <p className="eyebrow">المحطة القادمة</p>
            <h2>اكتمال هيكل الدور الثاني</h2>
            <p>المتوقع في 10 سبتمبر 2026. سنرسل تحديثًا عند انتقال المشروع إلى تمديدات الخدمات.</p>
          </div>
          <Link className="secondary-btn" href="/notifications">عرض سجل التحديثات <ArrowLeft size={15} /></Link>
        </section>
      </div>
    </section>
  );
}

export function UnitTwin({ compact = false }: { compact?: boolean }) {
  const [selectedKey, setSelectedKey] = useState("plumbing");
  const selected = unitComponents.find((component) => component.key === selectedKey) ?? unitComponents[1];
  const linkedTicket = selected.key === "plumbing" ? "MT-1024" : null;
  const nextStep = linkedTicket ? "متابعة إسناد البلاغ" : selected.issues === 0 ? "لا يوجد إجراء مطلوب" : "حجز فحص وقائي";

  return (
    <section className={`unit-twin ${compact ? "compact" : ""}`}>
      <div className="unit-visual">
        <div className="unit-id"><span>وحدتي السكنية</span><strong>UNT-407</strong></div>
        <div className="unit-health"><i /><span>حالة الوحدة</span><strong>جيدة</strong></div>
      </div>
      <div className="unit-controls">
        <div className="section-heading compact-heading"><div><p className="eyebrow">بعد الاستلام</p><h2>{compact ? "حالة وحدتي" : "مكوّنات الوحدة"}</h2></div></div>
        <div className="component-pills" aria-label="مكوّنات الوحدة">
          {unitComponents.map((component) => {
            const Icon = iconMap[component.key as keyof typeof iconMap];
            return <button key={component.key} className={`component-pill ${selectedKey === component.key ? "selected" : ""}`} onClick={() => setSelectedKey(component.key)}><Icon size={17} /><span>{component.name}</span><i className={component.tone} /></button>;
          })}
        </div>
        <div className="component-detail">
          <div><p>{selected.name}</p><StatusBadge tone={selected.tone as "success" | "warning"}>{selected.status}</StatusBadge></div>
          <dl><div><dt>آخر صيانة</dt><dd>{selected.lastMaintenance}</dd></div><div><dt>بلاغات سابقة</dt><dd>{selected.issues}</dd></div><div><dt>الخطوة التالية</dt><dd>{nextStep}</dd></div></dl>
          <Link className="component-action" href={linkedTicket ? `/unit/maintenance/${linkedTicket}` : "/unit/maintenance/new"}>{linkedTicket ? "عرض البلاغ المرتبط" : "حجز إجراء"} <ArrowLeft size={14} /></Link>
        </div>
      </div>
    </section>
  );
}
