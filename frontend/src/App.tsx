import { useEffect, useState, useMemo } from 'react';
import type { Book, ReadingStats, HealthCheck, ReadingStatus, BookCreateInput } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { StatsSection } from './components/StatsSection';
import { FilterBar } from './components/FilterBar';
import { BookCard } from './components/BookCard';
import { BookFormModal } from './components/BookFormModal';
import { BookDetailModal } from './components/BookDetailModal';
import { ProgressUpdateModal } from './components/ProgressUpdateModal';

export function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'ALL'>('ALL');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBookForProgress, setSelectedBookForProgress] = useState<Book | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Check health
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch (healthErr: any) {
        setHealth({
          status: 'error',
          service: 'book-buddy-api',
          database: {
            connected: false,
            target: 'unknown',
            error: healthErr.message || 'Cannot reach FastAPI backend server.',
          },
          authentication: {
            status: 'unauthenticated_development_mode',
            message: 'Backend server is not responding.',
          },
        });
      }

      // 2. Fetch Books & Stats
      const [booksData, statsData] = await Promise.all([
        api.getBooks(),
        api.getStats(),
      ]);

      setBooks(booksData);
      setStats(statsData);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Could not load library data. Ensure the FastAPI backend is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute unique genres for dropdown
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.genre) set.add(b.genre);
    });
    return Array.from(set).sort();
  }, [books]);

  // Filter books locally by status, genre, and search
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (statusFilter !== 'ALL' && book.status !== statusFilter) {
        return false;
      }
      if (genreFilter && book.genre.toLowerCase() !== genreFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = book.title.toLowerCase().includes(query);
        const matchAuthor = book.author.toLowerCase().includes(query);
        if (!matchTitle && !matchAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [books, statusFilter, genreFilter, searchQuery]);

  const handleCreateBook = async (input: BookCreateInput) => {
    await api.createBook(input);
    await loadData();
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await api.deleteBook(bookId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete book.');
    }
  };

  const handleRecordProgress = async (bookId: string, pagesRead: number) => {
    await api.recordProgress(bookId, pagesRead);
    await loadData();
    // Update local modal book if opened
    if (selectedBookForDetails && selectedBookForDetails.id === bookId) {
      const updated = await api.getBook(bookId);
      setSelectedBookForDetails(updated);
    }
  };

  return (
    <div>
      <Navbar
        health={health}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <main className="container" style={{ paddingBottom: '80px' }}>
        {/* Connection Diagnostics Banner if DB or Backend degraded */}
        {health && !health.database.connected && (
          <div className="connection-banner banner-warning" role="alert">
            <div>
              <strong>⚠️ Database Not Connected:</strong>{' '}
              {health.database.error || 'PostgreSQL connection failed.'}
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                Start PostgreSQL locally with <code>brew services start postgresql@16</code> and ensure{' '}
                <code>DATABASE_URL</code> is set in <code>backend/.env</code>.
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              Retry Connection
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="connection-banner banner-warning" role="alert">
            <div>
              <strong>Error Loading Data:</strong> {error}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadData}>
              Try Again
            </button>
          </div>
        )}

        {/* Reading Statistics */}
        <StatsSection stats={stats} />

        {/* Filters and Search Bar */}
        <FilterBar
          currentStatus={statusFilter}
          onStatusChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenre={genreFilter}
          onGenreChange={setGenreFilter}
          availableGenres={availableGenres}
        />

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>Loading your reading library...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3 className="empty-title">
              {books.length === 0 ? 'Your library is empty' : 'No books matched your filter'}
            </h3>
            <p className="empty-desc">
              {books.length === 0
                ? 'Start tracking your reading journey by adding your first book!'
                : 'Try clearing the search query or status filters to view all books.'}
            </p>
            {books.length === 0 ? (
              <button
                id="btn-empty-add-book"
                className="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Add First Book
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setStatusFilter('ALL');
                  setGenreFilter('');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <section aria-label="Book List" className="books-grid">
            {filteredBooks.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                onOpenDetails={(bk) => setSelectedBookForDetails(bk)}
                onOpenProgress={(bk) => setSelectedBookForProgress(bk)}
                onDelete={handleDeleteBook}
              />
            ))}
          </section>
        )}
      </main>

      {/* Modals */}
      <BookFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateBook}
      />

      <BookDetailModal
        book={selectedBookForDetails}
        isOpen={!!selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onRefreshBook={loadData}
      />

      <ProgressUpdateModal
        book={selectedBookForProgress}
        isOpen={!!selectedBookForProgress}
        onClose={() => setSelectedBookForProgress(null)}
        onSubmit={handleRecordProgress}
      />
    </div>
  );
}

export default App;
