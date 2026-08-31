import { describe, expect, it } from "vitest"

import {
  isSessionExpired,
  readStoredSession,
  sessionFromLoginResponse,
  SESSION_STORAGE_KEY,
} from "@/lib/auth/session"

describe("auth session", () => {
  it("maps the backend login response without inventing a refresh token", () => {
    const session = sessionFromLoginResponse({
      token: "token-for-test",
      expiresAt: "2099-01-01T00:00:00.000Z",
      user: {
        userId: "user-1",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        roles: ["Medico", "UnknownRole"],
      },
    })

    expect(session).toEqual({
      token: "token-for-test",
      expiresAt: "2099-01-01T00:00:00.000Z",
      user: {
        userId: "user-1",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        roles: ["Medico"],
      },
    })
  })

  it("removes expired sessions from storage", () => {
    const storage = window.sessionStorage
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: "expired",
        expiresAt: "2020-01-01T00:00:00.000Z",
        user: {
          userId: "user-1",
          fullName: "Ada Lovelace",
          email: "ada@example.com",
          roles: ["Medico"],
        },
      })
    )

    expect(readStoredSession(storage)).toBeNull()
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(isSessionExpired({ expiresAt: "2020-01-01T00:00:00.000Z" })).toBe(true)
  })
})
