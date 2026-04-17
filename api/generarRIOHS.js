export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { cliente, tipo, seccion, documento_existente, alertas_seleccionadas } = req.body || {};

    if (!cliente?.empresa || !cliente?.rubro) {
      return res.status(400).json({ error: 'Faltan datos del cliente' });
    }

    // Placeholder para campos vacíos
    const PENDIENTE = '[⚠️ PENDIENTE — completar antes de entrega al cliente]';

    const ctx = `
Empresa: ${cliente.empresa}
RUT: ${cliente.rut || PENDIENTE}
Rubro: ${cliente.rubro}
Actividad económica: ${cliente.actividad_economica || PENDIENTE}
Región: ${cliente.region || PENDIENTE}
N° trabajadores: ${cliente.num_trabajadores || PENDIENTE}
Turnos: ${cliente.turnos || 'Jornada estándar diurna'}
Sindicato: ${cliente.tiene_sindicato ? 'Sí tiene sindicato' : 'No tiene sindicato'}
Organismo Administrador: ${cliente.organismo_administrador || PENDIENTE}
Representante Legal: ${cliente.representante_legal || PENDIENTE}
Dirección: ${cliente.direccion || PENDIENTE}
Normativas a incorporar: ${cliente.normativas_activas || 'Todas las obligatorias'}`.trim();

    const estilo = `
REGLAS DE REDACCIÓN OBLIGATORIAS:
- Mínimo 8-12 líneas por artículo
- Lenguaje formal-legal chileno
- Cita artículos exactos del Código del Trabajo cuando corresponda
- Incluye datos reales de ${cliente.empresa} en cada artículo
- Desarrolla procedimientos paso a paso con plazos y responsables
- NUNCA uses [COMPLETAR] ni [INSERTAR] — todo redactado
- Cuando un dato de la empresa está marcado como "${PENDIENTE}", mantenlo exactamente así en el documento para que Rafael lo complete antes de la entrega`.trim();

    let prompt = '';
    let usarWebSearch = false;

    // ═══════════════════════════════════════
    // SECCIONES DEL RIOHS NUEVO (1-8)
    // ═══════════════════════════════════════

    if (tipo === 'nuevo' && seccion) {

      if (seccion === 1) {
        usarWebSearch = true;
        prompt = `Eres experto en legislación laboral chilena. Busca: "Ley 21.561 jornada 42 horas Chile vigencia 2026" y "código del trabajo Chile artículo 153 reglamento interno".

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 1 del RIOHS (Arts. 1 al 18):

# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
# ${cliente.empresa.toUpperCase()}
**RUT:** ${cliente.rut || PENDIENTE}
**Rubro:** ${cliente.rubro} | **Región:** ${cliente.region || PENDIENTE}
**Dirección:** ${cliente.direccion || PENDIENTE}
**Organismo Administrador:** ${cliente.organismo_administrador || PENDIENTE}
**Representante Legal:** ${cliente.representante_legal || PENDIENTE}
**Versión 01 — ${new Date().getFullYear()}**

---

En cumplimiento de lo dispuesto en el artículo 153 del Código del Trabajo (DFL N°1/2003), ${cliente.empresa} ha elaborado el presente Reglamento Interno de Orden, Higiene y Seguridad para regular las condiciones, requisitos, derechos, beneficios, obligaciones, prohibiciones y formas de trabajo de todos sus trabajadores. Este reglamento es obligatorio para todos los trabajadores desde el primer día de contrato.

---

## ÍNDICE GENERAL

| N° | TÍTULO | MATERIA | ARTÍCULOS |
|----|--------|---------|-----------|
| I | Disposiciones Generales | Objeto, ámbito y definiciones | 1–8 |
| II | Del Ingreso y Contratación | Requisitos, documentación, contrato | 9–18 |
| III | De la Jornada de Trabajo | Horarios, turnos, control, horas extra | 19–32 |
| IV | De las Remuneraciones | Pago, descuentos, gratificaciones | 33–42 |
| V | Obligaciones del Trabajador | Deberes generales y específicos | 43–52 |
| VI | Prohibiciones del Trabajador | Conductas prohibidas | 53–60 |
| VII | Orden y Disciplina | Sanciones, multas, reclamos | 61–70 |
| VIII | Higiene y Seguridad en el Trabajo | EPP, riesgos, prevención | 71–85 |
| IX | Accidentes del Trabajo y EEPP | Procedimiento, investigación, reporte | 86–95 |
| X | Ley Karin — Protocolo Acoso | Definiciones, denuncia, investigación | 96–110 |
| XI | TEMER | Trastornos musculoesqueléticos | 111–118 |
| XII | Riesgo Psicosocial ISTAS21 | Factores psicosociales | 119–124 |
| XIII | Manejo Manual de Cargas | Ley 20.001, pesos máximos | 125–130 |
| XIV | Protección Maternidad y Paternidad | Fuero, permisos, lactancia | 131–138 |
| XV | Protección de Datos Personales | Ley 21.719, derechos ARCO | 139–144 |
| XVI | Disposiciones Finales | Vigencia, difusión, modificaciones | 145–148 |

---

## TÍTULO I: DISPOSICIONES GENERALES

Redacta los Artículos 1° al 8° completamente desarrollados. Incluye:
- Art. 1°: Objeto y ámbito de aplicación (mínimo 10 líneas)
- Art. 2°: Definición de Reglamento Interno (mínimo 8 líneas)
- Art. 3°: Definiciones de Empleador, Trabajador, Empresa (10+ líneas, una definición por párrafo)
- Art. 4°: Jefe inmediato, Cargo, Faena, Dependencia jerárquica (10+ líneas)
- Art. 5°: Definiciones laborales: Remuneración, Sueldo, Gratificación, Jornada (10+ líneas)
- Art. 6°: Turno, Hora Extraordinaria, Feriado, Licencia Médica (8+ líneas)
- Art. 7°: Obligatoriedad del reglamento, entrega al trabajador, firma de recepción (8+ líneas)
- Art. 8°: Actualización y modificación del reglamento, rol de la Inspección del Trabajo (6+ líneas)

## TÍTULO II: DEL INGRESO Y CONTRATACIÓN

Redacta los Artículos 9° al 18° completamente desarrollados:
- Art. 9°: Requisitos de ingreso (lista completa con 12+ documentos)
- Art. 10°: Exámenes preocupacionales (tipos, quién, cuándo — 10+ líneas)
- Art. 11°: Período de prueba (condiciones, derechos — 8+ líneas)
- Art. 12°: Celebración del contrato (plazos: 15 días / 5 días — 10+ líneas)
- Art. 13°: Contenido mínimo del contrato (literales a) a i) explicados — 12+ líneas)
- Art. 14°: Modificaciones al contrato (procedimiento, anexos — 8+ líneas)
- Art. 15°: Contrato de menores de edad (requisitos, límites — 8+ líneas)
- Art. 16°: Documentos falsos al ingreso (consecuencias legales — 8+ líneas)
- Art. 17°: Actualización de antecedentes personales (6+ líneas)
- Art. 18°: Inclusión laboral Ley 21.015 — cuota 1% para 100+ trabajadores (8+ líneas)`;

      } else if (seccion === 2) {
        usarWebSearch = true;
        prompt = `Eres experto en legislación laboral chilena. Busca: "Ley 21.561 jornada 42 horas distribución Chile 2026" y "vacaciones feriado progresivo código trabajo Chile".

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 2 del RIOHS — Arts. 19 al 42:

## TÍTULO III: DE LA JORNADA DE TRABAJO

- Art. 19°: Jornada ordinaria 42 horas semanales (Ley 21.561). Horarios específicos de ${cliente.empresa} según turnos: ${cliente.turnos || 'jornada diurna'}. Tabla de horarios por planta/área si corresponde. Mínimo 12 líneas.
- Art. 20°: Control de asistencia — tarjetas, biométrico, libro, dispositivos. Consecuencias de no marcar. Mínimo 10 líneas.
- Art. 21°: Ausentismo y atrasos — aviso en 24 horas, descuentos, falta grave por reincidencia. Mínimo 10 líneas.
- Art. 22°: Permisos durante jornada — solicitud escrita, autorización jefe, imputación. Mínimo 8 líneas.
- Art. 23°: Colación — no computable como jornada, espacios habilitados. Art. 34 CT. Mínimo 6 líneas.
- Art. 24°: Horas extraordinarias — definición, autorización escrita previa, límite 2h diarias, recargo 50%. Arts. 30-32 CT. Mínimo 12 líneas.
- Art. 25°: Pago de horas extra — período, modalidad, prescripción. Mínimo 8 líneas.
- Art. 26°: Permanencia sin autorización no genera pago. Mínimo 6 líneas.
- Art. 27°: Descanso dominical y festivos — regla general y excepciones para ${cliente.rubro}. Arts. 35-38 CT. Mínimo 10 líneas.
- Art. 28°: Feriado anual — 15 días hábiles, requisito 1 año, vacaciones progresivas (1 día adicional por cada 3 años). Art. 67-68 CT. Mínimo 12 líneas.
- Art. 29°: Fraccionamiento y acumulación del feriado. Mínimo 8 líneas.
- Art. 30°: Feriado proporcional al término del contrato. Mínimo 8 líneas.
- Art. 31°: Licencias médicas — presentación electrónica/física, plazos, control de reposo. Mínimo 10 líneas.
- Art. 32°: Permisos especiales por fallecimiento — hijo (10 días), cónyuge (7 días), hijo no nato (7 días hábiles), padre/madre (4 días). Tabla. Art. 66 CT. Mínimo 12 líneas.

## TÍTULO IV: DE LAS REMUNERACIONES

- Art. 33°: Definición de remuneración y sus componentes. Qué no es remuneración. Arts. 41-42 CT. Mínimo 12 líneas.
- Art. 34°: Fecha y forma de pago — día 30 o hábil anterior, depósito bancario, anticipo máximo 25%. Mínimo 10 líneas.
- Art. 35°: Sueldo mínimo — proporcionalidad en jornadas parciales. Mínimo 6 líneas.
- Art. 36°: Gratificaciones — modalidades legales 30% utilidades o 25% remuneraciones. Arts. 46-49 CT. Mínimo 10 líneas.
- Art. 37°: Descuentos legales — cotizaciones, impuesto, sindicales, hipotecarios. Límite 30%. Art. 58 CT. Mínimo 10 líneas.
- Art. 38°: Liquidación de sueldo — entrega, firma, componentes. Mínimo 8 líneas.
- Art. 39°: Igualdad de remuneraciones hombre/mujer. Art. 62 bis CT. Procedimiento de reclamo. Mínimo 10 líneas.
- Art. 40°: Procedimiento de reclamo por remuneraciones — plazo respuesta 30 días. Mínimo 10 líneas.
- Art. 41°: Asignaciones no remuneracionales — viáticos, colación, movilización. Mínimo 8 líneas.
- Art. 42°: Finiquito — indemnizaciones, plazos, ratificación ante ministro de fe. Art. 163 CT. Mínimo 12 líneas.`;

      } else if (seccion === 3) {
        prompt = `Eres experto en legislación laboral chilena.

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 3 del RIOHS — Arts. 43 al 70:

## TÍTULO V: OBLIGACIONES DEL TRABAJADOR

- Art. 43°: Obligaciones generales de conducta — cumplir contrato, horarios, marcar asistencia, buena fe. Lista con literales a) a n) mínimo, cada uno explicado. Mínimo 20 líneas.
- Art. 44°: Obligaciones de seguridad — uso EPP, capacitaciones, reportar condiciones inseguras. Lista a) a j). Mínimo 15 líneas.
- Art. 45°: Obligaciones de cuidado de bienes — maquinarias, vehículos, instalaciones. Responsabilidad por daños. Mínimo 10 líneas.
- Art. 46°: Obligaciones de confidencialidad — información reservada, datos de clientes, vigencia post-contrato. Mínimo 10 líneas.
- Art. 47°: Obligaciones de comunicación — ausencias, cambios domicilio, variación cargas. Plazos exactos. Mínimo 10 líneas.
- Art. 48°: Obligaciones ante accidente — qué hacer inmediatamente, reportar, concurrir a ${cliente.organismo_administrador || 'organismo administrador'}. Paso a paso. Mínimo 10 líneas.
- Art. 49°: Obligaciones de trato y convivencia — respeto, no discriminación, ambiente libre de violencia. Mínimo 8 líneas.
- Art. 50°: Obligaciones específicas del rubro ${cliente.rubro} — procedimientos técnicos propios. Mínimo 10 líneas.
- Art. 51°: Obligación de capacitación — asistir, aplicar, certificaciones requeridas. Mínimo 8 líneas.
- Art. 52°: Uso de tecnología — internet, correo corporativo, redes sociales, confidencialidad digital. Mínimo 10 líneas.

## TÍTULO VI: PROHIBICIONES DEL TRABAJADOR

- Art. 53°: Prohibiciones laborales — tiempo extra sin autorización, abandonar puesto, asuntos personales en jornada, cargos en empresas competidoras. Lista a) a h). Mínimo 15 líneas.
- Art. 54°: Prohibiciones de seguridad — no usar EPP, operar sin autorización, desactivar protecciones, trabajar bajo efectos de sustancias, fumar fuera de zonas. Lista a) a j). Mínimo 15 líneas.
- Art. 55°: Prohibiciones sobre bienes — uso personal de vehículos, herramientas, equipos. Mínimo 10 líneas.
- Art. 56°: Prohibición de acoso y discriminación — remisión al Título X. Mínimo 8 líneas.
- Art. 57°: Prohibiciones de información — secretos comerciales, datos clientes, contraseñas. Mínimo 10 líneas.
- Art. 58°: Prohibiciones de control de asistencia — marcar tarjeta ajena, adulterar registros. Falta grave. Mínimo 8 líneas.
- Art. 59°: Prohibición de introducir sustancias — alcohol, drogas, armas. Facultad de control. Mínimo 8 líneas.
- Art. 60°: Otras prohibiciones del rubro ${cliente.rubro}. Mínimo 8 líneas.

## TÍTULO VII: DEL ORDEN Y LA DISCIPLINA

- Art. 61°: Sistema de sanciones — gradualidad: verbal, escrita, con copia Inspección, multa. Procedimiento. Mínimo 12 líneas.
- Art. 62°: Multas — 10%-25% remuneración diaria, destino SENCE/bienestar, notificación. Art. 157 CT. Mínimo 10 líneas.
- Art. 63°: Derecho a reclamo — plazo 3er día hábil, ante Inspección del Trabajo. Mínimo 8 líneas.
- Art. 64°: Causales Art. 160 CT — las 7 causales sin derecho a indemnización, cada una con ejemplos para ${cliente.rubro}. Mínimo 20 líneas.
- Art. 65°: Causal Art. 161 CT — necesidades empresa, preaviso 30 días, indemnizaciones. Mínimo 10 líneas.
- Art. 66°: Causales Art. 159 CT — mutuo acuerdo, renuncia, vencimiento plazo, etc. Mínimo 10 líneas.
- Art. 67°: Finiquito — contenido obligatorio, ratificación, plazo de pago. Mínimo 8 líneas.
- Art. 68°: Peticiones y reclamos internos — cómo presentar, plazo respuesta 5 días, escalamiento. Mínimo 10 líneas.
- Art. 69°: Certificado de trabajo — información que incluye, plazo emisión. Art. 162 CT. Mínimo 6 líneas.
- Art. 70°: Relaciones laborales armónicas — compromiso de ${cliente.empresa} con ambientes de respeto. Mínimo 8 líneas.`;

      } else if (seccion === 4) {
        usarWebSearch = true;
        prompt = `Eres experto en legislación laboral chilena. Busca: "DS 44 2023 Chile obligaciones empleador seguridad salud" y "EPP obligatorio ${cliente.rubro} Chile".

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 4 del RIOHS — Arts. 71 al 95:

## TÍTULO VIII: DE LA HIGIENE Y SEGURIDAD EN EL TRABAJO

- Art. 71°: Marco normativo — Ley 16.744, DS 44/2023 (reemplaza DS 40 y DS 54), Ley 21.012, Art. 184 CT. Mínimo 12 líneas.
- Art. 72°: Obligaciones del empleador — condiciones seguras, EPP, capacitación, evaluación de riesgos, DS 44/2023. Mínimo 12 líneas.
- Art. 73°: Obligaciones del trabajador en seguridad — lista detallada. Mínimo 12 líneas.
- Art. 74°: Identificación y evaluación de riesgos — matriz de riesgos, peligros del rubro ${cliente.rubro}, control jerárquico (eliminación, sustitución, ingeniería, administrativo, EPP). Mínimo 15 líneas.
- Art. 75°: EPP obligatorio para ${cliente.rubro} — lista completa, características, entrega, registro, reposición, prohibición de prestar o vender. Mínimo 15 líneas.
- Art. 76°: Señalización — zonas de riesgo, evacuación, extintores, botiquín. Mínimo 10 líneas.
- Art. 77°: Orden y limpieza — pasillos, almacenamiento, residuos. Mínimo 10 líneas.
- Art. 78°: Alcohol y drogas — política cero tolerancia, control mediante test, procedimiento, consecuencias. Mínimo 12 líneas.
- Art. 79°: Prevención de incendios — extintores, evacuación, simulacros, brigada de emergencia. Mínimo 12 líneas.
- Art. 80°: CPHS — obligatorio 25+ trabajadores, composición, funciones, reuniones mensuales. DS 54/1969. Mínimo 12 líneas.
- Art. 81°: Departamento Prevención — obligatorio 100+ trabajadores, funciones experto, programa anual. Mínimo 10 líneas.
- Art. 82°: Inspecciones de seguridad — internas/externas, derecho fiscalizador. Mínimo 8 líneas.
- Art. 83°: Capacitaciones obligatorias — inducción al ingreso, periódicas, registro, evaluación. Mínimo 10 líneas.
- Art. 84°: Riesgos específicos del rubro ${cliente.rubro} — identificación detallada, medidas de control, procedimientos seguros. Mínimo 15 líneas.
- Art. 85°: Higiene industrial — iluminación, ventilación, ruido, temperatura, ergonomía. Valores límites. Mínimo 12 líneas.

## TÍTULO IX: DE LOS ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES

- Art. 86°: Definiciones — accidente del trabajo, trayecto, enfermedad profesional, diferencias para el seguro Ley 16.744. Mínimo 12 líneas.
- Art. 87°: Procedimiento inmediato ante accidente — trabajador, testigo, jefe, traslado a ${cliente.organismo_administrador || 'organismo administrador'}. Paso a paso. Mínimo 15 líneas.
- Art. 88°: Investigación de accidentes — CPHS, formulario, plazo 24-48h, causas básicas/inmediatas, medidas. DS 44/2023. Mínimo 15 líneas.
- Art. 89°: DIAT — denuncia ante ${cliente.organismo_administrador || 'organismo administrador'}, plazo 24h, contenido. Mínimo 10 líneas.
- Art. 90°: Accidente de trayecto — definición, cobertura, acreditación. Mínimo 10 líneas.
- Art. 91°: Enfermedades profesionales — evaluación, DIEP, calificación, vigilancia médica. Mínimo 12 líneas.
- Art. 92°: Prestaciones — subsidio, atención médica, rehabilitación, prótesis. Ley 16.744. Mínimo 12 líneas.
- Art. 93°: Derecho a saber — información sobre riesgos, sustancias, EPP, emergencias. Art. 21 DS 44/2023. Mínimo 10 líneas.
- Art. 94°: Estadísticas — tasa frecuencia, gravedad, días perdidos, reporte mensual CPHS. Mínimo 8 líneas.
- Art. 95°: ${cliente.organismo_administrador || 'Organismo administrador'} — derechos del trabajador afiliado, centros, prestaciones, coordinación. Mínimo 10 líneas.`;

      } else if (seccion === 5) {
        usarWebSearch = true;
        prompt = `Eres experto en legislación laboral chilena. Busca: "Ley Karin 21643 plazos procedimiento investigación Chile 2024" y "DS 2 2024 ministerio trabajo prevención acoso Chile".

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 5 del RIOHS — Arts. 96 al 110 — LEY KARIN COMPLETA:

## TÍTULO X: PROTOCOLO PREVENCIÓN ACOSO LABORAL, SEXUAL Y VIOLENCIA EN EL TRABAJO (Ley N°21.643)

- Art. 96°: Fundamento legal — Ley 21.643 vigente desde agosto 2024, Arts. 2°, 211-A al 211-I CT, DS N°2/2024. Mínimo 12 líneas.
- Art. 97°: Objetivo — entorno libre de violencia, perspectiva de género, gestión riesgos psicosociales. Compromiso de ${cliente.empresa}. Mínimo 10 líneas.
- Art. 98°: Ámbito de aplicación — todos los trabajadores/as de ${cliente.empresa} sin excepción, contratistas, subcontratistas, proveedores, visitas, practicantes. Mínimo 8 líneas.
- Art. 99°: Definición acoso sexual — ejemplos detallados: verbal, físico, digital, visual. Art. 2° inc. 2° CT. Mínimo 15 líneas.
- Art. 100°: Definición acoso laboral — tipos: psicológico, físico, digital. Ejemplos concretos. Diferencia con ejercicio legítimo de facultades directivas. Mínimo 15 líneas.
- Art. 101°: Violencia por terceros — clientes, usuarios, proveedores. Ejemplos: amenazas, agresiones, insultos. Mínimo 12 líneas.
- Art. 102°: Conductas que NO constituyen acoso — evaluaciones de desempeño, instrucciones, medidas disciplinarias ajustadas a derecho. Importancia del contexto. Mínimo 10 líneas.
- Art. 103°: Principios — confidencialidad, no represalia, perspectiva de género, presunción buena fe, imparcialidad, celeridad. Mínimo 10 líneas.
- Art. 104°: Canal de denuncia — correo designado, formulario físico, denuncia verbal a RRHH, Inspección del Trabajo. Receptor designado en ${cliente.empresa}. Mínimo 12 líneas.
- Art. 105°: Procedimiento de denuncia — contenido mínimo, constancia de recepción, plazo para iniciar investigación (5 días hábiles). Mínimo 15 líneas.
- Art. 106°: Medidas de resguardo inmediatas — separación física, redistribución jornadas, teletrabajo temporal. Obligación del empleador. Mínimo 12 líneas.
- Art. 107°: Procedimiento de investigación — etapas, notificación al investigado, audiencias, análisis de pruebas, informe final. Plazo máximo 30 días hábiles. Derecho a defensa. Mínimo 20 líneas.
- Art. 108°: Derivación a Inspección del Trabajo — cuándo, plazo 30 días hábiles, obligación de adoptar medidas del informe. Mínimo 12 líneas.
- Art. 109°: Sanciones aplicables — según gravedad: amonestación, multa, traslado, despido Art. 160 N°1 b) o f). Mínimo 12 líneas.
- Art. 110°: Capacitación y difusión — capacitación anual obligatoria, difusión al ingreso, registro, rol CPHS. Mínimo 10 líneas.`;

      } else if (seccion === 6) {
        usarWebSearch = true;
        prompt = `Eres experto en legislación laboral chilena. Busca: "TEMER protocolo vigilancia musculoesquelético Chile SUSESO" y "ISTAS21 protocolo psicosocial Chile SUSESO" y "DS 63 manejo manual cargas Chile".

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 6 del RIOHS — Arts. 111 al 130:

## TÍTULO XI: TRASTORNOS MUSCULOESQUELÉTICOS (TEMER)

- Art. 111°: Marco legal TEMER — Protocolo SUSESO/Ministerio de Salud, obligatoriedad para ${cliente.rubro}. Mínimo 10 líneas.
- Art. 112°: Factores de riesgo — trabajo repetitivo, posturas forzadas, fuerza, vibración, frío. Identificación en ${cliente.empresa}. Mínimo 12 líneas.
- Art. 113°: Evaluación de riesgo — metodología RULA/OCRA, frecuencia, responsables. Mínimo 12 líneas.
- Art. 114°: Medidas preventivas — rotación, pausas activas, rediseño ergonómico, herramientas, capacitación. Mínimo 12 líneas.
- Art. 115°: Vigilancia de la salud — exámenes, derivación, coordinación con ${cliente.organismo_administrador || 'organismo administrador'}. Mínimo 10 líneas.
- Art. 116°: Registro y seguimiento — estadísticas, reporte CPHS, evaluación de efectividad. Mínimo 8 líneas.
- Art. 117°: Pausas activas — ejercicios, frecuencia (mínimo 2 veces por jornada), responsable. Mínimo 8 líneas.
- Art. 118°: Capacitación TEMER — contenidos, frecuencia anual, evaluación, registro. Mínimo 8 líneas.

## TÍTULO XII: FACTORES DE RIESGO PSICOSOCIAL (ISTAS21)

- Art. 119°: Marco legal — Protocolo SUSESO/ISTAS21, obligatorio 10+ trabajadores, DS 44/2023. Mínimo 10 líneas.
- Art. 120°: Factores de riesgo — exigencias psicológicas, trabajo activo, apoyo social, compensaciones, doble presencia. Definición de cada dimensión. Mínimo 15 líneas.
- Art. 121°: Aplicación cuestionario — versión breve/completa, periodicidad (cada 2 años mínimo), anonimato, análisis. Mínimo 12 líneas.
- Art. 122°: Medidas de intervención — según nivel de riesgo bajo/medio/alto. Plan de acción. Mínimo 12 líneas.
- Art. 123°: Seguimiento — monitoreo, nueva aplicación, informe CPHS, registro de mejoras. Mínimo 8 líneas.
- Art. 124°: Relación con Ley Karin — gestión integrada de riesgos psicosociales. Mínimo 8 líneas.

## TÍTULO XIII: MANEJO MANUAL DE CARGAS

- Art. 125°: Marco legal — Ley 20.001 y DS 63/2005. Aplicación en ${cliente.empresa}. Mínimo 10 líneas.
- Art. 126°: Límites de peso — hombres: 25 kg; mujeres y menores 18 años: 20 kg; embarazadas: 5 kg. Condiciones que reducen estos límites. Mínimo 12 líneas.
- Art. 127°: Técnica correcta de levantamiento — posición, rodillas, espalda recta, sujeción, evitar torsión. Paso a paso. Mínimo 15 líneas.
- Art. 128°: Medidas de control — equipos mecánicos, trabajo en equipo, rediseño, frecuencia. Mínimo 10 líneas.
- Art. 129°: Restricciones trabajadoras embarazadas — máximo 5 kg, trabajo en equipo obligatorio. Mínimo 8 líneas.
- Art. 130°: Capacitación — contenidos, frecuencia anual, evaluación práctica, registro. Mínimo 8 líneas.`;

      } else if (seccion === 7) {
        usarWebSearch = true;
        prompt = `Eres experto en legislación laboral chilena. Busca: "Ley 20545 posnatal parental Chile" y "Ley 21719 protección datos trabajadores Chile vigencia".

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 7 del RIOHS — Arts. 131 al 144:

## TÍTULO XIV: PROTECCIÓN DE LA MATERNIDAD Y PATERNIDAD

- Art. 131°: Marco legal — Arts. 194-208 CT, Ley 20.545, Ley 21.063, normativa vigente. Mínimo 10 líneas.
- Art. 132°: Fuero maternal — desde el embarazo hasta 1 año post posnatal, desafuero judicial, extensión adopción Ley 19.620. Mínimo 12 líneas.
- Art. 133°: Descanso prenatal y posnatal — 6 semanas antes, 12 semanas después. Posnatal parental adicional 12 semanas (transferible al padre). Mínimo 12 líneas.
- Art. 134°: Permiso de paternidad — 5 días pagados, irrenunciable, uso desde el parto o dentro del primer mes. Mínimo 10 líneas.
- Art. 135°: Sala cuna — obligatorio 20+ trabajadoras, modalidades. Mínimo 10 líneas.
- Art. 136°: Amamantamiento — 1 hora diaria hasta 2 años del hijo, fraccionable. Mínimo 8 líneas.
- Art. 137°: Permiso por enfermedad hijo menor 1 año — licencia médica, subsidio. Mínimo 8 líneas.
- Art. 138°: Trabajo nocturno y peligroso — prohibición embarazadas y en lactancia, traslado con misma remuneración. Mínimo 8 líneas.

## TÍTULO XV: PROTECCIÓN DE DATOS PERSONALES (Ley N°21.719)

- Art. 139°: Marco legal — Ley 21.719, aplicación en ${cliente.empresa} respecto a datos de trabajadores. Mínimo 12 líneas.
- Art. 140°: Datos que recopila ${cliente.empresa} — nómina, salud, control acceso, cámaras, rendimiento. Finalidad de cada tipo. Mínimo 12 líneas.
- Art. 141°: Principios del tratamiento — licitud, finalidad, proporcionalidad, calidad, seguridad, transparencia. Mínimo 12 líneas.
- Art. 142°: Derechos del trabajador — acceso, rectificación, cancelación, oposición (ARCO). Cómo ejercerlos, plazo 15 días hábiles, responsable en ${cliente.empresa}. Mínimo 12 líneas.
- Art. 143°: Seguridad y confidencialidad — medidas técnicas y organizativas, consecuencias de vulneración. Mínimo 10 líneas.
- Art. 144°: Transferencia de datos a terceros — proveedores RRHH, organismos previsionales, fiscalizadores. Condiciones, contratos, limitaciones. Mínimo 10 líneas.`;

      } else if (seccion === 8) {
        prompt = `Eres experto en legislación laboral chilena.

EMPRESA: ${ctx}

${estilo}

Genera la SECCIÓN 8 FINAL del RIOHS — Arts. 145 al 148 más normativa de referencia:

## TÍTULO XVI: DISPOSICIONES FINALES

**Artículo 145°:** Vigencia — fecha de entrada en vigencia, proceso de aprobación ante SEREMI del Trabajo (objeción en 30 días), publicación y difusión obligatoria. Art. 156 CT. Mínimo 12 líneas con el proceso completo.

**Artículo 146°:** Difusión y entrega — entrega física o digital al ingreso, firma de recepción, carteleras, plataformas digitales, disponibilidad permanente. Mínimo 10 líneas.

**Artículo 147°:** Modificación del reglamento — procedimiento, participación sindical si existe, aprobación Inspección del Trabajo, comunicación con 30 días de anticipación. Mínimo 10 líneas.

**Artículo 148°:** Normativa supletoria — aplicación supletoria del Código del Trabajo, reglamentos, normas de la Dirección del Trabajo y jurisprudencia administrativa. Mínimo 8 líneas.

---

## NORMATIVA DE REFERENCIA

Lista completa con año:
- Código del Trabajo (DFL N°1/2003) y modificaciones
- Ley N°16.744 — Seguro de Accidentes del Trabajo y Enfermedades Profesionales (1968)
- DS N°44/2023 — Reglamento de Seguridad y Salud Ocupacional
- Ley N°21.643 — Ley Karin, vigente agosto 2024
- Ley N°21.719 — Protección de Datos Personales
- Ley N°21.561 — Reducción jornada laboral a 40 horas (implementación progresiva hasta 2028)
- Ley N°20.001 — Manejo manual de cargas
- DS N°63/2005 — Reglamento manejo manual de cargas
- Ley N°21.012 — Garantía derecho a la seguridad y salud en el trabajo
- Ley N°21.015 — Inclusión laboral personas con discapacidad
- Ley N°21.220 — Teletrabajo y trabajo a distancia
- Protocolo TEMER — SUSESO/Ministerio de Salud
- Protocolo SUSESO/ISTAS21 — Riesgo Psicosocial en el Trabajo
- Ley N°20.545 — Posnatal parental
- DS N°2/2024 — Política Nacional de Seguridad y Salud en el Trabajo
(Agrega cualquier normativa adicional actualizada que encuentres relevante)

---

## DECLARACIÓN DE VIGENCIA Y APROBACIÓN

El presente Reglamento Interno de Orden, Higiene y Seguridad de ${cliente.empresa} ha sido elaborado conforme al artículo 153 y siguientes del Código del Trabajo, y entrará en vigencia 30 días después de su puesta en conocimiento de los trabajadores, salvo que la Inspección del Trabajo formule objeciones fundadas dentro de ese plazo.

___________________________
${cliente.representante_legal || PENDIENTE}
Representante Legal
${cliente.empresa}
RUT: ${cliente.rut || PENDIENTE}

*Elaborado: ${new Date().toLocaleDateString('es-CL')} — Versión 01/${new Date().getFullYear()}*`;

      } else {
        return res.status(400).json({ error: 'Sección no válida' });
      }

    // ═══════════════════════════════════════
    // RESUMEN EJECUTIVO PARA EL EMPLEADOR
    // ═══════════════════════════════════════
    } else if (tipo === 'resumen_empleador') {
      prompt = `Eres experto en legislación laboral chilena y comunicación ejecutiva.

EMPRESA: ${ctx}

Genera un RESUMEN EJECUTIVO del RIOHS para que la Gerencia y RRHH de ${cliente.empresa} entiendan rápidamente sus obligaciones sin leer el reglamento completo.

El documento debe ser claro, directo y accionable. Estructura:

# RESUMEN EJECUTIVO — RIOHS ${new Date().getFullYear()}
## ${cliente.empresa}

---

## ¿Qué es este documento y por qué importa?
Explica brevemente qué es el RIOHS, por qué es obligatorio (Art. 153 CT), cuál es la multa por no tenerlo actualizado, y qué pasa si un trabajador lo incumple. Máximo 10 líneas.

---

## Lo que el empleador DEBE hacer (obligaciones críticas)

Lista de 10-15 obligaciones concretas del empleador, cada una en 2-3 líneas:
- Entregar el RIOHS por escrito a cada trabajador al ingreso
- Mantener el reglamento actualizado con la normativa vigente
- Garantizar condiciones seguras de trabajo (Art. 184 CT)
- Implementar el protocolo de acoso laboral/sexual (Ley Karin)
- Contar con CPHS si tiene 25+ trabajadores
- Realizar capacitaciones de seguridad
- Investigar accidentes dentro de 24-48 horas
- Evaluar riesgos psicosociales (ISTAS21) cada 2 años
- Aplicar el protocolo TEMER si hay riesgo musculoesquelético
- No discriminar en remuneraciones por género
- Pagar finiquito dentro de los plazos legales
[agrega más según normativas aplicables a ${cliente.rubro}]

---

## Fechas y plazos clave que no puede olvidar

Tabla con: | Obligación | Plazo | Consecuencia del incumplimiento |
Incluye plazos de: investigación de accidentes, respuesta a denuncias Ley Karin, pago de finiquito, aplicación ISTAS21, entrega de liquidaciones, etc.

---

## Los 5 riesgos legales más importantes para ${cliente.empresa}

Explica los 5 principales riesgos de incumplimiento específicos para el rubro ${cliente.rubro}, con la sanción o consecuencia legal de cada uno.

---

## Lo que el RIOHS le permite hacer al empleador

Lista de 8-10 facultades que el reglamento le otorga: aplicar sanciones, controlar asistencia, establecer turnos, exigir EPP, etc.

---

## Alertas de normativa reciente (último año)

Menciona las 3-4 normas más recientes que deben estar incorporadas y que muchas empresas aún no tienen: Ley Karin (agosto 2024), DS 44/2023, Ley 21.719, reducción jornada Ley 21.561. Estado de implementación y qué hacer si falta alguna.

---

*Este resumen no reemplaza el RIOHS completo. Ante dudas, consulte con su asesor legal o la Inspección del Trabajo.*`;

    // ═══════════════════════════════════════
    // INFORME DE CAMBIOS (auditoría)
    // ═══════════════════════════════════════
    } else if (tipo === 'informe_cambios') {
      const resumen = (alertas_seleccionadas || []).map((a, i) =>
        `${i + 1}. [${a.tipo.toUpperCase()}] ${a.titulo} — ${a.descripcion} (${a.normativa || ''})`
      ).join('\n');

      prompt = `Eres experto en legislación laboral chilena y comunicación técnica.

EMPRESA: ${ctx}

Genera un INFORME DE CAMBIOS para la auditoría del RIOHS de ${cliente.empresa}.

# INFORME DE ACTUALIZACIÓN DEL RIOHS
## ${cliente.empresa} — ${new Date().toLocaleDateString('es-CL')}

---

## Resumen ejecutivo
Explica en 5-8 líneas: cuántos cambios se realizaron (${(alertas_seleccionadas || []).length}), de qué tipo, cuál es el impacto legal de haberlos aplicado, y el estado actual del reglamento.

---

## Cambios realizados por categoría

Organiza los ${(alertas_seleccionadas || []).length} cambios en una tabla por tipo:

### Artículos o secciones AGREGADOS (antes faltaban)
Tabla: | N° | Artículo/Sección | Normativa que lo exige | Impacto |

### Artículos ACTUALIZADOS (estaban desactualizados)
Tabla: | N° | Artículo | Cambio realizado | Normativa |

### Artículos ELIMINADOS o marcados como derogados
Tabla: | N° | Artículo | Razón | Reemplazado por |

### Errores formales CORREGIDOS
Tabla: | N° | Error | Corrección aplicada |

Los cambios aplicados fueron:
${resumen}

---

## Normativa incorporada en esta actualización
Lista de leyes y decretos que motivaron los cambios, con una línea explicando qué implicó cada uno para ${cliente.empresa}.

---

## Estado del RIOHS después de la actualización
Semáforo visual (usa emojis de colores):
🟢 Áreas completamente actualizadas
🟡 Áreas que requieren revisión periódica
🔴 Áreas pendientes (si quedaron cambios sin aplicar)

---

## Próxima revisión recomendada
Indica cuándo se recomienda la próxima auditoría y qué normativa hay que monitorear.

---

*Informe generado el ${new Date().toLocaleDateString('es-CL')} — Versión auditada por sistema Más Prevención*`;

    // ═══════════════════════════════════════
    // AUDITORÍA ANÁLISIS
    // ═══════════════════════════════════════
    } else if (tipo === 'auditoria_analisis') {
      usarWebSearch = true;
      prompt = `Eres experto en legislación laboral chilena con acceso a búsqueda web.

Busca normativa laboral chilena vigente actualizada:
- "DS 44 2023 Chile actualizaciones ${new Date().getFullYear()}"
- "Ley Karin reglamento vigente Chile"
- "normativa laboral nueva Chile ${new Date().getFullYear()}"
- "rubro ${cliente.rubro} normativa seguridad Chile"

EMPRESA: ${ctx}

DOCUMENTO A AUDITAR:
${(documento_existente || '').substring(0, 7000)}

Devuelve SOLO este JSON (sin texto antes ni después):

\`\`\`json
{
  "alertas": [
    {
      "id": 1,
      "tipo": "falta",
      "prioridad": "alta",
      "titulo": "Título descriptivo",
      "descripcion": "Qué falta o qué cambiar. Máximo 2 oraciones.",
      "seccion": "Sección o artículo afectado",
      "normativa": "Ley o decreto vigente con año"
    }
  ]
}
\`\`\`

TIPOS: "falta" | "cambio" | "sobra" | "error"
PRIORIDADES: "alta" (sanción vigente) | "media" (recomendado) | "baja" (forma)
Genera entre 10 y 30 alertas específicas y accionables.`;

    // ═══════════════════════════════════════
    // AUDITORÍA APLICAR CAMBIOS
    // ═══════════════════════════════════════
    } else if (tipo === 'auditoria_aplicar') {
      usarWebSearch = true;
      const cambios = (alertas_seleccionadas || []).map((a, i) =>
        `${i + 1}. [${a.tipo.toUpperCase()}] ${a.titulo}: ${a.descripcion} — Normativa: ${a.normativa || ''}`
      ).join('\n');

      prompt = `Eres experto en legislación laboral chilena con acceso a búsqueda web.

Busca el texto legal exacto de estas normativas para redactar correctamente: ${(alertas_seleccionadas || []).map(a => a.normativa).filter(Boolean).slice(0, 5).join(', ')}

EMPRESA: ${ctx}

DOCUMENTO ORIGINAL (primeros 5000 caracteres):
${(documento_existente || '').substring(0, 5000)}

CAMBIOS A APLICAR (${(alertas_seleccionadas || []).length} cambios):
${cambios}

INSTRUCCIONES:
- Aplica SOLO estos ${(alertas_seleccionadas || []).length} cambios
- FALTA: agrega el artículo completo en el lugar correcto
- CAMBIO: reescribe el artículo completo con texto legal actualizado
- SOBRA: elimínalo o márcalo [DEROGADO — reemplazado por normativa vigente]
- ERROR: corrígelo manteniendo el resto del artículo
- Entrega el documento COMPLETO actualizado en Markdown
- Cada artículo modificado debe tener mínimo 8 líneas de texto legal`;

    } else {
      return res.status(400).json({ error: 'Tipo no válido' });
    }

    // ═══════════════════════════════════════
    // LLAMAR A CLAUDE
    // ═══════════════════════════════════════
    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    };

    if (usarWebSearch) {
      requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
      headers['anthropic-beta'] = 'web-search-2025-03-05';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API error: ${response.status} — ${JSON.stringify(data)}`);
    }

    const texto = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    if (!texto) throw new Error('Sin respuesta de texto del API');

    return res.status(200).json({ contenido: texto, tipo, seccion });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
