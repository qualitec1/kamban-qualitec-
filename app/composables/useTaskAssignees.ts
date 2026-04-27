import { ref } from '#imports'
import type { Database } from '#shared/types/database'
import type { AssigneeProfile } from '#shared/types/assignee'
import { createClient } from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export function useTaskAssignees(taskId: string) {
  function getClient(): SupabaseClient {
    if (import.meta.server) throw new Error('[useTaskAssignees] SSR not supported')
    return useNuxtApp().$supabase as SupabaseClient
  }

  const assignees = ref<AssigneeProfile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Flag para evitar chamadas simultâneas
  let fetchPromise: Promise<void> | null = null

  async function fetchAssignees(id: string = taskId) {
    // Se já está carregando, retorna a promise existente
    if (fetchPromise) {
      return fetchPromise
    }
    
    loading.value = true
    error.value = null
    
    fetchPromise = (async () => {
      try {
        const supabase = getClient()
        const { data, error: fetchError } = await supabase
          .from('task_assignees')
          .select(`
            user_id,
            profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('task_id', id)

        if (fetchError) throw fetchError

        assignees.value = (data ?? [])
          .map((row: any) => row.profiles)
          .filter(Boolean) as AssigneeProfile[]
      } catch (e: any) {
        error.value = e.message
        assignees.value = []
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()
    
    return fetchPromise
  }

  async function addAssignee(userId: string, id: string = taskId) {
    try {
      console.log('[useTaskAssignees] ========== ADD ASSIGNEE START ==========')
      console.log('[useTaskAssignees] Adding assignee:', { taskId: id, userId })
      
      const supabase = getClient()
      
      // CRÍTICO: Verificar no BANCO se já está atribuído, não no estado local
      // O estado local pode estar desatualizado por causa de updates otimistas
      console.log('[useTaskAssignees] → Checking database for existing assignment...')
      const { data: existingAssignment, error: checkError } = await supabase
        .from('task_assignees')
        .select('user_id')
        .eq('task_id', id)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (checkError) {
        console.error('[useTaskAssignees] ✗ Error checking existing assignment:', checkError)
        throw checkError
      }
      
      console.log('[useTaskAssignees] Database check result:', {
        existsInDatabase: !!existingAssignment,
        userId: userId,
        taskId: id
      })
      
      if (existingAssignment) {
        console.log('[useTaskAssignees] ⊘ User already assigned in database, skipping insert')
        console.log('[useTaskAssignees] ⚠ Note: This might indicate duplicate call or race condition')
        console.log('[useTaskAssignees] ========== ADD ASSIGNEE END (skipped - already in DB) ==========')
        return true
      }
      
      console.log('[useTaskAssignees] ✓ User NOT in database, proceeding with insert')
      console.log('[useTaskAssignees] → Inserting into task_assignees...')
      const { error: insertError } = await supabase
        .from('task_assignees')
        .insert({ task_id: id, user_id: userId })

      if (insertError) {
        console.error('[useTaskAssignees] ✗ Insert error:', insertError)
        throw insertError
      }

      console.log('[useTaskAssignees] ✓ Assignee added to database')
      console.log('[useTaskAssignees] → Fetching updated assignee list...')
      await fetchAssignees(id)
      console.log('[useTaskAssignees] ✓ Assignee list updated')
      console.log('[useTaskAssignees] Updated assignees:', assignees.value.map(a => ({ id: a.id, name: a.full_name })))
      
      // Enviar email de notificação APENAS para o novo responsável
      // IMPORTANTE: Falha no email NÃO deve impedir a operação
      console.log('[useTaskAssignees] → Attempting to send email notification...')
      console.log('[useTaskAssignees] Email will be sent to user:', userId)
      try {
        const { sendTaskAssignedEmail } = useEmailNotifications()
        const emailSent = await sendTaskAssignedEmail(id, userId)
        console.log('[useTaskAssignees] ✓ Email notification result:', emailSent)
      } catch (emailError: any) {
        console.error('[useTaskAssignees] ⚠ Failed to send assignment email (non-critical):', emailError.message)
        // NÃO propagar o erro - a operação de adicionar responsável foi bem-sucedida
      }
      
      console.log('[useTaskAssignees] ========== ADD ASSIGNEE END (success) ==========')
      return true
    } catch (e: any) {
      console.error('[useTaskAssignees] ========== ADD ASSIGNEE END (error) ==========')
      console.error('[useTaskAssignees] ✗ Error adding assignee:', e)
      error.value = e.message ?? 'Unknown error'
      return false
    }
  }

  async function updateAssignees(newUserIds: string[], id: string = taskId) {
    try {
      console.log('[useTaskAssignees] Updating assignees:', { taskId: id, newUserIds })
      
      // Buscar responsáveis atuais
      await fetchAssignees(id)
      const currentUserIds = assignees.value.map(a => a.id)
      
      // Calcular diff
      const addedUserIds = newUserIds.filter(uid => !currentUserIds.includes(uid))
      const removedUserIds = currentUserIds.filter(uid => !newUserIds.includes(uid))
      
      console.log('[useTaskAssignees] Diff calculated:', { addedUserIds, removedUserIds })
      
      const supabase = getClient()
      
      // Remover responsáveis
      if (removedUserIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', id)
          .in('user_id', removedUserIds)
        
        if (deleteError) throw deleteError
        console.log('[useTaskAssignees] Removed assignees:', removedUserIds)
      }
      
      // Adicionar novos responsáveis
      if (addedUserIds.length > 0) {
        const { error: insertError } = await supabase
          .from('task_assignees')
          .insert(addedUserIds.map(uid => ({ task_id: id, user_id: uid })))
        
        if (insertError) throw insertError
        console.log('[useTaskAssignees] Added assignees:', addedUserIds)
        
        // Enviar email para cada novo responsável
        console.log('[useTaskAssignees] Sending emails to new assignees...')
        const { sendTaskAssignedEmail } = useEmailNotifications()
        
        for (const userId of addedUserIds) {
          try {
            const emailSent = await sendTaskAssignedEmail(id, userId)
            console.log(`[useTaskAssignees] Email sent to ${userId}:`, emailSent)
          } catch (emailError) {
            console.error(`[useTaskAssignees] Failed to send email to ${userId}:`, emailError)
            // Continuar mesmo se um email falhar
          }
        }
      }
      
      // Atualizar lista
      await fetchAssignees(id)
      return true
    } catch (e: any) {
      console.error('[useTaskAssignees] Error updating assignees:', e)
      error.value = e.message ?? 'Unknown error'
      return false
    }
  }

  async function removeAssignee(userId: string, id: string = taskId) {
    try {
      const supabase = getClient()
      const { error: deleteError } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchAssignees(id)
      return true
    } catch (e: any) {
      error.value = e.message ?? 'Unknown error'
      return false
    }
  }

  return {
    assignees,
    loading,
    error,
    fetchAssignees,
    addAssignee,
    removeAssignee,
    updateAssignees
  }
}
