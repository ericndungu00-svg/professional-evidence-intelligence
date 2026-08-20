import { describe, expect, it } from "vitest";
import { requireJsonTrpcResponse } from "../client/src/lib/trpcResponse";

describe("tRPC response boundary", () => {
  it("passes JSON responses through to tRPC", async () => {
    const response = new Response('{"result":{"data":null}}', { headers: { "content-type": "application/json" } });
    await expect(requireJsonTrpcResponse(response)).resolves.toBe(response);
  });

  it("turns an HTML gateway body into an actionable error instead of a JSON parse error", async () => {
    const response = new Response("<!DOCTYPE html><html><body>Gateway timeout</body></html>", { status: 504, headers: { "content-type": "text/html" } });
    await expect(requireJsonTrpcResponse(response)).rejects.toThrow("upstream error page");
    await expect(requireJsonTrpcResponse(new Response("<!DOCTYPE html>", { status: 504, headers: { "content-type": "text/html" } }))).rejects.not.toThrow("Unexpected token");
  });
});
