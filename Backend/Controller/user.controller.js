const User = require('../Model/user.model');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const BlacklistedToken = require('../Model/blackListedToken');
const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
};

/* --------------SIGNUP--------------*/
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await User.hashPassword(password);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = user.generateJWT();

    res.cookie("token", token, cookieOptions);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* --------------LOGIN---------------*/
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = user.generateJWT();

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* --------------LOGOUT---------------*/
const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies?.token;
        
    if (!token) {
      return res.status(400).json({ error: "Token missing" });
    }
    await BlacklistedToken.create({
      token,
      expiresAt: new Date(Date.now() + (24*100000)),
    });

    res.clearCookie("token", cookieOptions);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* --------------DELETE---------------*/
const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    res.clearCookie("token", cookieOptions);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* --------------GOOGLE CALLBACK---------------*/
const googleCallback = async (req, res) => {
  const token = jwt.sign(
    { userId: req.user._id, email: req.user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie("token", token, cookieOptions);

  res.redirect(`${process.env.GOOGLE_AUTH_CLIENT_URL_SUCCESS}/success`);
};

module.exports = {
  createUser,
  loginUser,
  logoutUser,
  deleteUser,
  googleCallback,
};
