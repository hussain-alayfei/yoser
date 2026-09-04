import { describe, expect, it } from "vitest";
import { constructionFloors } from "../client/src/constructionData";

describe("construction digital twin", () => {
  it("shows the first floor as complete and the second floor in progress", () => {
    const firstFloor = constructionFloors.find((floor) => floor.key === "first");
    const secondFloor = constructionFloors.find((floor) => floor.key === "second");

    expect(firstFloor).toMatchObject({ status: "مكتمل", progress: 100 });
    expect(secondFloor).toMatchObject({ status: "قيد البناء", progress: 46 });
    expect(secondFloor?.active.length).toBeGreaterThan(0);
  });

  it("keeps every construction progress value within a valid percentage range", () => {
    expect(constructionFloors.every((floor) => floor.progress >= 0 && floor.progress <= 100)).toBe(true);
  });
});
