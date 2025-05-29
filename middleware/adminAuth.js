
const adminAuth = (req, res, next) => {
    // For now, we'll use a simple check. In production, you'd have proper admin roles
    if (req.user.email === 'admin@microhire.com' || req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
  };
  
  module.exports = adminAuth;
  