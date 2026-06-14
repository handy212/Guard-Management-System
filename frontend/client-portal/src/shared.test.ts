import {describe, expect, it} from "vitest";
import {humanize} from "@guard/shared";

describe("client portal shared imports", () => {
  it("reuses shared formatting helpers", () => {
    expect(humanize("open_incident")).toBe("Open Incident");
  });
});
