import React from 'react';
import type { HealthCheck } from '../types';

interface NavbarProps {
  health: HealthCheck | null;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onOpenAddModal }) => {
  const isConnected = health?.database?.connected ?? false;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="brand">
          <div className="brand-icon" role="img" aria-label="Book Buddy logo">
            📚
          </div>
          <div>
            <h1 className="brand-title">Book Buddy</h1>
            <p className="brand-subtitle">Reading Progress Tracker</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            id="db-health-indicator"
            title={
              isConnected
                ? 'Database Connected (PostgreSQL)'
                : 'Database Disconnected'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: isConnected ? '#6ee7b7' : '#fcd34d',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                display: 'inline-block',
                boxShadow: isConnected
                  ? '0 0 8px rgba(16, 185, 129, 0.6)'
                  : '0 0 8px rgba(245, 158, 11, 0.6)',
              }}
            />
            <span>{isConnected ? 'Postgres Live' : 'Checking DB'}</span>
          </div>

          <button
            id="btn-add-book-header"
            className="btn btn-primary"
            onClick={onOpenAddModal}
          >
            <span>+</span> Add Book
          </button>
        </div>
      </div>
    </header>
  );
};
