import React, { useEffect, useRef, useState } from "react";
import { useSession } from "../context/sessionContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useZego } from "../hooks/useZego";
import { API_ENDPOINTS, APP_CONFIG, ROUTES } from "../utils/constants";
import { copyToClipboard } from "../utils/helpers";
import api from "../service/api";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import SessionHeader from "../components/session/SessionHeader";
import SessionInfoCard from "../components/session/SessionInfoCard";
import VideoContainer from "../components/session/VideoContainer";
import ParticipantsList from "../components/session/ParticipantsList";

const HostSession = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { currentSession, getSession, clearSession } = useSession();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const zegoJoinedRef = useRef(false);

  const roomId = searchParams.get("roomId") || currentSession?.roomId;

  const {
    isJoined,
    userHasJoined,
    error: zegoError,
    loading: zegoLoading,
    containerRef,
    joinZegoRoom,
    leaveZegoRoom,
  } = useZego();

  const handleFullScreen = () => {
    const videoContainer = containerRef.current;
    if (!videoContainer) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      videoContainer.requestFullscreen?.().catch(() => {});
    }
  };

  //load session information

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      if (!roomId) {
        navigate(ROUTES.DASHBOARD);
        return;
      }

      setLoading(true);
      const result = await getSession(roomId);

      if (!isMounted) return;

      if (result.success) {
        setSessionInfo(result.session);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
      setLoading(false);
    };
    loadSession();

    return () => {
      isMounted = false;
    };
  }, [roomId, getSession, navigate]);

  //JOIN ZEGGO room after container is mounted adn session is loaded

  useEffect(() => {
    if (!sessionInfo || !roomId || zegoJoinedRef.current) {
      return;
    }

    let isMounted = true;
    let retryTimout = null;

    //wait for conatiner to be ready
    const joinZego = async () => {
      if (containerRef.current && isMounted && !zegoJoinedRef.current) {
        zegoJoinedRef.current = true;
        const zegoResult = await joinZegoRoom(roomId);
        if (!isMounted) return;

        if (!zegoResult.success) {
          console.error("failed to join zego room ", zegoResult.error);
          zegoJoinedRef.current = false;
        }
      } else if (isMounted && !zegoJoinedRef.current) {
        retryTimout = setTimeout(joinZego, 200);
      }
    };

    joinZego();

    //cleanup on unmount or roomId chnage
    return () => {
      isMounted = false;
      if (retryTimout) {
        clearTimeout(retryTimout);
      }

      if (zegoJoinedRef.current) {
        leaveZegoRoom();
        zegoJoinedRef.current = false;
      }
    };
  }, [sessionInfo?.id, roomId]);

  //poll participant to keep list updated
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
          ) {
            return prev;
          }
          return res.session;
        });
      }
    }, 5000); //every 5s

    return () => clearInterval(interval);
  }, [roomId, getSession]);

  const handleCopyRoomId = async () => {
    if (roomId) {
      const success = await copyToClipboard(roomId);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const getShareableLink = () => {
    const baseURL = window.location.origin;
    return `${baseURL}/${ROUTES.JOIN}?roomId=${roomId}`;
  };

  const handleCopyLink = async () => {
    const link = getShareableLink();
    const success = await copyToClipboard(link);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  //hanle end session
  const handleEndSession = async () => {
    if (!sessionInfo || !sessionInfo.isHost) return;

    try {
      if (zegoJoinedRef.current) {
        await leaveZegoRoom();
        zegoJoinedRef.current = false;
      }

      await api.post(`${API_ENDPOINTS.SESSION.END}/${sessionInfo.id}`);
      clearSession();
      toast.success("session ended successfully");
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      toast.error("failed to end session. Please try again");
    }
  };

  const handleLeave = async () => {
    if (sessionInfo?.isHost) {
      handleEndSession();
    } else {
      if (zegoJoinedRef.current) {
        await leaveZegoRoom();
        zegoJoinedRef.current = false;
      }

      await api.post(API_ENDPOINTS.SESSION.LEAVE, { roomId });
      clearSession();
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.DASHBOARD);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {APP_CONFIG.LOADING_MESSAGES.SESSION}
          </p>
        </div>
      </div>
    );
  }

  if (!sessionInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SessionHeader
        title={APP_CONFIG.SESSION_CONTENT.HEADER.HOSTING_TITLE}
        roomId={roomId}
        userName={user?.name}
        onBack={handleBack}
        showEndBUtton={sessionInfo.isHost}
        onEndSession={handleEndSession}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
              leaveButtonText={
                sessionInfo?.isHost
                  ? APP_CONFIG.SESSION_CONTENT.VIDEO.END_BUTTON
                  : APP_CONFIG.SESSION_CONTENT.VIDEO.LEAVE_BUTTON
              }
            />
          </div>

          <div className="lg:col-span-1">
            <ParticipantsList
              participants={sessionInfo.participants}
              hostName={sessionInfo.hostName}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HostSession;