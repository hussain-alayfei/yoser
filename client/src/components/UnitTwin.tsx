/** أسلوب خريطة الاستقرار: التوأم الرقمي يحوّل تقدم البناء إلى أدوار قابلة للاستكشاف بلغة واضحة وغير هندسية. */
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, CircleHelp, Clock3, DoorOpen, Fan, Grid2X2, Hammer, Hand, Layers3, Paintbrush, PlugZap, RotateCcw, RotateCw } from "lucide-react";
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
  return <section className="construction-twin" aria-label="التوأم الرقمي لمتابعة البناء">
    <div className="construction-head">
      <div><p className="eyebrow">التوأم الرقمي للمشروع</p><h2>تابع بناء مسكنك دورًا بدور</h2><p>اضغط على أي دور لمعرفة ما اكتمل وما يجري الآن وما سيأتي بعده.</p></div>
      <div className="construction-overall"><span>الإنجاز الإجمالي</span><strong>67%</strong><i><b style={{ width: "67%" }} /></i><small>آخر تحديث: 24 أغسطس 2026</small></div>
    </div>
    <div className="construction-demo-note"><CircleHelp size={16} /><span><strong>عرض تجريبي:</strong> النسب والتواريخ تقريبية لتوضيح تجربة المتابعة، وليست تقريرًا هندسيًا معتمدًا.</span></div>
    <div className="construction-grid">
      <div className="building-twin building-twin-3d" aria-label="مجسم ثلاثي الأبعاد لأدوار المسكن">
        <div className="building-top"><Layers3 size={20} /><span>مشروع UNT-407 · نموذج ثلاثي الأبعاد</span></div>
        <div className="building-3d-instructions"><Hand size={14} /><span>اسحب لتدوير المبنى، واضغط على أي دور لعرض تفاصيله</span></div>
        <div className={`building-model-stage ${dragging ? "dragging" : ""}`} onPointerDown={(event) => { setDragging(true); dragStart.current = event.clientX; rotationStart.current = rotation; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (dragging) setRotation(rotationStart.current + (event.clientX - dragStart.current) * .45); }} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
          <div className="building-ground-plane" />
          <div className="building-model" style={{ transform: `rotateX(-10deg) rotateY(${rotation}deg)` }}>
            {constructionFloors.slice().reverse().map((floor, index) => <button key={floor.key} className={`model-floor floor-${floor.key} ${floor.key === selectedKey ? "selected" : ""} ${floor.status === "مكتمل" ? "done" : floor.status === "قيد البناء" ? "building" : "waiting"}`} style={{ bottom: `${index * 58}px` }} onClick={(event) => { event.stopPropagation(); setSelectedKey(floor.key); }} aria-label={`${floor.name}: ${floor.status} بنسبة ${floor.progress}%`} aria-pressed={floor.key === selectedKey}>
              <span className="model-face model-front"><span className="facade-shell"><span className="facade-windows"><i /><i /><i /></span>{floor.key !== "foundation" && floor.key !== "roof" && <span className="facade-balcony"><i /><i /><i /></span>}{floor.key === "ground" && <span className="facade-entry"><i /><b /></span>}{floor.key === "second" && <span className="construction-columns"><i /><i /><i /><i /></span>}{floor.key === "roof" && <span className="roof-details"><i /><i /><b /></span>}<span className="facade-label">{floor.name}<small>{floor.progress}%</small></span></span></span>
              <span className="model-face model-back" />
              <span className="model-face model-right"><span className="side-windows"><i /><i /></span></span>
              <span className="model-face model-left"><span className="side-windows"><i /><i /></span></span>
              <span className="model-face model-top" />
              <span className="model-face model-bottom" />
            </button>)}
          </div>
        </div>
        <div className="building-3d-controls"><button onClick={() => setRotation((value) => value - 18)} aria-label="تدوير المبنى إلى اليمين"><RotateCw size={16} /></button><button onClick={() => setRotation(-24)} aria-label="إعادة ضبط زاوية العرض"><RotateCcw size={16} /></button><button onClick={() => setRotation((value) => value + 18)} aria-label="تدوير المبنى إلى اليسار"><RotateCw size={16} className="flip-icon" /></button></div>
        <div className="building-legend"><span><i className="done" />مكتمل</span><span><i className="building" />قيد البناء</span><span><i className="waiting" />قادم</span></div>
      </div>
      <article className="floor-detail">
        <div className="floor-detail-title"><div><p className="eyebrow">الدور المحدد</p><h3>{selected.name}</h3></div><StatusBadge tone={selected.tone as "success" | "info" | "muted"}>{selected.status}</StatusBadge></div>
        <div className="floor-progress-large"><span><strong>{selected.progress}%</strong> نسبة الإنجاز</span><i><b style={{ width: `${selected.progress}%` }} /></i></div>
        <dl className="floor-dates"><div><dt><CalendarDays size={15} /> بداية المرحلة</dt><dd>{selected.enteredAt}</dd></div><div><dt><Clock3 size={15} /> التاريخ المتوقع</dt><dd>{selected.expectedAt}</dd></div></dl>
        <div className="floor-work-groups">
          <div><h4>تم إنجازه</h4>{selected.completed.length ? selected.completed.map((item) => <span className="work-chip done" key={item}><CheckCircle2 size={14} />{item}</span>) : <span className="work-empty">لا توجد أعمال مكتملة بعد</span>}</div>
          <div><h4>يجري الآن</h4>{selected.active.length ? selected.active.map((item) => <span className="work-chip active" key={item}><Hammer size={14} />{item}</span>) : <span className="work-empty">لا توجد أعمال جارية في هذا الدور</span>}</div>
          <div><h4>الخطوة التالية</h4>{selected.next.map((item) => <span className="work-chip next" key={item}><ArrowLeft size={14} />{item}</span>)}</div>
        </div>
      </article>
    </div>
    <div className="construction-lower-grid">
      <section className="construction-updates"><div className="section-heading compact-heading"><div><p className="eyebrow">سجل البناء</p><h2>آخر التحديثات</h2></div></div><div className="construction-update-list"><article><i /><div><time>24 أغسطس 2026</time><strong>بدأ استكمال جدران الدور الثاني</strong><p>تم تحديث نسبة إنجاز الدور الثاني إلى 46%.</p></div></article><article><i /><div><time>18 أغسطس 2026</time><strong>بدء أعمال الدور الثاني</strong><p>اكتملت فحوصات الدور الأول وبدأت أعمال الهيكل للدور التالي.</p></div></article><article><i /><div><time>16 أغسطس 2026</time><strong>اكتمال الدور الأول</strong><p>تم اعتماد اكتمال الهيكل والجدران الخارجية للدور الأول.</p></div></article></div></section>
      <section className="construction-next-card"><div className="next-symbol"><Hammer size={22} /></div><div><p className="eyebrow">ما الخطوة التالية؟</p><h2>اكتمال هيكل الدور الثاني</h2><p>المتوقع في 10 سبتمبر 2026. سنرسل لك إشعارًا عند انتقال المشروع إلى تمديدات الخدمات.</p></div><Link className="secondary-btn" href="/notifications">متابعة التحديثات <ArrowLeft size={15} /></Link></section>
    </div>
  </section>;
}

export function UnitTwin({ compact = false }: { compact?: boolean }) {
  const [selectedKey, setSelectedKey] = useState("plumbing");
  const selected = unitComponents.find((component) => component.key === selectedKey) ?? unitComponents[1];
  const linkedTicket = selected.key === "plumbing" ? "MT-1024" : null;
  const nextStep = linkedTicket ? "متابعة إسناد البلاغ" : selected.issues === 0 ? "لا يوجد إجراء مطلوب" : "حجز فحص وقائي";
  return <section className={`unit-twin ${compact ? "compact" : ""}`}>
    <div className="unit-visual" style={{ backgroundImage: "linear-gradient(90deg, rgba(245,247,246,.96), rgba(245,247,246,.33)), url('/manus-storage/sakan360-unit-twin_5abc1088.jpg')" }}>
      <div className="unit-id"><span>وحدتي السكنية</span><strong>UNT-407</strong></div>
      <div className="unit-health"><i /><span>حالة الوحدة</span><strong>جيدة</strong></div>
    </div>
    <div className="unit-controls">
      <div className="section-heading compact-heading"><div><p className="eyebrow">التوأم السكني المبسط</p><h2>{compact ? "حالة وحدتي" : "مكوّنات الوحدة"}</h2></div></div>
      <div className="component-pills" aria-label="مكوّنات الوحدة">
        {unitComponents.map((component) => { const Icon = iconMap[component.key as keyof typeof iconMap]; return <button key={component.key} className={`component-pill ${selectedKey === component.key ? "selected" : ""}`} onClick={() => setSelectedKey(component.key)}><Icon size={17} /><span>{component.name}</span><i className={component.tone} /></button>; })}
      </div>
      <div className="component-detail">
        <div><p>{selected.name}</p><StatusBadge tone={selected.tone as "success" | "warning"}>{selected.status}</StatusBadge></div>
        <dl><div><dt>آخر صيانة</dt><dd>{selected.lastMaintenance}</dd></div><div><dt>بلاغات سابقة</dt><dd>{selected.issues}</dd></div><div><dt>الخطوة التالية</dt><dd>{nextStep}</dd></div></dl><Link className="component-action" href={linkedTicket ? `/unit/maintenance/${linkedTicket}` : "/unit/maintenance/new"}>{linkedTicket ? "عرض البلاغ المرتبط" : "حجز إجراء"} <ArrowLeft size={14} /></Link>
      </div>
    </div>
  </section>;
}
