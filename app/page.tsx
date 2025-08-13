"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, FileText, Search, Users, BarChart3, Recycle, Leaf, TreePine } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-6 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <Recycle className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Panel de Control</h1>
        </div>
        <p className="text-muted-foreground flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          Gestiona el reciclaje y operaciones sustentables de manera eficiente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Órdenes Activas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">24</div>
            <p className="text-xs text-muted-foreground">+2 desde ayer</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">Material Procesado Hoy</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">2.4 Ton</div>
            <p className="text-xs text-muted-foreground">8 entradas, 4 salidas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/20 border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4" style={{ color: "hsl(var(--chart-3))" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--chart-3))" }}>
              156
            </div>
            <p className="text-xs text-muted-foreground">+12 esta semana</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-5/10 to-chart-5/20 border-chart-5/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Eco</CardTitle>
            <div className="flex items-center gap-1">
              <TreePine className="h-3 w-3" style={{ color: "hsl(var(--chart-5))" }} />
              <Users className="h-4 w-4" style={{ color: "hsl(var(--chart-5))" }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--chart-5))" }}>
              32
            </div>
            <p className="text-xs text-muted-foreground">5 nuevos este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShoppingCart className="h-5 w-5" />
              Orden de Compra
            </CardTitle>
            <CardDescription>Crear y gestionar órdenes de compra con proveedores sustentables</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/purchase-order">
              <Button className="w-full">Ir al Módulo</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <Package className="h-5 w-5 text-accent" />
              Almacén
            </CardTitle>
            <CardDescription>Registrar entradas y salidas de material reciclable</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/warehouse">
              <Button className="w-full bg-transparent" variant="outline">
                Ir al Módulo
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-chart-3/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: "hsl(var(--chart-3))" }} />
              Documentos
            </CardTitle>
            <CardDescription>Gestionar certificaciones y documentos ambientales</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/documents">
              <Button className="w-full bg-transparent" variant="outline">
                Ir al Módulo
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-chart-4/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" style={{ color: "hsl(var(--chart-4))" }} />
              Buscador
            </CardTitle>
            <CardDescription>Búsqueda avanzada de órdenes y documentos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/search">
              <Button className="w-full bg-transparent" variant="outline">
                Ir al Módulo
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-chart-5/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: "hsl(var(--chart-5))" }} />
              Reportes
            </CardTitle>
            <CardDescription>Estadísticas de impacto ambiental y operaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports">
              <Button className="w-full bg-transparent" variant="outline">
                Ir al Módulo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Orden #OC-2024-001 aprobada</p>
                <p className="text-xs text-muted-foreground">Proveedor: EcoMateriales SA - hace 2 horas</p>
              </div>
              <Recycle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/5 border border-accent/10">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Entrada de material reciclable</p>
                <p className="text-xs text-muted-foreground">Folio: ALM-2024-045 - 1.2 Ton plástico - hace 4 horas</p>
              </div>
              <Package className="h-4 w-4 text-accent" />
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-chart-3/10 border border-chart-3/20">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-3))" }}></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Certificación ambiental subida</p>
                <p className="text-xs text-muted-foreground">Documento #ENV-001234 - hace 6 horas</p>
              </div>
              <Leaf className="h-4 w-4" style={{ color: "hsl(var(--chart-3))" }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
