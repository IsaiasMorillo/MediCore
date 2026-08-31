import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  apiRequest,
  ApiError,
  configureApiClient,
} from "@/lib/api/client"

beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "https://localhost:7170")
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  configureApiClient({})
})

describe("api client", () => {
  it("sends the configured bearer token and parses successful JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    configureApiClient({ getToken: () => "session-token" })

    await expect(apiRequest<{ ok: boolean }>("/api/health")).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://localhost:7170/api/health")
    const requestOptions = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = new Headers(requestOptions.headers)
    expect(headers.get("Accept")).toBe("application/json")
    expect(headers.get("Authorization")).toBe("Bearer session-token")
  })

  it("notifies the session layer on 401 and exposes a safe API error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Token inválido" }), {
        headers: { "Content-Type": "application/problem+json" },
        status: 401,
      })
    )
    const unauthorized = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    configureApiClient({ onUnauthorized: unauthorized })

    const request = apiRequest("/api/private")

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      message: "Token inválido",
      status: 401,
    })
    expect(unauthorized).toHaveBeenCalledOnce()
  })
})
