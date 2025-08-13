"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Save, X, Package, PackageOpen, Eye, Edit, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface WarehouseMovement {
  id: string
  folio: string
  type: "entrada" | "salida"
  purchase_order_id: string
  purchase_order?: {
    folio: string
    supplier?: {
      name: string
    }
  }
  date: Date
  kilos: number
  transporter: string
  status: string
  signature?: string
  authorized_by?: string
  received_by?: string
  observations?: string
}

interface PurchaseOrder {
  id: string
  folio: string
  supplier?: {
    name: string
  }
  total: number
}

export default function WarehousePage() {
  const [date, setDate] = useState<Date>(new Date())
  const [folio, setFolio] = useState(`ALM-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`)
  const [isEditingFolio, setIsEditingFolio] = useState(false)
  const [selectedPO, setSelectedPO] = useState("")
  const [kilos, setKilos] = useState("")
  const [transporter, setTransporter] = useState("")
  const [notes, setNotes] = useState("")
  const [hasSignature, setHasSignature] = useState(false)
  const [authorizedBy, setAuthorizedBy] = useState("")
  const [receivedBy, setReceivedBy] = useState("")
  const [selectedMovement, setSelectedMovement] = useState<WarehouseMovement | null>(null)
  const [isViewMovementOpen, setIsViewMovementOpen] = useState(false)
  const [isEditMovementOpen, setIsEditMovementOpen] = useState(false)

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const loadPurchaseOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          folio,
          total,
          supplier:suppliers(name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPurchaseOrders(data || [])
    } catch (error) {
      console.error("Error al cargar órdenes:", error)
      alert("Error al cargar las órdenes de compra")
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const loadMovements = async () => {
    try {
      setIsLoadingMovements(true)
      const { data, error } = await supabase
        .from("warehouse_movements")
        .select(`
          *,
          purchase_order:purchase_orders(
            folio,
            supplier:suppliers(name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedMovements =
        data?.map((movement) => ({
          ...movement,
          date: new Date(movement.date),
          type: movement.type as "entrada" | "salida",
        })) || []

      setMovements(formattedMovements)
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
      alert("Error al cargar los movimientos de almacén")
    } finally {
      setIsLoadingMovements(false)
    }
  }

  useEffect(() => {
    loadPurchaseOrders()
    loadMovements()
  }, [])

  const generateNewFolio = () => {
    const newFolio = `ALM-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
    setFolio(newFolio)
    setIsEditingFolio(false)
  }

  const handleFolioChange = (value: string) => {
    setFolio(value)
  }

  const handleSaveMovement = async (type: "entrada" | "salida") => {
    // Basic validation
    if (!selectedPO || !kilos || !transporter || !authorizedBy || !receivedBy) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    try {
      setIsSaving(true)

      const movementData = {
        folio,
        type,
        purchase_order_id: selectedPO,
        date: date.toISOString().split("T")[0],
        kilos: Number.parseFloat(kilos),
        transporter,
        observations: notes,
        status: "Autorizado",
        authorized_by: authorizedBy,
        received_by: receivedBy,
      }

      const { data, error } = await supabase.from("warehouse_movements").insert([movementData]).select()

      if (error) throw error

      alert(`${type === "entrada" ? "Entrada" : "Salida"} de almacén registrada exitosamente`)

      // Reset form and generate new folio
      setSelectedPO("")
      setKilos("")
      setTransporter("")
      setNotes("")
      setHasSignature(false)
      setAuthorizedBy("")
      setReceivedBy("")
      generateNewFolio()

      // Reload movements
      loadMovements()
    } catch (error) {
      console.error("Error al guardar movimiento:", error)
      alert("Error al guardar el movimiento de almacén")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-green-600">Gestión de Almacén</h1>
        <p className="text-muted-foreground">Registra entradas y salidas de almacén</p>
      </div>

      <Tabs defaultValue="entry" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Entrada de Almacén
          </TabsTrigger>
          <TabsTrigger value="exit" className="flex items-center gap-2">
            <PackageOpen className="h-4 w-4" />
            Salida de Almacén
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Formulario de Entrada */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Registro de Entrada
                  </CardTitle>
                  <CardDescription>Registra una nueva entrada de mercancía al almacén</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="folio">Número de Folio</Label>
                      <div className="flex gap-2">
                        <Input
                          id="folio"
                          value={folio}
                          onChange={(e) => handleFolioChange(e.target.value)}
                          className={isEditingFolio ? "" : "bg-muted"}
                          readOnly={!isEditingFolio}
                        />
                        <Button
                          variant="outline"
                          onClick={() => (isEditingFolio ? generateNewFolio() : setIsEditingFolio(true))}
                        >
                          {isEditingFolio ? "Generar" : "Editar"}
                        </Button>
                      </div>
                      {isEditingFolio && (
                        <p className="text-xs text-muted-foreground">
                          Puedes escribir un folio personalizado o generar uno automático
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(date, "PPP", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(date) => date && setDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchase-order">Orden de Compra</Label>
                      <Select value={selectedPO} onValueChange={setSelectedPO}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingOrders ? "Cargando órdenes..." : "Seleccionar orden"} />
                        </SelectTrigger>
                        <SelectContent>
                          {purchaseOrders.map((po) => (
                            <SelectItem key={po.id} value={po.id}>
                              {po.folio} - {po.supplier?.name} (${po.total?.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kilos">Kilos</Label>
                      <Input
                        id="kilos"
                        type="number"
                        value={kilos}
                        onChange={(e) => setKilos(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="transporter">Nombre del Transportista</Label>
                      <Input
                        id="transporter"
                        value={transporter}
                        onChange={(e) => setTransporter(e.target.value)}
                        placeholder="Nombre de la empresa transportista"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="authorized-by">Autorizó</Label>
                      <Input
                        id="authorized-by"
                        value={authorizedBy}
                        onChange={(e) => setAuthorizedBy(e.target.value)}
                        placeholder="Nombre de quien autoriza"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="received-by">Recibió</Label>
                      <Input
                        id="received-by"
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        placeholder="Nombre de quien recibe"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Observaciones</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observaciones adicionales..."
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={() => handleSaveMovement("entrada")} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Autorizar Entrada
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Información Adicional */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Folio:</span>
                      <span className="font-medium">{folio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="default">Entrada</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge variant="secondary">Borrador</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exit" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Formulario de Salida */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageOpen className="h-5 w-5" />
                    Registro de Salida
                  </CardTitle>
                  <CardDescription>Registra una nueva salida de mercancía del almacén</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="folio-exit">Número de Folio</Label>
                      <div className="flex gap-2">
                        <Input
                          id="folio-exit"
                          value={folio}
                          onChange={(e) => handleFolioChange(e.target.value)}
                          className={isEditingFolio ? "" : "bg-muted"}
                          readOnly={!isEditingFolio}
                        />
                        <Button
                          variant="outline"
                          onClick={() => (isEditingFolio ? generateNewFolio() : setIsEditingFolio(true))}
                        >
                          {isEditingFolio ? "Generar" : "Editar"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(date, "PPP", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(date) => date && setDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchase-order-exit">Orden de Compra</Label>
                      <Select value={selectedPO} onValueChange={setSelectedPO}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingOrders ? "Cargando órdenes..." : "Seleccionar orden"} />
                        </SelectTrigger>
                        <SelectContent>
                          {purchaseOrders.map((po) => (
                            <SelectItem key={po.id} value={po.id}>
                              {po.folio} - {po.supplier?.name} (${po.total?.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kilos-exit">Kilos</Label>
                      <Input
                        id="kilos-exit"
                        type="number"
                        value={kilos}
                        onChange={(e) => setKilos(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transporter-exit">Nombre del Transportista</Label>
                      <Input
                        id="transporter-exit"
                        value={transporter}
                        onChange={(e) => setTransporter(e.target.value)}
                        placeholder="Nombre de la empresa transportista"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="authorized-by-exit">Autorizó</Label>
                      <Input
                        id="authorized-by-exit"
                        value={authorizedBy}
                        onChange={(e) => setAuthorizedBy(e.target.value)}
                        placeholder="Nombre de quien autoriza"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="received-by-exit">Recibió</Label>
                      <Input
                        id="received-by-exit"
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        placeholder="Nombre de quien recibe"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes-exit">Observaciones</Label>
                      <Textarea
                        id="notes-exit"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observaciones adicionales..."
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={() => handleSaveMovement("salida")} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Autorizar Salida
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Información Adicional */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Folio:</span>
                      <span className="font-medium">{folio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="destructive">Salida</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge variant="secondary">Borrador</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Historial de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
          <CardDescription>Últimos movimientos de almacén registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMovements ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando movimientos...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Orden de Compra</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Kilos</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">{movement.folio}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === "entrada" ? "default" : "destructive"}>
                        {movement.type === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.purchase_order?.folio || "N/A"}</TableCell>
                    <TableCell>{format(movement.date, "dd/MM/yyyy")}</TableCell>
                    <TableCell>{movement.kilos.toLocaleString()} kg</TableCell>
                    <TableCell>{movement.transporter}</TableCell>
                    <TableCell>
                      <Badge variant={movement.status === "Autorizado" ? "default" : "secondary"}>
                        {movement.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver detalle"
                          onClick={() => {
                            setSelectedMovement(movement)
                            setIsViewMovementOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar"
                          onClick={() => {
                            setSelectedMovement(movement)
                            setIsEditMovementOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewMovementOpen} onOpenChange={setIsViewMovementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Movimiento de Almacén</DialogTitle>
            <DialogDescription>Información completa del movimiento seleccionado</DialogDescription>
          </DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Folio</Label>
                  <p className="font-medium">{selectedMovement.folio}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                  <Badge variant={selectedMovement.type === "entrada" ? "default" : "destructive"}>
                    {selectedMovement.type === "entrada" ? "Entrada" : "Salida"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Orden de Compra</Label>
                  <p>{selectedMovement.purchase_order?.folio || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p>{format(selectedMovement.date, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Kilos</Label>
                  <p className="font-medium">{selectedMovement.kilos.toLocaleString()} kg</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Transportista</Label>
                  <p>{selectedMovement.transporter}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <Badge variant={selectedMovement.status === "Autorizado" ? "default" : "secondary"}>
                    {selectedMovement.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Autorizó</Label>
                  <p>{selectedMovement.authorized_by}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Recibió</Label>
                  <p>{selectedMovement.received_by}</p>
                </div>
                {selectedMovement.observations && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Observaciones</Label>
                    <p>{selectedMovement.observations}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditMovementOpen} onOpenChange={setIsEditMovementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Movimiento de Almacén</DialogTitle>
            <DialogDescription>Modifica la información del movimiento</DialogDescription>
          </DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedMovement.date, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={selectedMovement.date} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Orden de Compra</Label>
                  <Select defaultValue={selectedMovement.purchase_order_id}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.folio} - {po.supplier?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kilos</Label>
                  <Input type="number" defaultValue={selectedMovement.kilos} step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Transportista</Label>
                  <Input defaultValue={selectedMovement.transporter} />
                </div>
                <div className="space-y-2">
                  <Label>Autorizó</Label>
                  <Input defaultValue={selectedMovement.authorized_by} placeholder="Nombre de quien autoriza" />
                </div>
                <div className="space-y-2">
                  <Label>Recibió</Label>
                  <Input defaultValue={selectedMovement.received_by} placeholder="Nombre de quien recibe" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    defaultValue={selectedMovement.observations}
                    placeholder="Observaciones adicionales..."
                    className="resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditMovementOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    alert("Movimiento actualizado exitosamente")
                    setIsEditMovementOpen(false)
                  }}
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
