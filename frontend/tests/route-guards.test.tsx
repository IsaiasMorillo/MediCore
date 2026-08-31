import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"

import { RequireInternalAccess } from "@/app/route-guards"
import {
  LoginRequiredPage,
  PatientPortalPendingPage,
} from "@/components/feedback/feedback-states"
import { InternalAppShell } from "@/components/layout/internal-app-shell"
import { AuthSessionProvider } from "@/lib/auth/auth-session-provider"
import {
  SESSION_STORAGE_KEY,
  type AuthSession,
} from "@/lib/auth/session"

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
})

const internalSession: AuthSession = {
  token: "test-token",
  expiresAt: "2099-01-01T00:00:00.000Z",
  user: {
    userId: "user-1",
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    roles: ["Medico"],
  },
}

const patientSession: AuthSession = {
  ...internalSession,
  user: {
    ...internalSession.user,
    roles: ["Paciente"],
  },
}

function renderProtectedRoute(initialSession?: AuthSession) {
  if (initialSession) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(initialSession))
  }

  return render(
    <AuthSessionProvider>
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<RequireInternalAccess />} path="/app">
            <Route element={<p>Contenido interno</p>} index />
          </Route>
          <Route element={<LoginRequiredPage />} path="/login" />
          <Route element={<PatientPortalPendingPage />} path="/portal" />
          <Route element={<InternalAppShell />} path="/internal-fallback" />
        </Routes>
      </MemoryRouter>
    </AuthSessionProvider>
  )
}

describe("route guards", () => {
  it("redirects an anonymous visitor to login", () => {
    renderProtectedRoute()

    expect(screen.getByRole("heading", { name: "Inicio de sesión pendiente" })).toBeInTheDocument()
  })

  it("keeps patient accounts out of the internal shell", () => {
    renderProtectedRoute(patientSession)

    expect(screen.getByRole("heading", { name: "Portal en preparación" })).toBeInTheDocument()
    expect(screen.queryByText("Contenido interno")).not.toBeInTheDocument()
  })

  it("allows an internal role to render the protected outlet", () => {
    renderProtectedRoute(internalSession)

    expect(screen.getByText("Contenido interno")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument()
  })
})
