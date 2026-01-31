const generateRoomCode = require("../Utils/generate.roomcode");
const Room = require("../Model/room.model");

const createRoom = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let roomCode;
    let exists = true;

    do {
      roomCode = generateRoomCode(6);
      exists = await Room.exists({ roomCode });
    } while (exists);

    const room = await Room.create({
      roomCode,
      hostId: req.user._id,
      members: [{ userId: req.user._id }],
    });
    const populatedRoom = await Room.findById(room._id)
      .populate('members.userId', '_id username profilePicture');

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating room",
    });
  }
}

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room Id is required",
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const room = await Room.findOne({ roomCode: roomId })
      .populate('members.userId', '_id username profilePicture');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room does not exist",
      });
    }

    const userId = req.user._id.toString();

    const alreadyMember = room.members.find(
      (m) => {
        return m.userId?._id.toString() === userId
      }
    );

    if (alreadyMember) {
      return res.status(200).json({
        success: true,
        message: "Already joined room",
        room,
      });
    }

    // add new member
    room.members.push({
      userId,
      fileVerified: false,
    });

    await room.save();

    return res.status(200).json({
      success: true,
      message: "Joined room successfully",
      room,
    });
  } catch (error) {
    console.error("Room Join request error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while joining room",
    });
  }
};

const setVideo = async (req, res) => {
  try {
    const { roomId, hash, name, size } = req.body;

    if (!hash) {
      return res.status(400).json({ error: "File hash is required" });
    }

    const room = await Room.findOne({ roomCode: roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (!room.isHost(req.user.id)) {
      return res.status(403).json({ error: "Only host can set video" });
    }

    room.video = { hash, name, size };
    room.status = "verifying";

    room.members.forEach(member => {
      member.fileVerified = false;
    });

    room.members.forEach(member => {
      member.fileVerified =
        member.userId.toString() === req.user.id.toString();
    });


    await room.save();

    res.status(200).json({
      success: true,
      room,
      message: "Video info saved successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const verifyVideo = async (req, res) => {
  try {
    const { roomId, hash } = req.body;
    const userId = req.user.id;

    if (!hash) {
      return res.status(400).json({ error: "File hash is required" });
    }

    const room = await Room.findOne({ roomCode: roomId });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (!room.video || !room.video.hash) {
      return res.status(400).json({
        error: "No video selected by host yet",
      });
    }

    const member = room.members.find(
      (m) => m.userId.toString() === userId.toString()
    );

    if (!member) {
      return res.status(403).json({
        error: "You are not a member of this room",
      });
    }

    if (room.video.hash !== hash) {
      return res.status(400).json({
        error: "Selected file does not match host video",
      });
    }

    member.fileVerified = true;

    const allVerified = room.members.every(
      (m) => m.fileVerified === true
    );

    if (allVerified) {
      room.status = "ready";
    }

    await room.save();

    res.status(200).json({
      success: true,
      room,
      message: allVerified
        ? "File verified. Everyone is ready."
        : "File verified successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};



module.exports = {
  createRoom, joinRoom, setVideo, verifyVideo
};
