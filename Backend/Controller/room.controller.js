const generateRoomCode = require("../Utils/generate.roomcode");
const Room = require("../Model/room.model");

const getPopulatedRoom = async (roomId) => {
  return await Room.findById(roomId).populate(
    "members.userId",
    "_id username profilePicture"
  );
};

const createRoom = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
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
      members: [{ userId: req.user._id, fileVerified: false }],
      status: "waiting",
    });

    const populatedRoom = await getPopulatedRoom(room._id);

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Create room error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, message: "Room Id required" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const room = await Room.findOne({ roomCode: roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const userId = req.user._id.toString();

    const alreadyMember = room.members.some(
      (m) => m.userId.toString() === userId
    );

    if (!alreadyMember) {
      room.members.push({ userId, fileVerified: false });
      await room.save();
    }

    const populatedRoom = await getPopulatedRoom(room._id);

    req.io.to(room.roomCode).emit("room-updated", populatedRoom);

    return res.status(200).json({
      success: true,
      message: alreadyMember ? "Already joined room" : "Joined room successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Join room error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const setVideo = async (req, res) => {
  try {
    const { roomId, hash, name, size } = req.body;

    if (!hash) {
      return res.status(400).json({ success: false, message: "Hash required" });
    }

    const room = await Room.findOne({ roomCode: roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only host allowed" });
    }

    room.video = { hash, name, size };
    room.status = "verifying";

    room.members.forEach((m) => {
      m.fileVerified = m.userId.toString() === req.user._id.toString();
    });

    await room.save();

    const populatedRoom = await getPopulatedRoom(room._id);

    req.io.to(room.roomCode).emit("room-updated", populatedRoom);

    return res.status(200).json({
      success: true,
      message: "Video set successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Set video error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyVideo = async (req, res) => {
  try {
    const { roomId, hash } = req.body;
    const userId = req.user._id.toString();

    const room = await Room.findOne({ roomCode: roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (!room.video || room.video.hash !== hash) {
      return res.status(400).json({
        success: false,
        message: "Selected file does not match host video",
      });
    }

    const member = room.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!member) {
      return res.status(403).json({ success: false, message: "Not a room member" });
    }

    member.fileVerified = true;

    const allVerified = room.members.every((m) => m.fileVerified);
    if (allVerified) room.status = "ready";

    await room.save();

    const populatedRoom = await getPopulatedRoom(room._id);

    req.io.to(room.roomCode).emit("room-updated", populatedRoom);

    return res.status(200).json({
      success: true,
      message: allVerified
        ? "Everyone is ready"
        : "File verified successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Verify video error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  setVideo,
  verifyVideo,
};
