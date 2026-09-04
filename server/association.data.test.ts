import { describe, expect, it } from "vitest";
import { associationCases } from "../client/src/data";

describe("association workspace demo data", () => {
  it("includes the assigned association queue and the requested Ahmed case", () => {
    expect(associationCases.length).toBeGreaterThan(0);
    const ahmed = associationCases.find((item) => item.id === "SKN-2841");
    expect(ahmed).toMatchObject({
      name: "أحمد محمد",
      stage: "التخصيص",
      status: "تحتاج تدخل",
      owner: "الجمعية",
      alert: "لم يحدث تحديث على الطلب منذ 12 يومًا",
    });
  });

  it("keeps priority operational and never uses allocation-worth labels", () => {
    expect(associationCases.every((item) => ["عادية", "تحتاج متابعة", "تحتاج تدخل"].includes(item.priority))).toBe(true);
    expect(associationCases.every((item) => !item.priority.includes("حرج"))).toBe(true);
  });
});
