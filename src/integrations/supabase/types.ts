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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analysis_jobs: {
        Row: {
          company_name: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          instagram_url: string
          language: string
          result_data: Json | null
          started_at: string | null
          status: string
          user_id: string
          username: string
        }
        Insert: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instagram_url: string
          language?: string
          result_data?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
          username: string
        }
        Update: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instagram_url?: string
          language?: string
          result_data?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      nicho_insights: {
        Row: {
          avg_engagement: number | null
          avg_hook_strength: number | null
          avg_retention: number | null
          avg_score_geral: number | null
          avg_viral_score: number | null
          insight_generated_at: string | null
          insight_generated_at_count: number
          insight_text: string | null
          nicho: Database["public"]["Enums"]["profile_niche"]
          top_problemas: Json
          top_solucoes: Json
          total_analises: number
          updated_at: string
          viral_patterns: Json | null
        }
        Insert: {
          avg_engagement?: number | null
          avg_hook_strength?: number | null
          avg_retention?: number | null
          avg_score_geral?: number | null
          avg_viral_score?: number | null
          insight_generated_at?: string | null
          insight_generated_at_count?: number
          insight_text?: string | null
          nicho: Database["public"]["Enums"]["profile_niche"]
          top_problemas?: Json
          top_solucoes?: Json
          total_analises?: number
          updated_at?: string
          viral_patterns?: Json | null
        }
        Update: {
          avg_engagement?: number | null
          avg_hook_strength?: number | null
          avg_retention?: number | null
          avg_score_geral?: number | null
          avg_viral_score?: number | null
          insight_generated_at?: string | null
          insight_generated_at_count?: number
          insight_text?: string | null
          nicho?: Database["public"]["Enums"]["profile_niche"]
          top_problemas?: Json
          top_solucoes?: Json
          total_analises?: number
          updated_at?: string
          viral_patterns?: Json | null
        }
        Relationships: []
      }
      profile_history: {
        Row: {
          created_at: string
          engagement: number | null
          hook_strength: number | null
          id: string
          instagram_url: string
          media_comentarios: number | null
          media_likes: number | null
          media_views: number | null
          nicho: Database["public"]["Enums"]["profile_niche"]
          pais: string | null
          problemas_detectados: string[]
          retention: number | null
          score_geral: number | null
          seguidores: number | null
          solucoes_sugeridas: string[]
          storytelling: number | null
          user_id: string
          username: string
          viral_score: number | null
          visual_branding: number | null
        }
        Insert: {
          created_at?: string
          engagement?: number | null
          hook_strength?: number | null
          id?: string
          instagram_url: string
          media_comentarios?: number | null
          media_likes?: number | null
          media_views?: number | null
          nicho?: Database["public"]["Enums"]["profile_niche"]
          pais?: string | null
          problemas_detectados?: string[]
          retention?: number | null
          score_geral?: number | null
          seguidores?: number | null
          solucoes_sugeridas?: string[]
          storytelling?: number | null
          user_id: string
          username: string
          viral_score?: number | null
          visual_branding?: number | null
        }
        Update: {
          created_at?: string
          engagement?: number | null
          hook_strength?: number | null
          id?: string
          instagram_url?: string
          media_comentarios?: number | null
          media_likes?: number | null
          media_views?: number | null
          nicho?: Database["public"]["Enums"]["profile_niche"]
          pais?: string | null
          problemas_detectados?: string[]
          retention?: number | null
          score_geral?: number | null
          seguidores?: number | null
          solucoes_sugeridas?: string[]
          storytelling?: number | null
          user_id?: string
          username?: string
          viral_score?: number | null
          visual_branding?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_logo_url: string | null
          agency_name: string | null
          agency_primary_color: string | null
          agency_website: string | null
          analyses_limit: number
          analyses_remaining: number
          avatar_url: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          id: string
          language_pref: string | null
          period_end: string | null
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_logo_url?: string | null
          agency_name?: string | null
          agency_primary_color?: string | null
          agency_website?: string | null
          analyses_limit?: number
          analyses_remaining?: number
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language_pref?: string | null
          period_end?: string | null
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_logo_url?: string | null
          agency_name?: string | null
          agency_primary_color?: string | null
          agency_website?: string | null
          analyses_limit?: number
          analyses_remaining?: number
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language_pref?: string | null
          period_end?: string | null
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          analysis_data: Json
          created_at: string
          id: string
          language: string
          profile_pic_url: string | null
          profile_url: string
          user_id: string | null
          username: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          id?: string
          language?: string
          profile_pic_url?: string | null
          profile_url: string
          user_id?: string | null
          username: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          id?: string
          language?: string
          profile_pic_url?: string | null
          profile_url?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_jobs: {
        Row: {
          company_name: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_name: string
          file_size: number | null
          id: string
          language: string
          mime_type: string | null
          result_data: Json | null
          started_at: string | null
          status: string
          storage_path: string
          user_id: string
          video_expires_at: string
        }
        Insert: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          language?: string
          mime_type?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string
          storage_path: string
          user_id: string
          video_expires_at?: string
        }
        Update: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          language?: string
          mime_type?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string
          storage_path?: string
          user_id?: string
          video_expires_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      recompute_nicho_insights: {
        Args: { _nicho: Database["public"]["Enums"]["profile_niche"] }
        Returns: undefined
      }
    }
    Enums: {
      profile_niche:
        | "Imobiliaria"
        | "Fitness"
        | "Beleza"
        | "Moda"
        | "Alimentacao"
        | "Educacao"
        | "Tecnologia"
        | "Marketing"
        | "Financas"
        | "Saude"
        | "Coaching"
        | "Ecommerce"
        | "Turismo"
        | "Automotivo"
        | "Entretenimento"
        | "Servicos"
        | "B2B"
        | "Lifestyle"
        | "Arte"
        | "Outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      profile_niche: [
        "Imobiliaria",
        "Fitness",
        "Beleza",
        "Moda",
        "Alimentacao",
        "Educacao",
        "Tecnologia",
        "Marketing",
        "Financas",
        "Saude",
        "Coaching",
        "Ecommerce",
        "Turismo",
        "Automotivo",
        "Entretenimento",
        "Servicos",
        "B2B",
        "Lifestyle",
        "Arte",
        "Outros",
      ],
    },
  },
} as const
