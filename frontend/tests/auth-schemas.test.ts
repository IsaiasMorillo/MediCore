import { describe, expect, it } from "vitest"

import {
  registerUserSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas/auth-schemas"

describe("auth schemas", () => {
  it("rejects patient as an internal account role", () => {
    const result = registerUserSchema.safeParse({
      confirmPassword: "ClaveSegura123",
      email: "paciente@example.com",
      fullName: "Cuenta de paciente",
      password: "ClaveSegura123",
      roles: ["Paciente"],
    })

    expect(result.success).toBe(false)
  })

  it("requires matching reset passwords and a recovery token", () => {
    const result = resetPasswordSchema.safeParse({
      confirmPassword: "OtraClave123",
      newPassword: "NuevaClave123",
      token: "",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining(["token", "confirmPassword"])
      )
    }
  })
})
