import { describe, it, expect } from "vitest"
import { render, screen } from "./utils/test-utils"

describe("Example Test", () => {
  it("renders correctly", () => {
    render(<div>Hello World</div>)
    expect(screen.getByText("Hello World")).toBeInTheDocument()
  })
})

