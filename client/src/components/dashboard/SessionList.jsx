import React from 'react';
import { APP_CONFIG } from '../../utils/constants';
import { FaCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { formatDate } from '../../utils/helpers';
import { SessionCardSkeleton } from '../SkeletonLoader';
import { useNavigate } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  if (status === 'active') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold theme-transition"
        style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--color-success)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-live-pulse"
          style={{ background: 'var(--color-success)' }}
        />
        Live
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold theme-transition"
      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-2)' }}
    >
      <FaCircle className="w-1.5 h-1.5" />
      Ended
    </span>
  );
};

const SessionList = ({ sessions, loading, statusFilter, onFilterChange, onRejoinSession }) => {
  const navigate = useNavigate();
  return (
    <div
      className="mt-12 max-w-4xl mx-auto rounded-2xl p-6 im-card theme-transition"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h3 className="text-xl font-semibold im-text">
            {APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.HEADING}
          </h3>
          <p className="text-sm mt-0.5 im-text-2">
            {APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.DESCRIPTION}
          </p>
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="py-2 px-3 rounded-lg text-sm font-medium theme-transition focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          <option value="all">{APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.FILTER_ALL}</option>
          <option value="active">{APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.FILTER_ACTIVE}</option>
          <option value="ended">{APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.FILTER_ENDED}</option>
        </select>
      </div>

      {/* Loading state — skeleton cards */}
      {loading && sessions.length === 0 && (
        <div className="space-y-4">
          <SessionCardSkeleton />
          <SessionCardSkeleton />
          <SessionCardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <div
          className="text-center py-12 rounded-xl theme-transition"
          style={{ background: 'var(--color-surface-2)' }}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium im-text">{APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.EMPTY}</p>
          <p className="text-sm mt-1 im-text-2">Create or join a session to get started.</p>
        </div>
      )}

      {/* Session cards */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="im-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 theme-transition"
            >
              <div className="space-y-1.5">
                {/* Badges row */}
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  {s.isHost && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full theme-transition"
                      style={{
                        background: 'rgba(108,99,255,0.15)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      Host
                    </span>
                  )}
                </div>

                <div className="font-semibold text-base im-text">
                  Room: <span className="font-mono">{s.roomId}</span>
                </div>
                <div className="text-sm im-text-2">Hosted by {s.hostName}</div>
                <div className="text-sm im-text-2">
                  {s.participantCount} participant{s.participantCount !== 1 ? 's' : ''}
                  {' · '}
                  {s.startedAt ? formatDate(s.startedAt) : 'N/A'}
                </div>
              </div>

              {/* Action button */}
              {s.status === 'active' ? (
                <button
                  onClick={() => onRejoinSession(s)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold theme-transition text-white"
                  style={{
                    background: 'var(--color-accent)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(108,99,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {APP_CONFIG.DASHBOARD_CONTENT.SESSIONS_LIST.REJOIN_BUTTON}
                  <FaExternalLinkAlt className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/session/${s.id}/review`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold theme-transition border border-gray-300 dark:border-gray-700"
                  style={{
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Review Session
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionList;