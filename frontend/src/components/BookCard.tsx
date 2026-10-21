import React from 'react';
import type { Book } from '../types';
import { StatusBadge } from './StatusBadge';

interface BookCardProps {
  book: Book;
  onOpenDetails: (book: Book) => void;
  onOpenProgress: (book: Book) => void;
  onDelete: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenDetails,
  onOpenProgress,
  onDelete,
}) => {
  return (
    <article className="book-card" id={`book-card-${book.id}`}>
      <div className="book-card-top">
        <div className="book-card-header">
          <StatusBadge status={book.status} />
          {book.latest_rating && (
            <div
              className="stars-container"
              title={`Rated ${book.latest_rating} / 5`}
              aria-label={`Rated ${book.latest_rating} out of 5 stars`}
            >
              {'★'.repeat(book.latest_rating)}
              {'☆'.repeat(5 - book.latest_rating)}
            </div>
          )}
        </div>

        <h3 className="book-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-author">by {book.author}</p>

        <span className="book-genre-tag">{book.genre}</span>

        {book.summary && <p className="book-summary">{book.summary}</p>}
      </div>

      <div>
        <div className="progress-container">
          <div className="progress-labels">
            <span>
              {book.total_pages
                ? `Page ${book.current_page} of ${book.total_pages}`
                : `Progress`}
            </span>
            <span style={{ fontWeight: 600 }}>{book.progress_percent}%</span>
          </div>
          <div className="progress-bar-bg" role="progressbar" aria-valuenow={book.progress_percent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, book.progress_percent))}%` }}
            />
          </div>
        </div>

        {book.isbn && (
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            ISBN: {book.isbn}
          </div>
        )}

        <div className="card-actions">
          <button
            id={`btn-progress-${book.id}`}
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenProgress(book)}
          >
            📈 Update
          </button>

          <button
            id={`btn-details-${book.id}`}
            className="btn btn-primary btn-sm"
            onClick={() => onOpenDetails(book)}
          >
            Notes {book.notes_count > 0 && `(${book.notes_count})`}
          </button>

          <button
            id={`btn-delete-${book.id}`}
            className="btn btn-danger btn-sm"
            title="Delete Book"
            onClick={() => {
              if (window.confirm(`Delete "${book.title}"?`)) {
                onDelete(book.id);
              }
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </article>
  );
};
