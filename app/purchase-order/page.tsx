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
import { CalendarIcon, Plus, Trash2, Save, X, Eye, Edit } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface OrderItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
}

interface PurchaseOrder {
  id: string
  folio: string
  supplier: string
  date: Date
  paymentTerms: string
  status: string
  total: number
  items: OrderItem[]
  observations?: string
}

interface Supplier {
  id: string
  name: string
  rfc: string
  email: string
  status: string
}

export default function PurchaseOrderPage() {
  const [date, setDate] = useState<Date>()
  const [supplier, setSupplier] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
  const [paymentTerm, setPaymentTerm] = useState("")
  const [items, setItems] = useState<OrderItem[]>([{ id: "1", description: "", quantity: 1, price: 0, total: 0 }])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const loadSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true)
      const supabase = createClient()

      const { data: suppliersData, error } = await supabase
        .from("suppliers")
        .select("id, name, rfc, email, status")
        .in("status", ["Activo", "active"]) // Permitir ambos valores
        .order("name")

      if (error) {
        console.error("Error loading suppliers:", error)
        const { data: allSuppliers, error: fallbackError } = await supabase
          .from("suppliers")
          .select("id, name, rfc, email, status")
          .order("name")

        if (!fallbackError) {
          setSuppliers(allSuppliers || [])
        }
        return
      }

      setSuppliers(suppliersData || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const supabase = createClient()

      const { data: ordersData, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          suppliers (
            name
          ),
          purchase_order_items (
            id,
            description,
            quantity,
            unit_price,
            total
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error loading orders:", error)
        return
      }

      const formattedOrders: PurchaseOrder[] = ordersData.map((order) => ({
        id: order.id,
        folio: order.folio,
        supplier: order.suppliers?.name || "Proveedor no especificado",
        date: new Date(order.date),
        paymentTerms: order.payment_terms,
        status: order.status,
        total: order.total,
        observations: order.observations,
        items: order.purchase_order_items.map((item: any) => ({
          id: item.id.toString(),
          description: item.description,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total,
        })),
      }))

      setOrders(formattedOrders)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
    loadOrders()
  }, [])

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      price: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "price") {
            updatedItem.total = updatedItem.quantity * updatedItem.price
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const totalOrder = items.reduce((sum, item) => sum + item.total, 0)

  const handleSaveOrder = async () => {
    // Basic validation
    if (!supplier || !date || items.some((item) => !item.description || item.quantity <= 0 || item.price <= 0)) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    try {
      const supabase = createClient()

      const currentYear = new Date().getFullYear()
      const timestamp = Date.now().toString().slice(-6) // Últimos 6 dígitos del timestamp
      const folio = `OC-${currentYear}-${timestamp}`

      const { data: orderData, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          folio: folio,
          supplier_id: supplier,
          date: date.toISOString().split("T")[0],
          payment_terms: paymentTerm,
          total: totalOrder,
          subtotal: totalOrder,
          tax: 0,
          status: "Pendiente",
          observations: document.getElementById("notes")?.value || "",
        })
        .select()
        .single()

      if (orderError) {
        console.error("Error al crear orden:", orderError)
        alert("Error al guardar la orden de compra")
        return
      }

      const orderItems = items.map((item) => ({
        purchase_order_id: orderData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.total,
      }))

      const { error: itemsError } = await supabase.from("purchase_order_items").insert(orderItems)

      if (itemsError) {
        console.error("Error al guardar artículos:", itemsError)
        alert("Error al guardar los artículos de la orden")
        return
      }

      alert(`Orden de compra ${folio} guardada exitosamente en la base de datos`)

      setSupplier("")
      setDate(undefined)
      setPaymentTerm("")
      setItems([{ id: "1", description: "", quantity: 1, price: 0, total: 0 }])
      const notesField = document.getElementById("notes") as HTMLTextAreaElement
      if (notesField) notesField.value = ""

      loadOrders()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al conectar con la base de datos")
    }
  }

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      {" "}
      {/* Aumentar espaciado general */}
      <div className="space-y-2 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-green-600">Órdenes de Compra</h1>
        <p className="text-muted-foreground">Gestiona y crea nuevas órdenes de compra para Recicladora 4R</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Nueva Orden de Compra</CardTitle>
              <CardDescription>Completa los datos para crear una nueva orden de compra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Select value={supplier} onValueChange={setSupplier}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isLoadingSuppliers ? "Cargando proveedores..." : "Seleccionar proveedor"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!isLoadingSuppliers && suppliers.length === 0 && (
                        <div className="px-2 py-1 text-sm text-muted-foreground">
                          No hay proveedores disponibles. Ve a la sección de Proveedores para agregar uno.
                        </div>
                      )}
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          <div className="flex flex-col">
                            <span>{sup.name}</span>
                            <span className="text-xs text-muted-foreground">{sup.rfc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isLoadingSuppliers && suppliers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {suppliers.length} proveedor{suppliers.length !== 1 ? "es" : ""} disponible
                      {suppliers.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Condiciones de Pago</Label>
                  <Select value={paymentTerm} onValueChange={setPaymentTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar condiciones" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Contado", "15 días", "30 días", "45 días", "60 días"].map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observaciones</Label>
                  <Textarea id="notes" placeholder="Observaciones adicionales..." className="resize-none" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Artículos</Label>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Artículo
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="w-32">Precio</TableHead>
                        <TableHead className="w-32">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              placeholder="Descripción del artículo"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                              min="1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, "price", Number.parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${item.total.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>
                            {items.length > 1 && (
                              <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <div className="text-lg font-semibold">Total: ${totalOrder.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveOrder}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Orden
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Órdenes Recientes</CardTitle>
              <CardDescription>Últimas órdenes de compra registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Cargando órdenes...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay órdenes registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{order.folio}</div>
                        <Badge variant={order.status === "Aprobada" ? "default" : "secondary"}>{order.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{order.supplier}</div>
                      <div className="text-sm text-muted-foreground">{format(order.date, "dd/MM/yyyy")}</div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">${order.total.toFixed(2)}</div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)} title="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)} title="Editar orden">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Orden de Compra</DialogTitle>
            <DialogDescription>Información completa de la orden {selectedOrder?.folio}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Folio</Label>
                  <p className="font-medium">{selectedOrder.folio}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Proveedor</Label>
                  <p>{selectedOrder.supplier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p>{format(selectedOrder.date, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Condiciones de Pago</Label>
                  <p>{selectedOrder.paymentTerms}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <Badge variant={selectedOrder.status === "Aprobada" ? "default" : "secondary"}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total</Label>
                  <p className="font-medium text-lg">${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>

              {selectedOrder.observations && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observaciones</Label>
                  <p className="mt-1 text-sm">{selectedOrder.observations}</p>
                </div>
              )}

              <div>
                <Label className="text-base font-medium">Artículos</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Orden de Compra</DialogTitle>
            <DialogDescription>Modifica la información de la orden {selectedOrder?.folio}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select defaultValue={selectedOrder.supplier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condiciones de Pago</Label>
                  <Select defaultValue={selectedOrder.paymentTerms}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Contado", "15 días", "30 días", "45 días", "60 días"].map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select defaultValue={selectedOrder.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Aprobada">Aprobada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    defaultValue={selectedOrder.observations || ""}
                    placeholder="Observaciones adicionales..."
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Artículos</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="w-32">Precio</TableHead>
                        <TableHead className="w-32">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input defaultValue={item.description} placeholder="Descripción del artículo" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue={item.quantity} min="1" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue={item.price} min="0" step="0.01" />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${item.total.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Artículo
                  </Button>
                  <div className="text-right">
                    <div className="text-lg font-semibold">Total: ${selectedOrder.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    alert("Orden actualizada exitosamente")
                    setIsEditDialogOpen(false)
                    loadOrders()
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
