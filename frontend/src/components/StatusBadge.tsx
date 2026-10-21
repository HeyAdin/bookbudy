import React from 'react';
import type { ReadingStatus } from '../types';

interface StatusBadgeProps {
  status: ReadingStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'READING':
      return <span className="badge badge-reading">📖 Reading</span>;
    case 'COMPLETED':
      return <span className="badge badge-completed">✓ Completed</span>;
    case 'WISHLIST':
      return <span className="badge badge-wishlist">★ Wishlist</span>;
    default:
      return <span className="badge">{status}</span>;
  }
};
