import { describe, expect, it } from "vitest";
import {
  allowedTargets,
  forwardTarget,
  isLegalTransition,
  isNoOpTransition,
  isTerminal,
  JobStatus,
} from "@field-ops/contracts";
import { assertLegalTransition } from "../src/domain/lifecycle";
import { IllegalTransitionError } from "../src/errors";

describe("job lifecycle", () => {
  it("allows the happy-path sequence and cancel from each non-terminal state", () => {
    expect(allowedTargets("ASSIGNED")).toEqual(["EN_ROUTE", "CANCELED"]);
    expect(allowedTargets("EN_ROUTE")).toEqual(["ON_SITE", "CANCELED"]);
    expect(allowedTargets("ON_SITE")).toEqual(["COMPLETED", "CANCELED"]);
  });

  it("exposes the happy-path forward step separately from cancel", () => {
    expect(forwardTarget("ASSIGNED")).toBe("EN_ROUTE");
    expect(forwardTarget("ON_SITE")).toBe("COMPLETED");
    expect(forwardTarget("COMPLETED")).toBeNull();
  });

  it("treats COMPLETED and CANCELED as terminal", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELED")).toBe(true);
    expect(isTerminal("ASSIGNED")).toBe(false);
  });

  it("treats requesting the current status as a no-op rather than an illegal move", () => {
    expect(isNoOpTransition("EN_ROUTE", "EN_ROUTE")).toBe(true);
    expect(isLegalTransition("EN_ROUTE", "EN_ROUTE")).toBe(true);
    expect(() => assertLegalTransition("EN_ROUTE", "EN_ROUTE")).not.toThrow();
  });

  it("rejects skipped and backward transitions", () => {
    const illegal: Array<[JobStatus, JobStatus]> = [
      ["ASSIGNED", "ON_SITE"],
      ["ASSIGNED", "COMPLETED"],
      ["EN_ROUTE", "ASSIGNED"],
      ["EN_ROUTE", "COMPLETED"],
      ["ON_SITE", "EN_ROUTE"],
      ["COMPLETED", "ASSIGNED"],
      ["COMPLETED", "CANCELED"],
      ["CANCELED", "ASSIGNED"],
      ["CANCELED", "EN_ROUTE"],
    ];

    for (const [from, to] of illegal) {
      expect(() => assertLegalTransition(from, to)).toThrow(IllegalTransitionError);
    }
  });
});
