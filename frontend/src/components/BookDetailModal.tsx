import React, { useEffect, useState } from 'react';
import type { Book, BookDetail } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshBook: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onRefreshBook,
}) => {
  if (!isOpen || !book) return null;

  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Note state
  const [noteContent, setNoteContent] = useState('');
  const [noteRating, setNoteRating] = useState<number | undefined>(undefined);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBook(book.id);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [book.id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);

    if (!noteContent.trim()) {
      setNoteError('Note content cannot be empty.');
      return;
    }

    try {
      setSubmittingNote(true);
      await api.createBookNote(book.id, noteContent.trim(), noteRating);
      setNoteContent('');
      setNoteRating(undefined);
      await fetchDetails();
      onRefreshBook();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to add note or rating.';
      setNoteError(msg);
    } finally {
      setSubmittingNote(false);
    }
  };

  const isCompleted = book.status === 'COMPLETED';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-labelledby="modal-detail-title"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ marginBottom: '6px' }}>
              <StatusBadge status={book.status} />
            </div>
            <h2 id="modal-detail-title" className="modal-title">
              {book.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              by {book.author} • <span style={{ color: '#a5b4fc' }}>{book.genre}</span>
            </p>
          </div>
          <button
            id="btn-close-detail-modal"
            className="modal-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading details...</p>}
        {error && <div className="form-error">{error}</div>}

        {detail && (
          <div>
            {/* Overview */}
            {detail.summary && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Summary
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  {detail.summary}
                </p>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                marginBottom: '24px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Progress: </span>
                <strong>{detail.progress_percent}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Pages: </span>
                <strong>
                  {detail.current_page} {detail.total_pages ? `/ ${detail.total_pages}` : ''}
                </strong>
              </div>
              {detail.isbn && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>ISBN: </span>
                  <strong>{detail.isbn}</strong>
                </div>
              )}
              {detail.completed_at && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Completed: </span>
                  <strong>{new Date(detail.completed_at).toLocaleDateString()}</strong>
                </div>
              )}
            </div>

            {/* Notes & Reviews */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Personal Notes & Reviews ({detail.notes.length})
              </h3>

              {detail.notes.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  No notes added yet. Record your thoughts or key takeaways below.
                </p>
              ) : (
                <div className="notes-list">
                  {detail.notes.map((n) => (
                    <div key={n.id} className="note-item">
                      <div className="note-item-header">
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        {n.rating && (
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                            {'★'.repeat(n.rating)}
                            {'☆'.repeat(5 - n.rating)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{n.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ marginTop: '16px' }}>
                {noteError && (
                  <div className="form-error" style={{ marginBottom: '8px' }}>
                    {noteError}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <textarea
                    id="input-note-content"
                    rows={2}
                    className="form-textarea"
                    placeholder="Write a thought, quote, or review..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    {isCompleted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Rating:</span>
                        <select
                          id="select-note-rating"
                          className="form-select"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                          value={noteRating ?? ''}
                          onChange={(e) =>
                            setNoteRating(e.target.value ? parseInt(e.target.value, 10) : undefined)
                          }
                        >
                          <option value="">No rating</option>
                          <option value="5">★★★★★ (5 - Masterpiece)</option>
                          <option value="4">★★★★☆ (4 - Great)</option>
                          <option value="3">★★★☆☆ (3 - Good)</option>
                          <option value="2">★★☆☆☆ (2 - Fair)</option>
                          <option value="1">★☆☆☆☆ (1 - Poor)</option>
                        </select>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        ℹ️ Star ratings unlock once the book is COMPLETED.
                      </span>
                    )}
                  </div>

                  <button
                    id="btn-submit-note"
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={submittingNote}
                  >
                    {submittingNote ? 'Adding...' : '+ Add Note'}
                  </button>
                </div>
              </form>
            </div>

            {/* Reading History */}
            {detail.progress_updates.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Progress Log History
                </h4>
                <div className="history-list">
                  {detail.progress_updates.slice(0, 5).map((p) => (
                    <div key={p.id} className="history-item">
                      <span>Logged page {p.pages_read}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {p.progress_percent}% • {new Date(p.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
