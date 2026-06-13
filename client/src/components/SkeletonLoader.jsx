import React from 'react';

/**
 * SkeletonLoader — Pulsing shimmer placeholder.
 * Use while data is being fetched to prevent blank screens.
 * @param {{ className?: string, count?: number, height?: string }} props
 */
const SkeletonLoader = ({ className = '', count = 1, height = 'h-4' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${height} rounded-lg ${className} ${i < count - 1 ? 'mb-2' : ''}`}
          style={{ minHeight: '16px' }}
        />
      ))}
    </>
  );
};

/**
 * SessionCardSkeleton — Placeholder while session list is loading.
 */
export const SessionCardSkeleton = () => (
  <div className="im-card rounded-xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-5 w-12 rounded-full" />
    </div>
    <div className="skeleton h-6 w-48" />
    <div className="skeleton h-4 w-32" />
    <div className="skeleton h-4 w-40" />
    <div className="skeleton h-9 w-24 rounded-lg mt-2" />
  </div>
);

export default SkeletonLoader;
