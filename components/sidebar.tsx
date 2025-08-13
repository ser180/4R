"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, ShoppingCart, Package, FileText, Search, Users, BarChart3, LogOut, Recycle } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Órdenes de Compra",
    href: "/purchase-order",
    icon: ShoppingCart,
  },
  {
    name: "Almacén",
    href: "/warehouse",
    icon: Package,
  },
  {
    name: "Documentos",
    href: "/documents",
    icon: FileText,
  },
  {
    name: "Buscador",
    href: "/search",
    icon: Search,
  },
  {
    name: "Proveedores",
    href: "/suppliers",
    icon: Users,
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar-background border-r border-sidebar-border">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4 bg-primary/5">
        <Link href="/" className="flex items-center gap-3 font-bold text-lg">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Recycle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-primary">Recicladora 4R</span>
        </Link>
      </div>

      {user ? (
        <div className="border-b border-sidebar-border p-4 bg-accent/20">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-sidebar-border p-4 bg-accent/20">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">Administrador</p>
              <p className="text-xs text-muted-foreground truncate bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                Gerente
              </p>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent/50 text-sidebar-foreground hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {user && (
        <div className="border-t border-sidebar-border p-3 bg-destructive/5">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </Button>
        </div>
      )}
    </div>
  )
}
