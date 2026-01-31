const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../Model/blackListedToken');
const User = require('../Model/user.model');

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies?.token;
        if (!token) {
          return res.status(401).json({ error: 'Unauthorized: Token missing' });
        }
        
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
          return res.status(401).json({ error: 'Token has been revoked' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?._id || decoded?.userId || decoded.email).select(
          '-password'
        );
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
};
