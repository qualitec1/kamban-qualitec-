import { ref } from '#imports'
import type { Tables } from '#shared/types/database'

export type TaskRow = Pick<
  Tables<'tasks'>,
  'id' | 'title' | 'group_id' | 'board_id' | 'status_id' | 'priority_id' |
  'due_date' | 'start_date' | 'description' | 'budget' | 'updated_at'
>

export function useTasks() {
  const supabase = useNuxtApp().$supabase as any

  async function createTask(params: {
    boardId: string
    groupId: string
    title: string
  }): Promise<TaskRow | null> {
    // Get max position in group
    const { data: existing } = await supabase
      .from('tasks')
      .select('position')
      .eq('group_id', params.groupId)
      .order('position', { ascending: false })
      .limit(1)

    const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: params.title.trim(),
        board_id: params.boardId,
        group_id: params.groupId,
        position,
      })
      .select('id, title, group_id, board_id, status_id, priority_id, due_date, start_date, description, budget, updated_at')
      .single()

    if (error) throw error
    return data as TaskRow
  }

  return { createTask }
}
