import React from 'react';
import { FaPlus, FaSpinner, FaUsers } from 'react-icons/fa';
import { APP_CONFIG } from '../../utils/constants';

const ActionCard = ({ onCreateSession, onJoinSession, creating }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
      {/* Host a Session */}
      <div
        className="im-card rounded-2xl p-7 flex flex-col items-center text-center theme-transition"
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-md"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #8B83FF)' }}
        >
          <FaPlus className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold im-text mb-2">
          {APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.HOST.TITLE}
        </h3>
        <p className="text-sm im-text-2 mb-5 leading-relaxed">
          {APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.HOST.DESCRIPTION}
        </p>
        <button
          onClick={onCreateSession}
          disabled={creating}
          className="w-full btn-accent flex items-center justify-center gap-2"
          style={{ padding: '11px 20px' }}
        >
          {creating ? (
            <>
              <FaSpinner className="animate-spin" />
              {APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.HOST.BUTTON_LOADING}
            </>
          ) : (
            APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.HOST.BUTTON
          )}
        </button>
      </div>

      {/* Join a Session */}
      <div
        className="im-card rounded-2xl p-7 flex flex-col items-center text-center theme-transition"
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-md"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
        >
          <FaUsers className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold im-text mb-2">
          {APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.JOIN.TITLE}
        </h3>
        <p className="text-sm im-text-2 mb-5 leading-relaxed">
          {APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.JOIN.DESCRIPTION}
        </p>
        <button
          onClick={onJoinSession}
          className="w-full rounded-lg text-sm font-semibold theme-transition"
          style={{
            padding: '11px 20px',
            background: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-2)';
            e.currentTarget.style.borderColor = 'var(--color-text-2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          {APP_CONFIG.DASHBOARD_CONTENT.ACTION_CARDS.JOIN.BUTTON}
        </button>
      </div>
    </div>
  );
};

export default ActionCard;