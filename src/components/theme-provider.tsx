"use client"

import * as React from "react"
type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: unknown;
};

// This is a simplified version of next-themes's provider logic.
// In a real app, you would `npm install next-themes` and `import { ThemeProvider } from "next-themes"`.
// We are re-creating it here to avoid modifying package.json as per instructions.

const ThemeContext = React.createContext<
  | {
      theme: string
      setTheme: (theme: string) => void
    }
  | undefined
>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState(
    () =>
      (typeof window !== "undefined" && localStorage.getItem(storageKey)) ||
      defaultTheme
  )

  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    let systemTheme = defaultTheme
    if (defaultTheme === "system") {
      systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    const currentTheme = theme === "system" ? systemTheme : theme
    root.classList.add(currentTheme)
  }, [theme, defaultTheme])

  const value = {
    theme,
    setTheme: (theme: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme)
      }
      setTheme(theme)
    },
  }

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
