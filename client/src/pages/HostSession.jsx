import React, { useEffect, useRef, useState } from "react";
import { useSession } from "../context/sessionContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useZego } from "../hooks/useZego";
import { API_ENDPOINTS, APP_CONFIG, ROUTES } from "../utils/constants";
import { copyToClipboard } from "../utils/helpers";
import api from "../service/api";
import toast from "react-hot-toast";
import {
  FaSpinner, FaUpload, FaRobot, FaFileAlt, FaTrash,
  FaTimes, FaExternalLinkAlt,
} from "react-icons/fa";
import SessionHeader from "../components/session/SessionHeader";
import SessionInfoCard from "../components/session/SessionInfoCard";
import VideoContainer from "../components/session/VideoContainer";
import ParticipantsList from "../components/session/ParticipantsList";

const TABS = [
  { id: "participants", label: "People", icon: "👥" },
  { id: "docs_and_ai", label: "Docs & AI", icon: "📄" },
];

const HostSession = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef(null);

  const { currentSession, getSession, clearSession } = useSession();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const zegoJoinedRef = useRef(false);

  const roomId = searchParams.get("roomId") || currentSession?.roomId;

  const {
    isJoined, userHasJoined, error: zegoError,
    loading: zegoLoading, containerRef, joinZegoRoom, leaveZegoRoom,
  } = useZego();

  const handleFullScreen = () => {
    const el = containerRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen?.() : el.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      if (!roomId) { navigate(ROUTES.DASHBOARD); return; }
      setLoading(true);
      const result = await getSession(roomId);
      if (!isMounted) return;
      if (result.success) {
        setSessionInfo(result.session);
        fetchDocuments(result.session.id);
      } else navigate(ROUTES.DASHBOARD);
      setLoading(false);
    };
    loadSession();
    return () => { isMounted = false; };
  }, [roomId]);

  useEffect(() => {
    if (!sessionInfo || !roomId || zegoJoinedRef.current) return;
    let isMounted = true;
    let retryTimeout = null;
    const joinZego = async () => {
      if (containerRef.current && isMounted && !zegoJoinedRef.current) {
        zegoJoinedRef.current = true;
        const result = await joinZegoRoom(roomId);
        if (!isMounted) return;
        if (!result.success) zegoJoinedRef.current = false;
      } else if (isMounted && !zegoJoinedRef.current) {
        retryTimeout = setTimeout(joinZego, 200);
      }
    };
    joinZego();
    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (zegoJoinedRef.current) { leaveZegoRoom(); zegoJoinedRef.current = false; }
    };
  }, [sessionInfo?.id, roomId]);

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      const res = await getSession(roomId);
      if (res.success && res.session) {
        setSessionInfo((prev) => {
          if (
            prev &&
            prev.participantCount === res.session.participantCount &&
            prev.status === res.session.status &&
            prev.participants?.length === res.session.participants?.length
          ) return prev;
          return res.session;
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const fetchDocuments = async (sessionId) => {
    try {
      const res = await api.get(`${API_ENDPOINTS.RAG.DOCUMENTS}?sessionId=${sessionId}`);
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !sessionInfo) return;
    const formData = new FormData();
    formData.append("document", file);
    formData.append("title", file.name);
    formData.append("sessionId", sessionInfo.id);
    setUploading(true);
    try {
      await api.post(API_ENDPOINTS.RAG.UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded & processed!");
      fetchDocuments(sessionInfo.id);
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await api.delete(`${API_ENDPOINTS.RAG.DELETE}/${docId}`);
      toast.success("Document deleted");
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      if (viewingDoc?._id === docId) setViewingDoc(null);
    } catch {
      toast.error("Failed to delete document");
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

  const handleCopyRoomId = async () => {
    if (roomId) {
      await copyToClipboard(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getShareableLink = () => `${window.location.origin}/${ROUTES.JOIN}?roomId=${roomId}`;

  const handleCopyLink = async () => {
    await copyToClipboard(getShareableLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = async () => {
    if (!sessionInfo?.isHost) return;
    try {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (fErr) {
          console.error("Fullscreen exit error", fErr);
        }
      }
      if (zegoJoinedRef.current) { await leaveZegoRoom(); zegoJoinedRef.current = false; }
      await api.post(`${API_ENDPOINTS.SESSION.END}/${sessionInfo.id}`);
      clearSession();
      toast.success("Session ended");
      navigate(ROUTES.DASHBOARD);
    } catch {
      toast.error("Failed to end session");
    }
  };

  const handleLeave = async () => {
    if (sessionInfo?.isHost) { handleEndSession(); return; }
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (fErr) {
        console.error("Fullscreen exit error", fErr);
      }
    }
    if (zegoJoinedRef.current) { await leaveZegoRoom(); zegoJoinedRef.current = false; }
    await api.post(API_ENDPOINTS.SESSION.LEAVE, { roomId });
    clearSession();
    navigate(ROUTES.DASHBOARD);
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">{APP_CONFIG.LOADING_MESSAGES.SESSION}</p>
        </div>
      </div>
    );
  }

  if (!sessionInfo) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F13]">
      <SessionHeader
        title={APP_CONFIG.SESSION_CONTENT.HEADER.HOSTING_TITLE}
        roomId={roomId}
        userName={user?.name}
        onBack={handleLeave}
        showEndBUtton={sessionInfo.isHost}
        onEndSession={handleEndSession}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className={`${isSidebarOpen ? "lg:col-span-2" : "lg:col-span-3"} space-y-5 transition-all duration-300`}>
            <SessionInfoCard
              roomId={roomId}
              shareableLink={getShareableLink()}
              status={sessionInfo.status}
              participantCount={sessionInfo.participantCount}
              copied={copied}
              onCopyRoomId={handleCopyRoomId}
              onCopyLink={handleCopyLink}
            />

            <VideoContainer
              containerRef={containerRef}
              isJoined={isJoined}
              userHasJoined={userHasJoined}
              zegoError={zegoError}
              zegoLoading={zegoLoading}
              onFullscreen={handleFullScreen}
              onLeave={handleLeave}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              leaveButtonText={
                sessionInfo?.isHost
                  ? APP_CONFIG.SESSION_CONTENT.VIDEO.END_BUTTON
                  : APP_CONFIG.SESSION_CONTENT.VIDEO.LEAVE_BUTTON
              }
            />

            {/* Upload area — host only */}
            {sessionInfo.isHost && (
              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 transition-colors duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                    <FaUpload className="text-blue-500" />
                    Upload Study Material
                  </h3>
                  {uploading && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <FaSpinner className="animate-spin" /> Processing...
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center gap-2 w-full py-4 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all text-sm font-medium
                    ${uploading
                      ? "border-blue-200 bg-blue-50 text-blue-400 cursor-not-allowed dark:border-blue-900 dark:bg-blue-950/20"
                      : "border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/10"
                    }`}
                >
                  <FaUpload />
                  {uploading ? "Uploading & indexing..." : "Click to upload PDF, TXT, or DOCX"}
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Max 10MB · Processed by AI for Q&A</p>
              </div>
            )}
          </div>

          {/* ── Right column (Sidebar) ── */}
          {isSidebarOpen && (
            <div className="lg:col-span-1 space-y-4">

              {/* Tab bar */}
              <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-1 flex gap-1 transition-colors duration-300">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Participants Tab */}
              {activeTab === "participants" && (
                <ParticipantsList
                  participants={sessionInfo.participants}
                  hostName={sessionInfo.hostName}
                />
              )}

              {/* Consolidated Docs & AI Tab */}
              {activeTab === "docs_and_ai" && (
                <div className="space-y-4">
                  {/* Documents section */}
                  <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-3 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                        <FaFileAlt className="text-green-500" />
                        Session Documents
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {documents.length}
                      </span>
                    </div>

                    {documents.length === 0 ? (
                      <div className="text-center py-6">
                        <FaFileAlt className="text-gray-300 dark:text-gray-700 text-3xl mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No documents yet</p>
                        {sessionInfo.isHost && (
                          <p className="text-xs text-gray-400 mt-1">Upload materials using the panel on the left</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {documents.map((doc) => (
                          <div
                            key={doc._id}
                            className="group flex items-start gap-3 bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-3 transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                {doc.fileType.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{doc.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Uploaded by: {doc.uploadedBy?.name || "Host"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Time: {new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {doc.fileUrl && (
                                <button
                                  onClick={() => openDocument(doc)}
                                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/45 transition-all"
                                  title="Open document"
                                >
                                  <FaExternalLinkAlt size={11} />
                                </button>
                              )}
                              {sessionInfo.isHost && (
                                <button
                                  onClick={() => handleDeleteDocument(doc._id)}
                                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-900/45 transition-all"
                                  title="Delete"
                                >
                                  <FaTrash size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ask AI Section */}
                  <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-4 transition-colors duration-300">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <FaRobot className="text-purple-600 dark:text-purple-400 text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Ask AI</h3>
                        <p className="text-xs text-gray-400">Powered by Groq · Llama 3.1</p>
                      </div>
                    </div>

                    <form onSubmit={handleAskAI} className="space-y-3">
                      <textarea
                        value={askQuery}
                        onChange={(e) => setAskQuery(e.target.value)}
                        placeholder="Ask anything about uploaded documents..."
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white dark:bg-[#22222E] text-gray-900 dark:text-white outline-none transition-all"
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
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl p-3">
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {askAnswer.answer}
                          </p>
                        </div>
                        {askAnswer.sources?.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sources</p>
                            {askAnswer.sources.map((src, i) => (
                              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{src.title}</p>
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
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HostSession;