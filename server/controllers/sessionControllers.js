import Session from "../model/Session.js";
import User from "../model/User.js";

export const listSession = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const statusFilter = status && status !== "all" ? { status } : {};

    const session = await Session.find({
      $and: [
        statusFilter,
        {
          $or: [{ host: userId }, { "participants.userId": userId }],
        },
      ],
    }).sort({ createdAt: -1 });

    const result = session.map((s) => ({
      id: s._id,
      roomId: s.roomId,
      hostName: s.hostName,
      status: s.status,
      participantCount: s.participants.length || 0,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      isHost: s.host.toString() === userId.toString(),
    }));

    res.json({
      success: true,
      data: {
        session: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    //genereate unique room Id
    let roomId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomId = Session.generateRoomId();
      const exits = await Session.roomIdExists(roomId);
      if (!exits) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate unique room ID. Please try again",
      });
    }

    const session = await Session.create({
      roomId,
      host: userId,
      hostName: user.name,
      participants: [
        {
          userId: userId,
          userName: user.name,
        },
      ],
    });

    res.status(201).json({
      sucsess: true,
      data: {
        session: {
          id: session._id,
          roomId: session.roomId,
          hostName: session.hostName,
          status: session.status,
          participantCount: session.participants.length,
          startedAt: session.startedAt,
          participants: session.participants,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const JoinSession = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.userId;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: "Room Id is required",
      });
    }

    const session = await Session.findOne({ roomId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found. Please check the roomId",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "This session has ended",
      });
    }

    //check if user already join session
    const alreadyJoined = session.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (alreadyJoined) {
      return res.json({
        success: true,
        data: {
          session: {
            id: session._id,
            roomId: session.roomId,
            hostName: session.hostName,
            status: session.status,
            participantCount: session.participants.length,
            isHost: session.host.toString() === userId.toString(),
            participants: session.participants,
          },
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    session.participants.push({
      userId: userId,
      userName: user.name,
    });

    await session.save();

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          roomId: session.roomId,
          hostName: session.hostName,
          status: session.status,
          participantCount: session.participants.length,
          isHost: session.host.toString() === userId.toString(),
          participants: session.participants,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    let session;
    // Check if roomId is a valid MongoDB ObjectId (24 hex characters)
    if (roomId && roomId.match(/^[0-9a-fA-F]{24}$/)) {
      session = await Session.findById(roomId);
    } else {
      session = await Session.findOne({ roomId });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found. Please check the ID",
      });
    }

    //check if user already join session
    const isParticipant = session.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          roomId: session.roomId,
          hostName: session.hostName,
          status: session.status,
          participantCount: session.participants.length,
          isHost: session.host.toString() === userId.toString(),
          isParticipant,
          participants: session.participants,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found.",
      });
    }

    //verify user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the host can end the session",
      });
    }

    //check if alredy ended
    if (session.status === "ended") {
      return res.status(400).json({
        success: false,
        error: "session has alredy ended",
      });
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          roomId: session.roomId,

          status: session.status,
          endedAt: session.endedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const leaveSession = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.userId;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: "Room Id is required",
      });
    }

    const session = await Session.findOne({ roomId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found.",
      });
    }

    session.participants =  session.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );

    await session.save();

    res.json({
      success: true,
      data: {
        message: "Left session successfully",
      },
    });
  } catch (error) {
    next(error);
  }
};