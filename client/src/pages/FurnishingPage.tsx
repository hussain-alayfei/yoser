import { Armchair, ArrowLeft, BadgePercent, BedDouble, CheckCircle2, PackageCheck, Refrigerator, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getApplicationCreated } from "@/journeyExperience";
import "./furnishing.css";

type FurnishingCategory = "الكل" | "مجلس وصالة" | "غرف نوم" | "أجهزة منزلية" | "باقة متكاملة";

type FurnishingOffer = {
  id: string;
  category: Exclude<FurnishingCategory, "الكل">;
  provider: string;
  title: string;
  summary: string;
  items: string[];
  price: number;
  oldPrice: number;
  discount: number;
  icon: typeof Armchair;
};

const categories: FurnishingCategory[] = ["الكل", "مجلس وصالة", "غرف نوم", "أجهزة منزلية", "باقة متكاملة"];

const offers: FurnishingOffer[] = [
  {
    id: "living-basic",
    category: "مجلس وصالة",
    provider: "دار المسكن",
    title: "باقة الصالة الأساسية",
    summary: "تأثيث عملي للصالة مع توصيل وتركيب داخل الوحدة.",
    items: ["كنبة 4 مقاعد", "طاولة وسط", "سجادة 2×3 م"],
    price: 5890,
    oldPrice: 8180,
    discount: 28,
    icon: Armchair,
  },
  {
    id: "bedroom-ready",
    category: "غرف نوم",
    provider: "غرفة اليوم",
    title: "غرفة النوم الجاهزة",
    summary: "غرفة نوم متكاملة مناسبة للبداية بعد استلام المسكن.",
    items: ["سرير مزدوج", "دولاب 6 أبواب", "كومدينة وتسريحة"],
    price: 6550,
    oldPrice: 9630,
    discount: 32,
    icon: BedDouble,
  },
  {
    id: "appliances",
    category: "أجهزة منزلية",
    provider: "مدى المنزل",
    title: "باقة الأجهزة الضرورية",
    summary: "الأجهزة الأساسية للانتقال إلى المسكن دون تشتيت بين عدة طلبات.",
    items: ["ثلاجة", "غسالة", "فرن كهربائي"],
    price: 5670,
    oldPrice: 7460,
    discount: 24,
    icon: Refrigerator,
  },
  {
    id: "home-start",
    category: "باقة متكاملة",
    provider: "بيت البداية",
    title: "باقة بداية البيت",
    summary: "حل مختصر لتجهيز الصالة وغرفة النوم وعدد من الاحتياجات الأساسية.",
    items: ["صالة متكاملة", "غرفة نوم", "طاولة طعام 6 كراسي"],
    price: 9620,
    oldPrice: 14800,
    discount: 35,
    icon: PackageCheck,
  },
];

function formatSar(value: number) {
  return new Intl.NumberFormat("ar-SA").format(value);
}

export function FurnishingPage() {
  const [category, setCategory] = useState<FurnishingCategory>("الكل");
  const [compare, setCompare] = useState<string[]>([]);
  const hasApplication = getApplicationCreated();

  const visibleOffers = useMemo(
    () => category === "الكل" ? offers : offers.filter((offer) => offer.category === category),
    [category],
  );

  if (!hasApplication) {
    return (
      <AppShell eyebrow="خدمة ما بعد الاستلام" title="التأثيث" subtitle="تظهر عروض التأثيث بعد اكتمال رحلتك واستلام الوحدة.">
        <section className="furnishing-locked">
          <div className="furnishing-locked-icon"><Armchair size={24} /></div>
          <div>
            <p className="eyebrow">الخدمة غير متاحة بعد</p>
            <h2>استلم وحدتك أولًا</h2>
            <p>بعد الاستلام ستظهر هنا عروض تأثيث مناسبة للوحدة مع الأسعار والخصومات وخيار طلب التواصل.</p>
          </div>
          <Link className="primary-btn" href="/application">عرض حالة الرحلة <ArrowLeft size={16} /></Link>
        </section>
      </AppShell>
    );
  }

  const toggleCompare = (id: string) => {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) {
        toast.info("يمكن مقارنة عرضين في كل مرة حتى تبقى المقارنة واضحة.");
        return current;
      }
      return [...current, id];
    });
  };

  return (
    <AppShell eyebrow="بعد استلام المسكن" title="تأثيث مسكنك" subtitle="عروض مختارة للمستفيدين بعد الاستلام، مع سعر واضح وخطوة واحدة للتواصل.">
      <section className="furnishing-status" aria-label="حالة الأهلية لخدمة التأثيث">
        <div className="furnishing-status-mark"><CheckCircle2 size={21} /></div>
        <div>
          <strong>الوحدة مستلمة · عروض التأثيث متاحة</strong>
          <p>لا تحتاج إعادة إدخال بيانات الوحدة. اختر العرض المناسب ثم اطلب التواصل.</p>
        </div>
      </section>

      <section className="furnishing-hero">
        <div className="furnishing-hero-icon"><BadgePercent size={28} /></div>
        <div className="furnishing-hero-copy">
          <p className="eyebrow">ميزة ما بعد الاستلام</p>
          <h2>خصومات تصل إلى 35% على تجهيز المسكن</h2>
          <p>عروض من شركاء تأثيث وتجهيز، مرتبة حسب نوع الاحتياج بدل عرض تفاصيل كثيرة في شاشة واحدة.</p>
          <div className="furnishing-benefits" aria-label="مزايا العروض">
            <span><ShieldCheck size={15} /> سعر العرض موضح</span>
            <span><Truck size={15} /> التوصيل والتركيب موضحان</span>
          </div>
        </div>
        <div className="furnishing-saving">
          <small>أعلى وفر متاح</small>
          <strong>5,180 ر.س</strong>
          <span>مقارنة بالسعر قبل الخصم</span>
        </div>
      </section>

      <section className="furnishing-filter-section" aria-label="تصفية عروض التأثيث">
        <div>
          <p className="eyebrow">نوع الاحتياج</p>
          <h2>اختر ما تريد تجهيزه</h2>
        </div>
        <div className="furnishing-filters" role="tablist" aria-label="فئات التأثيث">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="furnishing-results-head">
        <div>
          <span>{visibleOffers.length} عروض مناسبة</span>
          <h2>العروض المتاحة</h2>
        </div>
        {compare.length > 0 && <span className="compare-count">للمقارنة: {compare.length} من 2</span>}
      </section>

      <section className="furnishing-grid">
        {visibleOffers.map((offer) => {
          const Icon = offer.icon;
          const selected = compare.includes(offer.id);
          return (
            <article className="furnishing-card" key={offer.id}>
              <div className="furnishing-card-top">
                <div className="furnishing-card-icon"><Icon size={25} /></div>
                <span className="discount-tag">-{offer.discount}%</span>
              </div>

              <div className="furnishing-card-copy">
                <small>{offer.provider}</small>
                <h3>{offer.title}</h3>
                <p>{offer.summary}</p>
              </div>

              <ul className="furnishing-items">
                {offer.items.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}
              </ul>

              <div className="furnishing-price-row">
                <div>
                  <small>سعر العرض</small>
                  <strong>{formatSar(offer.price)} <span>ر.س</span></strong>
                </div>
                <del>{formatSar(offer.oldPrice)} ر.س</del>
              </div>

              <div className="furnishing-card-actions">
                <button
                  type="button"
                  className="primary-btn furnishing-contact-btn"
                  onClick={() => toast.success(`تم تسجيل طلب التواصل بخصوص ${offer.title}.`)}
                >
                  طلب التواصل <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`furnishing-compare-btn ${selected ? "selected" : ""}`}
                  onClick={() => toggleCompare(offer.id)}
                  aria-pressed={selected}
                >
                  {selected ? "تمت الإضافة للمقارنة" : "إضافة للمقارنة"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="furnishing-note">
        <PackageCheck size={19} />
        <div>
          <strong>ماذا يحدث بعد طلب التواصل؟</strong>
          <p>يتواصل مقدم العرض معك لتأكيد المقاسات والتوفر وموعد التركيب قبل أي التزام نهائي.</p>
        </div>
      </section>
    </AppShell>
  );
}
