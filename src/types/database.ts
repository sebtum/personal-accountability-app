export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "active" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done";

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          start_date: string;
          deadline: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date: string;
          deadline: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string;
          deadline?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          status: TaskStatus;
          estimated_hours: number;
          checklist: ChecklistItem[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          status?: TaskStatus;
          estimated_hours: number;
          checklist?: ChecklistItem[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          status?: TaskStatus;
          estimated_hours?: number;
          checklist?: ChecklistItem[];
          updated_at?: string;
        };
        Relationships: never[];
      };
      time_logs: {
        Row: {
          id: string;
          task_id: string;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          notes: string | null;
          is_manual: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          notes?: string | null;
          is_manual?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          notes?: string | null;
          is_manual?: boolean;
        };
        Relationships: never[];
      };
    };
    Views: {
      task_actuals: {
        Row: {
          task_id: string;
          project_id: string;
          name: string;
          status: TaskStatus;
          estimated_hours: number;
          actual_hours: number;
          is_overrun: boolean;
        };
        Relationships: never[];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
