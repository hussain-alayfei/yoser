/**
 * الميزة ٢ — اكتشاف الطلبات المتوقفة.
 *
 * المستخدم عدّد خمس إشارات. ثلاث منها كانت تعمل، واثنتان — تكرار تحويل الحالة
 * وتكرار تواصل المستفيد — كانتا مكتوبتين في الشيفرة لكن مستحيلتَي التحقّق:
 * كانتا تُشتقّان بمطابقة نصية على عناوين السجل، ولا يوجد في السجل كلّه عنوان
 * واحد يحتوي «تحويل» أو «تواصل»، فبقيت القيمتان صفرًا دائمًا.
 *
 * هذه الاختبارات تحرس الحالتين: أن البيانات قادرة على إطلاق كل إشارة،
 * وأن كل إشارة تُطلق فعلًا على حالة واحدة على الأقل.
 */
import { describe, expect, it } from "vitest";
import { associationCases, associationDemoThresholds as T } from "../client/src/data";

/** نفس منطق الإشارات المستخدم في اللوحة وفي الخادم. */
function signalsFor(item: (typeof associationCases)[number]): string[] {
  const signals: string[] = [];
  if (item.requirement !== "مكتمل") signals.push("متطلب غير مكتمل");
  if (item.daysInStage > T.maxStageDays) signals.push("تجاوز مدة المرحلة");
  if (item.daysSinceUpdate > T.maxDaysWithoutUpdate) signals.push("لا يوجد تحديث");
  if (item.requirement === "مكتمل" && item.daysSinceUpdate > T.maxDaysWithoutUpdate) signals.push("مكتمل ولم يتحرك");
  if (item.reassignments > 1) signals.push("تحويل متكرر");
  if (item.beneficiaryContacts > 1) signals.push("تواصل متكرر");
  return signals;
}

describe("إشارات الطلبات المتوقفة", () => {
  it("تحمل كل حالة العدّادين صراحةً بدل اشتقاقهما من نص السجل", () => {
    for (const item of associationCases) {
      expect(typeof item.reassignments, `${item.id} reassignments`).toBe("number");
      expect(typeof item.beneficiaryContacts, `${item.id} beneficiaryContacts`).toBe("number");
    }
  });

  it("كل إشارة من الخمس تُطلق على حالة واحدة على الأقل", () => {
    const fired = new Set(associationCases.flatMap(signalsFor));
    // الإشارات الثلاث التي كانت تعمل أصلًا
    expect(fired).toContain("متطلب غير مكتمل");
    expect(fired).toContain("تجاوز مدة المرحلة");
    expect(fired).toContain("لا يوجد تحديث");
    // الإشارتان اللتان كانتا شيفرة ميتة — هذا هو الحارس الفعلي
    expect(fired, "لا توجد حالة تُطلق إشارة التحويل المتكرر").toContain("تحويل متكرر");
    expect(fired, "لا توجد حالة تُطلق إشارة التواصل المتكرر").toContain("تواصل متكرر");
  });

  it("تبقى الحالات السليمة بلا إشارات فلا تُعرض كمتوقفة", () => {
    const healthy = associationCases.filter((item) => signalsFor(item).length === 0);
    expect(healthy.length).toBeGreaterThan(0);
  });
});
