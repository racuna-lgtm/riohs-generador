export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { cliente, bloque } = req.body;
    
    if (!cliente || !bloque) {
      return res.status(400).json({ error: "Faltan datos del cliente o bloque." });
    }

    const prompt = `Genera un RIOHS completo para la empresa ${cliente.empresa} del rubro ${cliente.rubro}`;
    
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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    
    res.status(200).json({ 
      contenido: data.content[0].text,
      bloque 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Error al generar: " + error.message });
  }
}
