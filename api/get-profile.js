// Try to import Vercel KV, but handle if it's not available
let kv = null;
try {
  kv = require('@vercel/kv').kv;
} catch (error) {
  console.warn('[get-profile] Vercel KV not available');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Check if KV is available
    if (!kv) {
      console.error('[get-profile] Vercel KV not configured');
      return res.status(503).json({
        error: 'Service not available',
        message: 'Vercel KV not configured - codes cannot be retrieved. Please use screenshots instead.'
      });
    }

    // Buscar en Vercel KV
    const data = await kv.get(`profile:${code.toUpperCase()}`);

    if (!data) {
      console.log(`[get-profile] Profile not found for code: ${code}`);
      return res.status(404).json({ error: 'Profile not found or expired' });
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    console.log(`[get-profile] Profile retrieved for code: ${code}`);

    return res.status(200).json({
      profile: parsedData.profile,
      createdAt: parsedData.createdAt,
      expiresAt: parsedData.expiresAt
    });

  } catch (error) {
    console.error('[get-profile] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
