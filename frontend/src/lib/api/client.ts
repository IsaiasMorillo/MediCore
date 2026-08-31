import {
  getProblemMessage,
  parseProblemDetails,
  type ProblemDetails,
} from "@/lib/api/problem-details"

interface ApiClientConfig {
  getToken?: () => string | null
  onUnauthorized?: () => void
}

let apiClientConfig: ApiClientConfig = {}

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ProblemDetails

  constructor(status: number, problem?: ProblemDetails) {
    super(getProblemMessage(problem, status))
    this.name = "ApiError"
    this.status = status
    this.problem = problem
  }
}

export function configureApiClient(config: ApiClientConfig) {
  apiClientConfig = config
}

function getApiUrl(path: string) {
  const baseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "")

  if (!baseUrl) {
    throw new ApiError(0, {
      title: "La URL de la API no está configurada.",
    })
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

async function readResponseBody(response: Response) {
  const body = await response.text()

  if (!body) {
    return undefined
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return undefined
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = apiClientConfig.getToken?.()

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let response: Response

  try {
    response = await fetch(getApiUrl(path), {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError(0)
  }

  const payload = await readResponseBody(response)

  if (!response.ok) {
    const problem = parseProblemDetails(payload)

    if (response.status === 401) {
      apiClientConfig.onUnauthorized?.()
    }

    throw new ApiError(response.status, problem)
  }

  return payload as T
}
