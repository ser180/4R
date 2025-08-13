"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  Search,
  Eye,
  Edit,
  Download,
  X,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  Upload,
  Pen,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface SearchResult {
  id: string
  type: "orden" | "documento" | "entrada" | "salida"
  folio: string
  supplier: string
  date: Date
  status: string
  amount?: number
  documentType?: string
  kilos?: number
  transporter?: string
}

const documentTypes = ["Factura", "Ticket", "Remisión", "Otro"]

const statuses = ["Pendiente", "Aprobada", "Autorizado", "Cancelado"]

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedDocType, setSelectedDocType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [searchType, setSearchType] = useState("all")
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)
  const [documentType, setDocumentType] = useState("")
  const [relatedTo, setRelatedTo] = useState("")
  const [relatedNumber, setRelatedNumber] = useState("")
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)

  const [searchResults] = useState<SearchResult[]>([
    {
      id: "1",
      type: "orden",
      folio: "OC-2024-001",
      supplier: "Distribuidora ABC S.A.",
      date: new Date(),
      status: "Aprobada",
      amount: 15750.0,
    },
    {
      id: "2",
      type: "orden",
      folio: "OC-2024-002",
      supplier: "Comercial XYZ Ltda.",
      date: new Date(),
      status: "Pendiente",
      amount: 8920.5,
    },
    {
      id: "3",
      type: "documento",
      folio: "DOC-2024-001",
      supplier: "Distribuidora ABC S.A.",
      date: new Date(),
      status: "Procesado",
      documentType: "Factura",
    },
    {
      id: "4",
      type: "documento",
      folio: "DOC-2024-002",
      supplier: "Proveedores Unidos",
      date: new Date(),
      status: "Pendiente",
      documentType: "Ticket",
    },
    {
      id: "5",
      type: "entrada",
      folio: "ALM-2024-045",
      supplier: "Distribuidora ABC S.A.",
      date: new Date(),
      status: "Autorizado",
      kilos: 1500,
      transporter: "Transportes García",
    },
    {
      id: "6",
      type: "salida",
      folio: "ALM-2024-046",
      supplier: "Comercial XYZ Ltda.",
      date: new Date(),
      status: "Pendiente",
      kilos: 800,
      transporter: "Logística Express",
    },
  ])

  const loadSuppliers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("suppliers").select("id, name").eq("status", "active").order("name")

      if (error) {
        console.error("Error loading suppliers:", error)
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error("Error loading suppliers:", error)
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const filteredResults = searchResults.filter((result) => {
    if (
      searchTerm &&
      !result.folio.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !result.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    if (selectedSupplier && result.supplier !== selectedSupplier) return false
    if (selectedStatus && result.status !== selectedStatus) return false
    if (selectedDocType && result.documentType !== selectedDocType) return false
    if (searchType !== "all" && result.type !== searchType) return false
    return true
  })

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedSupplier("")
    setSelectedDocType("")
    setSelectedStatus("")
    setDateFrom(undefined)
    setDateTo(undefined)
    setSearchType("all")
  }

  const handleView = (result: SearchResult) => {
    setSelectedResult(result)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (result: SearchResult) => {
    setSelectedResult(result)
    setIsEditDialogOpen(true)
  }

  const handleDownload = (result: SearchResult) => {
    // Simular descarga de documento
    const link = document.createElement("a")
    link.href = `/api/documents/${result.id}/download`
    link.download = `${result.folio}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`Descargando documento: ${result.folio}`)
    alert(`Descargando documento: ${result.folio}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscador Avanzado</h1>
        <p className="text-muted-foreground">Busca órdenes de compra y documentos con filtros avanzados</p>
      </div>

      {/* Filtros de Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>Utiliza los filtros para encontrar exactamente lo que buscas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Búsqueda General */}
          <div className="space-y-2">
            <Label htmlFor="search">Búsqueda General</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por folio, proveedor..."
                  className="pl-10"
                />
              </div>
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Filtros Específicos */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Búsqueda</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="orden">Órdenes de Compra</SelectItem>
                  <SelectItem value="documento">Documentos</SelectItem>
                  <SelectItem value="entrada">Entradas de Almacén</SelectItem>
                  <SelectItem value="salida">Salidas de Almacén</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSuppliers ? "Cargando proveedores..." : "Todos los proveedores"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Botón Limpiar Filtros */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Búsqueda</CardTitle>
          <CardDescription>Se encontraron {filteredResults.length} resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto/Tipo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Badge
                      variant={
                        result.type === "orden"
                          ? "default"
                          : result.type === "documento"
                            ? "secondary"
                            : result.type === "entrada"
                              ? "default"
                              : "destructive"
                      }
                    >
                      {result.type === "orden"
                        ? "Orden"
                        : result.type === "documento"
                          ? "Documento"
                          : result.type === "entrada"
                            ? "Entrada"
                            : "Salida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{result.folio}</TableCell>
                  <TableCell>{result.supplier}</TableCell>
                  <TableCell>{format(result.date, "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        result.status === "Aprobada" || result.status === "Autorizado" || result.status === "Procesado"
                          ? "default"
                          : result.status === "Pendiente"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {result.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {result.type === "orden" && result.amount ? (
                      <span className="font-medium">${result.amount.toFixed(2)}</span>
                    ) : result.type === "documento" ? (
                      <span className="text-muted-foreground">{result.documentType}</span>
                    ) : (result.type === "entrada" || result.type === "salida") && result.kilos ? (
                      <span className="font-medium">{result.kilos.toLocaleString()} kg</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="Ver detalle" onClick={() => handleView(result)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Editar" onClick={() => handleEdit(result)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(result.type === "documento" ||
                        result.type === "orden" ||
                        result.type === "entrada" ||
                        result.type === "salida") && (
                        <Button variant="ghost" size="sm" title="Descargar" onClick={() => handleDownload(result)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredResults.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda para encontrar lo que buscas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de{" "}
              {selectedResult?.type === "orden"
                ? "Orden de Compra"
                : selectedResult?.type === "documento"
                  ? "Documento"
                  : selectedResult?.type === "entrada"
                    ? "Entrada de Almacén"
                    : "Salida de Almacén"}
            </DialogTitle>
            <DialogDescription>Información completa del registro seleccionado</DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Folio</Label>
                  <p className="font-medium">{selectedResult.folio}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Proveedor</Label>
                  <p>{selectedResult.supplier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p>{format(selectedResult.date, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <Badge
                    variant={
                      selectedResult.status === "Aprobada" || selectedResult.status === "Autorizado"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedResult.status}
                  </Badge>
                </div>
                {selectedResult.amount && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Monto Total</Label>
                    <p className="font-medium text-lg">${selectedResult.amount.toFixed(2)}</p>
                  </div>
                )}
                {selectedResult.documentType && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo de Documento</Label>
                    <p>{selectedResult.documentType}</p>
                  </div>
                )}
                {selectedResult.kilos && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Kilos</Label>
                    <p className="font-medium">{selectedResult.kilos.toLocaleString()} kg</p>
                  </div>
                )}
                {selectedResult.transporter && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transportista</Label>
                    <p>{selectedResult.transporter}</p>
                  </div>
                )}
              </div>

              {selectedResult.type === "orden" && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Documentos Relacionados</Label>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Badge variant="outline">Factura</Badge>
                          </TableCell>
                          <TableCell>factura_001.pdf</TableCell>
                          <TableCell>{format(new Date(), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" title="Descargar">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge variant="outline">Entrada</Badge>
                          </TableCell>
                          <TableCell>ENT-2024-045</TableCell>
                          <TableCell>{format(new Date(), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" title="Ver detalle">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar{" "}
              {selectedResult?.type === "orden"
                ? "Orden de Compra"
                : selectedResult?.type === "documento"
                  ? "Documento"
                  : selectedResult?.type === "entrada"
                    ? "Entrada de Almacén"
                    : "Salida de Almacén"}
            </DialogTitle>
            <DialogDescription>Modifica la información del registro</DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-6">
              {selectedResult.type === "entrada" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Folio</Label>
                      <div className="flex gap-2">
                        <Input defaultValue={selectedResult.folio} />
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Orden de Compra</Label>
                      <Select defaultValue="OC-2024-001">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OC-2024-001">OC-2024-001 - Proveedor ABC</SelectItem>
                          <SelectItem value="OC-2024-002">OC-2024-002 - Proveedor XYZ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kilos</Label>
                      <Input type="number" defaultValue="1500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transportista</Label>
                      <Input defaultValue="Transportes Eco" />
                    </div>
                    <div className="space-y-2">
                      <Label>Autorizó</Label>
                      <Input defaultValue="Juan Pérez" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recibió</Label>
                      <Input defaultValue="María García" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select defaultValue={selectedResult.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Autorizado">Autorizado</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      defaultValue="Material en buen estado, sin contaminantes"
                    />
                  </div>
                </div>
              )}

              {selectedResult.type === "salida" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Folio</Label>
                      <div className="flex gap-2">
                        <Input defaultValue={selectedResult.folio} />
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente/Destino</Label>
                      <Input defaultValue="Empresa Recicladora Norte" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kilos</Label>
                      <Input type="number" defaultValue="800" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transportista</Label>
                      <Input defaultValue="Logística Verde" />
                    </div>
                    <div className="space-y-2">
                      <Label>Autorizó</Label>
                      <Input defaultValue="Carlos López" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recibió</Label>
                      <Input defaultValue="Ana Martínez" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select defaultValue={selectedResult.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Autorizado">Autorizado</SelectItem>
                          <SelectItem value="Completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      defaultValue="Entrega programada para las 14:00 hrs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Firma Digital</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Pen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Área de firma digital</p>
                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                        Firmar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedResult.type === "orden" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proveedor</Label>
                      <Select value={selectedResult.supplier} onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingSuppliers ? "Cargando..." : "Seleccionar proveedor"} />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.name}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select defaultValue={selectedResult.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Documentos Relacionados</Label>
                      <Button variant="outline" size="sm" onClick={() => setIsAddDocumentOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Documento
                      </Button>
                    </div>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <Badge variant="outline">Factura</Badge>
                            </TableCell>
                            <TableCell>factura_001.pdf</TableCell>
                            <TableCell>{format(new Date(), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" title="Descargar">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Badge variant="outline">Entrada</Badge>
                            </TableCell>
                            <TableCell>ENT-2024-045</TableCell>
                            <TableCell>{format(new Date(), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" title="Ver detalle">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Eliminar"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {selectedResult.type === "documento" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue={selectedResult.type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="factura">Factura</SelectItem>
                        <SelectItem value="ticket">Ticket</SelectItem>
                        <SelectItem value="remision">Remisión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select defaultValue={selectedResult.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    alert("Cambios guardados exitosamente")
                    setIsEditDialogOpen(false)
                  }}
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Documento</DialogTitle>
            <DialogDescription>Sube un nuevo documento y relacónalo con esta orden</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factura">Factura</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="remision">Remisión</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="entrada-almacen">Entrada de Almacén</SelectItem>
                    <SelectItem value="salida-almacen">Salida de Almacén</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relacionar con</Label>
                <Select value={relatedTo} onValueChange={setRelatedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona relación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orden-compra">Orden de Compra</SelectItem>
                    <SelectItem value="entrada-almacen">Entrada de Almacén</SelectItem>
                    <SelectItem value="salida-almacen">Salida de Almacén</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {relatedTo && (
              <div className="space-y-2">
                <Label>
                  {relatedTo === "orden-compra"
                    ? "Número de Orden"
                    : relatedTo === "entrada-almacen"
                      ? "Folio de Entrada"
                      : "Folio de Salida"}
                </Label>
                <Select value={relatedNumber} onValueChange={setRelatedNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el número" />
                  </SelectTrigger>
                  <SelectContent>
                    {relatedTo === "orden-compra" && (
                      <>
                        <SelectItem value="OC-2024-001">OC-2024-001 - Proveedor ABC ($15,000)</SelectItem>
                        <SelectItem value="OC-2024-002">OC-2024-002 - Proveedor XYZ ($8,500)</SelectItem>
                      </>
                    )}
                    {relatedTo === "entrada-almacen" && (
                      <>
                        <SelectItem value="ENT-2024-001">ENT-2024-001 - 1,500 kg</SelectItem>
                        <SelectItem value="ENT-2024-002">ENT-2024-002 - 2,200 kg</SelectItem>
                      </>
                    )}
                    {relatedTo === "salida-almacen" && (
                      <>
                        <SelectItem value="SAL-2024-001">SAL-2024-001 - 800 kg</SelectItem>
                        <SelectItem value="SAL-2024-002">SAL-2024-002 - 1,200 kg</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Archivo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arrastra y suelta tu archivo aquí, o{" "}
                    <Button variant="link" className="p-0 h-auto">
                      selecciona un archivo
                    </Button>
                  </p>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG hasta 10MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea placeholder="Observaciones adicionales sobre el documento..." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                alert("Documento agregado exitosamente")
                setIsAddDocumentOpen(false)
                setDocumentType("")
                setRelatedTo("")
                setRelatedNumber("")
              }}
            >
              Agregar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
