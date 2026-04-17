export default async function handler(req, res) {
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
    
    if (!cliente?.empresa || !cliente?.rubro) {
      return res.status(400).json({ error: "Faltan datos de empresa o rubro" });
    }

    const prompt = `Genera un RIOHS (Reglamento Interno de Orden, Higiene y Seguridad) completo y profesional para:

EMPRESA: ${cliente.empresa}
RUBRO: ${cliente.rubro}

El documento debe incluir:
1. Disposiciones generales y objeto del reglamento
2. Organización de la prevención de riesgos
3. Obligaciones del empleador y trabajadores
4. Prohibiciones específicas del rubro
5. Elementos de protección personal
6. Procedimientos de capacitación y entrenamiento
7. Investigación y registro de accidentes
8. Sanciones y procedimientos disciplinarios
9. Disposiciones finales

Genera un documento completo de aproximadamente 5000 palabras, con artículos numerados, específico para el rubro ${cliente.rubro} y adaptado a la legislación chilena. Incluye ejemplos prácticos y procedimientos detallados.`;
    
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
      throw new Error(`Error API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return res.status(200).json({ 
      contenido: data.content[0].text,
      bloque,
      empresa: cliente.empresa,
      rubro: cliente.rubro
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: "Error al generar RIOHS", 
      detalle: error.message 
    });
  }
}
