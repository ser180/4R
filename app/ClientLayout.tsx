"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem("user")
      const isAuthPage = pathname?.startsWith("/auth")

      if (!user && !isAuthPage) {
        router.push("/auth/login")
        setIsAuthenticated(false)
      } else if (user && isAuthPage) {
        router.push("/")
        setIsAuthenticated(true)
      } else if (user) {
        setIsAuthenticated(true)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <html lang="es">
        <body className={inter.className}>
          <div className="flex h-screen items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Si no está autenticado y no está en página de auth, mostrar solo el contenido (login)
  if (!isAuthenticated && pathname?.startsWith("/auth")) {
    return (
      <html lang="es">
        <body className={inter.className}>
          <div className="min-h-screen bg-background">{children}</div>
        </body>
      </html>
    )
  }

  // Si está autenticado, mostrar layout completo con sidebar
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
