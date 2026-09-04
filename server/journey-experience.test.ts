import { describe, expect, it } from "vitest";
import { getJourneyAction, getJourneyProgress, getJourneyStep, journeyStages } from "../client/src/journeyExperience";

describe("connected beneficiary journey", () => {
  it("keeps the journey in a clear seven-stage order", () => {
    expect(journeyStages.map((stage) => stage.key)).toEqual([
      "profile",
      "matching",
      "apply",
      "tracking",
      "construction",
      "handover",
      "settlement",
    ]);
  });

  it("moves the application page from submission to tracking after creation", () => {
    expect(getJourneyStep("/application", false)).toBe(2);
    expect(getJourneyStep("/application", true)).toBe(3);
  });

  it("maps construction and maintenance to their connected stages", () => {
    expect(getJourneyStep("/unit", true)).toBe(4);
    expect(getJourneyStep("/unit/maintenance", true)).toBe(6);
  });

  it("calculates bounded progress across all stages", () => {
    expect(getJourneyProgress(0)).toBe(14);
    expect(getJourneyProgress(3)).toBe(57);
    expect(getJourneyProgress(6)).toBe(100);
    expect(getJourneyProgress(99)).toBe(100);
  });

  it("requires profile data before program selection", () => {
    expect(getJourneyAction({ hasProfile: false, selectedProgram: false, hasApplication: false }).key).toBe("complete_profile");
    expect(getJourneyAction({ hasProfile: true, selectedProgram: false, hasApplication: false }).key).toBe("choose_program");
  });

  it("moves from program selection to submission without skipping", () => {
    expect(getJourneyAction({ hasProfile: true, selectedProgram: true, hasApplication: false })).toMatchObject({ key: "submit_application", href: "/application" });
  });

  it("changes the required action after the application and requirement upload", () => {
    expect(getJourneyAction({ hasProfile: true, selectedProgram: true, hasApplication: true, requirementUploaded: false }).key).toBe("upload_requirement");
    expect(getJourneyAction({ hasProfile: true, selectedProgram: true, hasApplication: true, requirementUploaded: true }).key).toBe("await_review");
  });

  it("returns contextual next actions for construction and maintenance", () => {
    expect(getJourneyAction({ hasProfile: true, selectedProgram: true, hasApplication: true, context: "unit", handover: false }).key).toBe("construction_update");
    expect(getJourneyAction({ hasProfile: true, selectedProgram: true, hasApplication: true, context: "unit", handover: true }).key).toBe("care_schedule");
    expect(getJourneyAction({ hasProfile: true, selectedProgram: true, hasApplication: true, context: "maintenance" }).key).toBe("track_ticket");
  });
});
