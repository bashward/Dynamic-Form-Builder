"use client"

import React from "react"
import { ThemeProvider } from "next-themes"

export default function ThemeContext({children, ...props}: React.ComponentProps<typeof ThemeProvider>) {
return <ThemeProvider {...props}>{children}</ThemeProvider>
}