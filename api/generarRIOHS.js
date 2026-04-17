export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { cliente } = req.body || {};
    
    if (!cliente?.empresa || !cliente?.rubro) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ 
          role: 'user', 
          content: `Genera un RIOHS completo para la empresa ${cliente.empresa} del rubro ${cliente.rubro}. Incluye todos los artículos y disposiciones necesarias según la legislación chilena.` 
        }]
      })
    });

    const data = await response.json();
    
    return res.status(200).json({ 
      contenido: data.content[0].text,
      bloque: { id: 1 }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
