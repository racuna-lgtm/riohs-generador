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
    // Debug: verificar variables
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Variable ANTHROPIC_API_KEY no configurada",
        debug: "Verifica las environment variables en Vercel"
      });
    }

    const { cliente, bloque } = req.body || {};
    
    if (!cliente || !bloque) {
      return res.status(400).json({ 
        error: "Faltan datos del cliente o bloque.",
        received: { cliente, bloque }
      });
    }

    // Por ahora, devolvamos un RIOHS mock para probar
    const mockRIOHS = `
REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
EMPRESA: ${cliente.empresa}
RUBRO: ${cliente.rubro}

TÍTULO I: DISPOSICIONES GENERALES

Artículo 1°: El presente reglamento tiene por objeto establecer las normas de orden, higiene y seguridad que deben observarse en la empresa ${cliente.empresa}.

TÍTULO II: ORGANIZACIÓN DE LA PREVENCIÓN

Artículo 2°: La empresa mantendrá los servicios de prevención de riesgos que establece la legislación vigente.

[Este es un RIOHS de prueba generado automáticamente]
    `;
    
    return res.status(200).json({ 
      contenido: mockRIOHS,
      bloque,
      debug: "Función funcionando correctamente - usando contenido mock"
    });

  } catch (error) {
    return res.status(500).json({ 
      error: "Error interno", 
      detalle: error.message,
      stack: error.stack
    });
  }
}
