import { ref } from '#imports'

export interface TaskAttachment {
  id: string
  task_id: string
  file_name: string
  file_path: string
  mime_type: string | null
  size_bytes: number | null
  category: string | null
  description: string | null
  sort_order: number
  uploaded_by: string | null
  created_at: string
  uploader?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function useTaskAttachments(taskId: string) {
  const supabase = useNuxtApp().$supabase as any
  const attachments = ref<TaskAttachment[]>([])
  const count = ref<number>(0)
  const loading = ref(false)
  const uploading = ref(false)
  const uploadProgress = ref<UploadProgress[]>([])

  async function fetchCount() {
    loading.value = true
    try {
      const { count: total, error } = await supabase
        .from('task_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('task_id', taskId)

      if (!error) count.value = total ?? 0
    } catch {
      count.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchAttachments() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select(`
          *,
          uploader:uploaded_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .order('category', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (!error && data) {
        attachments.value = data
        count.value = data.length
      }
    } catch (err) {
      console.error('Erro ao buscar anexos:', err)
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(
    file: File,
    category?: string,
    description?: string
  ): Promise<TaskAttachment | null> {
    uploading.value = true
    
    const progressItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }
    uploadProgress.value.push(progressItem)

    try {
      // Validar tamanho (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        progressItem.status = 'error'
        progressItem.error = 'Arquivo muito grande (máx 10MB)'
        return null
      }

      // Gerar nome único do arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${taskId}/${fileName}`

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        progressItem.status = 'error'
        progressItem.error = uploadError.message
        console.error('Erro no upload:', uploadError)
        return null
      }

      progressItem.progress = 100

      // Registrar no banco de dados
      const { data, error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || null,
          size_bytes: file.size,
          category: category || null,
          description: description || null,
          sort_order: attachments.value.length
        })
        .select(`
          *,
          uploader:uploaded_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (dbError) {
        progressItem.status = 'error'
        progressItem.error = dbError.message
        console.error('Erro ao registrar anexo:', dbError)
        
        // Limpar arquivo do storage se falhar no banco
        await supabase.storage.from('task-attachments').remove([filePath])
        return null
      }

      progressItem.status = 'success'
      
      // Adicionar à lista local
      if (data) {
        attachments.value.push(data)
        count.value++
        return data
      }

      return null
    } catch (err) {
      progressItem.status = 'error'
      progressItem.error = 'Erro desconhecido'
      console.error('Erro no upload:', err)
      return null
    } finally {
      uploading.value = false
      // Limpar progresso após 3 segundos
      setTimeout(() => {
        uploadProgress.value = uploadProgress.value.filter(p => p !== progressItem)
      }, 3000)
    }
  }

  async function deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      const attachment = attachments.value.find(a => a.id === attachmentId)
      if (!attachment) return false

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachment.file_path])

      if (storageError) {
        console.error('Erro ao deletar do storage:', storageError)
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) {
        console.error('Erro ao deletar do banco:', dbError)
        return false
      }

      // Remover da lista local
      attachments.value = attachments.value.filter(a => a.id !== attachmentId)
      count.value--

      return true
    } catch (err) {
      console.error('Erro ao deletar anexo:', err)
      return false
    }
  }

  async function getDownloadUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(filePath, 3600) // 1 hora

      if (error) {
        console.error('Erro ao gerar URL:', error)
        return null
      }

      return data.signedUrl
    } catch (err) {
      console.error('Erro ao gerar URL:', err)
      return null
    }
  }

  async function updateAttachment(
    attachmentId: string,
    updates: { category?: string; description?: string }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('task_attachments')
        .update(updates)
        .eq('id', attachmentId)

      if (error) {
        console.error('Erro ao atualizar anexo:', error)
        return false
      }

      // Atualizar localmente
      const index = attachments.value.findIndex(a => a.id === attachmentId)
      if (index !== -1) {
        attachments.value[index] = {
          ...attachments.value[index],
          ...updates
        }
      }

      return true
    } catch (err) {
      console.error('Erro ao atualizar anexo:', err)
      return false
    }
  }

  async function reorderAttachments(
    updates: Array<{ id: string; sort_order: number }>
  ): Promise<boolean> {
    try {
      // Atualizar localmente primeiro (otimista)
      const previousState = [...attachments.value]
      attachments.value = attachments.value.map(a => {
        const update = updates.find(u => u.id === a.id)
        return update ? { ...a, sort_order: update.sort_order } : a
      })

      // Atualizar no banco em paralelo
      const updatePromises = updates.map(update =>
        supabase
          .from('task_attachments')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      )

      const results = await Promise.all(updatePromises)
      
      // Verificar se algum update falhou
      const hasError = results.some(r => r.error)
      if (hasError) {
        console.error('Erro ao reordenar anexos:', results.filter(r => r.error))
        // Reverter estado local
        attachments.value = previousState
        return false
      }

      return true
    } catch (err) {
      console.error('Erro ao reordenar anexos:', err)
      // Recarregar do banco em caso de erro
      await fetchAttachments()
      return false
    }
  }

  return {
    attachments,
    count,
    loading,
    uploading,
    uploadProgress,
    fetchCount,
    fetchAttachments,
    uploadFile,
    deleteAttachment,
    getDownloadUrl,
    updateAttachment,
    reorderAttachments
  }
}
