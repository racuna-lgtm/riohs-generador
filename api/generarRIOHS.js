export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { cliente, tipo, seccion, documento_existente, alertas_seleccionadas } = req.body || {};
    if (!cliente?.empresa || !cliente?.rubro) return res.status(400).json({ error: 'Faltan datos' });

    const P = '[⚠️ PENDIENTE]';
    const E = cliente.empresa;
    const R = cliente.rubro;
    const OA = cliente.organismo_administrador || P;
    const RL = cliente.representante_legal || P;
    const DIR = cliente.direccion || P;
    const RUT = cliente.rut || P;
    const REG = cliente.region || P;
    const TRAB = cliente.num_trabajadores || P;
    const TURN = cliente.turnos || 'jornada diurna estándar';
    const SIN = cliente.tiene_sindicato ? 'Sí tiene sindicato' : 'No tiene sindicato';

    const BASE = `Eres experto en legislación laboral chilena. Empresa: ${E} | RUT: ${RUT} | Rubro: ${R} | Región: ${REG} | Trabajadores: ${TRAB} | Turnos: ${TURN} | Sindicato: ${SIN} | Organismo Administrador: ${OA} | Representante Legal: ${RL} | Dirección: ${DIR}.

REGLAS: mínimo 6 líneas por artículo, lenguaje formal-legal chileno, cita artículos del Código del Trabajo, usa datos reales de ${E}, escribe "${P}" donde faltan datos del cliente, NUNCA uses [COMPLETAR].`;

    let prompt = '';
    let usarWebSearch = false;
    const maxTokens = 4000;

    if (tipo === 'nuevo' && seccion) {

      const INDICE = `## ÍNDICE GENERAL
| N° | TÍTULO | ARTÍCULOS |
|----|--------|-----------|
| I | Disposiciones Generales | 1–8 |
| II | Del Ingreso y Contratación | 9–18 |
| III | Jornada de Trabajo Parte 1 | 19–26 |
| IV | Jornada: Horas Extra y Descansos | 27–34 |
| V | De las Remuneraciones | 35–44 |
| VI | Obligaciones del Trabajador | 45–54 |
| VII | Prohibiciones del Trabajador | 55–62 |
| VIII | Orden y Disciplina | 63–72 |
| IX | Higiene y Seguridad Parte 1 | 73–82 |
| X | Higiene y Seguridad Parte 2 | 83–90 |
| XI | Accidentes del Trabajo y EEPP | 91–100 |
| XII | Ley Karin Parte 1 | 101–107 |
| XIII | Ley Karin Parte 2 | 108–114 |
| XIV | TEMER · ISTAS21 · Cargas | 115–128 |
| XV | Maternidad y Datos Personales | 129–139 |
| XVI | Disposiciones Finales | 140–142 |`;

      if (seccion === 1) {
        prompt = `${BASE}

Genera la SECCIÓN 1 del RIOHS con portada, índice y Título I (Arts. 1-8).

PORTADA:
# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
# ${E.toUpperCase()}
RUT: ${RUT} | Rubro: ${R} | Región: ${REG}
Dirección: ${DIR} | Organismo Administrador: ${OA}
Representante Legal: ${RL} | Versión 01 — ${new Date().getFullYear()}

Párrafo introductorio sobre el cumplimiento del Art. 153 CT.

${INDICE}

## TÍTULO I: DISPOSICIONES GENERALES
Redacta los Artículos 1° al 8° completamente. Incluye: objeto y ámbito (Art. 1°), definición del reglamento (Art. 2°), definiciones de empleador/trabajador/empresa referenciando Arts. 3° y 7° CT (Art. 3°), jefe inmediato y estructura jerárquica (Art. 4°), definiciones económicas como remuneración/sueldo/gratificación (Art. 5°), definiciones operativas como jornada/turno/hora extra/feriado/licencia médica (Art. 6°), entrega y recepción del reglamento con firma (Art. 7°), procedimiento de modificación (Art. 8°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 2) {
        prompt = `${BASE}

Genera la SECCIÓN 2 — TÍTULO II: DEL INGRESO Y CONTRATACIÓN (Arts. 9-18).

Redacta los artículos 9° al 18° completamente. Incluye: requisitos de ingreso con lista de 12+ documentos (Art. 9°), exámenes preocupacionales coordinados con ${OA} (Art. 10°), período de prueba (Art. 11°), celebración del contrato con plazos 15 días / 5 días Art. 9° CT (Art. 12°), contenido mínimo del contrato literales a) hasta i) Art. 10 CT (Art. 13°), modificaciones al contrato (Art. 14°), contrato de menores con restricciones Art. 13 CT (Art. 15°), documentos falsos como causal Art. 160 N°1 CT (Art. 16°), actualización de antecedentes en 5 días hábiles (Art. 17°), inclusión laboral Ley 21.015 cuota 1% para 100+ trabajadores (Art. 18°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 3) {
        prompt = `${BASE}

Genera la SECCIÓN 3 — TÍTULO III: JORNADA DE TRABAJO PARTE 1 (Arts. 19-26).

Redacta los artículos 19° al 26° completamente. Incluye: jornada 42 horas semanales Ley 21.561 vigente abril 2026 con horarios de ${E} según turnos ${TURN} y tabla de horarios por área (Art. 19°), sistema de control de asistencia y consecuencias de no marcar (Art. 20°), ausentismo aviso 24 horas y Art. 160 N°3 CT (Art. 21°), atrasos reiterados y descuentos (Art. 22°), permisos durante jornada solicitud escrita (Art. 23°), colación no computable Art. 34 CT (Art. 24°), teletrabajo Ley 21.220 desconexión digital 12 horas (Art. 25°), cambios de turno con 30 días de anticipación (Art. 26°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 4) {
        prompt = `${BASE}

Genera la SECCIÓN 4 — TÍTULO IV: HORAS EXTRAORDINARIAS Y DESCANSOS (Arts. 27-34).

Redacta los artículos 27° al 34° completamente. Incluye: horas extraordinarias definición límite 2h diarias Arts. 30-31 CT (Art. 27°), pago recargo 50% Art. 32 CT (Art. 28°), descanso semanal dominical y Art. 38 CT (Art. 29°), feriado 15 días hábiles irrenunciable Art. 67 CT (Art. 30°), vacaciones progresivas 1 día por cada 3 años Art. 68 CT (Art. 31°), fraccionamiento y acumulación hasta 2 períodos Art. 70 CT (Art. 32°), feriado proporcional Art. 73 CT (Art. 33°), permisos especiales por fallecimiento tabla completa hijo/cónyuge/hijo no nato/padres con fuero laboral 1 mes Art. 66 CT (Art. 34°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 5) {
        prompt = `${BASE}

Genera la SECCIÓN 5 — TÍTULO V: DE LAS REMUNERACIONES (Arts. 35-44).

Redacta los artículos 35° al 44° completamente. Incluye: definición remuneración y componentes Arts. 41-42 CT (Art. 35°), fecha y forma de pago día 30 depósito bancario anticipo 25% (Art. 36°), ingreso mínimo y proporcionalidad (Art. 37°), gratificaciones modalidades 30% utilidades o 25% remuneración Arts. 46-49 CT (Art. 38°), descuentos legales cotizaciones impuesto cuotas límite 30% Art. 58 CT (Art. 39°), liquidación de sueldo entrega y componentes (Art. 40°), igualdad de remuneraciones Art. 62 bis CT (Art. 41°), procedimiento de reclamo 30 días (Art. 42°), asignaciones no remuneracionales viáticos colación movilización (Art. 43°), finiquito ratificación ministro de fe 5 días hábiles Art. 163 CT (Art. 44°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 6) {
        prompt = `${BASE}

Genera la SECCIÓN 6 — TÍTULO VI: OBLIGACIONES DEL TRABAJADOR (Arts. 45-54).

Redacta los artículos 45° al 54° completamente. Incluye: obligaciones generales de conducta con literales a) hasta n) mínimo: puntualidad, registrar asistencia, avisar ausencias en 24h, buena fe, respeto a superiores, cortesía, cuidar bienes, mantener orden, denunciar irregularidades, actualizar antecedentes (Art. 45°), obligaciones de seguridad literales a) hasta j) uso EPP reportar condiciones inseguras (Art. 46°), cuidado y conservación de bienes responsabilidad por negligencia (Art. 47°), confidencialidad 2 años post contrato (Art. 48°), comunicar cambios en 5 días hábiles (Art. 49°), procedimiento ante accidente paso a paso con ${OA} (Art. 50°), trato y convivencia (Art. 51°), obligaciones específicas del rubro ${R} con 5-7 ítems propios del rubro (Art. 52°), asistir a capacitaciones SENCE (Art. 53°), uso tecnología corporativa solo fines laborales (Art. 54°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 7) {
        prompt = `${BASE}

Genera la SECCIÓN 7 — TÍTULO VII: PROHIBICIONES DEL TRABAJADOR (Arts. 55-62).

Redacta los artículos 55° al 62° completamente. Incluye: prohibiciones laborales literales a) hasta h) horas extra sin autorización abandonar puesto asuntos personales empresas competidoras revelar información (Art. 55°), prohibiciones de seguridad literales a) hasta h) no usar EPP operar sin autorización desactivar sistemas alcohol drogas fumar fuera de zonas (Art. 56°), prohibiciones sobre bienes de la empresa Art. 160 N°6 CT (Art. 57°), prohibiciones control de asistencia marcar tarjeta ajena como falta grave Art. 160 N°1 CT (Art. 58°), sustancias prohibidas con facultad de control aleatorio (Art. 59°), prohibición de acoso y violencia remisión al Título XII (Art. 60°), otras prohibiciones armas juegos de azar propaganda (Art. 61°), prohibiciones específicas del rubro ${R} con 4-6 ítems propios (Art. 62°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 8) {
        prompt = `${BASE}

Genera la SECCIÓN 8 — TÍTULO VIII: ORDEN Y DISCIPLINA (Arts. 63-72).

Redacta los artículos 63° al 72° completamente. Incluye: sistema de sanciones gradual verbal/escrita/con copia Inspección/multa Art. 154 N°10 CT (Art. 63°), multas 10%-25% remuneración diaria destino bienestar Art. 157 CT (Art. 64°), derecho a reclamo 3er día hábil Inspección del Trabajo (Art. 65°), causales Art. 160 CT las 7 causales con ejemplos para ${R} (Art. 66°), causal Art. 161 CT preaviso 30 días indemnizaciones (Art. 67°), causales Art. 159 CT mutuo acuerdo renuncia muerte vencimiento (Art. 68°), finiquito y certificado de trabajo Art. 162 CT (Art. 69°), peticiones y reclamos internos 5 días hábiles (Art. 70°), investigación disciplinaria interna 15 días hábiles (Art. 71°), relaciones laborales armónicas y mediación (Art. 72°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 9) {
        prompt = `${BASE}

Genera la SECCIÓN 9 — TÍTULO IX: HIGIENE Y SEGURIDAD PARTE 1 (Arts. 73-82).

Redacta los artículos 73° al 82° completamente. Incluye: marco normativo Ley 16.744 DS 44/2023 Art. 184 CT (Art. 73°), obligaciones del empleador garantizar condiciones EPP IPER capacitación DS 44/2023 (Art. 74°), obligaciones del trabajador en seguridad lista completa (Art. 75°), identificación y control de riesgos matriz IPER con 5-7 riesgos principales del rubro ${R} y medidas de control jerarquía eliminación/sustitución/ingeniería/administrativo/EPP (Art. 76°), EPP obligatorio para ${R} lista completa características entrega reposición prohibición de prestar (Art. 77°), señalización de seguridad (Art. 78°), orden y limpieza pasillos despejados (Art. 79°), CPHS para 25+ trabajadores composición funciones reunión mensual DS 54/1969 (Art. 80°), Departamento de Prevención para 100+ trabajadores (Art. 81°), política alcohol y drogas tolerancia cero control aleatorio (Art. 82°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 10) {
        prompt = `${BASE}

Genera la SECCIÓN 10 — TÍTULO X: HIGIENE Y SEGURIDAD PARTE 2 (Arts. 83-90).

Redacta los artículos 83° al 90° completamente. Incluye: prevención de incendios extintores simulacros anuales brigada de emergencia procedimiento evacuación paso a paso (Art. 83°), primeros auxilios botiquines trabajador certificado por turno procedimiento ante accidente (Art. 84°), higiene industrial iluminación ruido límite 85dB temperatura ventilación ergonomía (Art. 85°), capacitaciones obligatorias inducción al ingreso anual uso EPP primeros auxilios registro (Art. 86°), riesgos específicos del rubro ${R} identificar y desarrollar 6-8 riesgos propios con descripción situación y medida preventiva (Art. 87°), procedimientos de trabajo seguro PTS para tareas de mayor riesgo del rubro ${R} (Art. 88°), inspecciones periódicas CPHS y derecho de fiscalizadores (Art. 89°), derecho a saber sobre riesgos sustancias EPP emergencias Art. 21 DS 44/2023 (Art. 90°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 11) {
        prompt = `${BASE}

Genera la SECCIÓN 11 — TÍTULO XI: ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES (Arts. 91-100).

Redacta los artículos 91° al 100° completamente. Incluye: definiciones accidente del trabajo trayecto enfermedad profesional Art. 5° Ley 16.744 (Art. 91°), procedimiento inmediato ante accidente 7 pasos con traslado a ${OA} (Art. 92°), DIAT denuncia a ${OA} dentro de 24 horas (Art. 93°), accidente de trayecto acreditación parte policial declaración jurada (Art. 94°), investigación de accidentes 24-48h causas inmediatas básicas y raíz DS 44/2023 (Art. 95°), accidentes graves y fatales notificación Inspección del Trabajo SEREMI de Salud 24h suspensión faenas (Art. 96°), enfermedades profesionales DIEP vigilancia médica rubro ${R} (Art. 97°), prestaciones médicas y económicas subsidio 100% atención gratuita rehabilitación prótesis Ley 16.744 (Art. 98°), estadísticas tasa frecuencia gravedad accidentabilidad reporte mensual (Art. 99°), rehabilitación y reincorporación gradual con restricciones médicas coordinada con ${OA} (Art. 100°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 12) {
        prompt = `${BASE}

Genera la SECCIÓN 12 — TÍTULO XII: PROTOCOLO LEY KARIN PARTE 1 (Arts. 101-107). Ley 21.643 vigente agosto 2024, Arts. 211-A al 211-I CT, DS 2/2024.

Redacta los artículos 101° al 107° completamente. Incluye: fundamento legal y objetivo Ley 21.643 perspectiva de género compromiso de ${E} (Art. 101°), ámbito aplica a todos los trabajadores de ${E} más contratistas proveedores visitas practicantes (Art. 102°), definición acoso sexual con ejemplos verbales físicos digitales visuales característica es no consentido Art. 2° CT (Art. 103°), definición acoso laboral conductas reiteradas o únicas que causen menoscabo humillación con ejemplos aislamiento humillación pública tareas degradantes acoso digital Art. 2° CT (Art. 104°), violencia por terceros clientes proveedores visitas con ejemplos (Art. 105°), principios confidencialidad no represalia perspectiva de género buena fe imparcialidad celeridad (Art. 106°), canal de denuncia correo designado formulario físico RRHH Inspección del Trabajo opción de anonimato (Art. 107°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 13) {
        prompt = `${BASE}

Genera la SECCIÓN 13 — TÍTULO XII: PROTOCOLO LEY KARIN PARTE 2 (Arts. 108-114). Arts. 211-A al 211-I CT.

Redacta los artículos 108° al 114° completamente. Incluye: procedimiento de denuncia contenido mínimo constancia de recepción inicio en 5 días hábiles opción derivar a Inspección del Trabajo (Art. 108°), medidas de resguardo inmediatas separación física redistribución jornada teletrabajo derivación psicológica a ${OA} sin prejuzgamiento (Art. 109°), procedimiento investigación interna investigador imparcial capacitado notificación cargos audiencias análisis pruebas informe final 30 días hábiles máximo derecho a defensa Arts. 211-A al 211-I CT (Art. 110°), investigación por Inspección del Trabajo cooperación plena adoptar medidas del informe 30 días hábiles (Art. 111°), sanciones según gravedad amonestación multa traslado despido Art. 160 N°1 b) y f) CT represalias también sancionadas (Art. 112°), capacitación anual obligatoria contenido mínimo registro CPHS supervisa (Art. 113°), conductas que NO constituyen acoso evaluaciones objetivas instrucciones cambios disciplina facultades directivas (Art. 114°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 14) {
        prompt = `${BASE}

Genera la SECCIÓN 14 — TÍTULO XIV: TEMER, ISTAS21 Y MANEJO DE CARGAS (Arts. 115-128).

Redacta los artículos 115° al 128° completamente.

TEMER (Arts. 115-118): marco legal SUSESO obligatorio para ${R} (115°), factores de riesgo trabajo repetitivo posturas forzadas fuerza vibración evaluación RULA/OCRA anual (116°), medidas preventivas rotación pausas activas 2 veces por jornada rediseño ergonómico herramientas adecuadas (117°), vigilancia médica exámenes periódicos coordinados con ${OA} (118°).

ISTAS21 (Arts. 119-121): marco legal SUSESO/ISTAS21 obligatorio 10+ trabajadores DS 44/2023 (119°), 5 dimensiones del riesgo psicosocial exigencias psicológicas trabajo activo apoyo social compensaciones doble presencia (120°), aplicación cuestionario cada 2 años anónimo plan de acción por nivel riesgo CPHS participa (121°).

MANEJO MANUAL DE CARGAS (Arts. 122-128): marco legal Ley 20.001 DS 63/2005 (122°), límites de peso hombres 25kg mujeres y menores 20kg embarazadas 5kg (123°), técnica correcta de levantamiento 7 pasos (124°), medidas de control equipos mecánicos restricciones especiales embarazadas (125°), capacitación anual práctica (126°), pausas de recuperación DS 63/2005 (127°), seguimiento CPHS (128°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 15) {
        prompt = `${BASE}

Genera la SECCIÓN 15 — TÍTULOS XV Y XVI: MATERNIDAD/PATERNIDAD Y DATOS PERSONALES (Arts. 129-139).

MATERNIDAD Y PATERNIDAD (Arts. 129-136): marco legal Arts. 194-208 CT Ley 20.545 (129°), fuero maternal desde embarazo hasta 1 año post posnatal extensión adopción Ley 19.620 (130°), descansos prenatal 6 semanas posnatal 12 semanas posnatal parental 12 semanas transferibles Arts. 195-197 CT (131°), permiso de paternidad 5 días irrenunciable (132°), sala cuna 20+ trabajadoras amamantamiento 1 hora diaria hasta 2 años Arts. 203-206 CT (133°), trabajo peligroso o nocturno traslado con misma remuneración Art. 202 CT (134°), permiso por enfermedad grave hijo menor 1 año Art. 199 CT (135°), permiso muerte hijo cónyuge fuero laboral 1 mes Art. 66 CT (136°).

DATOS PERSONALES Ley 21.719 (Arts. 137-139): marco legal ámbito tipos de datos que trata ${E} identificación laborales salud financieros imágenes solo fines laborales (137°), principios de tratamiento licitud finalidad proporcionalidad calidad seguridad transparencia (138°), derechos ARCO acceso rectificación cancelación oposición responsable designado en ${E} plazo 15 días hábiles medidas de seguridad técnicas y organizativas (139°). Cada artículo mínimo 6 líneas.`;

      } else if (seccion === 16) {
        prompt = `${BASE}

Genera la SECCIÓN 16 FINAL — TÍTULO XVII: DISPOSICIONES FINALES, NORMATIVA DE REFERENCIA Y DECLARACIÓN (Arts. 140-142).

## TÍTULO XVII: DISPOSICIONES FINALES

Redacta los artículos 140° al 142° completamente:
- Art. 140°: Vigencia del reglamento. Entra en vigor 30 días después de ser puesto en conocimiento de los trabajadores salvo objeción de la Inspección del Trabajo Art. 156 CT. Proceso de depósito. Mínimo 8 líneas.
- Art. 141°: Difusión y entrega. Copia física o digital al ingreso firma de recepción carteleras plataforma digital registro en expediente. Mínimo 7 líneas.
- Art. 142°: Normativa supletoria y modificaciones. Aplicación del Código del Trabajo jurisprudencia administrativa compromiso de actualización permanente. Mínimo 7 líneas.

---

## NORMATIVA DE REFERENCIA

| N° | Norma | Materia | Año |
|----|-------|---------|-----|
| 1 | Código del Trabajo DFL N°1/2003 | Marco general laboral | 2003 |
| 2 | Ley N°16.744 | Accidentes del trabajo y enfermedades profesionales | 1968 |
| 3 | DS N°44/2023 | Seguridad y Salud Ocupacional | 2023 |
| 4 | Ley N°21.643 — Ley Karin | Prevención acoso laboral, sexual y violencia | 2024 |
| 5 | Ley N°21.719 | Protección de datos personales | 2022 |
| 6 | Ley N°21.561 | Reducción jornada laboral | 2024 |
| 7 | Ley N°20.001 y DS N°63/2005 | Manejo manual de cargas | 2005 |
| 8 | Ley N°21.012 | Seguridad y salud en el trabajo | 2017 |
| 9 | Ley N°21.015 | Inclusión laboral personas con discapacidad | 2017 |
| 10 | Ley N°21.220 | Teletrabajo y trabajo a distancia | 2020 |
| 11 | Protocolo TEMER — SUSESO | Trastornos musculoesqueléticos | Vigente |
| 12 | Protocolo SUSESO/ISTAS21 | Riesgos psicosociales en el trabajo | Vigente |
| 13 | Ley N°20.545 | Posnatal parental | 2011 |
| 14 | DS N°2/2024 | Política Nacional de Seguridad y Salud | 2024 |
| 15 | DS N°54/1969 | Constitución y funcionamiento del CPHS | 1969 |

---

## DECLARACIÓN DE VIGENCIA Y APROBACIÓN

El presente Reglamento Interno de Orden, Higiene y Seguridad de **${E}** ha sido elaborado conforme al artículo 153 y siguientes del Código del Trabajo (DFL N°1/2003).

**${RL}**
Representante Legal — ${E}
RUT: ${RUT} | ${DIR}

*${new Date().toLocaleDateString('es-CL')} — Versión 01/${new Date().getFullYear()}*`;

      } else {
        return res.status(400).json({ error: `Sección ${seccion} no válida.` });
      }

    // RESUMEN EJECUTIVO
    } else if (tipo === 'resumen_empleador') {
      prompt = `${BASE}

Genera un RESUMEN EJECUTIVO del RIOHS para Gerencia y RRHH de ${E}. Directo, claro, accionable.

# RESUMEN EJECUTIVO — RIOHS ${new Date().getFullYear()}
## ${E} | Rubro: ${R}

## ¿Por qué existe el RIOHS?
Art. 153 CT obligatorio. Consecuencias de no tenerlo o tenerlo desactualizado. 5 líneas.

## 12 obligaciones críticas del empleador
Lista numerada. Por cada obligación: qué es, ley que la sustenta, consecuencia de incumplimiento. Incluir: entrega del RIOHS al trabajador, condiciones seguras Art. 184 CT, Protocolo Ley Karin, CPHS 25+ trabajadores, capacitaciones de seguridad, investigar accidentes 24-48h, ISTAS21 cada 2 años, TEMER, igualdad de remuneraciones, finiquito 5 días hábiles, datos personales Ley 21.719, Organismo Administrador ${OA}.

## Plazos clave
Tabla: | Obligación | Plazo | Consecuencia |

## Los 5 riesgos legales más importantes para ${E}
5 riesgos específicos del rubro ${R} con multa o consecuencia legal.

## Normativa reciente — asegúrese de tenerla incorporada
Ley Karin agosto 2024, DS 44/2023, Ley 21.719, Ley 21.561. Una línea por norma.

*Este resumen no reemplaza el RIOHS completo.*`;

    // INFORME DE CAMBIOS
    } else if (tipo === 'informe_cambios') {
      const lista = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo} — ${a.normativa||''}`
      ).join('\n');

      prompt = `${BASE}

Genera un INFORME DE CAMBIOS para la auditoría del RIOHS de ${E}.

# INFORME DE ACTUALIZACIÓN DEL RIOHS
## ${E} — ${new Date().toLocaleDateString('es-CL')}

## Resumen (5 líneas)
Cuántos cambios, de qué tipo, impacto legal, estado actual del reglamento.

## Cambios aplicados por categoría
Organiza en 4 tablas: AGREGADOS ⚠️ | ACTUALIZADOS 🔄 | ELIMINADOS 🗑️ | CORREGIDOS ❌
Columnas: N° | Descripción del cambio | Normativa aplicada

Cambios aplicados (${(alertas_seleccionadas||[]).length}):
${lista}

## Estado del RIOHS actualizado
🟢 Áreas completamente actualizadas
🟡 Áreas que requieren revisión periódica
🔴 Cambios pendientes

## Próxima revisión recomendada
Fecha y normativa a monitorear.

*Generado el ${new Date().toLocaleDateString('es-CL')} — Sistema Más Prevención*`;

    // AUDITORÍA ANÁLISIS
    } else if (tipo === 'auditoria_analisis') {
      usarWebSearch = false;
      maxTokens = 1500;
      let parte = req.body.parte || 1;
      prompt = `Eres experto en legislación laboral chilena. Normativa vigente: DS 44/2023, Ley Karin 21.643, Ley 21.719, Ley 21.561, Ley 16.744.

Empresa: ${E} | Rubro: ${R} | Analizando parte ${parte} de 3.

FRAGMENTO DEL RIOHS:
${(documento_existente||'').substring(0,2500)}

Devuelve SOLO este JSON:
\`\`\`json
{"alertas":[{"id":1,"tipo":"falta","prioridad":"alta","titulo":"Titulo","descripcion":"Descripcion en 1-2 oraciones.","seccion":"Seccion","normativa":"Ley con año"}]}
\`\`\`
TIPOS: falta o cambio o sobra o error. PRIORIDADES: alta o media o baja.
Genera 5-10 alertas para este fragmento.`;

    // AUDITORÍA APLICAR
    } else if (tipo === 'auditoria_aplicar') {
      usarWebSearch = true;
      const cambios = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo}: ${a.descripcion} — ${a.normativa||''}`
      ).join('\n');

      prompt = `Eres experto en legislación laboral chilena con búsqueda web. Empresa: ${E} | Rubro: ${R}.

DOCUMENTO ORIGINAL:
${(documento_existente||'').substring(0,4000)}

CAMBIOS A APLICAR (${(alertas_seleccionadas||[]).length}):
${cambios}

Aplica SOLO estos cambios al documento original. FALTA: agrega el artículo completo. CAMBIO: reescribe con normativa actualizada. SOBRA: marca [DEROGADO]. ERROR: corrígelo. Cada artículo modificado mínimo 6 líneas. Entrega el documento COMPLETO en Markdown.`;

    } else {
      return res.status(400).json({ error: 'Tipo no válido' });
    }

    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
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
      method: 'POST', headers, body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`API error: ${response.status} — ${JSON.stringify(data)}`);

    const texto = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
    if (!texto) throw new Error('Sin respuesta de texto');
    return res.status(200).json({ contenido: texto, tipo, seccion });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
