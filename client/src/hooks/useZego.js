import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { joinRoom, leaveRoom } from "../service/zego";

export const useZego = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [userHasJoined, setUserHasJoined] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const joinedRoomIdRef = useRef(null);
  const isJoiningRef = useRef(false);
  const isLeavingRef = useRef(false);
  const { user } = useAuth();

  const joinZegoRoom = useCallback(
    async (roomId) => {
      if (joinedRoomIdRef.current === roomId && isJoined) {
        return { success: true };
      }

      if (isJoiningRef.current) {
        return { success: false, error: "Join room in process" };
      }

      if (!roomId) {
        const errorMessage = "Room Id is required";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      isJoiningRef.current = true;
      setLoading(true);
      setError(null);

      try {
        //wait for container to be avaible with retry mechanism
        let retries = 0;
        const maxRetries = 30;
        while (!containerRef.current && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
        if (!containerRef.current) {
          throw new Error(
            "video container not ready after waiting. Please the page",
          );
        }

        const container = containerRef.current;
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.warn("Container has zero deminsions, waiting a bot more...");
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        await joinRoom(
          roomId,
          user.id,
          user.name,
          container,
          () => {
            //onJoinCall
            setUserHasJoined(true);
          },
          () => {
            //onLeaveCall
            setUserHasJoined(false);
          },
        );
        setIsJoined(true);
        joinedRoomIdRef.current = roomId;
        return {success:true}
      } catch (error) {
        console.error("failed to join zego room", error);
        const errorMessage =
          error.message ||
          "Failed to join room. Please check you camera.microphone permission and try again";
        setError(errorMessage);
        setIsJoined(false);
        setUserHasJoined(false);
        joinedRoomIdRef.current = null;
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
        isJoiningRef.current = false;
      }
    },
    [user],
  );

  const leaveZegoRoom = useCallback(async () => {
    if (isLeavingRef.current || !joinedRoomIdRef.current) {
      return;
    }

    isLeavingRef.current = true;
    try {
      leaveRoom(() => {
        setUserHasJoined(false);
      });
      setIsJoined(false);
      setUserHasJoined(false);
      joinedRoomIdRef.current = null;
    } catch (error) {
      console.error("Error leaving zego room", error);
      setIsJoined(false);
      setUserHasJoined(false);
      joinedRoomIdRef.current = null;
    } finally {
      isLeavingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (joinedRoomIdRef.current && !isLeavingRef.current) {
        try {
          leaveRoom();
        } catch (error) {
          console.error("Error in cleaup leave room", error);
        }
      joinedRoomIdRef.current = null;
          isJoiningRef.current = false;
          isLeavingRef.current = false;
      }
    };
  }, []);

  return {
    //state
    isJoined,
    userHasJoined,
    error,
    loading,
    containerRef,

    //Methods
    joinZegoRoom,
    leaveZegoRoom,
  };
};