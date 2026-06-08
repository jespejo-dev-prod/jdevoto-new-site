"use client"

import * as React from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Forzamos el modo oscuro al inicio sin inyectar scripts externos
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }, [])

  return <>{children}</>
}
