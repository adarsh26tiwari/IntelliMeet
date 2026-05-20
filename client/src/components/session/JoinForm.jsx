import React from "react";
import {
  FaArrowRight,
  FaExclamationCircle,
  FaHome,
  FaInfoCircle,
  FaSpinner,
  FaUsers,
} from "react-icons/fa";
import { APP_CONFIG } from "../../utils/constants";

const JoinForm = ({ roomId, error, loading, onChange, onSubmit }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
          <FaUsers className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {APP_CONFIG.SESSION_CONTENT.JOIN_FORM.HEADING}
        </h1>
        <p className=" text-gray-600">
          {APP_CONFIG.SESSION_CONTENT.JOIN_FORM.DESCRIPTION}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-1-4 border-red-500 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <FaExclamationCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-semibold text-gray-700 mb-3"
          >
            {APP_CONFIG.SESSION_CONTENT.JOIN_FORM.ROOM_ID_LABEL}
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaHome className="h-6 w-6 text-gray-400" />
            </div>

            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={onChange}
              maxLength={12}
              placeholder={
                APP_CONFIG.SESSION_CONTENT.JOIN_FORM.ROOM_ID_PLACEHOLDER
              }
              className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-xl font-mono tracking-wider uppercase transition-colors"
            />
          </div>

          <p className="mt-3 text-xm text-gray-500 text-center">
            <FaInfoCircle className="w-4 h-4 inline mr-1" />
            {APP_CONFIG.SESSION_CONTENT.JOIN_FORM.ROOM_ID_HELP}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white  rounded-xl shadow-lg text-lg font-semibold  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]  `}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              {APP_CONFIG.SESSION_CONTENT.JOIN_FORM.BUTTON_LOADING}
            </>
          ) : (
            <>
              <FaArrowRight className="w-5 h-5 mr-2" />
              {APP_CONFIG.SESSION_CONTENT.JOIN_FORM.BUTTON}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default JoinForm;