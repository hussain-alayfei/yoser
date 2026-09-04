/** أسلوب خريطة الاستقرار: بطاقات متفاوتة الإيقاع، بإشارة اتجاه ومعلومة واحدة رئيسة لكل بطاقة. */
import { ArrowUpLeft } from "lucide-react";
import { ReactNode } from "react";

export function MetricCard({ label, value, detail, icon, tone = "mint", onClick }: { label: string; value: ReactNode; detail?: string; icon: ReactNode; tone?: "mint" | "orange" | "stone" | "green"; onClick?: () => void }) {
  const content = <><div className="metric-icon">{icon}</div><p>{label}</p><strong>{value}</strong>{detail && <span className="metric-detail"><ArrowUpLeft size={14} />{detail}</span>}</>;
  return onClick ? <button type="button" className={`metric-card metric-button ${tone}`} onClick={onClick}>{content}</button> : <article className={`metric-card ${tone}`}>{content}</article>;
}
