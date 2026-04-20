import type { Database } from '#shared/types/database'

type EmailPreferences = Database['public']['Tables']['email_preferences']['Row']

export function useEmailNotifications() {
  const supabase = useNuxtApp().$supabase as any

  async function getEmailPreferences(userId?: string): Promise<EmailPreferences | null> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
    
    if (!targetUserId) return null

    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      console.error('Error fetching email preferences:', error)
      return null
    }

    return data
  }

  async function updateEmailPreferences(preferences: Partial<EmailPreferences>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating email preferences:', error)
      return false
    }

    return true
  }

  async function sendTaskAssignedEmail(taskId: string, assigneeId: string): Promise<boolean> {
    try {
      console.log('[useEmailNotifications] Sending task assigned email:', { taskId, assigneeId })
      
      const response = await $fetch('/api/emails/task-assigned', {
        method: 'POST',
        body: {
          taskId,
          assigneeId
        }
      })

      console.log('[useEmailNotifications] Email API response:', response)
      return response.success
    } catch (error) {
      console.error('[useEmailNotifications] Error sending task assigned email:', error)
      return false
    }
  }

  async function getEmailStats(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
    
    if (!targetUserId) return null

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: allEmails } = await supabase
      .from('email_sent_log')
      .select('id, sent_at, email_type')
      .eq('user_id', targetUserId)
      .gte('sent_at', oneDayAgo)
      .order('sent_at', { ascending: false })

    if (!allEmails) return null

    const emailsLastHour = allEmails.filter(e => e.sent_at >= oneHourAgo).length
    const emailsLastDay = allEmails.length

    return {
      emailsLastHour,
      emailsLastDay,
      recentEmails: allEmails.slice(0, 10)
    }
  }

  return {
    getEmailPreferences,
    updateEmailPreferences,
    sendTaskAssignedEmail,
    getEmailStats
  }
}
