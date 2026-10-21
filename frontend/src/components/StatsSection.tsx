import React from 'react';
import type { ReadingStats } from '../types';

interface StatsSectionProps {
  stats: ReadingStats | null;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <section aria-label="Reading Statistics" style={{ marginBottom: '24px' }}>
      <div className="stats-grid">
        <div className="stat-card" id="stat-total-books">
          <div className="stat-header">
            <span>Library Total</span>
            <span>📚</span>
          </div>
          <div className="stat-value">{stats.total_books}</div>
          <div className="stat-subtext">
            {stats.total_pages_library > 0
              ? `${stats.total_pages_library.toLocaleString()} pages logged`
              : 'All tracked books'}
          </div>
        </div>

        <div className="stat-card" id="stat-reading">
          <div className="stat-header">
            <span>Currently Reading</span>
            <span>📖</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--status-reading)' }}>
            {stats.currently_reading}
          </div>
          <div className="stat-subtext">Active books in progress</div>
        </div>

        <div className="stat-card" id="stat-completed">
          <div className="stat-header">
            <span>Completed</span>
            <span>🏆</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--status-completed)' }}>
            {stats.completed}
          </div>
          <div className="stat-subtext">Finished reads</div>
        </div>

        <div className="stat-card" id="stat-completion-rate">
          <div className="stat-header">
            <span>Completion Rate</span>
            <span>📈</span>
          </div>
          <div className="stat-value" style={{ color: '#a78bfa' }}>
            {stats.completion_percentage}%
          </div>
          <div className="stat-subtext">
            {stats.wishlist} in wishlist
          </div>
        </div>
      </div>

      {stats.genre_breakdown && stats.genre_breakdown.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-muted)',
              marginBottom: '10px',
            }}
          >
            Genre Distribution
          </div>
          <div className="genre-pills">
            {stats.genre_breakdown.map((g) => (
              <span key={g.genre} className="genre-pill">
                <strong>{g.genre}</strong>: {g.count} ({g.percentage}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
