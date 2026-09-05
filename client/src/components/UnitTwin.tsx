import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Droplets,
  Fan,
  Hammer,
  Home,
  Info,
  Paintbrush,
  PlugZap,
  Sofa,
  UtensilsCrossed,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link } from "wouter";
import { unitComponents } from "@/data";
import { constructionFloors } from "@/constructionData";
import type { RoomId, SystemKey } from "./ResidentialDigitalTwin";
import { StatusBadge } from "./StatusBadge";

const ResidentialDigitalTwin = lazy(() => import("./ResidentialDigitalTwin").then((module) => ({ default: module.ResidentialDigitalTwin })));

const systemIcons = {
  electricity: PlugZap,
  plumbing: Droplets,
  air: Fan,
  finish: Paintbrush,
  doors: DoorOpen,
  facilities: Building2,
} satisfies Record<SystemKey, typeof PlugZap>;

const roomMeta: Record<RoomId, { name: string; icon: typeof Home }> = {
  living: { name: "المجلس والمعيشة", icon: Sofa },
  kitchen: { name: "المطبخ", icon: UtensilsCrossed },
  master: { name: "غرفة النوم الرئيسية", icon: BedDouble },
  bedroom: { name: "غرفة النوم", icon: BedDouble },
  bath: { name: "دورة المياه", icon: Droplets },
};

function TwinLoading() {
  return <div className="twin3d-loading" role="status" aria-live="polite"><span /><div><strong>جاري تجهيز التوأم الرقمي</strong><small>تحميل محرك العرض ثلاثي الأبعاد…</small></div></div>;
}

export function ConstructionTwin() {
  const [selectedKey, setSelectedKey] = useState("second");
  const selected = constructionFloors.find((floor) => floor.key === selectedKey) ?? constructionFloors[1];

  return (
    <section className="construction-twin twin-workspace" aria-label="التوأم الرقمي لمتابعة البناء">
      <header className="twin-workspace-header">
        <div>
          <p className="eyebrow">متابعة البناء · Digital Twin</p>
          <h2>المسكن كما يُبنى، دورًا بدور</h2>
          <p>دوّر المجسم، قرّب، اختر أي دور، أو افصل الطبقات لرؤية حالة الهيكل وما يتم تنفيذه حاليًا.</p>
        </div>
        <div className="twin-overall-progress" aria-label="نسبة الإنجاز الإجمالي 67 بالمئة">
          <span>الإنجاز الإجمالي</span>
          <strong>67%</strong>
          <i><b style={{ width: "67%" }} /></i>
          <small>آخر تحديث · 24 أغسطس 2026</small>
        </div>
      </header>

      <p className="twin-disclaimer"><Info size={15} /><span>المجسم تفاعلي ويعرض بيانات النموذج التجريبي. النسب والتواريخ ليست تقريرًا هندسيًا معتمدًا.</span></p>

      <div className="twin-workspace-grid">
        <section className="twin-viewport-panel" aria-label="منطقة عرض المجسم">
          <Suspense fallback={<TwinLoading />}>
            <ResidentialDigitalTwin mode="construction" selectedFloorKey={selectedKey} onSelectFloor={setSelectedKey} />
          </Suspense>
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
  const [selectedRoom, setSelectedRoom] = useState<RoomId>("kitchen");
  const [selectedSystem, setSelectedSystem] = useState<SystemKey>("plumbing");
  const selected = unitComponents.find((component) => component.key === selectedSystem) ?? unitComponents[1];
  const linkedTicket = selected.key === "plumbing" ? "MT-1024" : null;
  const nextStep = linkedTicket ? "متابعة إسناد البلاغ" : selected.issues === 0 ? "لا يوجد إجراء مطلوب" : "حجز فحص وقائي";

  return (
    <section className={`unit-twin twin-home-workspace ${compact ? "compact" : ""}`} aria-label="التوأم الرقمي للوحدة بعد الاستلام">
      <header className="twin-workspace-header">
        <div>
          <p className="eyebrow">بعد الاستلام · Home Digital Twin</p>
          <h2>وحدتك السكنية، غرفةً ونظامًا</h2>
          <p>تجوّل داخل الوحدة واختر الغرفة، ثم افحص الكهرباء والسباكة والتكييف والتشطيبات والأبواب والمرافق مباشرة داخل المجسم.</p>
        </div>
        <div className="twin-overall-progress" aria-label="صحة الوحدة 88 بالمئة">
          <span>صحة الوحدة</span>
          <strong>88%</strong>
          <i><b style={{ width: "88%" }} /></i>
          <small>آخر مزامنة · الآن</small>
        </div>
      </header>

      <div className="home-twin-grid">
        <section className="twin-viewport-panel">
          <Suspense fallback={<TwinLoading />}>
            <ResidentialDigitalTwin
              mode="home"
              compact={compact}
              selectedRoomId={selectedRoom}
              onSelectRoom={setSelectedRoom}
              selectedSystemKey={selectedSystem}
              onSelectSystem={setSelectedSystem}
            />
          </Suspense>
        </section>

        <aside className="home-twin-inspector" aria-live="polite">
          <div className="home-inspector-title">
            <div><p className="eyebrow">الوحدة UNT-407</p><h3>{roomMeta[selectedRoom].name}</h3></div>
            <StatusBadge tone="success">حالة جيدة</StatusBadge>
          </div>

          <div className="home-inspector-health"><span>مؤشر صحة الوحدة</span><strong>88%</strong><i><b /></i></div>

          <div className="home-room-list">
            <h4>الغرف والمساحات</h4>
            {(Object.entries(roomMeta) as Array<[RoomId, (typeof roomMeta)[RoomId]]>).map(([key, room]) => {
              const Icon = room.icon;
              return <button key={key} className={selectedRoom === key ? "active" : ""} onClick={() => setSelectedRoom(key)}><Icon size={15} /><span>{room.name}</span></button>;
            })}
          </div>

          <div className="home-system-list">
            <h4>أنظمة الوحدة</h4>
            {unitComponents.map((component) => {
              const key = component.key as SystemKey;
              const Icon = systemIcons[key];
              return <button key={component.key} className={selectedSystem === key ? "active" : ""} onClick={() => setSelectedSystem(key)}><Icon size={15} /><span>{component.name}</span><i className={component.tone} /></button>;
            })}
          </div>

          <div className="home-selected-detail">
            <div><h4>{selected.name}</h4><StatusBadge tone={selected.tone as "success" | "warning"}>{selected.status}</StatusBadge></div>
            <dl>
              <div><dt>آخر صيانة</dt><dd>{selected.lastMaintenance}</dd></div>
              <div><dt>بلاغات سابقة</dt><dd>{selected.issues}</dd></div>
              <div><dt>المساحة الحالية</dt><dd>{roomMeta[selectedRoom].name}</dd></div>
              <div><dt>الخطوة التالية</dt><dd>{nextStep}</dd></div>
            </dl>
            <Link className="component-action" href={linkedTicket ? `/unit/maintenance/${linkedTicket}` : "/unit/maintenance/new"}>{linkedTicket ? "عرض البلاغ المرتبط" : "حجز إجراء"} <ArrowLeft size={14} /></Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
