import React, { useState } from 'react';
import type { BookCreateInput, ReadingStatus } from '../types';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookCreateInput) => Promise<void>;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [isbn, setIsbn] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<ReadingStatus>('WISHLIST');
  const [totalPages, setTotalPages] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !author.trim() || !genre.trim()) {
      setError('Title, author, and genre are required.');
      return;
    }

    const total = totalPages ? parseInt(totalPages, 10) : undefined;
    const current = currentPage ? parseInt(currentPage, 10) : 0;

    if (total !== undefined && isNaN(total)) {
      setError('Total pages must be a valid number.');
      return;
    }
    if (isNaN(current) || current < 0) {
      setError('Current page must be a positive number or zero.');
      return;
    }
    if (total !== undefined && current > total) {
      setError(`Current page (${current}) cannot exceed total pages (${total}).`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        isbn: isbn.trim() || undefined,
        summary: summary.trim() || undefined,
        status,
        total_pages: total,
        current_page: current,
      });
      // reset form
      setTitle('');
      setAuthor('');
      setGenre('');
      setIsbn('');
      setSummary('');
      setStatus('WISHLIST');
      setTotalPages('');
      setCurrentPage('0');
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to save book.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-labelledby="modal-book-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-book-title" className="modal-title">
            Add New Book
          </h2>
          <button
            id="btn-close-book-modal"
            className="modal-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="input-title" className="form-label">
              Book Title *
            </label>
            <input
              id="input-title"
              type="text"
              className="form-input"
              placeholder="e.g. Project Hail Mary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="input-author" className="form-label">
                Author *
              </label>
              <input
                id="input-author"
                type="text"
                className="form-input"
                placeholder="e.g. Andy Weir"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-genre" className="form-label">
                Genre *
              </label>
              <input
                id="input-genre"
                type="text"
                className="form-input"
                placeholder="e.g. Science Fiction"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="select-status" className="form-label">
                Reading Status
              </label>
              <select
                id="select-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ReadingStatus)}
              >
                <option value="WISHLIST">★ Wishlist</option>
                <option value="READING">📖 Currently Reading</option>
                <option value="COMPLETED">✓ Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="input-isbn" className="form-label">
                ISBN (Optional)
              </label>
              <input
                id="input-isbn"
                type="text"
                className="form-input"
                placeholder="ISBN-10 or ISBN-13"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="input-total-pages" className="form-label">
                Total Pages
              </label>
              <input
                id="input-total-pages"
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 496"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-current-page" className="form-label">
                Current Page
              </label>
              <input
                id="input-current-page"
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="input-summary" className="form-label">
              Summary / Synopsis (Optional)
            </label>
            <textarea
              id="input-summary"
              rows={3}
              className="form-textarea"
              placeholder="Brief description or personal motivation..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="btn-submit-book"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
