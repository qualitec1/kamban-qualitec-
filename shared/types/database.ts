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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          organization_id: string | null
          phone: string | null
          role_global: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          role_global?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          role_global?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      // ... other tables
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
