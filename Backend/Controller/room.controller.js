const generateRoomCode = require("../Utils/generate.roomcode");
const Room = require("../Model/room.model");
const { generatePresignedUrl } = require("../Utils/tigris");

const getPopulatedRoom = async (roomId) => {
  return await Room.findOne({ roomCode: roomId }).populate(
    "members.userId",
    "_id username profilePicture"
  );
};

const createRoom = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {movieKey} = req.body;
    if(!movieKey){
      return res.status(400).json({success: false,message: "Movie is not selected"});
    }
    let roomCode;
    let exists = true;
    
    do {
      roomCode = generateRoomCode(6);
      exists = await Room.exists({ roomCode });
    } while (exists);
    
    const movieUrl = await generatePresignedUrl(movieKey)
    if(!movieUrl) return res.status(400).json({status: "failed",message: "Failed to generate Url"});
    console.log(movieUrl);
    
    const room = await Room.create({
      roomCode,
      hostId: req.user._id,
      video: movieUrl,
      members: [{ userId: req.user._id, fileVerified: false }]
    });

    const populatedRoom = await getPopulatedRoom(roomCode);

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
    await Room.updateOne(
      {
        roomCode: roomId,
        "members.userId": { $ne: req.user._id }
      },
      {
        $push: {
          members: { userId: req.user._id}
        }
      }
    );


    const populatedRoom = await getPopulatedRoom(roomId);
    req.io.to(populatedRoom?.roomCode).emit("room-updated", populatedRoom);
    console.log("Populated Room",populatedRoom);
    
    return res.status(200).json({
      success: true,
      message: "Joined room successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Join room error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createRoom,
  joinRoom
};
