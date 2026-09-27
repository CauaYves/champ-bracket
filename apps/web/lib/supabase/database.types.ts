// Hand-written to match supabase/migrations/20260926000000_init.sql.
// Replace with generated types (Supabase MCP `generate_typescript_types`).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type ChampionshipStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "finished"
type RegistrationStatus = "pending" | "approved" | "rejected"
type Gender = "male" | "female"
type BracketFormat = "single_elimination" | "repechage" | "round_robin"
type DivisionStatus = "draft" | "locked" | "in_progress" | "finished"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; created_at: string }
        Insert: { id: string; full_name?: string; created_at?: string }
        Update: { id?: string; full_name?: string; created_at?: string }
        Relationships: []
      }
      presets: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          criteria: Json
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          criteria: Json
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          criteria?: Json
          created_at?: string
        }
        Relationships: []
      }
      championships: {
        Row: {
          id: string
          owner_id: string
          name: string
          event_date: string
          location: string
          status: ChampionshipStatus
          criteria: Json
          public_slug: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          name: string
          event_date: string
          location?: string
          status?: ChampionshipStatus
          criteria: Json
          public_slug?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          event_date?: string
          location?: string
          status?: ChampionshipStatus
          criteria?: Json
          public_slug?: string
          created_at?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          id: string
          championship_id: string
          name: string
          format: BracketFormat
          third_place_match: boolean
          group_size: number | null
          advance_per_group: number | null
          status: DivisionStatus
          bracket: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          championship_id: string
          name: string
          format?: BracketFormat
          third_place_match?: boolean
          group_size?: number | null
          advance_per_group?: number | null
          status?: DivisionStatus
          bracket?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          championship_id?: string
          name?: string
          format?: BracketFormat
          third_place_match?: boolean
          group_size?: number | null
          advance_per_group?: number | null
          status?: DivisionStatus
          bracket?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          id: string
          championship_id: string
          division_id: string | null
          status: RegistrationStatus
          full_name: string
          birth_date: string
          gender: Gender
          weight_kg: number
          belt: string
          academy: string
          coach: string
          phone: string
          email: string
          guardian_name: string | null
          guardian_phone: string | null
          consent_at: string
          guardian_consent_at: string | null
          created_at: string
        }
        Insert: never
        Update: {
          division_id?: string | null
          status?: RegistrationStatus
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_public_championship: {
        Args: { slug: string }
        Returns: {
          name: string
          event_date: string
          location: string
          status: ChampionshipStatus
          belts: Json
          adult_age: number
        }[]
      }
      submit_registration: {
        Args: {
          slug: string
          full_name: string
          birth_date: string
          gender: Gender
          weight_kg: number
          belt: string
          academy: string
          coach: string
          phone: string
          email: string
          consent: boolean
          guardian_name?: string
          guardian_phone?: string
          guardian_consent?: boolean
        }
        Returns: string
      }
    }
    Enums: {
      championship_status: ChampionshipStatus
      registration_status: RegistrationStatus
      gender: Gender
      bracket_format: BracketFormat
      division_status: DivisionStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T]
