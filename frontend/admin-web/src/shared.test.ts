import {describe, expect, it} from "vitest";
import {buildPaginationSummary, extractApiErrorMessage, humanize} from "@guard/shared";

describe("@guard/shared helpers", () => {
  it("humanizes snake_case values", () => {
    expect(humanize("client_service")).toBe("Client Service");
  });

  it("builds pagination summary text", () => {
    expect(buildPaginationSummary(2, 25, 60)).toBe("26-50 of 60");
    expect(buildPaginationSummary(1, 25, 0)).toBe("No records");
  });

  it("extracts API error messages from DRF payloads", () => {
    expect(extractApiErrorMessage(400, {name: ["This field is required."]})).toBe("This field is required.");
  });
});
