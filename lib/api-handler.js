const { getSession } = require('./session');
const { getUserById, tryIncrementUsage, DEFAULT_LIMIT } = require('./auth');

/**
 * Wraps an API module (with .handler) so every call:
 * 1. Validates session
 * 2. Atomically increments usage (or 429)
 * 3. Runs the handler
 */
function withUsageLimit(apiModule) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    try {
      const session = await getSession(req, res);
      if (!session.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please sign in to use SamApi.'
        });
      }

      const user = await getUserById(session.userId);
      if (!user) {
        session.destroy();
        return res.status(401).json({
          success: false,
          message: 'Session invalid. Please sign in again.'
        });
      }

      const updated = await tryIncrementUsage(session.userId);
      if (!updated) {
        return res.status(429).json({
          success: false,
          message: 'API request limit reached.',
          usage: DEFAULT_LIMIT,
          limit: DEFAULT_LIMIT,
          remaining: 0
        });
      }

      // Temporarily capture json so we can inject usage
      const originalJson = res.json.bind(res);
      let responded = false;

      res.json = function (body) {
        responded = true;
        if (body && typeof body === 'object' && body.success !== false) {
          body.usage = {
            used: updated.usage,
            limit: updated.limit || DEFAULT_LIMIT,
            remaining: Math.max(0, (updated.limit || DEFAULT_LIMIT) - updated.usage)
          };
        }
        return originalJson(body);
      };

      await apiModule.handler(req, res);

      if (!responded && !res.writableEnded) {
        return originalJson({
          success: true,
          usage: {
            used: updated.usage,
            limit: updated.limit || DEFAULT_LIMIT,
            remaining: Math.max(0, (updated.limit || DEFAULT_LIMIT) - updated.usage)
          },
          data: {}
        });
      }
    } catch (err) {
      console.error('[API Error]', err.message);
      if (!res.writableEnded) {
        const isDb =
          err.message &&
          (err.message.includes('MONGODB') ||
            err.message.includes('Mongo') ||
            err.message.includes('connection') ||
            err.message.includes('ECONNREFUSED'));
        return res.status(isDb ? 503 : 500).json({
          success: false,
          message: isDb
            ? 'Database service temporarily unavailable.'
            : 'An unexpected error occurred.'
        });
      }
    }
  };
}

module.exports = { withUsageLimit };
