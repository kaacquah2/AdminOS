import React, { ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { AuthProvider } from "@/contexts/auth-context"
import { DatabaseProvider } from "@/contexts/database-provider"

// Custom render function that includes providers
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DatabaseProvider>{children}</DatabaseProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from "@testing-library/react"
export { customRender as render }

