import { describe, expect, it } from "vitest";
import { createMidtransProvider, mapMidtransStatus, midtransSignature, parseGrossAmount } from "@/lib/payment/midtrans";

const KEY = "SB-Mid-server-TESTKEY";
const provider = createMidtransProvider({ serverKey: KEY, isProduction: false });

function notification(overrides: Record<string, string> = {}) {
  const body: Record<string, string> = {
    order_id: "BDU-260930-ABCDEF-1",
    status_code: "200",
    gross_amount: "150000.00",
    transaction_status: "settlement",
    fraud_status: "accept",
    payment_type: "bank_transfer",
    transaction_id: "tx-1",
    ...overrides,
  };
  body.signature_key ??= midtransSignature(body.order_id!, body.status_code!, body.gross_amount!, KEY);
  return body;
}
const verify = (body: unknown) => provider.verifyNotification({ body, rawBody: JSON.stringify(body), headers: new Headers() });

describe("mapMidtransStatus", () => {
  it.each([
    ["settlement", "accept", "PAID"],
    ["capture", "accept", "PAID"],
    ["capture", "challenge", "PENDING"],
    ["capture", "deny", "FAILED"],
    ["pending", undefined, "PENDING"],
    ["deny", undefined, "FAILED"],
    ["cancel", undefined, "CANCELLED"],
    ["expire", undefined, "EXPIRED"],
    ["refund", undefined, "IGNORED"],
  ])("%s + %s → %s", (status, fraud, expected) => {
    expect(mapMidtransStatus(status, fraud)).toBe(expected);
  });
});

describe("parseGrossAmount", () => {
  it.each([
    ["150000.00", BigInt(150000)],
    ["2500000000.00", BigInt(2500000000)],
    [150000, BigInt(150000)],
    ["150000.50", null],
    ["-1", null],
    [undefined, null],
  ])("%s → %s", (input, expected) => {
    expect(parseGrossAmount(input)).toBe(expected);
  });
});

describe("verifikasi notifikasi (signature)", () => {
  it("menerima notifikasi bertanda tangan valid", () => {
    expect(verify(notification())).toMatchObject({ reference: "BDU-260930-ABCDEF-1", status: "PAID", amount: BigInt(150000) });
  });
  it("tidak menyimpan signature di payload log", () => {
    expect(verify(notification())!.raw).not.toHaveProperty("signature_key");
  });
  it("menolak signature dari kunci lain", () => {
    const body = notification();
    body.signature_key = midtransSignature(body.order_id!, body.status_code!, body.gross_amount!, "KUNCI-LAIN");
    expect(verify(body)).toBeNull();
  });
  it("menolak nominal yang diubah setelah ditandatangani", () => {
    expect(verify({ ...notification(), gross_amount: "1.00" })).toBeNull();
  });
  it("menolak body kosong / tanpa signature", () => {
    expect(verify(null)).toBeNull();
    expect(verify({ order_id: "x" })).toBeNull();
  });
});
