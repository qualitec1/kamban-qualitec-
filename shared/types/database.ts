export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      tasks: {
        Row: {
          archived_at: string | null
          board_id: string
          budget: number | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          group_id: string | null
          id: string
          notes: string | null
          position: number
          priority_id: string | null
          start_date: string | null
          status_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          board_id: string
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          position?: number
          priority_id?: string | null
          start_date?: string | null
          status_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          board_id?: string
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          position?: number
          priority_id?: string | null
          start_date?: string | null
          status_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          board_id: string
          color: string | null
          id: string
          is_collapsed: boolean
          name: string
          sort_order: number
        }
        Insert: {
          board_id: string
          color?: string | null
          id?: string
          is_collapsed?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          board_id?: string
          color?: string | null
          id?: string
          is_collapsed?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_groups_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          board_id: string
          color: string
          id: string
          is_done: boolean
          name: string
          sort_order: number
        }
        Insert: {
          board_id: string
          color?: string
          id?: string
          is_done?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          board_id?: string
          color?: string
          id?: string
          is_done?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_statuses_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      // ... other tables (truncated for brevity - add as needed)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      board_access_role: "owner" | "editor" | "viewer" | "guest" | "observer"
      board_type: "kanban" | "scrum" | "list"
      column_type:
        | "status"
        | "priority"
        | "due_date"
        | "start_date"
        | "assignee"
        | "notes"
        | "files"
        | "budget"
        | "last_updated"
        | "timeline"
        | "custom"
      user_role: "master" | "collaborator" | "guest" | "observer"
      user_status: "active" | "inactive" | "pending"
      view_type:
        | "board"
        | "kanban"
        | "calendar"
        | "timeline"
        | "gantt"
        | "cards"
        | "table"
      visibility_type: "public" | "private" | "org"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  TableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends TableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[TableNameOrOptions["schema"]]["Tables"] &
        Database[TableNameOrOptions["schema"]]["Views"])
    : never = never,
> = TableNameOrOptions extends { schema: keyof Database }
  ? (Database[TableNameOrOptions["schema"]]["Tables"] &
      Database[TableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : TableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[TableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends TableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof Database }
  ? Database[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends TableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof Database }
  ? Database[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  EnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends EnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[EnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = EnumNameOrOptions extends { schema: keyof Database }
  ? Database[EnumNameOrOptions["schema"]]["Enums"][EnumName]
  : EnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][EnumNameOrOptions]
    : never
