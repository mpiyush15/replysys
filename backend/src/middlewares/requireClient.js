/**
 * Middleware: Require Client
 * Only users with role 'client' can access these routes
 */

export const requireClient = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Not authenticated' 
    });
  }

  // Check if user is client
  if (req.user.role !== 'client') {
    return res.status(403).json({ 
      success: false,
      error: 'Client access only' 
    });
  }

  // Attach their userId to request for data isolation
  req.userId = req.user.userId;

  next();
};

export default requireClient;
