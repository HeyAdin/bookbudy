export type ReadingStatus = 'READING' | 'COMPLETED' | 'WISHLIST';

export interface Book {
  id: string;
  user_id?: string | null;
  title: string;
  author: string;
  genre: string;
  isbn?: string | null;
  summary?: string | null;
  status: ReadingStatus;
  progress_percent: number;
  total_pages?: number | null;
  current_page: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  notes_count: number;
  latest_rating?: number | null;
}

export interface BookNote {
  id: string;
  book_id: string;
  content: string;
  rating?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingProgress {
  id: string;
  book_id: string;
  pages_read: number;
  progress_percent: number;
  recorded_at: string;
}

export interface BookDetail extends Book {
  notes: BookNote[];
  progress_updates: ReadingProgress[];
}

export interface GenreStat {
  genre: string;
  count: number;
  percentage: number;
}

export interface ReadingStats {
  total_books: number;
  currently_reading: number;
  completed: number;
  wishlist: number;
  completion_percentage: number;
  books_by_genre: Record<string, number>;
  genre_breakdown: GenreStat[];
  total_pages_read: number;
  total_pages_library: number;
}

export interface HealthCheck {
  status: string;
  service: string;
  database: {
    connected: boolean;
    target: string;
    error?: string | null;
  };
  authentication: {
    status: string;
    message: string;
  };
}

export interface BookCreateInput {
  title: string;
  author: string;
  genre: string;
  isbn?: string;
  summary?: string;
  status: ReadingStatus;
  total_pages?: number;
  current_page?: number;
}

export interface BookUpdateInput {
  title?: string;
  author?: string;
  genre?: string;
  isbn?: string;
  summary?: string;
  status?: ReadingStatus;
  total_pages?: number;
  current_page?: number;
  progress_percent?: number;
}
