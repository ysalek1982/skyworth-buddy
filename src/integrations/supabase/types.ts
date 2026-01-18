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
      campaign: {
        Row: {
          created_at: string
          draw_date: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          draw_date?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Update: {
          created_at?: string
          draw_date?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      canjes: {
        Row: {
          cliente_id: string | null
          created_at: string
          estado: string
          id: string
          premio_id: string
          puntos_utilizados: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          premio_id: string
          puntos_utilizados: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          premio_id?: string
          puntos_utilizados?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canjes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_premio_id_fkey"
            columns: ["premio_id"]
            isOneToOne: false
            referencedRelation: "premios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canjes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      client_purchases: {
        Row: {
          admin_status: string | null
          ai_validation_result: Json | null
          city: string | null
          coupons_generated: number | null
          created_at: string
          dni: string
          email: string
          full_name: string
          id: string
          id_back_url: string | null
          id_front_url: string | null
          invoice_url: string | null
          phone: string
          product_id: string | null
          purchase_date: string
          rejection_reason: string | null
          serial_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_status?: string | null
          ai_validation_result?: Json | null
          city?: string | null
          coupons_generated?: number | null
          created_at?: string
          dni: string
          email: string
          full_name: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          invoice_url?: string | null
          phone: string
          product_id?: string | null
          purchase_date: string
          rejection_reason?: string | null
          serial_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_status?: string | null
          ai_validation_result?: Json | null
          city?: string | null
          coupons_generated?: number | null
          created_at?: string
          dni?: string
          email?: string
          full_name?: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          invoice_url?: string | null
          phone?: string
          product_id?: string | null
          purchase_date?: string
          rejection_reason?: string | null
          serial_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cedula: string
          created_at: string
          email: string
          estado: string
          id: string
          puntos_acumulados: number
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cedula: string
          created_at?: string
          email: string
          estado?: string
          id?: string
          puntos_acumulados?: number
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cedula?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          puntos_acumulados?: number
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compras: {
        Row: {
          cliente_id: string
          created_at: string
          estado: string
          fecha_compra: string
          foto_factura_url: string | null
          id: string
          numero_factura: string
          producto_id: string | null
          puntos_otorgados: number
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: string
          fecha_compra: string
          foto_factura_url?: string | null
          id?: string
          numero_factura: string
          producto_id?: string | null
          puntos_otorgados?: number
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: string
          fecha_compra?: string
          foto_factura_url?: string | null
          id?: string
          numero_factura?: string
          producto_id?: string | null
          puntos_otorgados?: number
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          buyer_purchase_id: string | null
          code: string
          created_at: string
          draw_id: string | null
          id: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          seller_sale_id: string | null
          serial_id: string | null
          status: Database["public"]["Enums"]["coupon_status"]
        }
        Insert: {
          buyer_purchase_id?: string | null
          code: string
          created_at?: string
          draw_id?: string | null
          id?: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          seller_sale_id?: string | null
          serial_id?: string | null
          status?: Database["public"]["Enums"]["coupon_status"]
        }
        Update: {
          buyer_purchase_id?: string | null
          code?: string
          created_at?: string
          draw_id?: string | null
          id?: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          seller_sale_id?: string | null
          serial_id?: string | null
          status?: Database["public"]["Enums"]["coupon_status"]
        }
        Relationships: [
          {
            foreignKeyName: "coupons_buyer_purchase_id_fkey"
            columns: ["buyer_purchase_id"]
            isOneToOne: false
            referencedRelation: "client_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_seller_sale_id_fkey"
            columns: ["seller_sale_id"]
            isOneToOne: false
            referencedRelation: "seller_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_serial_id_fkey"
            columns: ["serial_id"]
            isOneToOne: false
            referencedRelation: "tv_serials"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          created_at: string
          executed_at: string | null
          finalists_count: number | null
          id: string
          name: string
          preselected_count: number | null
          results: Json | null
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          finalists_count?: number | null
          id?: string
          name: string
          preselected_count?: number | null
          results?: Json | null
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          finalists_count?: number | null
          id?: string
          name?: string
          preselected_count?: number | null
          results?: Json | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_settings: {
        Row: {
          benefits: Json
          campaign_end_date: string
          campaign_name: string
          campaign_start_date: string
          campaign_tagline: string
          created_at: string
          cta_text: string
          disclaimer: string | null
          draw_date: string
          hero_background_url: string | null
          hero_banner_url: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          prize_destination: string
          requirements: Json
          sections: Json
          theme: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          benefits?: Json
          campaign_end_date?: string
          campaign_name?: string
          campaign_start_date?: string
          campaign_tagline?: string
          created_at?: string
          cta_text?: string
          disclaimer?: string | null
          draw_date?: string
          hero_background_url?: string | null
          hero_banner_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          prize_destination?: string
          requirements?: Json
          sections?: Json
          theme?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          benefits?: Json
          campaign_end_date?: string
          campaign_name?: string
          campaign_start_date?: string
          campaign_tagline?: string
          created_at?: string
          cta_text?: string
          disclaimer?: string | null
          draw_date?: string
          hero_background_url?: string | null
          hero_banner_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          prize_destination?: string
          requirements?: Json
          sections?: Json
          theme?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      premios: {
        Row: {
          activo: boolean
          cantidad_disponible: number
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          puntos_requeridos: number
        }
        Insert: {
          activo?: boolean
          cantidad_disponible?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          puntos_requeridos: number
        }
        Update: {
          activo?: boolean
          cantidad_disponible?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          puntos_requeridos?: number
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          imagen_url: string | null
          modelo: string
          nombre: string
          puntos: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          imagen_url?: string | null
          modelo: string
          nombre: string
          puntos: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          imagen_url?: string | null
          modelo?: string
          nombre?: string
          puntos?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          coupon_multiplier: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          model_key: string | null
          model_name: string
          points_value: number
          screen_size: number | null
          seller_coupon_multiplier: number | null
          ticket_multiplier: number
          tier: string
          updated_at: string
        }
        Insert: {
          coupon_multiplier?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          model_key?: string | null
          model_name: string
          points_value?: number
          screen_size?: number | null
          seller_coupon_multiplier?: number | null
          ticket_multiplier?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          coupon_multiplier?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          model_key?: string | null
          model_name?: string
          points_value?: number
          screen_size?: number | null
          seller_coupon_multiplier?: number | null
          ticket_multiplier?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string
          created_at: string
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido: string
          created_at?: string
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string
          created_at?: string
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secure_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      seller_sales: {
        Row: {
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          invoice_number: string | null
          points_earned: number
          product_id: string | null
          sale_date: string
          seller_id: string
          serial_number: string
        }
        Insert: {
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          invoice_number?: string | null
          points_earned?: number
          product_id?: string | null
          sale_date?: string
          seller_id: string
          serial_number: string
        }
        Update: {
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          invoice_number?: string | null
          points_earned?: number
          product_id?: string | null
          sale_date?: string
          seller_id?: string
          serial_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          phone: string | null
          store_city: string
          store_name: string
          total_points: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          store_city: string
          store_name: string
          total_points?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          store_city?: string
          store_name?: string
          total_points?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tv_serials: {
        Row: {
          buyer_purchase_id: string | null
          buyer_status: Database["public"]["Enums"]["buyer_status"]
          created_at: string
          id: string
          product_id: string | null
          seller_sale_id: string | null
          seller_status: Database["public"]["Enums"]["seller_status"]
          serial_number: string
          status: Database["public"]["Enums"]["serial_status"]
          updated_at: string
        }
        Insert: {
          buyer_purchase_id?: string | null
          buyer_status?: Database["public"]["Enums"]["buyer_status"]
          created_at?: string
          id?: string
          product_id?: string | null
          seller_sale_id?: string | null
          seller_status?: Database["public"]["Enums"]["seller_status"]
          serial_number: string
          status?: Database["public"]["Enums"]["serial_status"]
          updated_at?: string
        }
        Update: {
          buyer_purchase_id?: string | null
          buyer_status?: Database["public"]["Enums"]["buyer_status"]
          created_at?: string
          id?: string
          product_id?: string | null
          seller_sale_id?: string | null
          seller_status?: Database["public"]["Enums"]["seller_status"]
          serial_number?: string
          status?: Database["public"]["Enums"]["serial_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tv_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          cedula: string
          codigo_vendedor: string
          created_at: string
          email: string
          estado: string
          id: string
          puntos_acumulados: number
          telefono: string
          tienda: string
          updated_at: string
          user_id: string
          ventas_totales: number
        }
        Insert: {
          cedula: string
          codigo_vendedor: string
          created_at?: string
          email: string
          estado?: string
          id?: string
          puntos_acumulados?: number
          telefono: string
          tienda: string
          updated_at?: string
          user_id: string
          ventas_totales?: number
        }
        Update: {
          cedula?: string
          codigo_vendedor?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          puntos_acumulados?: number
          telefono?: string
          tienda?: string
          updated_at?: string
          user_id?: string
          ventas_totales?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rpc_register_buyer_serial:
        | {
            Args: {
              p_city?: string
              p_dni: string
              p_email: string
              p_existing_purchase_id?: string
              p_full_name: string
              p_phone: string
              p_purchase_date?: string
              p_serial_number: string
              p_user_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_city: string
              p_dni: string
              p_email: string
              p_full_name: string
              p_phone: string
              p_purchase_date: string
              p_serial_number: string
              p_user_id?: string
            }
            Returns: Json
          }
      rpc_register_seller: {
        Args: {
          p_phone?: string
          p_store_city: string
          p_store_name: string
          p_user_id: string
        }
        Returns: Json
      }
      rpc_register_seller_serial: {
        Args: {
          p_client_name?: string
          p_client_phone?: string
          p_invoice_number?: string
          p_sale_date?: string
          p_seller_id: string
          p_serial_number: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "cliente" | "vendedor" | "seller"
      buyer_status: "NOT_REGISTERED" | "REGISTERED"
      coupon_status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED"
      owner_type: "BUYER" | "SELLER"
      seller_status: "NOT_REGISTERED" | "REGISTERED"
      serial_status: "AVAILABLE" | "BLOCKED"
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
      app_role: ["admin", "cliente", "vendedor", "seller"],
      buyer_status: ["NOT_REGISTERED", "REGISTERED"],
      coupon_status: ["ACTIVE", "USED", "EXPIRED", "CANCELLED"],
      owner_type: ["BUYER", "SELLER"],
      seller_status: ["NOT_REGISTERED", "REGISTERED"],
      serial_status: ["AVAILABLE", "BLOCKED"],
    },
  },
} as const
