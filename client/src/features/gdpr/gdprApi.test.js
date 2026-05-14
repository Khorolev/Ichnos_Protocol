import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../config/firebase", () => ({
  auth: { currentUser: null },
}));

const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input, init) {
    const url =
      typeof input === "string" && input.startsWith("/")
        ? `http://localhost${input}`
        : input;
    super(url, init);
  }
};

import {
  gdprApi,
  useDeleteAccountMutation,
  useDownloadDataQuery,
  useLazyDownloadDataQuery,
} from "./gdprApi.js";

describe("gdprApi - deleteAccount endpoint", () => {
  let store;
  let originalFetch;

  beforeEach(() => {
    store = configureStore({
      reducer: { [gdprApi.reducerPath]: gdprApi.reducer },
      middleware: (getDefault) => getDefault().concat(gdprApi.middleware),
    });
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST to /api/gdpr/delete with { confirm: true } body", async () => {
    let interceptedUrl = null;
    let interceptedMethod = null;
    let interceptedBody = null;

    globalThis.fetch = vi.fn(async (input, init) => {
      if (input instanceof Request) {
        interceptedUrl = input.url;
        interceptedMethod = input.method;
        interceptedBody = await input.clone().text();
      } else {
        interceptedUrl = String(input);
        interceptedMethod = init?.method ?? "GET";
        interceptedBody = init?.body != null ? String(init.body) : "";
      }
      return new Response(JSON.stringify({ data: { success: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await store.dispatch(gdprApi.endpoints.deleteAccount.initiate());

    expect(interceptedUrl).toContain("/api/gdpr/delete");
    expect(interceptedMethod).toBe("POST");
    expect(JSON.parse(interceptedBody)).toEqual({ confirm: true });
  });

  it("exports expected hooks", () => {
    expect(useDeleteAccountMutation).toBeDefined();
    expect(useDownloadDataQuery).toBeDefined();
    expect(useLazyDownloadDataQuery).toBeDefined();
  });
});
