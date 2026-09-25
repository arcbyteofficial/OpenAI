import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Enabling the Cloudflare Quick Tunnel from a remote browser showed "[object Object]": the
// endpoint page did `new Error(data?.error || …)`, but the auth layer rejects LOCAL_ONLY
// routes (POST /api/tunnels/cloudflared spawns cloudflared) with
// `{ error: { code, message, correlation_id } }`, so the Error got the object itself.

const { getErrorMessage } = await import("../../src/shared/utils/api.ts");

const root = path.resolve(import.meta.dirname, "../..");
const pageSrc = fs.readFileSync(
  path.join(root, "src/app/(dashboard)/dashboard/endpoint/EndpointPageClient.tsx"),
  "utf8"
);

test("the auth layer's LOCAL_ONLY rejection yields its message, not an object", () => {
  const body = {
    error: {
      code: "LOCAL_ONLY",
      message: "This endpoint requires localhost access",
      correlation_id: "req-1",
    },
  };
  assert.equal(getErrorMessage(body, undefined, ""), "This endpoint requires localhost access");
  // The tunnel routes' own `{ error: "…" }` bodies still come through unchanged.
  assert.equal(getErrorMessage({ error: "Tunnel failed" }, undefined, ""), "Tunnel failed");
  // No error text: the empty fallback lets the page's translated fallback take over.
  assert.equal(getErrorMessage({}, undefined, ""), "");
});

test("the endpoint page never hands a raw response `error` field to the UI", () => {
  assert.doesNotMatch(pageSrc, /\bdata\??\.error\s*\|\|/, "use errorOf(data) instead");
  assert.match(
    pageSrc,
    /const errorOf = \(data: unknown\) => getErrorMessage\(data, undefined, ""\)/
  );
  // Every tunnel action (Cloudflare, Tailscale, ngrok) and the cloud toggles go through it.
  assert.ok((pageSrc.match(/errorOf\((?:next\.)?data\) \|\|/g) ?? []).length >= 12);
});
