import React from 'react';
import type { ReadingStatus } from '../types';

interface FilterBarProps {
  currentStatus: ReadingStatus | 'ALL';
  onStatusChange: (status: ReadingStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  availableGenres,
}) => {
  return (
    <div className="filter-bar" role="search">
      <div className="filter-group">
        <button
          id="filter-all"
          className={`filter-btn ${currentStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => onStatusChange('ALL')}
        >
          All
        </button>
        <button
          id="filter-reading"
          className={`filter-btn ${currentStatus === 'READING' ? 'active' : ''}`}
          onClick={() => onStatusChange('READING')}
        >
          📖 Reading
        </button>
        <button
          id="filter-completed"
          className={`filter-btn ${currentStatus === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => onStatusChange('COMPLETED')}
        >
          ✓ Completed
        </button>
        <button
          id="filter-wishlist"
          className={`filter-btn ${currentStatus === 'WISHLIST' ? 'active' : ''}`}
          onClick={() => onStatusChange('WISHLIST')}
        >
          ★ Wishlist
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {availableGenres.length > 0 && (
          <select
            id="genre-filter-select"
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
          >
            <option value="">All Genres</option>
            {availableGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}

        <input
          id="search-books-input"
          type="text"
          className="search-input"
          placeholder="Search title or author..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
