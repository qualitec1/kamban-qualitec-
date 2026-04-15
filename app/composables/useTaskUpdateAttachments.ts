import { ref } from 'vue'

export interface TaskUpdateAttachment {
  id: string
  update_id: string
  file_name: string
  file_path: string
  mime_type: string
  size_bytes: number
  attachment_type: string
  uploaded_by: string | null
  created_at: string
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function useTaskUpdateAttachments() {
  const supabase = useNuxtApp().$supabase as any
  const { user } = useAuth()
  
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não permitido'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande (máximo 10MB)'
    }
    return null
  }

  async function uploadFile(updateId: string, file: File): Promise<TaskUpdateAttachment | null> {
    if (!user.value) {
      error.value = 'Usuário não autenticado'
      return null
    }

    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      return null
    }

    try {
      uploading.value = true
      uploadProgress.value = 0
      error.value = null

      const fileExt = file.name.split('.').pop()
      const fileName = `${updateId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `task-update-attachments/${fileName}`

      uploadProgress.value = 25

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      uploadProgress.value = 75

      const attachmentType = file.type.startsWith('image/') ? 'image' : 'file'

      const { data: attachmentData, error: dbError } = await supabase
        .from('task_update_attachments')
        .insert({
          update_id: updateId,
          file_name: file.name,
          file_path: filePath,
          size_bytes: file.size,
          attachment_type: attachmentType,
          mime_type: file.type,
          uploaded_by: user.value.id
        })
        .select('id, update_id, file_name, file_path, size_bytes, attachment_type, mime_type, uploaded_by, created_at')
        .single()

      if (dbError) throw dbError

      uploadProgress.value = 100
      return attachmentData as TaskUpdateAttachment
    } catch (err) {
      console.error('[useTaskUpdateAttachments] Upload error:', err)
      error.value = err instanceof Error ? err.message : 'Erro ao fazer upload'
      return null
    } finally {
      uploading.value = false
    }
  }

  async function deleteAttachment(attachmentId: string): Promise<boolean> {
    if (!user.value) return false

    try {
      const { data: attachment } = await supabase
        .from('task_update_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single()

      if (attachment?.file_path) {
        await supabase.storage
          .from('task-attachments')
          .remove([attachment.file_path])
      }

      const { error: dbError } = await supabase
        .from('task_update_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) throw dbError
      return true
    } catch (err) {
      console.error('[useTaskUpdateAttachments] Delete error:', err)
      return false
    }
  }

  async function fetchAttachments(updateId: string): Promise<TaskUpdateAttachment[]> {
    try {
      if (!updateId) return []

      const { data, error: fetchError } = await supabase
        .from('task_update_attachments')
        .select('id, update_id, file_name, file_path, size_bytes, attachment_type, mime_type, uploaded_by, created_at')
        .eq('update_id', updateId)
        .order('created_at', { ascending: true })

      if (fetchError) {
        if (fetchError.code === 'PGRST116' || fetchError.code === '42501') {
          return []
        }
        throw fetchError
      }

      return data as TaskUpdateAttachment[]
    } catch (err) {
      console.error('[useTaskUpdateAttachments] Fetch error:', err)
      return []
    }
  }

  async function fetchAttachmentBlob(attachmentId: string): Promise<Blob | null> {
    try {
      const { data: attachment, error: fetchError } = await supabase
        .from('task_update_attachments')
        .select('file_path, mime_type')
        .eq('id', attachmentId)
        .single()

      if (fetchError || !attachment || !attachment.file_path) {
        return null
      }

      const { data: blob, error: downloadError } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path)

      if (downloadError || !blob) {
        return null
      }

      return blob
    } catch (err) {
      console.error('[useTaskUpdateAttachments] Error:', err)
      return null
    }
  }

  async function getAttachmentUrl(attachmentId: string): Promise<string | null> {
    const blob = await fetchAttachmentBlob(attachmentId)
    if (!blob) return null
    return URL.createObjectURL(blob)
  }

  return {
    uploading,
    uploadProgress,
    error,
    validateFile,
    uploadFile,
    deleteAttachment,
    fetchAttachments,
    fetchAttachmentBlob,
    getAttachmentUrl
  }
}
