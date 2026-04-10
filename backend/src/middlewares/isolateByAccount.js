/**
 * Middleware: Isolate by Account
 * Ensures clients can only access their own data
 * Blocks access to other clients' accountIds
 */

export const isolateByAccount = (req, res, next) => {
  // This middleware should only be used after requireClient
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }

  const userAccountId = req.user.accountId;

  // Check if trying to access different account's data
  if (req.query.accountId && req.query.accountId !== userAccountId) {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied - Cannot view other account data' 
    });
  }

  if (req.body?.accountId && req.body.accountId !== userAccountId) {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied - Cannot modify other account data' 
    });
  }

  // Attach accountId to request
  req.accountId = userAccountId;

  next();
};

export default isolateByAccount;
