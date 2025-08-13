"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Shield, LogOut, Save, Edit } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "",
  })
  const router = useRouter()

  const departments = ["Compras", "Almacén", "Administración", "Ventas", "Contabilidad"]
  const roles = ["Empleado", "Supervisor", "Administrador"]

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setFormData({
        name: parsedUser.name,
        email: parsedUser.email,
        department: parsedUser.department || "Compras",
        role: parsedUser.role || "Empleado",
      })
    }
  }, [])

  const handleSaveProfile = () => {
    if (user) {
      const updatedUser = { ...user, ...formData }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setIsEditing(false)
      alert("Perfil actualizado exitosamente")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">No hay usuario autenticado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu perfil y configuración del sistema</p>
      </div>

      {/* Perfil del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil del Usuario
          </CardTitle>
          <CardDescription>Información personal y datos del empleado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user.name}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{user.role}</Badge>
                <Badge variant="secondary">{user.department}</Badge>
              </div>
            </div>
            <div className="ml-auto">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => updateFormData("department", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => updateFormData("role", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Configuración de seguridad y acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cambiar Contraseña</Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="Nueva contraseña" />
              <Button variant="outline">Cambiar</Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base">Información de Sesión</Label>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>Usuario ID: {user.id}</p>
                <p>Último acceso: {new Date().toLocaleString()}</p>
                <p>Sesión activa desde: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cerrar Sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Cerrar Sesión</CardTitle>
          <CardDescription>Termina tu sesión actual en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
