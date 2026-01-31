const express = require('express');
const passport = require('passport');
const { verifyToken } = require('../Middleware/auth.middleware');
const {
  createUser,
  loginUser,
  logoutUser,
  deleteUser,
  googleCallback,
} = require('../Controller/user.controller');
const {
  signupValidator,
  loginValidator,
} = require('../Validators/User.validators');

const userRouter = express.Router();

/* -------------- MANUAL AUTH ------------- */
userRouter.post('/signup', signupValidator, createUser);
userRouter.post('/login', loginValidator, loginUser);
userRouter.post('/logout', logoutUser);
userRouter.delete('/delete', verifyToken, deleteUser);

/* -------------- GOOGLE AUTH ------------- */
userRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

userRouter.get(
  '/google/callback',
  passport.authenticate('google', { session: false,failureRedirect: process.env.GOOGLE_AUTH_CLIENT_URL_FAILURE,
}),
  googleCallback
);

userRouter.get('/isAuthenticated', verifyToken, (req, res) => {
  res.status(200).json({
    message: 'Authenticated',
    user: req.user,
  });
});

module.exports = userRouter;
