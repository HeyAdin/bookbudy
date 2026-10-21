import axios from 'axios';
import type {
  Book,
  BookDetail,
  BookCreateInput,
  BookUpdateInput,
  BookNote,
  ReadingProgress,
  ReadingStats,
  HealthCheck,
  ReadingStatus,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const api = {
  async getHealth(): Promise<HealthCheck> {
    const res = await client.get<HealthCheck>('/health');
    return res.data;
  },

  async getBooks(params?: {
    status?: ReadingStatus;
    genre?: string;
    search?: string;
  }): Promise<Book[]> {
    const res = await client.get<Book[]>('/api/books', { params });
    return res.data;
  },

  async getBook(id: string): Promise<BookDetail> {
    const res = await client.get<BookDetail>(`/api/books/${id}`);
    return res.data;
  },

  async createBook(data: BookCreateInput): Promise<Book> {
    const res = await client.post<Book>('/api/books', data);
    return res.data;
  },

  async updateBook(id: string, data: BookUpdateInput): Promise<Book> {
    const res = await client.patch<Book>(`/api/books/${id}`, data);
    return res.data;
  },

  async deleteBook(id: string): Promise<void> {
    await client.delete(`/api/books/${id}`);
  },

  async recordProgress(
    bookId: string,
    pagesRead: number,
    progressPercent?: number
  ): Promise<ReadingProgress> {
    const res = await client.post<ReadingProgress>(`/api/books/${bookId}/progress`, {
      pages_read: pagesRead,
      progress_percent: progressPercent,
    });
    return res.data;
  },

  async getBookProgress(bookId: string): Promise<ReadingProgress[]> {
    const res = await client.get<ReadingProgress[]>(`/api/books/${bookId}/progress`);
    return res.data;
  },

  async createBookNote(
    bookId: string,
    content: string,
    rating?: number
  ): Promise<BookNote> {
    const res = await client.post<BookNote>(`/api/books/${bookId}/notes`, {
      content,
      rating,
    });
    return res.data;
  },

  async getBookNotes(bookId: string): Promise<BookNote[]> {
    const res = await client.get<BookNote[]>(`/api/books/${bookId}/notes`);
    return res.data;
  },

  async getStats(): Promise<ReadingStats> {
    const res = await client.get<ReadingStats>('/api/stats');
    return res.data;
  },
};
