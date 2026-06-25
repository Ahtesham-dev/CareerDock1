const adminMiddleware = (req, res, next) => {
  if (req.userId !== process.env.ADMIN_USER_ID) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = adminMiddleware;
