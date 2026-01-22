const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Buscar en Vercel KV
    const data = await kv.get(`profile:${code.toUpperCase()}`);

    if (!data) {
      return res.status(404).json({ error: 'Profile not found or expired' });
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    console.log(`Profile retrieved for code: ${code}`);

    return res.status(200).json({
      profile: parsedData.profile,
      createdAt: parsedData.createdAt,
      expiresAt: parsedData.expiresAt
    });

  } catch (error) {
    console.error('Error retrieving profile:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
