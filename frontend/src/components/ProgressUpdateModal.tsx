import React, { useState } from 'react';
import type { Book } from '../types';

interface ProgressUpdateModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookId: string, pagesRead: number) => Promise<void>;
}

export const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  book,
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !book) return null;

  const [pagesRead, setPagesRead] = useState<number>(book.current_page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (book.total_pages && pagesRead > book.total_pages) {
      setError(`Pages read (${pagesRead}) cannot exceed total pages (${book.total_pages}).`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(book.id, pagesRead);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update progress.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setLoading(true);
      const targetPages = book.total_pages ? book.total_pages : Math.max(pagesRead, 100);
      await onSubmit(book.id, targetPages);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to complete book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-labelledby="progress-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="progress-modal-title" className="modal-title">
              Update Reading Progress
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {book.title}
            </p>
          </div>
          <button
            id="btn-close-progress-modal"
            className="modal-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="input-pages-read" className="form-label">
              Pages Read So Far
            </label>
            <input
              id="input-pages-read"
              type="number"
              min="0"
              max={book.total_pages || undefined}
              className="form-input"
              value={pagesRead}
              onChange={(e) => setPagesRead(parseInt(e.target.value, 10) || 0)}
              required
            />
            {book.total_pages && (
              <div className="form-hint">
                Book total: {book.total_pages} pages (
                {Math.min(100, Math.round((pagesRead / book.total_pages) * 100))}% complete)
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleMarkComplete}
              disabled={loading}
              title="Automatically sets pages to total and marks as COMPLETED"
            >
              ✓ Mark 100% Finished
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                id="btn-submit-progress"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
