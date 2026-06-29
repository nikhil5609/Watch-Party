const mongoose = require('mongoose');

const { Schema } = mongoose;

const memberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { unique: true, sparse: true },
  { _id: false }
);


const roomSchema = new Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    video: {
      type: String,
      default: null,
    },
    videoTitle:{
      type: String,
      default: "CineSync"
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);



roomSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

roomSchema.methods.isHost = function (userId) {
  return this.hostId.toString() === userId.toString();
};


const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
