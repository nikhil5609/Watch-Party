const mongoose = require('mongoose');

const { Schema } = mongoose;

const memberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fileVerified: {
      type: Boolean,
      default: false,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { unique: true, sparse: true },
  { _id: false }
);

const videoSchema = new Schema(
  {
    sourceType: {
      type: String,
      enum: ["local"],
      default: "local",
    },

    hash: {
      type: String, // SHA-256 hash
      required: true,
    },

    name: {
      type: String, // optional (UI only)
    },

    size: {
      type: Number, // optional (bytes)
    },
  },
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

    status: {
      type: String,
      enum: ["waiting", "verifying", "ready", "playing"],
      default: "waiting",
    },

    video: {
      type: videoSchema,
      default: null,
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

roomSchema.methods.isMemberVerified = function (userId) {
  const member = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  );
  return member ? member.fileVerified : false;
};

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
