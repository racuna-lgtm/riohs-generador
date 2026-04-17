export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' });

  try {
    const { cliente, tipo, seccion, documento_existente, alertas_seleccionadas, perfil } = req.body || {};
    if (!cliente?.empresa || !cliente?.rubro) return res.status(400).json({ error: 'Faltan datos' });

    const P = '[PENDIENTE - completar antes de entrega al cliente]';
    const E = cliente.empresa;
    const R = cliente.rubro;
    const OA = cliente.organismo_administrador || P;
    const RUT = cliente.rut || P;
    const REG = cliente.region || P;
    const DIR = cliente.direccion || P;
    const RL = cliente.representante_legal || P;
    const TRAB = parseInt(cliente.num_trabajadores) || 0;
    const TURN = cliente.turnos || 'jornada diurna estandar';
    const SIN = cliente.tiene_sindicato ? 'Si tiene sindicato' : 'No tiene sindicato';

    // Perfil editorial (viene del frontend tras llamar tipo=perfil)
    const NIVEL = perfil?.nivel || 'intermedio';
    const MAX_TOKENS = perfil?.max_tokens || 3500;
    const CAMBIOS_AUDITORIA = perfil?.cambios || '';

    // ═══════════════════════════════════════════
    // SECCIÓN 0 — PERFIL EDITORIAL
    // Evaluación de la empresa antes de generar
    // ═══════════════════════════════════════════
    if (tipo === 'perfil') {
      const rubrosAltoRiesgo = ['Construccion','Mineria','Manufactura','Transporte','Seguridad privada','Agroindustria'];
      const esAltoRiesgo = rubrosAltoRiesgo.some(r => R.toLowerCase().includes(r.toLowerCase()));
      const tieneTurnos = TURN && TURN !== 'Sin turnos definidos' && TURN !== 'jornada diurna estandar';
      const esGrande = TRAB >= 100;
      const esMediana = TRAB >= 25 && TRAB < 100;

      let nivel, paginas, maxTok, justificacion;

      if (esGrande || esAltoRiesgo) {
        nivel = 'extenso';
        paginas = '90-110 paginas';
        maxTok = 4000;
        justificacion = `Con ${TRAB > 0 ? TRAB + ' trabajadores' : 'alta complejidad operativa'} en el rubro ${R}, el reglamento requiere desarrollo completo de todos los procedimientos, incluyendo protocolos detallados de seguridad, disciplina y canales de denuncia.`;
      } else if (esMediana || tieneTurnos || cliente.tiene_sindicato) {
        nivel = 'intermedio';
        paginas = '60-80 paginas';
        maxTok = 3500;
        justificacion = `Con ${TRAB > 0 ? TRAB + ' trabajadores' : 'estructura mediana'} y ${tieneTurnos ? 'sistema de turnos activo' : 'estructura organizacional con areas definidas'}, el reglamento debe cubrir todos los aspectos legales con nivel de detalle moderado.`;
      } else {
        nivel = 'compacto';
        paginas = '40-55 paginas';
        maxTok = 2500;
        justificacion = `Con ${TRAB > 0 ? TRAB + ' trabajadores' : 'estructura pequena'} en el rubro ${R}, el reglamento debe ser preciso y directo, sin sobredimensionamiento ni bloques genericos que no aplican a la realidad de esta empresa.`;
      }

      return res.status(200).json({
        nivel,
        paginas,
        max_tokens: maxTok,
        justificacion,
        variables_coherencia: {
          jornada: '42 horas semanales (Ley 21.561, vigente desde abril 2026)',
          organismo_administrador: OA,
          turnos: TURN,
          trabajadores: TRAB || P,
          sindicato: SIN,
          region: REG
        }
      });
    }

    // ═══════════════════════════════════════════
    // CRITERIO MAESTRO — se inyecta en todos los prompts
    // ═══════════════════════════════════════════
    const CRITERIO = `
CRITERIO MAESTRO DE CALIDAD (OBLIGATORIO):
Perfil de empresa: ${NIVEL.toUpperCase()} — ajusta la extension y el nivel de detalle a este perfil.

Variables de coherencia interna que DEBEN ser consistentes en todo el documento:
- Jornada ordinaria: 42 horas semanales (Ley 21.561, vigente desde abril 2026)
- Organismo Administrador: ${OA}
- Sistema de turnos: ${TURN}
- Numero de trabajadores: ${TRAB || P}
- Sindicato: ${SIN}

Reglas de redaccion:
1. NUNCA dejes un articulo truncado, una frase incompleta o una enumeracion sin cerrar. Si falta informacion puntual, cierra el articulo con una formula neutra formal.
2. Usa "${P}" SOLO para datos especificos del cliente que faltan (RUT, nombre de persona, correo, etc.). NUNCA como parche para contenido incompleto.
3. Redaccion: formal, clara, sin inflado. Evita repetir la razon social mas de una vez por articulo. Evita frases redundantes y ampulosidad innecesaria.
4. Sanciones: siempre con gradualidad explicita. NUNCA redactes como si cualquier incumplimiento derivara automaticamente en despido.
5. Equilibrio empleador/trabajador: toda obligacion, prohibicion o sancion debe quedar dentro de un marco proporcional y juridicamente defendible.
6. Extension: proporcional al perfil ${NIVEL}. No maximices extension ni tecnicismo. Maximiza coherencia, claridad y aplicabilidad real.
7. Documentos al ingreso: usa criterio de pertinencia real para el rubro ${R}, no maximalismo.`;

    const BASE = `Eres experto en derecho laboral chileno con criterio editorial riguroso.
Empresa: ${E} | RUT: ${RUT} | Rubro: ${R} | Region: ${REG} | Trabajadores: ${TRAB||P} | Turnos: ${TURN} | ${SIN} | OA: ${OA} | Representante Legal: ${RL} | Direccion: ${DIR}.
${CRITERIO}`;

    const INDICE = `## INDICE GENERAL
| N | TITULO | ARTICULOS |
|---|--------|-----------|
| I | Disposiciones Generales | 1-8 |
| II | Del Ingreso y Contratacion | 9-18 |
| III | Jornada de Trabajo - Parte 1 | 19-26 |
| IV | Jornada - Horas Extra y Descansos | 27-34 |
| V | De las Remuneraciones | 35-44 |
| VI | Obligaciones del Trabajador | 45-54 |
| VII | Prohibiciones del Trabajador | 55-62 |
| VIII | Orden y Disciplina | 63-72 |
| IX | Higiene y Seguridad - Parte 1 | 73-82 |
| X | Higiene y Seguridad - Parte 2 | 83-90 |
| XI | Accidentes del Trabajo y EEPP | 91-100 |
| XII | Ley Karin - Parte 1 | 101-107 |
| XIII | Ley Karin - Parte 2 | 108-114 |
| XIV | TEMER - ISTAS21 - Manejo de Cargas | 115-128 |
| XV | Maternidad y Datos Personales | 129-139 |
| XVI | Disposiciones Finales | 140-142 |`;

    let prompt = '';

    if (tipo === 'nuevo' && seccion) {

      // Si viene de auditoria (Opcion B), incluir cambios como instrucciones adicionales
      const instrCambios = CAMBIOS_AUDITORIA
        ? `\n\nINSTRUCCIONES ADICIONALES (cambios de auditoria a incorporar en esta seccion):\n${CAMBIOS_AUDITORIA}`
        : '';

      if (seccion === 1) {
        prompt = `${BASE}

Genera la SECCION 1 del RIOHS: portada, indice y Titulo I (Arts. 1-8).

PORTADA:
# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
# ${E.toUpperCase()}
RUT: ${RUT} | Rubro: ${R} | Region: ${REG}
Direccion: ${DIR} | Organismo Administrador: ${OA}
Representante Legal: ${RL} | Version 01 - ${new Date().getFullYear()}

En cumplimiento del articulo 153 del Codigo del Trabajo (DFL N1/2003), ${E} establece el presente Reglamento Interno de Orden, Higiene y Seguridad para regular las condiciones, derechos, obligaciones y prohibiciones de todos sus trabajadores. Este reglamento es de cumplimiento obligatorio desde el primer dia de contratacion.

${INDICE}

## TITULO I: DISPOSICIONES GENERALES
Redacta los Articulos 1 al 8. Extensión proporcional al perfil ${NIVEL}.
- Art. 1: Objeto y ambito. Que regula, a quienes aplica, caracter obligatorio. Art. 153 CT.
- Art. 2: Definicion y valor juridico del reglamento. Proceso de aprobacion ante la Inspeccion del Trabajo.
- Art. 3: Definiciones de empleador, trabajador y empresa. Arts. 3 y 7 CT.
- Art. 4: Jefe inmediato, cargo, faena y dependencia jerarquica en ${E}.
- Art. 5: Remuneracion, sueldo, gratificacion y sobresueldo.
- Art. 6: Jornada, turno, hora extraordinaria, feriado y licencia medica.
- Art. 7: Entrega y recepcion del reglamento. Firma de cargo. Disponibilidad en carteleras.
- Art. 8: Modificacion del reglamento. Procedimiento, plazos y participacion sindical si existe.
${instrCambios}`;

      } else if (seccion === 2) {
        prompt = `${BASE}

Genera la SECCION 2 - TITULO II: DEL INGRESO Y CONTRATACION (Arts. 9-18). Perfil: ${NIVEL}.

CRITERIO ESPECIFICO: Los documentos de ingreso (Art. 9) deben ser pertinentes para el rubro ${R} y el tamano de la empresa (${TRAB||'sin dato'} trabajadores). No listes documentos de forma maximalista. Usa criterio de pertinencia real.

- Art. 9: Requisitos de ingreso. Lista documentos esenciales para ${R}. Diferencia opcionales por cargo. No incluyas documentos discutibles sin fundamento.
- Art. 10: Examenes preocupacionales con ${OA}. Tipos segun cargo y riesgo real del rubro.
- Art. 11: Periodo de prueba.
- Art. 12: Celebracion del contrato. Plazos: 15 dias / 5 dias por obra. Art. 9 CT.
- Art. 13: Contenido minimo del contrato. Literales a) hasta i). Art. 10 CT.
- Art. 14: Modificaciones al contrato.
- Art. 15: Contrato de trabajadores menores de edad. Art. 13 CT.
- Art. 16: Documentos falsos al ingreso. Art. 160 N1 CT.
- Art. 17: Actualizacion de antecedentes en 5 dias habiles.
- Art. 18: Inclusion laboral Ley 21.015.
${instrCambios}`;

      } else if (seccion === 3) {
        prompt = `${BASE}

Genera la SECCION 3 - TITULO III: JORNADA DE TRABAJO - PARTE 1 (Arts. 19-26). Perfil: ${NIVEL}.

DATO CRITICO DE COHERENCIA: La jornada ordinaria es de 42 horas semanales (Ley 21.561, vigente desde abril 2026, reduccion progresiva a 40h en 2028). Este dato es fijo y debe reflejarse exactamente igual en todas las secciones.

- Art. 19: Jornada ordinaria. 42 horas semanales. Distribucion en ${E} segun ${TURN}. Tabla de horarios si corresponde.
- Art. 20: Control de asistencia. Medios de registro. Consecuencias de no marcar.
- Art. 21: Ausentismo. Aviso en 24 horas. Art. 160 N3 CT. Redaccion sin automatismo sancionatorio.
- Art. 22: Atrasos. Registro y descuento proporcional. Gradualidad de la sancion.
- Art. 23: Permisos durante la jornada. Solicitud escrita, autorizacion del jefe directo.
- Art. 24: Colacion. No computable como jornada. Art. 34 CT.
- Art. 25: Teletrabajo. Ley 21.220. Si no aplica actualmente, redactar brevemente que la empresa podra acordarlo por escrito cuando corresponda.
- Art. 26: Cambios de turno. 30 dias de anticipacion.
${instrCambios}`;

      } else if (seccion === 4) {
        prompt = `${BASE}

Genera la SECCION 4 - TITULO IV: HORAS EXTRAORDINARIAS Y DESCANSOS (Arts. 27-34). Perfil: ${NIVEL}.

COHERENCIA: La jornada ordinaria es de 42 horas semanales. Las horas extras se calculan sobre esa base.

- Art. 27: Horas extraordinarias. Acuerdo escrito previo. Limite 2h diarias. Arts. 30-31 CT.
- Art. 28: Pago de horas extra. Recargo 50%. Sin autorizacion escrita no hay derecho a pago. Art. 32 CT.
- Art. 29: Descanso semanal. Domingo como regla general. Excepciones para el rubro ${R}. Art. 38 CT.
- Art. 30: Feriado anual. 15 dias habiles. Irrenunciable. No compensable en dinero durante la vigencia del contrato. Art. 67 CT.
- Art. 31: Vacaciones progresivas. 1 dia adicional por cada 3 anos. Art. 68 CT.
- Art. 32: Fraccionamiento y acumulacion del feriado. Hasta 2 periodos. Art. 70 CT.
- Art. 33: Feriado proporcional al termino del contrato. Art. 73 CT.
- Art. 34: Permisos por fallecimiento. Tabla completa: hijo (10 dias), conyuge/conviviente (7 dias), hijo no nato (7 dias habiles), padre/madre (4 dias). Fuero laboral 1 mes. Art. 66 CT.
${instrCambios}`;

      } else if (seccion === 5) {
        prompt = `${BASE}

Genera la SECCION 5 - TITULO V: DE LAS REMUNERACIONES (Arts. 35-44). Perfil: ${NIVEL}.

- Art. 35: Definicion de remuneracion y componentes. Que NO es remuneracion. Arts. 41-42 CT.
- Art. 36: Fecha y forma de pago. Dia 30 o habil anterior. Deposito bancario. Anticipo maximo 25%.
- Art. 37: Ingreso minimo. Proporcionalidad en jornadas parciales.
- Art. 38: Gratificaciones. Modalidades: 30% utilidades o 25% remuneracion anual. Arts. 46-49 CT.
- Art. 39: Descuentos legales. Cotizaciones, impuesto, cuotas sindicales. Limite 30%. Art. 58 CT.
- Art. 40: Liquidacion de sueldo. Entrega, componentes, firma.
- Art. 41: Igualdad de remuneraciones. Art. 62 bis CT. Procedimiento de reclamo interno.
- Art. 42: Reclamo por remuneraciones. Plazo de respuesta 30 dias.
- Art. 43: Asignaciones no remuneracionales. Viaticos, colacion, movilizacion.
- Art. 44: Finiquito. Ratificacion ante ministro de fe. Plazo: 5 dias habiles. Art. 163 CT.
${instrCambios}`;

      } else if (seccion === 6) {
        prompt = `${BASE}

Genera la SECCION 6 - TITULO VI: OBLIGACIONES DEL TRABAJADOR (Arts. 45-54). Perfil: ${NIVEL}.

CRITERIO: Redacta de forma equilibrada. Prioriza las obligaciones mas relevantes para el rubro ${R} y el tamano de ${E}. Evita listas excesivamente largas o tono de control exagerado. El objetivo es colaboracion y responsabilidad, no vigilancia.

- Art. 45: Obligaciones generales. Literales pertinentes para ${R}: puntualidad, registrar asistencia, avisar ausencias en 24h, buena fe, respeto, cuidar bienes, mantener orden, denunciar irregularidades.
- Art. 46: Obligaciones de seguridad. Uso de EPP, reportar condiciones inseguras, participar en capacitaciones.
- Art. 47: Cuidado de bienes. Responsabilidad proporcional segun negligencia.
- Art. 48: Confidencialidad. Informacion tecnica, comercial y financiera. Vigencia razonable post-contrato.
- Art. 49: Actualizacion de antecedentes. Cambios en 5 dias habiles.
- Art. 50: Procedimiento ante accidente del trabajo. Paso a paso claro. Traslado a ${OA}.
- Art. 51: Trato y convivencia. Respeto mutuo, ambiente libre de violencia.
- Art. 52: Obligaciones especificas del rubro ${R}. Solo las mas relevantes y aplicables.
- Art. 53: Capacitacion obligatoria. Asistencia y registro.
- Art. 54: Uso de tecnologia corporativa. Solo fines laborales.
${instrCambios}`;

      } else if (seccion === 7) {
        prompt = `${BASE}

Genera la SECCION 7 - TITULO VII: PROHIBICIONES DEL TRABAJADOR (Arts. 55-62). Perfil: ${NIVEL}.

CRITERIO: Redacta las prohibiciones de forma sobria y juridicamente prudente. Cada prohibicion debe tener fundamento claro y ser proporcional a la realidad de ${E}.

- Art. 55: Prohibiciones laborales. Horas extra sin autorizacion, abandonar puesto sin permiso, atender asuntos personales en jornada, cargos en empresas competidoras.
- Art. 56: Prohibiciones de seguridad. No usar EPP, operar sin capacitacion, desactivar sistemas de seguridad, trabajar bajo efectos de alcohol o drogas.
- Art. 57: Prohibiciones sobre bienes de la empresa. Art. 160 N6 CT.
- Art. 58: Prohibiciones en control de asistencia. Marcar tarjeta ajena como falta grave. Art. 160 N1 CT.
- Art. 59: Sustancias prohibidas. Alcohol y drogas en instalaciones. Facultad de control aleatorio con protocolo.
- Art. 60: Prohibicion de acoso y violencia. Remision al Titulo XII - Ley Karin.
- Art. 61: Otras prohibiciones pertinentes para ${E}.
- Art. 62: Prohibiciones especificas del rubro ${R}. Solo las mas relevantes.
${instrCambios}`;

      } else if (seccion === 8) {
        prompt = `${BASE}

Genera la SECCION 8 - TITULO VIII: ORDEN Y DISCIPLINA (Arts. 63-72). Perfil: ${NIVEL}.

CRITERIO CRITICO DE CALIDAD: Las sanciones deben tener gradualidad explicita y razonabilidad juridica. NUNCA redactes como si cualquier incumplimiento derivara automaticamente en despido. El reglamento puede regular conductas pero no puede sonar como una maquina sancionatoria. Toda aplicacion de sancion requiere analisis del caso concreto.

- Art. 63: Sistema de sanciones. Gradualidad: amonestacion verbal, escrita, escrita con copia a la Inspeccion del Trabajo, multa. Art. 154 N10 CT.
- Art. 64: Multas. Maximo 25% de la remuneracion diaria. Destino: bienestar de los trabajadores o capacitacion. Art. 157 CT.
- Art. 65: Derecho a reclamo. Tercer dia habil desde notificacion. Inspeccion del Trabajo.
- Art. 66: Causales Art. 160 CT. Las 7 causales con ejemplos concretos para ${R}. Redactar como situaciones que requieren analisis previo y verificacion, no como consecuencias automaticas.
- Art. 67: Causal Art. 161 CT. Necesidades de la empresa. Preaviso 30 dias. Indemnizacion legal.
- Art. 68: Causales Art. 159 CT. Mutuo acuerdo, renuncia, muerte, vencimiento del plazo, conclusion de obra.
- Art. 69: Finiquito y certificado de trabajo. Art. 162 CT.
- Art. 70: Peticiones y reclamos internos. Plazo de respuesta 5 dias habiles.
- Art. 71: Investigacion disciplinaria interna. Derecho a conocer cargos y presentar descargos. Plazo: 15 dias habiles.
- Art. 72: Relaciones laborales armonicas. Compromiso de ${E} con un ambiente de trabajo digno y respetuoso.
${instrCambios}`;

      } else if (seccion === 9) {
        prompt = `${BASE}

Genera la SECCION 9 - TITULO IX: HIGIENE Y SEGURIDAD - PARTE 1 (Arts. 73-82). Perfil: ${NIVEL}.

- Art. 73: Marco normativo. Ley 16.744, DS 44/2023 (reemplaza DS 40 y DS 54), Ley 21.012, Art. 184 CT.
- Art. 74: Obligaciones del empleador. Art. 184 CT: condiciones seguras, EPP sin costo, IPER actualizada, capacitacion, investigar accidentes.
- Art. 75: Obligaciones del trabajador en seguridad. Lista proporcional al riesgo real del rubro ${R}.
- Art. 76: Identificacion y control de riesgos. Matriz IPER. Los 5-7 riesgos mas relevantes del rubro ${R} con jerarquia de controles: eliminacion, sustitucion, ingenieria, administrativo, EPP.
- Art. 77: EPP obligatorio para ${R}. Lista especifica. Entrega gratuita, reposicion, prohibicion de prestar o vender.
- Art. 78: Senalizacion. Zonas de riesgo, evacuacion, extintores, botiquines.
- Art. 79: Orden y limpieza. Pasillos despejados, almacenamiento ordenado.
- Art. 80: CPHS. Obligatorio para 25+ trabajadores. Composicion, funciones, reunion mensual. DS 54/1969, DS 44/2023. Si la empresa tiene menos de 25 trabajadores, indicar que se designara un delegado de prevencion.
- Art. 81: Departamento de Prevencion. Obligatorio para 100+ trabajadores. Si ${TRAB} < 100, indicar que se designara un responsable interno de prevencion.
- Art. 82: Politica alcohol y drogas. Tolerancia cero. Control aleatorio con protocolo. Consecuencias dentro del sistema gradual de sanciones.
${instrCambios}`;

      } else if (seccion === 10) {
        prompt = `${BASE}

Genera la SECCION 10 - TITULO X: HIGIENE Y SEGURIDAD - PARTE 2 (Arts. 83-90). Perfil: ${NIVEL}.

- Art. 83: Prevencion de incendios. Extintores vigentes, rutas de evacuacion, simulacros anuales, brigada de emergencia. Procedimiento de evacuacion paso a paso.
- Art. 84: Primeros auxilios. Botiquines abastecidos. Al menos un trabajador por turno certificado. Procedimiento ante accidente: conservar calma, llamar al numero de emergencia, no mover al accidentado si hay riesgo de lesion espinal, coordinar traslado a ${OA}.
- Art. 85: Higiene industrial. Iluminacion, ruido (limite 85 dB TWA), temperatura (10C-30C), ventilacion, ergonomia.
- Art. 86: Capacitaciones obligatorias. Induccion al ingreso (antes de iniciar labores), anual en riesgos del rubro ${R}, uso de EPP, primeros auxilios. Registro con lista de asistencia.
- Art. 87: Riesgos especificos del rubro ${R}. Identifica 5-6 riesgos propios con descripcion, situacion de ocurrencia y medida preventiva principal.
- Art. 88: Procedimientos de Trabajo Seguro. Para las tareas de mayor riesgo en ${R}: analisis de riesgos, pasos seguros, EPP requerido.
- Art. 89: Inspecciones de seguridad. CPHS y administracion de ${E}. Derecho de fiscalizacion de Inspeccion del Trabajo, SEREMI de Salud y ${OA}.
- Art. 90: Derecho a saber. Riesgos del puesto, sustancias peligrosas y HDS, EPP requerido, procedimientos de emergencia. Art. 21 DS 44/2023.
${instrCambios}`;

      } else if (seccion === 11) {
        prompt = `${BASE}

Genera la SECCION 11 - TITULO XI: ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES (Arts. 91-100). Perfil: ${NIVEL}.

- Art. 91: Definiciones. Accidente del trabajo, accidente de trayecto y enfermedad profesional. Art. 5 Ley 16.744.
- Art. 92: Procedimiento inmediato ante accidente. 7 pasos: conservar calma, avisar al jefe, llamar al numero de emergencia, aplicar primeros auxilios si esta capacitado, no mover al accidentado si hay riesgo de lesion espinal, coordinar traslado a ${OA}, preservar el lugar para la investigacion.
- Art. 93: DIAT. Denuncia a ${OA} dentro de 24 horas.
- Art. 94: Accidente de trayecto. Trayecto directo. Acreditacion: parte policial, certificado medico o declaracion jurada.
- Art. 95: Investigacion de accidentes. CPHS o empleador, dentro de 24-48h. Causas inmediatas, basicas y raiz. Medidas correctivas. DS 44/2023.
- Art. 96: Accidentes graves y fatales. Llamar a emergencias (132/131), notificar a Inspeccion del Trabajo y SEREMI de Salud dentro de 24h, suspender faenas en el area.
- Art. 97: Enfermedades profesionales. DIEP ante ${OA}. Vigilancia medica para trabajadores expuestos en el rubro ${R}.
- Art. 98: Prestaciones. Atencion medica gratuita, medicamentos, rehabilitacion, subsidio 100%. Ley 16.744.
- Art. 99: Estadisticas de accidentabilidad. Tasa de frecuencia, gravedad y accidentabilidad. Reporte mensual al CPHS.
- Art. 100: Rehabilitacion y reincorporacion. Gradual, respetando restricciones medicas, coordinada con ${OA}.
${instrCambios}`;

      } else if (seccion === 12) {
        prompt = `${BASE}

Genera la SECCION 12 - TITULO XII: PROTOCOLO LEY KARIN - PARTE 1 (Arts. 101-107).
Ley 21.643, vigente desde el 1 de agosto de 2024. Arts. 211-A al 211-I CT. DS 2/2024.

- Art. 101: Fundamento legal y objetivo. Ley 21.643, perspectiva de genero, compromiso de ${E} con un entorno laboral libre de violencia.
- Art. 102: Ambito. Todos los trabajadores y trabajadoras de ${E} sin excepcion, mas contratistas, proveedores, visitas y practicantes.
- Art. 103: Acoso sexual. Definicion con ejemplos verbales, fisicos, digitales y visuales. La caracteristica esencial es que NO es consentido. Art. 2 CT.
- Art. 104: Acoso laboral. Conductas reiteradas o unicas que causen menoscabo o humillacion. Ejemplos: aislamiento, humillacion publica, tareas degradantes, sobrecarga excesiva. Art. 2 CT.
- Art. 105: Violencia por terceros. Clientes, proveedores, usuarios y visitas. Medidas de proteccion de ${E}.
- Art. 106: Principios. Confidencialidad, no represalia, perspectiva de genero, presuncion de buena fe, imparcialidad, celeridad.
- Art. 107: Canal de denuncia. Correo designado (${P}), formulario fisico en RRHH, denuncia verbal ante encargado/a designado/a, o directamente ante la Inspeccion del Trabajo. Opcion de anonimato.
${instrCambios}`;

      } else if (seccion === 13) {
        prompt = `${BASE}

Genera la SECCION 13 - TITULO XII: PROTOCOLO LEY KARIN - PARTE 2 (Arts. 108-114). Arts. 211-A al 211-I CT.

- Art. 108: Procedimiento de denuncia. Contenido minimo, constancia de recepcion con fecha y hora, inicio de investigacion en 5 dias habiles, opcion de derivar a la Inspeccion del Trabajo.
- Art. 109: Medidas de resguardo inmediatas. Separacion de espacios fisicos, redistribucion de jornada, teletrabajo temporal, derivacion psicologica a traves de ${OA}. No implican prejuzgamiento.
- Art. 110: Investigacion interna. Investigador imparcial y capacitado, sin conflicto de interes. Notificacion de cargos al investigado. Derecho a defensa. Audiencias. Informe final con conclusiones y propuesta de medidas. Plazo maximo: 30 dias habiles.
- Art. 111: Investigacion por la Inspeccion del Trabajo. Cooperacion plena de ${E}. Adoptar medidas ordenadas. Plazo: 30 dias habiles.
- Art. 112: Sanciones. Gradualidad: amonestacion, multa, traslado, despido (Art. 160 N1 b) acoso sexual o f) acoso laboral CT). Las represalias contra quien denuncia de buena fe tambien seran sancionadas.
- Art. 113: Capacitacion anual. Obligatoria para todos. Contenido minimo: definiciones, conductas prohibidas, canal de denuncia, procedimiento, sanciones. Registro con lista de asistencia.
- Art. 114: Conductas que NO constituyen acoso. Evaluaciones objetivas, instrucciones de trabajo, cambios organizativos, medidas disciplinarias ajustadas a derecho, ejercicio legitimo de facultades directivas.
${instrCambios}`;

      } else if (seccion === 14) {
        prompt = `${BASE}

Genera la SECCION 14 - TITULO XIV: TEMER, ISTAS21 Y MANEJO DE CARGAS (Arts. 115-128). Perfil: ${NIVEL}.

TEMER (Arts. 115-118):
- Art. 115: Marco legal. Protocolo TEMER, SUSESO. Aplicacion en el rubro ${R}.
- Art. 116: Factores de riesgo. Trabajo repetitivo, posturas forzadas, aplicacion de fuerza, vibracion. Evaluacion anual mediante RULA/OCRA u otras metodologias validadas.
- Art. 117: Medidas preventivas. Rotacion de puestos, pausas activas (minimo 2 veces por jornada), rediseno ergonomico, herramientas adecuadas.
- Art. 118: Vigilancia medica. Examenes periodicos con ${OA}. Adaptaciones del puesto ante casos detectados.

ISTAS21 (Arts. 119-121):
- Art. 119: Marco legal. Protocolo SUSESO/ISTAS21. Obligatorio para 10+ trabajadores. DS 44/2023.
- Art. 120: Dimensiones del riesgo psicosocial. Exigencias psicologicas, trabajo activo y desarrollo, apoyo social y liderazgo, compensaciones, doble presencia.
- Art. 121: Aplicacion y medidas. Cuestionario cada 2 anos, anonimo y confidencial. Plan de accion segun nivel de riesgo. El CPHS participa en el analisis y seguimiento.

MANEJO MANUAL DE CARGAS (Arts. 122-128):
- Art. 122: Marco legal. Ley 20.001 y DS 63/2005.
- Art. 123: Limites de peso. Hombres: 25 kg. Mujeres y menores/mayores de edad: 20 kg. Embarazadas: maximo 5 kg.
- Art. 124: Tecnica correcta de levantamiento. 7 pasos: evaluar el peso, ubicarse cerca de la carga, pies al ancho de los hombros, doblar rodillas manteniendo espalda recta, tomar firmemente con ambas manos, levantar con la fuerza de las piernas, evitar girar el torso.
- Art. 125: Medidas de control. Medios mecanicos para cargas que superan los limites. Restricciones especiales para embarazadas.
- Art. 126: Capacitacion anual. Tecnica correcta, factores de riesgo, uso de medios mecanicos.
- Art. 127: Pausas de recuperacion. Segun carga y frecuencia, conforme a tablas del DS 63/2005.
- Art. 128: Seguimiento CPHS. Revision periodica. Lesiones por sobreesfuerzo se investigan como accidentes del trabajo.
${instrCambios}`;

      } else if (seccion === 15) {
        prompt = `${BASE}

Genera la SECCION 15 - TITULOS XV Y XVI: MATERNIDAD/PATERNIDAD Y DATOS PERSONALES (Arts. 129-139). Perfil: ${NIVEL}.

MATERNIDAD Y PATERNIDAD (Arts. 129-136):
- Art. 129: Marco legal. Arts. 194-208 CT, Ley 20.545.
- Art. 130: Fuero maternal. Desde el embarazo hasta 1 ano post posnatal. Requiere desafuero judicial. Extension a adopcion Ley 19.620.
- Art. 131: Descansos de maternidad. Prenatal: 6 semanas. Posnatal: 12 semanas. Posnatal parental adicional: 12 semanas, transferibles en parte al padre. Arts. 195-197 CT.
- Art. 132: Permiso de paternidad. 5 dias pagados, irrenunciable.
- Art. 133: Sala cuna y amamantamiento. Sala cuna obligatoria para 20+ trabajadoras. Derecho a 1 hora diaria de amamantamiento hasta los 2 anos del hijo, sin descuento de remuneracion. Arts. 203-206 CT.
- Art. 134: Restricciones por embarazo o lactancia. Traslado con misma remuneracion a funciones compatibles. Art. 202 CT.
- Art. 135: Permiso por enfermedad grave del hijo menor de 1 ano. Art. 199 CT.
- Art. 136: Permisos por fallecimiento de hijo o conyuge. Fuero laboral por 1 mes. Art. 66 CT.

PROTECCION DE DATOS PERSONALES - Ley 21.719 (Arts. 137-139):
- Art. 137: Marco legal y datos que trata ${E}. Identificacion, laborales, salud (solo fines laborales), financieros, imagenes de videovigilancia. Finalidad exclusivamente laboral.
- Art. 138: Principios. Licitud, finalidad, proporcionalidad, calidad, seguridad y transparencia.
- Art. 139: Derechos ARCO. Acceso, rectificacion, cancelacion y oposicion. Responsable designado en ${E} (${P}). Plazo de respuesta: 15 dias habiles.
${instrCambios}`;

      } else if (seccion === 16) {
        prompt = `${BASE}

Genera la SECCION 16 FINAL - TITULO XVII: DISPOSICIONES FINALES, NORMATIVA Y DECLARACION (Arts. 140-142). Perfil: ${NIVEL}.

Art. 140: Vigencia. Entra en vigor 30 dias despues de ser puesto en conocimiento de los trabajadores, salvo objecion fundada de la Inspeccion del Trabajo. Deposito ante la Inspeccion del Trabajo y SEREMI de Salud. Art. 156 CT. Minimo 7 lineas. Cierra formalmente el articulo.

Art. 141: Difusion y entrega. Copia fisica o digital al ingreso. Firma de cargo. Carteleras permanentes. Disponible para consulta en todo momento. Minimo 6 lineas. Cierra formalmente el articulo.

Art. 142: Normativa supletoria y modificaciones. Aplicacion supletoria del Codigo del Trabajo. ${E} se compromete a mantener este reglamento actualizado. Toda modificacion seguira el procedimiento del Art. 8. Minimo 6 lineas. Cierra formalmente el articulo.

---

## NORMATIVA DE REFERENCIA

| N | Norma | Materia | Ano |
|---|-------|---------|-----|
| 1 | Codigo del Trabajo DFL N1/2003 | Marco general laboral | 2003 |
| 2 | Ley N16.744 | Accidentes del trabajo y enfermedades profesionales | 1968 |
| 3 | DS N44/2023 | Seguridad y Salud Ocupacional | 2023 |
| 4 | Ley N21.643 - Ley Karin | Prevencion acoso laboral, sexual y violencia | 2024 |
| 5 | Ley N21.719 | Proteccion de datos personales | 2022 |
| 6 | Ley N21.561 | Reduccion jornada laboral progresiva hasta 40h en 2028 | 2024 |
| 7 | Ley N20.001 | Manejo manual de cargas humanas | 2005 |
| 8 | DS N63/2005 | Reglamento manejo de cargas | 2005 |
| 9 | Ley N21.012 | Garantia del derecho a la seguridad y salud | 2017 |
| 10 | Ley N21.015 | Inclusion laboral personas con discapacidad | 2017 |
| 11 | Ley N21.220 | Teletrabajo y trabajo a distancia | 2020 |
| 12 | Protocolo TEMER | Trastornos musculoesqueleticos | SUSESO |
| 13 | Protocolo SUSESO/ISTAS21 | Riesgos psicosociales en el trabajo | SUSESO |
| 14 | Ley N20.545 | Posnatal parental | 2011 |
| 15 | DS N2/2024 | Politica Nacional de Seguridad y Salud | 2024 |
| 16 | DS N54/1969 | Constitucion y funcionamiento del CPHS | 1969 |

---

## DECLARACION DE VIGENCIA Y APROBACION

El presente Reglamento Interno de Orden, Higiene y Seguridad de **${E}** ha sido elaborado en conformidad con el articulo 153 y siguientes del Codigo del Trabajo (DFL N1/2003), incorporando la normativa laboral vigente en Chile a la fecha de su elaboracion.

**${RL}**
Representante Legal - **${E}**
RUT: ${RUT}
${DIR}

*Elaborado: ${new Date().toLocaleDateString('es-CL')} - Version 01/${new Date().getFullYear()}*
${instrCambios}`;

      } else {
        return res.status(400).json({ error: `Seccion ${seccion} no valida.` });
      }

    // ═══════════════════════════════════════════
    // RESUMEN EJECUTIVO
    // ═══════════════════════════════════════════
    } else if (tipo === 'resumen_empleador') {
      prompt = `${BASE}

Genera un RESUMEN EJECUTIVO del RIOHS para Gerencia y RRHH de ${E}. Estilo ejecutivo, directo y accionable. Sin inflado juridico.

# RESUMEN EJECUTIVO - RIOHS ${new Date().getFullYear()}
## ${E} | Rubro: ${R}

## Por que existe este documento
Que es el RIOHS, por que es obligatorio (Art. 153 CT) y que consecuencias tiene no tenerlo actualizado. Maximo 6 lineas.

## Lo que el empleador DEBE hacer - Obligaciones criticas
Lista de 10-12 obligaciones concretas. Para cada una: que es, que ley lo exige, que pasa si no se cumple. Incluir: entrega del RIOHS al trabajador, condiciones seguras (Art. 184 CT), protocolo Ley Karin, CPHS si corresponde, capacitaciones, investigar accidentes, ISTAS21, TEMER, igualdad de remuneraciones, finiquito en plazo.

## Plazos clave
Tabla: | Obligacion | Plazo | Consecuencia del incumplimiento |

## Los 5 riesgos legales mas importantes para ${E}
5 riesgos especificos para el rubro ${R} con la multa o consecuencia legal concreta.

## Normativa reciente - Verificar que este incorporada
Ley Karin (agosto 2024), DS 44/2023, Ley 21.719, Ley 21.561. Una linea por norma.

---
*Este resumen no reemplaza el RIOHS completo.*`;

    // ═══════════════════════════════════════════
    // INFORME DE CAMBIOS
    // ═══════════════════════════════════════════
    } else if (tipo === 'informe_cambios') {
      const lista = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo} - ${a.descripcion} (${a.normativa||''})`
      ).join('\n');

      prompt = `${BASE}

Genera un INFORME DE CAMBIOS para la auditoria del RIOHS de ${E}. Claro, bien estructurado, sin inflado.

# INFORME DE ACTUALIZACION DEL RIOHS
## ${E} - ${new Date().toLocaleDateString('es-CL')}

## Resumen ejecutivo
En 5-6 lineas: cuantos cambios se realizaron (${(alertas_seleccionadas||[]).length}), de que tipo, impacto legal de haberlos aplicado, estado actual del reglamento.

## Cambios realizados

### Articulos INCORPORADOS (antes faltaban)
Lista de cambios tipo falta. Por cada uno: que se incorporo y que normativa lo exige.

### Articulos ACTUALIZADOS
Lista de cambios tipo cambio. Por cada uno: que se modifico y con que normativa.

### Articulos ELIMINADOS o derogados
Lista de cambios tipo sobra. Por cada uno: que se elimino y por que.

### Errores CORREGIDOS
Lista de cambios tipo error. Por cada uno: que error se corrigio.

Cambios aplicados:
${lista}

## Estado del RIOHS actualizado
Semaforo:
- Verde: areas completamente actualizadas
- Amarillo: areas que requieren revision periodica
- Rojo: cambios pendientes si quedaron alertas sin aplicar

## Proxima revision recomendada
Cuando hacer la proxima auditoria y que normativa monitorear en los proximos 12 meses.

*Informe generado el ${new Date().toLocaleDateString('es-CL')} - Sistema Mas Prevencion*`;

    // ═══════════════════════════════════════════
    // AUDITORIA ANALISIS
    // ═══════════════════════════════════════════
    } else if (tipo === 'auditoria_analisis') {
      let parte = req.body.parte || 1;
      prompt = `Eres experto en derecho laboral chileno con criterio editorial riguroso.
Empresa: ${E} | Rubro: ${R} | OA: ${OA}
Normativa vigente: DS 44/2023, Ley Karin 21.643 (agosto 2024), Ley 21.719, Ley 21.561 (42h desde abril 2026), Ley 16.744.

FRAGMENTO DEL RIOHS A AUDITAR (parte ${parte} de 3):
${(documento_existente||'').substring(0,2500)}

Analiza este fragmento con criterio juridico y editorial. Detecta:
- Normativa faltante o desactualizada
- Redaccion excesivamente rigida o automaticamente sancionatoria
- Desequilibrios entre potestad del empleador y derechos del trabajador
- Articulos truncados o mal cerrados
- Inconsistencias internas en jornada, sanciones o procedimientos

Devuelve SOLO este JSON sin texto antes ni despues:
\`\`\`json
{"alertas":[{"id":1,"tipo":"falta","prioridad":"alta","titulo":"Titulo descriptivo","descripcion":"Descripcion clara en 1-2 oraciones.","seccion":"Seccion o articulo afectado","normativa":"Ley o decreto con ano"}]}
\`\`\`
TIPOS: falta o cambio o sobra o error
PRIORIDADES: alta (sancion vigente) o media (recomendado) o baja (forma)
Genera 5-10 alertas especificas y accionables para este fragmento.`;

    } else {
      return res.status(400).json({ error: 'Tipo no valido' });
    }

    // ═══════════════════════════════════════════
    // STREAMING GLOBAL
    // Mantiene la conexion activa evitando el
    // timeout de 60 segundos de Vercel Hobby
    // ═══════════════════════════════════════════
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicRes.ok) {
      const errData = await anthropicRes.json();
      res.write(`data: ${JSON.stringify({ error: errData.error?.message || 'API error' })}\n\n`);
      return res.end();
    }

    let textoCompleto = '';
    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const texto = parsed.delta.text;
            textoCompleto += texto;
            res.write(`data: ${JSON.stringify({ chunk: texto })}\n\n`);
          }
        } catch {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, contenido: textoCompleto, tipo, seccion })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error:', error);
    try {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } catch {
      res.status(500).json({ error: error.message });
    }
  }
}
