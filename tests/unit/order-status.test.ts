import { describe, expect, it } from "vitest";
import { canTransition, nextStatus } from "@/lib/order-status";

describe("order status flow", () => {
  it("walks the delivery flow", () => {
    expect(nextStatus("DELIVERY", "PENDING")).toBe("CONFIRMED");
    expect(nextStatus("DELIVERY", "PREPARING")).toBe("OUT_FOR_DELIVERY");
    expect(nextStatus("DELIVERY", "DELIVERED")).toBeNull();
  });

  it("walks the takeaway flow", () => {
    expect(nextStatus("TAKEAWAY", "PREPARING")).toBe("READY");
    expect(nextStatus("TAKEAWAY", "READY")).toBe("COMPLETED");
  });

  it("only moves forward", () => {
    expect(canTransition("DELIVERY", "PREPARING", "CONFIRMED")).toBe(false);
    expect(canTransition("DELIVERY", "PENDING", "PREPARING")).toBe(true);
  });

  it("rejects statuses from the other flow", () => {
    expect(canTransition("DELIVERY", "PREPARING", "READY")).toBe(false);
    expect(canTransition("TAKEAWAY", "PREPARING", "OUT_FOR_DELIVERY")).toBe(false);
  });

  it("allows cancel from open states only", () => {
    expect(canTransition("DELIVERY", "PREPARING", "CANCELLED")).toBe(true);
    expect(canTransition("DELIVERY", "DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("TAKEAWAY", "CANCELLED", "PENDING")).toBe(false);
  });
});
