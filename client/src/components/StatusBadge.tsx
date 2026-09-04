/** أسلوب خريطة الاستقرار: الحالات تجمع الرمز والنص واللون لضمان وضوح الوصول. */
import { AlertCircle, CheckCircle2, Clock3, CircleDot } from "lucide-react";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "muted";

export function StatusBadge({ children, tone = "muted", icon = true }: { children: React.ReactNode; tone?: BadgeTone; icon?: boolean }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" || tone === "danger" ? AlertCircle : tone === "info" ? Clock3 : CircleDot;
  const normalized = typeof children === "string" ? children.replace("تحت المراجعة", "قيد الإجراء").replace("قيد المراجعة", "قيد الإجراء") : children;
  return <span className={`status-badge ${tone}`}>{icon && <Icon size={14} aria-hidden="true" />}{normalized}</span>;
}

export const toneForStatus = (status: string): BadgeTone => {
  if (status.includes("مكتمل") || status.includes("جيد") || status.includes("الحل") || status.includes("مرتفعة")) return "success";
  if (status.includes("يحتاج") || status.includes("إجراء")) return "warning";
  if (status.includes("توقف")) return "danger";
  if (status.includes("مراجعة") || status.includes("إسناد")) return "info";
  return "muted";
};
