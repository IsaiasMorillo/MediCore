import { GlobalErrorBoundary } from "@/components/feedback/feedback-states"
import { AppProviders } from "@/app/providers"
import { router } from "@/app/router"
import { RouterProvider } from "react-router-dom"

export function App() {
  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </GlobalErrorBoundary>
  )
}

export default App
