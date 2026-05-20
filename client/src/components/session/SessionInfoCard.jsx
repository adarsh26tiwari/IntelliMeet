import React from "react";
import { FaCheck, FaCopy, FaInfoCircle } from "react-icons/fa";
import { APP_CONFIG } from "../../utils/constants";

const SessionInfoCard = ({
  roomId,
  shareableLink,
  status,
  participantCount,
  copied,
  onCopyRoomId,
  onCopyLink,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
          <FaInfoCircle className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {APP_CONFIG.SESSION_CONTENT.INFO_CARD.HEADING}
        </h2>
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {APP_CONFIG.SESSION_CONTENT.INFO_CARD.ROOM_ID_LABEL}
        </label>

        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={roomId}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 font-mono text-lg tracking-wider text-center focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={onCopyRoomId}
            className={`px-5 py-3 rounded-lg font-medium transition-all ${copied ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {copied ? (
              <span className="flex items-center">
                <FaCheck className="w-4 h-4 mr-1" />
                {APP_CONFIG.SESSION_CONTENT.INFO_CARD.COPIED_BUTTON}
              </span>
            ) : (
              <span className="flex items-center">
                <FaCopy className="w-4 h-4 mr-1" />
                {APP_CONFIG.SESSION_CONTENT.INFO_CARD.COPY_BUTTON}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {APP_CONFIG.SESSION_CONTENT.INFO_CARD.SHAREABLE_LINK_LABEL}
        </label>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={shareableLink}
            readOnly
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm  focus:border-green-500 transition-colors"
          />
          <button
            onClick={onCopyLink}
            className={`px-5 py-3 rounded-lg font-medium transition-all ${copied ? "bg-green-500 text-white" : "bg-green-600 text-white hover:bg-green-700"}`}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-200">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
            {APP_CONFIG.SESSION_CONTENT.INFO_CARD.STATUS_LABEL}
          </p>
          <p className="text-xl font-bold text-green-600 capitalize">
            {status}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
            {APP_CONFIG.SESSION_CONTENT.INFO_CARD.PARTICIPANTS_LABEL}
          </p>
          <p className="text-xl font-bold text-blue-600 capitalize">
            {participantCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionInfoCard;