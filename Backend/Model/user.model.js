const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },

    googleId: {
      type: String,
    },

    profilePicture: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = async function (plainPassword) {
    return await bcrypt.hash(plainPassword, 10);
};

userSchema.methods.checkPassword = async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
};
userSchema.methods.generateJWT = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.JWT_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};
const User = mongoose.model('User', userSchema);
module.exports = User;
