export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VehicleType = 'motorcycle' | 'car'
export type TransmissionType = 'matic' | 'manual'
export type ItemType = 'part' | 'service_fee'

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          name: string
          license_plate: string
          vehicle_type: VehicleType
          transmission_type: TransmissionType | null
          manufacture_year: number | null
          current_odometer: number
          tax_due_date: string | null
          plate_due_date: string | null
          estimated_daily_km: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          license_plate: string
          vehicle_type: VehicleType
          transmission_type?: TransmissionType | null
          manufacture_year?: number | null
          current_odometer?: number
          tax_due_date?: string | null
          plate_due_date?: string | null
          estimated_daily_km?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          license_plate?: string
          vehicle_type?: VehicleType
          transmission_type?: TransmissionType | null
          manufacture_year?: number | null
          current_odometer?: number
          tax_due_date?: string | null
          plate_due_date?: string | null
          estimated_daily_km?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_rules: {
        Row: {
          id: string
          vehicle_id: string
          part_name: string
          interval_km: number | null
          interval_months: number | null
          last_service_odometer: number
          last_service_date: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          part_name: string
          interval_km?: number | null
          interval_months?: number | null
          last_service_odometer?: number
          last_service_date: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          part_name?: string
          interval_km?: number | null
          interval_months?: number | null
          last_service_odometer?: number
          last_service_date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'maintenance_rules_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      maintenance_logs: {
        Row: {
          id: string
          vehicle_id: string
          service_date: string
          odometer: number
          workshop_name: string | null
          total_cost: number
          receipt_image_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          service_date: string
          odometer: number
          workshop_name?: string | null
          total_cost?: number
          receipt_image_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          service_date?: string
          odometer?: number
          workshop_name?: string | null
          total_cost?: number
          receipt_image_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'maintenance_logs_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      fuel_logs: {
        Row: {
          id: string
          vehicle_id: string | null
          log_date: string
          odometer: number
          liters: number
          price_per_liter: number
          total_cost: number
          is_full_tank: boolean
          fuel_type: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          log_date?: string
          odometer: number
          liters: number
          price_per_liter: number
          total_cost: number
          is_full_tank?: boolean
          fuel_type?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          log_date?: string
          odometer?: number
          liters?: number
          price_per_liter?: number
          total_cost?: number
          is_full_tank?: boolean
          fuel_type?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fuel_logs_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      tire_logs: {
        Row: {
          id: string
          vehicle_id: string | null
          log_date: string
          front_psi: number
          rear_psi: number
          tread_condition: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          log_date?: string
          front_psi: number
          rear_psi: number
          tread_condition?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          log_date?: string
          front_psi?: number
          rear_psi?: number
          tread_condition?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tire_logs_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      battery_logs: {
        Row: {
          id: string
          vehicle_id: string | null
          check_date: string
          voltage: number | null
          condition: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          check_date?: string
          voltage?: number | null
          condition?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          check_date?: string
          voltage?: number | null
          condition?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'battery_logs_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      vehicle_specs: {
        Row: {
          id: string
          vehicle_id: string | null
          engine_oil_spec: string | null
          transmission_oil_spec: string | null
          spark_plug_code: string | null
          front_tire_size: string | null
          rear_tire_size: string | null
          battery_type: string | null
          coolant_capacity: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          engine_oil_spec?: string | null
          transmission_oil_spec?: string | null
          spark_plug_code?: string | null
          front_tire_size?: string | null
          rear_tire_size?: string | null
          battery_type?: string | null
          coolant_capacity?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          engine_oil_spec?: string | null
          transmission_oil_spec?: string | null
          spark_plug_code?: string | null
          front_tire_size?: string | null
          rear_tire_size?: string | null
          battery_type?: string | null
          coolant_capacity?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_specs_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: true
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      trusted_workshops: {
        Row: {
          id: string
          vehicle_id: string | null
          name: string
          specialty: string | null
          address_or_maps_url: string | null
          phone_number: string | null
          rating: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          name: string
          specialty?: string | null
          address_or_maps_url?: string | null
          phone_number?: string | null
          rating?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          name?: string
          specialty?: string | null
          address_or_maps_url?: string | null
          phone_number?: string | null
          rating?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'trusted_workshops_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      maintenance_log_items: {
        Row: {
          id: string
          log_id: string
          rule_id: string | null
          item_name: string
          item_type: ItemType
          cost: number
        }
        Insert: {
          id?: string
          log_id: string
          rule_id?: string | null
          item_name: string
          item_type: ItemType
          cost: number
        }
        Update: {
          id?: string
          log_id?: string
          rule_id?: string | null
          item_name?: string
          item_type?: ItemType
          cost?: number
        }
        Relationships: [
          {
            foreignKeyName: 'maintenance_log_items_log_id_fkey'
            columns: ['log_id']
            isOneToOne: false
            referencedRelation: 'maintenance_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'maintenance_log_items_rule_id_fkey'
            columns: ['rule_id']
            isOneToOne: false
            referencedRelation: 'maintenance_rules'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_complaints: {
        Row: {
          id: string
          vehicle_id: string | null
          title: string
          symptom_category: string | null
          severity: string | null
          is_resolved: boolean | null
          resolved_at: string | null
          resolved_log_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          title: string
          symptom_category?: string | null
          severity?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_log_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          title?: string
          symptom_category?: string | null
          severity?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_log_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_complaints_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicle_complaints_resolved_log_id_fkey'
            columns: ['resolved_log_id']
            isOneToOne: false
            referencedRelation: 'maintenance_logs'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
