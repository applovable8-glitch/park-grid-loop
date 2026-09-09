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
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          read: boolean
          recipient_id: string
          sender_id: string
          spot_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read?: boolean
          recipient_id: string
          sender_id: string
          spot_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read?: boolean
          recipient_id?: string
          sender_id?: string
          spot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          icon: string
          id: string
          metadata: Json
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          icon?: string
          id?: string
          metadata?: Json
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          icon?: string
          id?: string
          metadata?: Json
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      parking_spots: {
        Row: {
          address: string | null
          cost: number
          created_at: string
          expires_at: string
          extension_count: number
          id: string
          lat: number
          leave_at: string
          lng: number
          planned_leave_at: string | null
          reserved_by: string | null
          reserved_until: string | null
          status: Database["public"]["Enums"]["spot_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cost?: number
          created_at?: string
          expires_at?: string
          extension_count?: number
          id?: string
          lat: number
          leave_at?: string
          lng: number
          planned_leave_at?: string | null
          reserved_by?: string | null
          reserved_until?: string | null
          status?: Database["public"]["Enums"]["spot_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cost?: number
          created_at?: string
          expires_at?: string
          extension_count?: number
          id?: string
          lat?: number
          leave_at?: string
          lng?: number
          planned_leave_at?: string | null
          reserved_by?: string | null
          reserved_until?: string | null
          status?: Database["public"]["Enums"]["spot_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_purchases: {
        Row: {
          amount_total: number | null
          created_at: string
          currency: string | null
          environment: string
          id: string
          points: number
          price_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          environment?: string
          id?: string
          points: number
          price_id: string
          session_id: string
          user_id: string
        }
        Update: {
          amount_total?: number | null
          created_at?: string
          currency?: string | null
          environment?: string
          id?: string
          points?: number
          price_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          metadata: Json
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          metadata?: Json
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_prefs: Json
          avatar_url: string | null
          car_color: string | null
          car_make: string | null
          car_model: string | null
          car_type: string | null
          created_at: string
          email: string | null
          language: string
          location_prefs: Json
          name: string
          notification_prefs: Json
          phone: string | null
          plate: string | null
          points: number
          referral_code: string | null
          referred_by: string | null
          reputation: number
          reservation_count: number
          shared_count: number
          show_phone: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_prefs?: Json
          avatar_url?: string | null
          car_color?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          created_at?: string
          email?: string | null
          language?: string
          location_prefs?: Json
          name?: string
          notification_prefs?: Json
          phone?: string | null
          plate?: string | null
          points?: number
          referral_code?: string | null
          referred_by?: string | null
          reputation?: number
          reservation_count?: number
          shared_count?: number
          show_phone?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_prefs?: Json
          avatar_url?: string | null
          car_color?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          created_at?: string
          email?: string | null
          language?: string
          location_prefs?: Json
          name?: string
          notification_prefs?: Json
          phone?: string | null
          plate?: string | null
          points?: number
          referral_code?: string | null
          referred_by?: string | null
          reputation?: number
          reservation_count?: number
          shared_count?: number
          show_phone?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          ratee_id: string
          rater_id: string
          reservation_id: string
          stars: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id: string
          rater_id: string
          reservation_id: string
          stars: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id?: string
          rater_id?: string
          reservation_id?: string
          stars?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          points_awarded: number
          referee_id: string
          referrer_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          points_awarded?: number
          referee_id: string
          referrer_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          points_awarded?: number
          referee_id?: string
          referrer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          owner_id: string | null
          proposed_leave_at: string | null
          request_status: string
          responded_at: string | null
          seeker_lat: number | null
          seeker_lng: number | null
          seeker_loc_at: string | null
          spot_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string | null
          proposed_leave_at?: string | null
          request_status?: string
          responded_at?: string | null
          seeker_lat?: number | null
          seeker_lng?: number | null
          seeker_loc_at?: string | null
          spot_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string | null
          proposed_leave_at?: string | null
          request_status?: string
          responded_at?: string | null
          seeker_lat?: number | null
          seeker_lng?: number | null
          seeker_loc_at?: string | null
          spot_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      answer_extension: {
        Args: { p_accept: boolean; p_reservation_id: string }
        Returns: undefined
      }
      cancel_request: { Args: { p_reservation_id: string }; Returns: undefined }
      complete_handoff: {
        Args: { p_reservation_id: string; p_taken: boolean }
        Returns: undefined
      }
      credit_purchased_points: {
        Args: {
          _amount_total: number
          _currency: string
          _environment: string
          _points: number
          _price_id: string
          _session_id: string
          _user_id: string
        }
        Returns: boolean
      }
      gen_referral_code: { Args: never; Returns: string }
      push_notification: {
        Args: {
          _body: string
          _icon: string
          _meta?: Json
          _title: string
          _user_id: string
        }
        Returns: undefined
      }
      rate_user: {
        Args: { p_comment?: string; p_reservation_id: string; p_stars: number }
        Returns: undefined
      }
      redeem_referral: { Args: { p_code: string }; Returns: undefined }
      request_spot: { Args: { p_spot_id: string }; Returns: string }
      respond_to_request: {
        Args: {
          p_action: string
          p_new_leave_at?: string
          p_reservation_id: string
        }
        Returns: undefined
      }
      set_planned_leave: {
        Args: { p_leave_at: string; p_spot_id: string }
        Returns: undefined
      }
      takeover_spot: {
        Args: { p_leave_at: string; p_reservation_id: string }
        Returns: string
      }
    }
    Enums: {
      reservation_status: "active" | "completed" | "expired" | "cancelled"
      spot_status:
        | "available"
        | "leaving"
        | "reserved"
        | "expired"
        | "completed"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      reservation_status: ["active", "completed", "expired", "cancelled"],
      spot_status: [
        "available",
        "leaving",
        "reserved",
        "expired",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
