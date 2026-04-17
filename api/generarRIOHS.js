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
    const { cliente, bloque } = req.body || {};
    
    if (!cliente || !bloque) {
      return res.status(400).json({ error: "Faltan datos del cliente o bloque." });
    }

    const prompt = `Genera un RIOHS (Reglamento Interno de Orden, Higiene y Seguridad) completo para la empresa ${cliente.empresa} del rubro ${cliente.rubro}. 

El RIOHS debe incluir:
1. Disposiciones generales
2. Organización de la prevención de riesgos
3. Obligaciones y prohibiciones
4. Protección personal
5. Capacitación
6. Investigación de accidentes
7. Sanciones

Genera un documento profesional y detallado de al menos 50 páginas.`;
    
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

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({ 
      contenido: data.content[0].text,
      bloque 
    });

  } catch (error) {
    console.error('Error detallado:', error);
    return res.status(500).json({ 
      error: "Error al generar RIOHS", 
      detalle: error.message 
    });
  }
}
