import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRobot, FaSpinner, FaFileAlt, FaTimes, FaExternalLinkAlt, FaCalendarAlt, FaClock, FaUser } from "react-icons/fa";
import api from "../service/api";
import { API_ENDPOINTS, ROUTES } from "../utils/constants";
import toast from "react-hot-toast";

const ReviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch session info using /api/session/:sessionId/review
        const sessionRes = await api.get(`${API_ENDPOINTS.SESSION.GET}/${sessionId}/review`);
        setSession(sessionRes.data.data.session);

        // Fetch documents uploaded in this session
        const docsRes = await api.get(`${API_ENDPOINTS.RAG.DOCUMENTS}?sessionId=${sessionId}`);
        setDocuments(docsRes.data.documents || []);
      } catch (err) {
        console.error("Failed to load review data", err);
        toast.error("Failed to load review data or access forbidden");
        navigate(ROUTES.DASHBOARD);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) {
      fetchData();
    }
  }, [sessionId, navigate]);

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!askQuery.trim() || !sessionId) return;
    setAskLoading(true);
    setAskAnswer(null);
    try {
      const res = await api.post(API_ENDPOINTS.RAG.ASK, {
        query: askQuery,
        sessionId: sessionId,
      });
      setAskAnswer(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get answer");
    } finally {
      setAskLoading(false);
    }
  };

  const getDuration = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return "N/A";
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = Math.abs(end - start);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} mins`;
    }
    const diffHours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    return `${diffHours} hr ${remMins} mins`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openDocument = (doc) => {
    const url = `${process.env.REACT_APP_API_URL}/rag/download/${doc._id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F0F13]">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading session summary...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F13] theme-transition pb-12">
      {/* Header bar */}
      <header className="bg-white dark:bg-[#1A1A24] border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Session {session.roomId} Review
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Post-meeting review & materials access
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Session Summary Card */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6 transition-colors duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Classroom Session Summary</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Room ID: <span className="font-mono font-semibold">{session.roomId}</span></p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  Session Ended
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-gray-100 dark:border-gray-800 py-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <FaCalendarAlt size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(session.startedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FaClock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{getDuration(session.startedAt, session.endedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <FaUser size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Host</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{session.hostName}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-3">Participants ({session.participants?.length || 0})</h3>
                <div className="flex flex-wrap gap-2">
                  {session.participants?.map((p) => (
                    <div key={p.userId} className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/60">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center text-2xs font-semibold">
                        {p.userName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Assistant Section */}
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FaRobot size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ask AI Assistant</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Consult materials uploaded during this session</p>
                </div>
              </div>

              <form onSubmit={handleAskAI} className="space-y-4">
                <textarea
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder="Ask a question about the session documents..."
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white dark:bg-[#22222E] text-gray-900 dark:text-white outline-none transition-all"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={askLoading || !askQuery.trim()}
                  className="w-full sm:w-auto py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {askLoading ? (
                    <><FaSpinner className="animate-spin" /> Fetching Answer...</>
                  ) : (
                    <><FaRobot /> Ask AI</>
                  )}
                </button>
              </form>

              {askAnswer && (
                <div className="mt-6 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2">Answer</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {askAnswer.answer}
                    </p>
                  </div>
                  {askAnswer.sources?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sources</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {askAnswer.sources.map((src, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700/50">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{src.title}</p>
                            <span className="text-xs text-gray-400 ml-2 shrink-0">
                              {(src.relevanceScore * 100).toFixed(0)}% match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { setAskAnswer(null); setAskQuery(""); }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5"
                  >
                    <FaTimes size={10} /> Clear Assistant Output
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Uploaded Documents */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4 transition-colors duration-300 sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <FaFileAlt className="text-green-500" />
                  Uploaded Materials
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {documents.length}
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  <FaFileAlt className="text-gray-300 dark:text-gray-700 text-4xl mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No documents uploaded</p>
                  <p className="text-xs text-gray-400 mt-1">No study materials were index during this meeting.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="group flex items-start gap-3 bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-800/60 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          {doc.fileType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{doc.title}</p>
                        <p className="text-2xs text-gray-400 mt-0.5">
                          By: {doc.uploadedBy?.name || "Host"}
                        </p>
                        <p className="text-2xs text-gray-400 mt-0.5">
                          Uploaded: {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {doc.fileUrl && (
                        <button
                          onClick={() => openDocument(doc)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shrink-0"
                          title="View PDF"
                        >
                          <FaExternalLinkAlt size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewSession;
