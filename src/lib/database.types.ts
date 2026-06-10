export interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Drawing {
  id: string;
  user_id: string;
  title: string;
  thumbnail: string | null;
  stroke_count: number;
  created_at: string;
  updated_at: string;
}

export interface StrokeRow {
  id: string;
  drawing_id: string;
  // JSONB — stores a single Stroke object from Phase 2
  stroke_data: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      drawings: {
        Row: Drawing;
        Insert: Omit<Drawing, 'id' | 'created_at' | 'updated_at' | 'stroke_count'> & {
          id?: string;
          stroke_count?: number;
        };
        Update: Partial<Omit<Drawing, 'id' | 'user_id' | 'created_at'>>;
      };
      strokes: {
        Row: StrokeRow;
        Insert: Omit<StrokeRow, 'id' | 'created_at'> & { id?: string };
        Update: never;
      };
    };
  };
}
