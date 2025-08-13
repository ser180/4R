"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Upload, FileText, ImageIcon, Eye, Download, Filter, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  name: string
  type: "factura" | "ticket" | "remision" | "entrada_almacen" | "salida_almacen" | "otro"
  relatedTo: string
  relationType: "orden" | "movimiento" | "entrada" | "salida"
  uploadDate: Date
  supplier: string
  size: string
  format: "PDF" | "JPG" | "PNG"
  file_url?: string
}

interface PurchaseOrder {
  id: string
  folio: string
  supplier_name: string
  total: number
}

interface WarehouseMovement {
  id: string
  folio: string
  type: string
  supplier_name?: string
  client_name?: string
  kilos: number
  date: string
  transporter?: string
}

const documentTypes = [
  { value: "factura", label: "Factura" },
  { value: "ticket", label: "Ticket" },
  { value: "remision", label: "Remisión" },
  { value: "entrada_almacen", label: "Entrada de Almacén" },
  { value: "salida_almacen", label: "Salida de Almacén" },
  { value: "otro", label: "Otro" },
]

const relationTypes = [
  { value: "orden", label: "Orden de Compra" },
  { value: "entrada", label: "Entrada de Almacén" },
  { value: "salida", label: "Salida de Almacén" },
]

export default function DocumentsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("")
  const [relationType, setRelationType] = useState("")
  const [relatedId, setRelatedId] = useState("")
  const [supplier, setSupplier] = useState("")
  const [filterDate, setFilterDate] = useState<Date>()
  const [filterType, setFilterType] = useState("")
  const [filterSupplier, setFilterSupplier] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [warehouseEntries, setWarehouseEntries] = useState<WarehouseMovement[]>([])
  const [warehouseExits, setWarehouseExits] = useState<WarehouseMovement[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadMessage("")
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.includes("pdf") || file.type.includes("image")) {
        setSelectedFile(file)
        setUploadMessage("")
      } else {
        setUploadMessage("Formato no soportado. Solo PDF e imágenes.")
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !relationType || !relatedId) {
      setUploadMessage("Por favor completa todos los campos requeridos.")
      return
    }

    setIsUploading(true)
    setUploadMessage("")

    try {
      const supabase = createClient()

      // Since storage bucket doesn't exist, we'll save document metadata without file upload
      const fileName = selectedFile.name
      const filePath = `documents/${Date.now()}-${fileName}`

      // Save document metadata to database without file upload
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          original_name: selectedFile.name,
          filename: fileName,
          document_type: documentType,
          related_id: relatedId,
          related_to: relationType,
          supplier_id: supplier || null,
          file_path: filePath, // Store intended path for future use
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        })
        .select()
        .single()

      if (docError) {
        throw docError
      }

      setUploadMessage("Documento registrado exitosamente! (Archivo guardado localmente)")
      setSelectedFile(null)
      setDocumentType("")
      setRelationType("")
      setRelatedId("")
      setSupplier("")

      // Clear file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Reload documents
      loadDocuments()
    } catch (error) {
      console.error("Upload error:", error)
      setUploadMessage(`Error al registrar el documento: ${error.message || "Intenta de nuevo."}`)
    } finally {
      setIsUploading(false)
    }
  }

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

  const loadPurchaseOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          folio,
          total,
          suppliers (name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading purchase orders:", error)
        return
      }

      const formattedOrders =
        data?.map((order) => ({
          id: order.id,
          folio: order.folio,
          supplier_name: order.suppliers?.name || "Sin proveedor",
          total: order.total || 0,
        })) || []

      setPurchaseOrders(formattedOrders)
    } catch (error) {
      console.error("Error loading purchase orders:", error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const loadWarehouseMovements = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("warehouse_movements")
        .select(`
          id,
          folio,
          type,
          kilos,
          date,
          transporter,
          purchase_orders (
            suppliers (name)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading warehouse movements:", error)
        return
      }

      const entries =
        data
          ?.filter((movement) => movement.type === "entrada")
          .map((movement) => ({
            id: movement.id,
            folio: movement.folio,
            type: movement.type,
            supplier_name: movement.purchase_orders?.suppliers?.name || "Sin proveedor",
            kilos: movement.kilos || 0,
            date: movement.date,
          })) || []

      const exits =
        data
          ?.filter((movement) => movement.type === "salida")
          .map((movement) => ({
            id: movement.id,
            folio: movement.folio,
            type: movement.type,
            client_name: movement.transporter || "Sin transportista",
            kilos: movement.kilos || 0,
            date: movement.date,
          })) || []

      setWarehouseEntries(entries)
      setWarehouseExits(exits)
    } catch (error) {
      console.error("Error loading warehouse movements:", error)
    } finally {
      setIsLoadingMovements(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documents")
        .select(`
          id,
          original_name,
          document_type,
          related_id,
          related_to,
          file_path,
          file_size,
          mime_type,
          created_at,
          suppliers (name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading documents:", error)
        return
      }

      const formattedDocs =
        data?.map((doc) => ({
          id: doc.id,
          name: doc.original_name || "Sin nombre",
          type: doc.document_type as Document["type"],
          relatedTo: doc.related_id || "Sin relación",
          relationType: doc.related_to as Document["relationType"],
          uploadDate: new Date(doc.created_at),
          supplier: doc.suppliers?.name || "Sin proveedor",
          size: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : "N/A",
          format: doc.mime_type?.includes("pdf") ? "PDF" : doc.mime_type?.includes("image") ? "JPG" : "PNG",
          file_url: doc.file_path,
        })) || []

      setDocuments(formattedDocs)
    } catch (error) {
      console.error("Error loading documents:", error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
    loadPurchaseOrders()
    loadWarehouseMovements()
    loadDocuments()
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    if (filterType && doc.type !== filterType) return false
    if (filterSupplier && doc.supplier !== filterSupplier) return false
    if (filterDate && format(doc.uploadDate, "yyyy-MM-dd") !== format(filterDate, "yyyy-MM-dd")) return false
    return true
  })

  const clearFilters = () => {
    setFilterDate(undefined)
    setFilterType("")
    setFilterSupplier("")
  }

  return (
    <div className="space-y-6">
      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-green-600">Gestión de Documentos</h1>
        <p className="text-muted-foreground">Sube y gestiona documentos relacionados con órdenes y movimientos</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir Documento
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Gestionar Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Formulario de Subida */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Subir Nuevo Documento
                  </CardTitle>
                  <CardDescription>
                    Sube documentos PDF o imágenes relacionados con órdenes y movimientos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Área de Subida */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Archivo</Label>
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 transition-colors hover:border-muted-foreground/50"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="text-center space-y-4">
                        {selectedFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center">
                              {selectedFile.type.includes("pdf") ? (
                                <FileText className="h-12 w-12 text-red-500" />
                              ) : (
                                <ImageIcon className="h-12 w-12 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{selectedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                              Cambiar archivo
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                              <p className="text-lg font-medium">Arrastra tu archivo aquí</p>
                              <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                            />
                            <Label htmlFor="file-upload">
                              <Button variant="outline" className="cursor-pointer bg-transparent">
                                Seleccionar archivo
                              </Button>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Formatos soportados: PDF, JPG, PNG (máx. 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {uploadMessage && (
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          uploadMessage.includes("exitosamente")
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {uploadMessage}
                      </div>
                    )}
                  </div>

                  {/* Información del Documento */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="doc-type">Tipo de Documento</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relation-type">Relacionar con</Label>
                      <Select value={relationType} onValueChange={setRelationType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar relación" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="related-id">
                        {relationType === "orden"
                          ? "Orden de Compra"
                          : relationType === "entrada"
                            ? "Entrada de Almacén"
                            : relationType === "salida"
                              ? "Salida de Almacén"
                              : "Folio de Movimiento"}
                      </Label>
                      {relationType === "orden" ? (
                        <Select value={relatedId} onValueChange={setRelatedId}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={isLoadingOrders ? "Cargando órdenes..." : "Seleccionar orden de compra"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {purchaseOrders.map((order) => (
                              <SelectItem key={order.id} value={order.folio}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{order.folio}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {order.supplier_name} - ${order.total.toFixed(2)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : relationType === "entrada" ? (
                        <Select value={relatedId} onValueChange={setRelatedId}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingMovements ? "Cargando entradas..." : "Seleccionar entrada de almacén"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouseEntries.map((entry) => (
                              <SelectItem key={entry.id} value={entry.folio}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{entry.folio}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {entry.supplier_name} - {entry.kilos} kg
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : relationType === "salida" ? (
                        <Select value={relatedId} onValueChange={setRelatedId}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={isLoadingMovements ? "Cargando salidas..." : "Seleccionar salida de almacén"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouseExits.map((exit) => (
                              <SelectItem key={exit.id} value={exit.folio}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{exit.folio}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {exit.client_name} - {exit.kilos} kg
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="related-id"
                          value={relatedId}
                          onChange={(e) => setRelatedId(e.target.value)}
                          placeholder="Folio de movimiento"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier-select">Proveedor (Opcional)</Label>
                      <Select value={supplier} onValueChange={setSupplier}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isLoadingSuppliers ? "Cargando proveedores..." : "Seleccionar proveedor"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id}>
                              {sup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null)
                        setDocumentType("")
                        setRelationType("")
                        setRelatedId("")
                        setSupplier("")
                        setUploadMessage("")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button disabled={!selectedFile || isUploading} onClick={handleUpload}>
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Documento
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vista Previa */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        {selectedFile.type.includes("pdf") ? (
                          <FileText className="h-16 w-16 text-red-500" />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-blue-500" />
                        )}
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium text-right">{selectedFile.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tamaño:</span>
                          <span className="font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium">{selectedFile.type}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-2" />
                        <p>Sin archivo seleccionado</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingSuppliers ? "Cargando..." : "Todos los proveedores"} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.name}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos ({filteredDocuments.length})</CardTitle>
              <CardDescription>
                {isLoadingDocuments ? "Cargando documentos..." : "Lista de documentos subidos al sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Relacionado con</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doc.format === "PDF" ? (
                              <FileText className="h-4 w-4 text-red-500" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{documentTypes.find((t) => t.value === doc.type)?.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{doc.relatedTo}</div>
                            <div className="text-sm text-muted-foreground">
                              {relationTypes.find((t) => t.value === doc.relationType)?.label}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doc.supplier}</TableCell>
                        <TableCell>{format(doc.uploadDate, "dd/MM/yyyy")}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => doc.file_url && window.open(doc.file_url, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (doc.file_url) {
                                  const link = document.createElement("a")
                                  link.href = doc.file_url
                                  link.download = doc.name
                                  link.click()
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
