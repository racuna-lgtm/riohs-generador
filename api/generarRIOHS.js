export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { cliente, tipo, documento_existente, alertas_seleccionadas } = req.body || {};

    if (!cliente?.empresa || !cliente?.rubro) {
      return res.status(400).json({ error: 'Faltan datos del cliente' });
    }

    const ctx = `
- Razón Social: ${cliente.empresa}
- RUT: ${cliente.rut || 'No especificado'}
- Rubro: ${cliente.rubro}
- Actividad económica: ${cliente.actividad_economica || 'No especificada'}
- Región: ${cliente.region || 'No especificada'}
- N° trabajadores: ${cliente.num_trabajadores || 'No especificado'}
- Sistema de turnos: ${cliente.turnos || 'Jornada estándar'}
- Sindicato: ${cliente.tiene_sindicato ? 'Sí' : 'No'}
- Organismo Administrador: ${cliente.organismo_administrador || 'No especificado'}
- Representante Legal: ${cliente.representante_legal || 'No especificado'}
- Dirección: ${cliente.direccion || 'No especificada'}
- Normativas a incorporar: ${cliente.normativas_activas || 'Todas las obligatorias'}`.trim();

    let prompt = '';

    if (tipo === 'nuevo') {
      prompt = `Eres un experto en legislación laboral chilena con acceso a búsqueda web en tiempo real.

PASO 1 — ANTES de redactar, busca en internet:
- "normativa laboral chilena ${new Date().getFullYear()} RIOHS"
- "DS 44 2023 reglamento SSO Chile actualización"
- "Ley Karin 21643 protocolo reglamento vigente"
- "leyes laborales Chile Diario Oficial ${new Date().getFullYear()}"
- Normativa específica para el rubro: "${cliente.rubro} Chile seguridad laboral"

PASO 2 — Con la normativa actualizada que encontraste, genera el RIOHS completo.

DATOS DE LA EMPRESA:
${ctx}

ESTRUCTURA (mínimo 80 artículos, todos completamente redactados, sin placeholders):

# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
## ${cliente.empresa.toUpperCase()}
### Rubro: ${cliente.rubro} | ${new Date().getFullYear()}

## ÍNDICE GENERAL (tabla: Título | Materia | Artículos)

## TÍTULO I: DISPOSICIONES GENERALES
## TÍTULO II: DEL INGRESO Y CONTRATACIÓN
## TÍTULO III: JORNADA DE TRABAJO (incluye ${cliente.turnos || 'jornada estándar'})
## TÍTULO IV: REMUNERACIONES
## TÍTULO V: OBLIGACIONES DEL TRABAJADOR
## TÍTULO VI: PROHIBICIONES DEL TRABAJADOR
## TÍTULO VII: ORDEN Y DISCIPLINA (sanciones según Código del Trabajo)
## TÍTULO VIII: HIGIENE Y SEGURIDAD (riesgos específicos de ${cliente.rubro})
## TÍTULO IX: ACCIDENTES Y ENFERMEDADES PROFESIONALES (${cliente.organismo_administrador || 'organismo administrador'})
## TÍTULO X: LEY KARIN N°21.643 — PROTOCOLO ACOSO LABORAL Y SEXUAL (completo con plazos legales)
## TÍTULO XI: TEMER — TRASTORNOS MUSCULOESQUELÉTICOS
## TÍTULO XII: FACTORES DE RIESGO PSICOSOCIAL (ISTAS21)
## TÍTULO XIII: MANEJO MANUAL DE CARGAS (Ley 20.001, D.S. N°63)
## TÍTULO XIV: PROTECCIÓN MATERNIDAD Y PATERNIDAD
## TÍTULO XV: PROTECCIÓN DE DATOS PERSONALES (Ley 21.719)
## TÍTULO XVI: DISPOSICIONES FINALES

## NORMATIVA DE REFERENCIA
(lista las leyes y decretos vigentes que usaste, con fecha de publicación)

REGLAS: Redacta cada artículo completo. Cita la normativa real y actualizada. Usa los datos reales de la empresa.`;

    } else if (tipo === 'auditoria_analisis') {
      prompt = `Eres un experto en legislación laboral chilena con acceso a búsqueda web en tiempo real.

PASO 1 — Busca en internet la normativa vigente actualizada:
- "normativa laboral Chile ${new Date().getFullYear()} RIOHS obligatorio"
- "DS 44 2023 Chile actualizaciones ${new Date().getFullYear()}"
- "Ley Karin reglamento vigente Chile"
- "leyes laborales nuevas Chile ${new Date().getFullYear()}"
- Normativa del rubro: "${cliente.rubro} Chile seguridad laboral vigente"

PASO 2 — Audita el documento comparándolo con la normativa ACTUALIZADA que encontraste.

DATOS DE LA EMPRESA:
${ctx}

DOCUMENTO A AUDITAR:
${(documento_existente || '').substring(0, 7000)}

PASO 3 — Devuelve ÚNICAMENTE este JSON (sin texto antes ni después):

\`\`\`json
{
  "alertas": [
    {
      "id": 1,
      "tipo": "falta",
      "prioridad": "alta",
      "titulo": "Título corto del problema",
      "descripcion": "Qué falta, qué cambiar o qué error tiene. Máximo 2 oraciones.",
      "seccion": "Sección o artículo afectado",
      "normativa": "Ley o decreto vigente (con año)"
    }
  ]
}
\`\`\`

TIPOS: "falta" (exigido pero no está) | "cambio" (existe pero desactualizado) | "sobra" (derogado o no aplica) | "error" (contradicción o error formal)
PRIORIDADES: "alta" (multa/sanción) | "media" (recomendado) | "baja" (forma)
Genera 10-30 alertas. Sé específico.`;

    } else if (tipo === 'auditoria_aplicar') {
      const cambios = (alertas_seleccionadas || []).map((a, i) =>
        `${i + 1}. [${a.tipo.toUpperCase()}] ${a.titulo}: ${a.descripcion} — Normativa: ${a.normativa || 'ver legislación vigente'}`
      ).join('\n');

      prompt = `Eres un experto en legislación laboral chilena con acceso a búsqueda web.

PASO 1 — Busca el texto legal exacto de las normativas mencionadas en los cambios para redactar los artículos correctamente:
${(alertas_seleccionadas || []).map(a => a.normativa).filter(Boolean).join(', ')}

PASO 2 — Aplica los cambios al documento original.

EMPRESA: ${ctx}

DOCUMENTO ORIGINAL:
${(documento_existente || '').substring(0, 5000)}

CAMBIOS A APLICAR (${(alertas_seleccionadas || []).length}):
${cambios}

REGLAS:
- Aplica SOLO los cambios listados
- FALTA: agrega el artículo/sección completo en el lugar correcto
- CAMBIO: reescribe el artículo completo con texto legal actualizado
- SOBRA: elimínalo o márcalo como [DEROGADO]
- ERROR: corrígelo
- Entrega el documento COMPLETO en Markdown`;

    } else {
      return res.status(400).json({ error: 'Tipo no válido' });
    }

    // Llamar a Claude con web search habilitado
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API error: ${response.status} — ${JSON.stringify(data)}`);
    }

    // Extraer solo bloques de texto
    const texto = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    if (!texto) throw new Error('Sin respuesta de texto del API');

    return res.status(200).json({ contenido: texto, tipo });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
