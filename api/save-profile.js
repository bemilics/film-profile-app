const { kv } = require('@vercel/kv');

// Caracteres para el código (sin 0, O, 1, I, l para evitar confusión)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const TTL_DAYS = 30;

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'No profile data provided' });
    }

    // Generar código único (retry si existe)
    let code;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      code = generateCode();
      const existing = await kv.get(`profile:${code}`);
      if (!existing) break;
      attempts++;
    } while (attempts < MAX_ATTEMPTS);

    if (attempts >= MAX_ATTEMPTS) {
      return res.status(500).json({ error: 'Failed to generate unique code' });
    }

    // Guardar en Vercel KV con TTL de 30 días
    const dataToSave = {
      code,
      profile,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    };

    await kv.set(`profile:${code}`, JSON.stringify(dataToSave), {
      ex: TTL_DAYS * 24 * 60 * 60 // TTL en segundos
    });

    console.log(`Profile saved with code: ${code}`);

    return res.status(200).json({
      code,
      expiresAt: dataToSave.expiresAt
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
