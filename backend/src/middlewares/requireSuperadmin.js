/**
 * Middleware: Require Superadmin
 * Only admin@replysys.com can access these routes
 */

export const requireSuperadmin = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Not authenticated' 
    });
  }

  // Check if user is superadmin
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false,
      error: 'Superadmin access only' 
    });
  }

  next();
};

export default requireSuperadmin;
