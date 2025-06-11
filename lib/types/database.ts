// Re-export database types for easier importing
export { type Database, type Json } from "@/lib/supabase/database.types";
import { type Database } from "@/lib/supabase/database.types";

// Helper type for extracting table rows
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Helper type for extracting enum values
export type Enum<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// All table names for type safety
export type TableName = keyof Database["public"]["Tables"];

// All enum names for type safety
export type EnumName = keyof Database["public"]["Enums"];

// Database response types
export interface DatabaseResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseListResponse<T = any> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

// Query builder helper types
export interface QueryFilter {
  column: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "in"
    | "is";
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  select?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Supabase client types
export interface SupabaseClientConfig {
  url: string;
  anonKey: string;
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}
