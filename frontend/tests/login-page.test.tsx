import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { login } from "@/features/auth/api/auth-api"
import { LoginPage } from "@/features/auth/pages/login-page"
import { AuthSessionProvider } from "@/lib/auth/auth-session-provider"
import { SESSION_STORAGE_KEY } from "@/lib/auth/session"
import { ApiError } from "@/lib/api/client"

vi.mock("@/features/auth/api/auth-api", () => ({
  login: vi.fn(),
}))

const loginMock = vi.mocked(login)

afterEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
})

function renderLogin(initialPath = "/login") {
  return render(
    <AuthSessionProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<p>Área interna</p>} path="/app" />
          <Route element={<p>Portal del paciente</p>} path="/portal" />
        </Routes>
      </MemoryRouter>
    </AuthSessionProvider>
  )
}

describe("LoginPage", () => {
  it("persists the returned session and lands internal users in the app", async () => {
    loginMock.mockResolvedValue({
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "internal-token",
      user: {
        email: "medico@example.com",
        fullName: "Dra. Ada Lovelace",
        roles: ["Medico"],
        userId: "user-1",
      },
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Correo electrónico"), "medico@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura123")
    await user.click(screen.getByRole("button", { name: "Entrar a MediCore" }))

    await waitFor(() => expect(screen.getByText("Área interna")).toBeInTheDocument())
    expect(JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "null")).toMatchObject({
      token: "internal-token",
      user: { userId: "user-1", roles: ["Medico"] },
    })
    expect(loginMock).toHaveBeenCalledWith({
      email: "medico@example.com",
      password: "ClaveSegura123",
    })
  })

  it("lands patient users in the patient portal", async () => {
    loginMock.mockResolvedValue({
      expiresAt: "2099-01-01T00:00:00.000Z",
      token: "patient-token",
      user: {
        email: "patient@example.com",
        fullName: "Ada Patient",
        roles: ["Paciente"],
        userId: "patient-user",
      },
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Correo electrónico"), "patient@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura123")
    await user.click(screen.getByRole("button", { name: "Entrar a MediCore" }))

    await waitFor(() => expect(screen.getByText("Portal del paciente")).toBeInTheDocument())
  })

  it("shows a neutral invalid-credentials message", async () => {
    loginMock.mockRejectedValue(new ApiError(401, { detail: "Credenciales inválidas." }))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Correo electrónico"), "nobody@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "Incorrecta123")
    await user.click(screen.getByRole("button", { name: "Entrar a MediCore" }))

    expect(
      await screen.findByText("El correo o la contraseña no son correctos.")
    ).toBeInTheDocument()
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})
