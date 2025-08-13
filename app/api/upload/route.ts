import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string
    const relatedTo = formData.get("relatedTo") as string
    const relatedId = formData.get("relatedId") as string
    const supplierId = formData.get("supplierId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `documents/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Save document metadata to database
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert({
        filename: fileName,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        document_type: documentType,
        related_to: relatedTo,
        related_id: relatedId,
        supplier_id: supplierId || null,
        uploaded_by: "current_user", // TODO: Get from auth
      })
      .select()
      .single()

    if (docError) {
      console.error("Database error:", docError)
      return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: docData,
      message: "Documento subido exitosamente",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
