import { AlertTriangle, ArrowLeft, Check, ClipboardList, Clock3, FileText, Trash2, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, toneForStatus } from "@/components/StatusBadge";
import { requirements } from "@/data";
import { getApplicationCreated } from "@/journeyExperience";

type UploadMeta = {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function loadUploadMeta(): UploadMeta | null {
  try {
    const raw = sessionStorage.getItem("yusr-requirement-upload");
    if (!raw) return null;
    return JSON.parse(raw) as UploadMeta;
  } catch {
    return null;
  }
}

function humanFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
}

export function RequirementsPageV2() {
  const hasApplication = getApplicationCreated();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMeta, setUploadedMeta] = useState<UploadMeta | null>(() => loadUploadMeta());
  const [error, setError] = useState("");

  const visibleRequirements = useMemo(() => requirements.map((requirement) => {
    if (!uploadedMeta || requirement.status === "مكتمل") return requirement;
    return {
      ...requirement,
      status: "قيد المراجعة",
      detail: `تم إرسال ${uploadedMeta.name} في هذه الجلسة، وينتظر مراجعة الجهة المختصة.`,
    };
  }), [uploadedMeta]);

  function chooseFile(file?: File) {
    setError("");
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("الملف غير مدعوم. اختر PDF أو JPG أو PNG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("حجم الملف أكبر من 5 ميجابايت.");
      return;
    }
    setSelectedFile(file);
  }

  function submitFile() {
    if (!selectedFile) {
      setError("اختر ملفًا صالحًا أولًا.");
      return;
    }
    const meta: UploadMeta = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      uploadedAt: new Date().toISOString(),
    };
    try { sessionStorage.setItem("yusr-requirement-upload", JSON.stringify(meta)); } catch { /* session persistence is optional */ }
    setUploadedMeta(meta);
    setSelectedFile(null);
    setOpen(false);
    setError("");
    toast.success("تم إرسال المستند للمراجعة في النسخة التجريبية.");
  }

  function clearUpload() {
    try { sessionStorage.removeItem("yusr-requirement-upload"); } catch { /* optional */ }
    setUploadedMeta(null);
    toast("تم حذف حالة الرفع التجريبية ويمكنك اختيار ملف جديد.");
  }

  if (!hasApplication) {
    return <AppShell journeyStep={0} hideJourneyContinuation eyebrow="متطلبات الطلب" title="لا توجد متطلبات بعد" subtitle="تظهر المتطلبات بعد تقديم طلبك وبدء مراجعته.">
      <section className="journey-empty-state">
        <div className="journey-empty-symbol"><ClipboardList size={25} /></div>
        <div><p className="eyebrow">لا يوجد طلب نشط</p><h2>ابدأ رحلتك أولًا</h2><p>أكمل بياناتك واعرف البرامج المتاحة، ثم قدّم الطلب لتظهر المتطلبات المرتبطة به.</p></div>
        <Link className="primary-btn" href="/start">بدء الرحلة <ArrowLeft size={16} /></Link>
      </section>
    </AppShell>;
  }

  return <AppShell journeyStep={3} hideJourneyContinuation={!uploadedMeta} eyebrow="جزء من مرحلة المتابعة" title="متطلبات طلبي" subtitle="اعرف المطلوب، اختر الملف، وتأكد من صيغته قبل إرساله للمراجعة.">
    <section className="unified-next-action requirement-primary-action">
      <div className="unified-next-icon">{uploadedMeta ? <Clock3 size={21} /> : <Upload size={21} />}</div>
      <div className="unified-next-copy">
        <p className="eyebrow">{uploadedMeta ? "تم الإرسال" : "مطلوب منك الآن"}</p>
        <h2>{uploadedMeta ? "إثبات السكن قيد المراجعة" : "تحديث إثبات السكن"}</h2>
        <p>{uploadedMeta ? `تم تسجيل الملف ${uploadedMeta.name}. لا يلزمك إجراء آخر الآن.` : "اختر مستندًا حديثًا لتأكيد وضعك السكني قبل استكمال التخصيص."}</p>
        <div className="unified-next-meta"><span>{uploadedMeta ? "المدة المتوقعة: يومان" : "PDF أو JPG أو PNG"}</span><span>الحد الأقصى: 5 ميجابايت</span></div>
      </div>
      {uploadedMeta
        ? <button className="secondary-btn" onClick={() => { clearUpload(); setOpen(true); }}>استبدال الملف</button>
        : <button className="primary-btn" onClick={() => setOpen(true)}>اختيار المستند <Upload size={15} /></button>}
    </section>

    <section className="requirements-card">
      <div className="requirements-head">
        <div><h2>حالة الملف</h2><p>{uploadedMeta ? "جميع المتطلبات مكتملة أو قيد المراجعة." : "متطلب واحد فقط يحتاج إجراءك."}</p></div>
        <div className="mini-progress"><span>{uploadedMeta ? "100%" : "86%"}</span><i><b style={{ width: uploadedMeta ? "100%" : "86%" }} /></i></div>
      </div>
      <div className="requirements-list">
        {visibleRequirements.map((requirement) => {
          const reviewing = requirement.status === "قيد المراجعة";
          const complete = requirement.status === "مكتمل";
          return <article className="requirement-row" key={requirement.name}>
            <div className={`requirement-check ${complete ? "success" : reviewing ? "review" : "warning"}`}>
              {complete ? <Check size={18} /> : reviewing ? <Clock3 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="requirement-body"><h3>{requirement.name}</h3><p>{requirement.detail}</p></div>
            <StatusBadge tone={reviewing ? "info" : toneForStatus(requirement.status)}>{requirement.status}</StatusBadge>
          </article>;
        })}
      </div>
    </section>

    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="upload-modal" role="dialog" aria-modal="true" aria-label="رفع إثبات السكن">
        <button className="modal-close" onClick={() => setOpen(false)} aria-label="إغلاق"><X size={20} /></button>
        <div className="modal-symbol"><Upload size={22} /></div>
        <p className="eyebrow">تحديث مستند</p>
        <h2>إثبات السكن</h2>
        <p>اختر ملفًا حقيقيًا من جهازك. سنفحص الصيغة والحجم قبل السماح بالإرسال.</p>

        <label className="drop-zone">
          <Upload size={20} />
          <strong>{selectedFile ? "اختيار ملف آخر" : "اختر ملفًا من الجهاز"}</strong>
          <span>PDF أو JPG أو PNG — حتى 5 ميجابايت</span>
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </label>

        {selectedFile && <div className="upload-file-summary">
          <FileText size={20} />
          <div><strong>{selectedFile.name}</strong><small>{humanFileSize(selectedFile.size)} · ملف صالح للإرسال</small></div>
          <button className="upload-file-remove" onClick={() => setSelectedFile(null)}><Trash2 size={14} /> حذف</button>
        </div>}

        {error && <p className="upload-validation-note" role="alert">{error}</p>}
        <p className="upload-validation-note">في النسخة الحالية يُحفظ سجل الرفع داخل جلسة المتصفح فقط؛ التخزين الدائم للملف نفسه يحتاج ربط Storage في الـbackend.</p>

        <div className="upload-modal-actions">
          <button className="primary-btn" disabled={!selectedFile} onClick={submitFile}>إرسال للمراجعة <Upload size={15} /></button>
          <button className="secondary-btn" onClick={() => setOpen(false)}>إلغاء</button>
        </div>
      </section>
    </div>}
  </AppShell>;
}
