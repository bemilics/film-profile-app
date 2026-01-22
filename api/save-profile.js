// Caracteres para el código (sin 0, O, 1, I, l para evitar confusión)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const TTL_DAYS = 30;

// Try to import Vercel KV, but handle if it's not available
let kv = null;
try {
  kv = require('@vercel/kv').kv;
} catch (error) {
  console.warn('[save-profile] Vercel KV not available, using fallback mode');
}

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

    // Generar código
    let code;
    let kvAvailable = false;

    // Check if KV is available
    if (kv) {
      try {
        // Try to use KV
        let attempts = 0;
        const MAX_ATTEMPTS = 10;

        do {
          code = generateCode();
          const existing = await kv.get(`profile:${code}`);
          if (!existing) break;
          attempts++;
        } while (attempts < MAX_ATTEMPTS);

        if (attempts >= MAX_ATTEMPTS) {
          console.error('[save-profile] Failed to generate unique code after max attempts');
          code = generateCode(); // Use non-unique code as fallback
        } else {
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

          kvAvailable = true;
          console.log(`[save-profile] Profile saved with code: ${code} (KV enabled)`);
        }
      } catch (kvError) {
        console.error('[save-profile] KV error:', kvError.message);
        // Fallback: just generate a code without saving
        code = generateCode();
      }
    } else {
      // KV not available, just generate a code
      code = generateCode();
      console.log(`[save-profile] Generated code: ${code} (KV not configured - code won't be retrievable)`);
    }

    const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    return res.status(200).json({
      code,
      expiresAt,
      kvEnabled: kvAvailable,
      warning: !kvAvailable ? 'Code generated but not saved - Vercel KV not configured' : undefined
    });

  } catch (error) {
    console.error('[save-profile] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
