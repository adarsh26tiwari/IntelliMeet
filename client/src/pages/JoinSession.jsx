import React, { useEffect, useRef, useState } from "react";
import { useSession } from "../context/sessionContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useZego } from "../hooks/useZego";
import { API_ENDPOINTS, APP_CONFIG, ROUTES } from "../utils/constants";
import api from "../service/api";
import toast from "react-hot-toast";
import { FaRobot, FaSpinner, FaFileAlt, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import SessionHeader from "../components/session/SessionHeader";
import JoinForm from "../components/session/JoinForm";
import VideoContainer from "../components/session/VideoContainer";
import ParticipantsList from "../components/session/ParticipantsList";

const TABS = [
  { id: "participants", label: "People", icon: "👥" },
  { id: "askAI", label: "Ask AI", icon: "🤖" },
  { id: "documents", label: "Docs", icon: "📄" },
];

const JoinSession = () => {
  const [roomId, setRoomId] = useState("");
  const [localError, setLocalError] = useState("");
  const [sessionJoined, setSessionJoined] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("participants");
  const [documents, setDocuments] = useState([]);
  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState(null);

  const zegoJoinedRef = useRef(false);
  const [searchParams] = useSearchParams();
  const { joinSession, getSession, loading, error } = useSession();
  const navigate = useNavigate();

  const {
    isJoined, userHasJoined, error: zegoError,
    loading: zegoLoading, containerRef, joinZegoRoom, leaveZegoRoom,
  } = useZego();

  useEffect(() => {
    const urlRoomId = searchParams.get("roomId");
    if (urlRoomId) setRoomId(urlRoomId);
  }, [searchParams]);

  const handleChange = (e) => {
    setRoomId(e.target.value.toUpperCase().trim());
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (!roomId) { setLocalError("Please enter a room ID"); return; }
    const result = await joinSession(roomId);
    if (result.success) {
      setSessionInfo(result.session);
      setSessionJoined(true);
      fetchDocuments(result.session.id);
      if (result.session.isHost) navigate(`${ROUTES.HOST}?roomId=${roomId}`);
    }
  };

  useEffect(() => {
    if (!sessionJoined || !roomId || zegoJoinedRef.current) return;
    let timeoutId;
    const joinZego = async () => {
      if (containerRef.current) {
        zegoJoinedRef.current = true;
        const result = await joinZegoRoom(roomId);
        if (!result.success) zegoJoinedRef.current = false;
      } else {
        timeoutId = setTimeout(joinZego, 200);
      }
    };
    joinZego();
    return () => {
      clearTimeout(timeoutId);
      if (zegoJoinedRef.current) { leaveZegoRoom(); zegoJoinedRef.current = false; }
    };
  }, [sessionJoined, roomId]);

  useEffect(() => {
    if (!sessionJoined || !roomId) return;
    const interval = setInterval(async () => {
      const res = await getSession(roomId);
      if (res.success) setSessionInfo(res.session);
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionJoined, roomId]);

  const fetchDocuments = async (sessionId) => {
    try {
      const res = await api.get(`${API_ENDPOINTS.RAG.DOCUMENTS}?sessionId=${sessionId}`);
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!askQuery.trim() || !sessionInfo) return;
    setAskLoading(true);
    setAskAnswer(null);
    try {
      const res = await api.post(API_ENDPOINTS.RAG.ASK, {
        query: askQuery,
        sessionId: sessionInfo.id,
      });
      setAskAnswer(res.data);
    } catch {
      toast.error("Failed to get answer");
    } finally {
      setAskLoading(false);
    }
  };

  const handleLeave = async () => {
    if (zegoJoinedRef.current) { await leaveZegoRoom(); zegoJoinedRef.current = false; }
    if (sessionJoined) await api.post(API_ENDPOINTS.SESSION.LEAVE, { roomId });
    navigate(ROUTES.DASHBOARD);
  };

  const handleFullScreen = () => {
    const el = containerRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen?.() : el.requestFullscreen?.().catch(() => {});
  };

  const openDocument = (doc) => {
    // Backend proxy se serve karo — proper PDF headers milenge
    const url = `${process.env.REACT_APP_API_URL}/rag/download/${doc._id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader
        title={APP_CONFIG.SESSION_CONTENT.HEADER.JOINING_TITLE}
        roomId={sessionJoined ? roomId : ""}
        onBack={() => navigate(ROUTES.DASHBOARD)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!sessionJoined ? (
          <JoinForm
            roomId={roomId}
            error={error || localError}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left — Video ── */}
            <div className="lg:col-span-2">
              <VideoContainer
                containerRef={containerRef}
                isJoined={isJoined}
                userHasJoined={userHasJoined}
                zegoError={zegoError}
                zegoLoading={zegoLoading}
                onFullscreen={handleFullScreen}
                onLeave={handleLeave}
                leaveButtonText={APP_CONFIG.SESSION_CONTENT.VIDEO.LEAVE_BUTTON}
              />
            </div>

            {/* ── Right — Tabs ── */}
            <div className="lg:col-span-1 space-y-4">

              {/* Tab bar */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Participants */}
              {activeTab === "participants" && (
                <ParticipantsList
                  participants={sessionInfo?.participants || []}
                  hostName={sessionInfo?.hostName}
                />
              )}

              {/* Ask AI */}
              {activeTab === "askAI" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FaRobot className="text-purple-600 text-sm" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">Ask AI</h3>
                      <p className="text-xs text-gray-400">Powered by Groq · Llama 3.1</p>
                    </div>
                  </div>

                  <form onSubmit={handleAskAI} className="space-y-3">
                    <textarea
                      value={askQuery}
                      onChange={(e) => setAskQuery(e.target.value)}
                      placeholder="Ask anything about uploaded documents..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all"
                      rows={3}
                    />
                    <button
                      type="submit"
                      disabled={askLoading || !askQuery.trim()}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {askLoading ? (
                        <><FaSpinner className="animate-spin" /> Thinking...</>
                      ) : (
                        <><FaRobot /> Ask AI</>
                      )}
                    </button>
                  </form>

                  {askAnswer && (
                    <div className="space-y-3">
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {askAnswer.answer}
                        </p>
                      </div>
                      {askAnswer.sources?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sources</p>
                          {askAnswer.sources.map((src, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-xs font-medium text-gray-700 truncate">{src.title}</p>
                              <span className="text-xs text-gray-400 ml-2 shrink-0">
                                {(src.relevanceScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => { setAskAnswer(null); setAskQuery(""); }}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        <FaTimes size={10} /> Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {activeTab === "documents" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <FaFileAlt className="text-green-500" />
                      Documents
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {documents.length}
                    </span>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FaFileAlt className="text-gray-300 text-3xl mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No documents uploaded yet</p>
                      <p className="text-xs text-gray-300 mt-1">Host will upload study materials</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-start gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-gray-500">
                              {doc.fileType.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{doc.chunkCount} chunks indexed</p>
                          </div>
                          {doc.fileUrl && (
                            <button
                              onClick={() => openDocument(doc)}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-100 transition-all shrink-0"
                              title="Open document"
                            >
                              <FaExternalLinkAlt size={11} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinSession;