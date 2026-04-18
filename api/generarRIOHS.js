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
    const FUNC = cliente.funcion_real || 'No especificada';

    const NIVEL = perfil?.nivel || 'intermedio';
    const CAMBIOS_AUDITORIA = perfil?.cambios || '';
    // max_tokens: resumen e informe siempre 3500 independiente del perfil
    const MAX_TOKENS = (tipo === 'resumen_empleador' || tipo === 'informe_cambios')
      ? 3500
      : (perfil?.max_tokens || 3500);

    // ═══════════════════════════════════════════
    // SECCIÓN 0 — PERFIL EDITORIAL
    // ═══════════════════════════════════════════
    if (tipo === 'perfil') {
      const rubrosAltoRiesgo = ['construccion','mineria','manufactura','transporte','seguridad privada','agroindustria'];
      const esAltoRiesgo = rubrosAltoRiesgo.some(r => R.toLowerCase().includes(r));
      const esFaena = ['terreno','faena','planta','obra','produccion'].some(f => FUNC.toLowerCase().includes(f));
      const esOficina = ['oficina','administracion','consultoria','capacitacion','educacion','servicios','tecnologia','ti ','software'].some(f => R.toLowerCase().includes(f) || FUNC.toLowerCase().includes(f));
      const tieneTurnos = TURN && !['sin turnos','jornada diurna'].some(t => TURN.toLowerCase().includes(t));
      const esGrande = TRAB >= 100;
      const esMediana = TRAB >= 25 && TRAB < 100;

      let nivel, paginas, maxTok, secciones, articulos, justificacion;

      if (esGrande || (esAltoRiesgo && esFaena)) {
        nivel = 'extenso'; paginas = '90-110 paginas'; maxTok = 4000; secciones = 16; articulos = '~130-142';
        justificacion = `Con ${TRAB > 0 ? TRAB + ' trabajadores' : 'dotacion grande'} y rubro ${R} (funcion: ${FUNC}), el reglamento requiere desarrollo completo con protocolos detallados.`;
      } else if (esMediana || tieneTurnos || cliente.tiene_sindicato || (esAltoRiesgo && !esFaena)) {
        nivel = 'intermedio'; paginas = '60-80 paginas'; maxTok = 3500; secciones = 12; articulos = '~90-105';
        justificacion = `Con ${TRAB > 0 ? TRAB + ' trabajadores' : 'dotacion mediana'} en ${R}, el reglamento cubre todos los aspectos legales con nivel de detalle moderado.`;
      } else {
        nivel = 'compacto'; paginas = '35-50 paginas'; maxTok = 2800; secciones = 8; articulos = '~65-75';
        justificacion = `Con ${TRAB > 0 ? TRAB + ' trabajadores' : 'dotacion pequena'} en ${R} (${esOficina ? 'entorno de oficina, bajo riesgo fisico' : 'operacion simple'}), el reglamento debe ser preciso y directo. Arquitectura simplificada: ${secciones} secciones fusionadas, sin mini-capitulos doctrinales.`;
      }

      return res.status(200).json({
        nivel, paginas, max_tokens: maxTok, secciones, articulos, justificacion,
        variables_coherencia: {
          jornada: '42 horas semanales (Ley 21.561, vigente abril 2026)',
          aviso_inasistencia: 'dentro de las primeras 2 horas de iniciada la jornada',
          organismo_administrador: OA,
          turnos: TURN,
          trabajadores: TRAB || P,
          sindicato: SIN,
          funcion_real: FUNC,
          region: REG
        }
      });
    }

    // ═══════════════════════════════════════════
    // CRITERIO MAESTRO
    // ═══════════════════════════════════════════
    const CRITERIO = `
CRITERIO MAESTRO DE CALIDAD (OBLIGATORIO):
Perfil: ${NIVEL.toUpperCase()} | Empresa: ${TRAB||'?'} trabajadores | Funcion real: ${FUNC}

VARIABLES DE COHERENCIA INTERNA (usar estas mismas en TODAS las secciones):
- Jornada ordinaria: 42 horas semanales (Ley 21.561, vigente abril 2026)
- Aviso de inasistencia: SIEMPRE "dentro de las primeras 2 horas de iniciada la jornada" (no cambiar en ninguna seccion)
- Organismo Administrador: ${OA}
- Turnos: ${TURN} | Sindicato: ${SIN}

REGLAS OBLIGATORIAS:
1. NUNCA dejes un articulo truncado o una frase incompleta. Si falta informacion puntual del cliente, usa "${P}" solo para ese dato. NUNCA como parche de contenido incompleto.
2. NO uses "periodo de prueba" como clausula general. Es figura juridicamente delicada en Chile. Si debes regular adaptacion inicial, usa: "acompanamiento al inicio de la relacion laboral" o "evaluacion de adaptacion al cargo".
3. Horas extraordinarias: distingue siempre entre (a) exigencia de autorizacion previa, (b) consecuencias disciplinarias por incumplir esa regla, y (c) tratamiento del tiempo efectivamente trabajado. NUNCA redactes como negacion absoluta del pago.
4. Sanciones: gradualidad explicita. NUNCA automatismo hacia el despido.
5. Sin errores de codificacion: usa solo caracteres ASCII seguros o UTF-8 limpio. No uses caracteres especiales que puedan corromperse.
6. Perfil ${NIVEL}: ${NIVEL === 'compacto' ? 'usa reglas practicas suficientes, no mini-capitulos doctrinales. Una regla clara vale mas que tres parrafos que dicen lo mismo.' : NIVEL === 'intermedio' ? 'desarrollo moderado sin inflado.' : 'desarrollo completo con protocolos detallados.'}`;

    const BASE = `Eres experto en derecho laboral chileno con criterio editorial riguroso.
Empresa: ${E} | RUT: ${RUT} | Rubro: ${R} | Funcion real: ${FUNC} | Region: ${REG} | Trabajadores: ${TRAB||P} | Turnos: ${TURN} | ${SIN} | OA: ${OA} | Rep. Legal: ${RL} | Direccion: ${DIR}.
${CRITERIO}`;

    let prompt = '';

    if (tipo === 'nuevo' && seccion) {
      const instrCambios = CAMBIOS_AUDITORIA
        ? `\n\nCAMBIOS DE AUDITORIA A INCORPORAR EN ESTA SECCION:\n${CAMBIOS_AUDITORIA}` : '';

      // ═══════════════════════════════════════════
      // ARQUITECTURA COMPACTA — 8 SECCIONES
      // Secciones fusionadas para empresas pequenas
      // ═══════════════════════════════════════════
      if (NIVEL === 'compacto') {

        const INDICE_C = `## INDICE GENERAL
| N | TITULO | ARTICULOS |
|---|--------|-----------|
| I | Disposiciones Generales e Ingreso | 1-18 |
| II | Jornada, Horas Extra y Descansos | 19-32 |
| III | Remuneraciones | 33-42 |
| IV | Obligaciones y Prohibiciones | 43-56 |
| V | Disciplina y Reclamos | 57-64 |
| VI | Higiene, Seguridad y Accidentes | 65-76 |
| VII | Protocolo Ley Karin | 77-86 |
| VIII | Normativas Especificas y Cierre | 87-98 |`;

        if (seccion === 1) {
          prompt = `${BASE}

Genera la SECCION 1 COMPACTA: Portada + Indice + Titulo I Disposiciones Generales + Titulo II Ingreso (Arts. 1-18).

PORTADA:
# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
# ${E.toUpperCase()}
RUT: ${RUT} | Rubro: ${R} | Region: ${REG}
Direccion: ${DIR} | Organismo Administrador: ${OA}
Representante Legal: ${RL} | Version 01 - ${new Date().getFullYear()}

El presente Reglamento Interno ha sido elaborado en cumplimiento del articulo 153 del Codigo del Trabajo, y es de observancia obligatoria para todos los trabajadores de ${E} desde el inicio de la relacion laboral.

${INDICE_C}

## TITULO I: DISPOSICIONES GENERALES (Arts. 1-8)
Redacta los articulos 1 al 8. Perfil compacto: reglas claras y practicas, sin desarrollo doctrinal excesivo.
- Art. 1: Objeto y ambito. Que regula, a quienes aplica. Art. 153 CT.
- Art. 2: Definiciones esenciales: empleador, trabajador, empresa. Arts. 3 y 7 CT.
- Art. 3: Definiciones operativas: jefe inmediato, jornada, turno, hora extraordinaria, feriado, licencia medica. Todas en un solo articulo sintetico.
- Art. 4: Definiciones economicas: remuneracion, sueldo, gratificacion. En un solo articulo.
- Art. 5: Entrega y recepcion del reglamento. Firma de cargo. Art. 153 CT.
- Art. 6: Vigencia y modificacion. Proceso ante la Inspeccion del Trabajo. Plazos. Art. 156 CT.
- Art. 7: Valor juridico del reglamento como instrumento de la relacion laboral.
- Art. 8: Normativa supletoria aplicable.

## TITULO II: DEL INGRESO Y CONTRATACION (Arts. 9-18)
Perfil compacto: documentos pertinentes para ${R} con ${TRAB} trabajadores. Separar esenciales de condicionales por cargo. No pedir documentos sin relacion con la funcion.
- Art. 9: Requisitos de ingreso. ESENCIALES para todos los cargos en ${R}: cedula de identidad, curriculum vitae, certificado de antecedentes laborales, certificado de estudios/titulo segun cargo. ADICIONALES segun funcion: para relatores/docentes agrega acreditacion equivalente; para manejo de fondos, referencias laborales. No mas que lo necesario.
- Art. 10: Examenes preocupacionales. Ajustados al bajo riesgo fisico del rubro ${R}: se realizan en el centro medico de ${OA}. Para funciones de oficina, examen general de salud suficiente.
- Art. 11: Acompanamiento al inicio de la relacion laboral. En los primeros 30 dias, el/la trabajador/a recibe orientacion sobre sus funciones, equipo de trabajo y normas internas. Esto no constituye un periodo de prueba laboral especial sino un proceso de integracion normal.
- Art. 12: Celebracion del contrato. 15 dias desde el ingreso (5 dias para contratos inferiores a 30 dias). Art. 9 CT.
- Art. 13: Contenido minimo del contrato. Literales a) a i). Art. 10 CT.
- Art. 14: Modificaciones al contrato. Formalidad escrita.
- Art. 15: Actualizacion de antecedentes personales. Plazo: 5 dias habiles.
- Art. 16: Documentos falsos. Art. 160 N1 CT.
- Art. 17: Certificado de antecedentes penales. Solo cuando sea pertinente al cargo.
- Art. 18: Inclusion laboral. Ley 21.015.
${instrCambios}`;

        } else if (seccion === 2) {
          prompt = `${BASE}

Genera la SECCION 2 COMPACTA: Jornada + Horas Extra + Descansos (Arts. 19-32).
Perfil compacto: una regla clara por materia. Sin desarrollo doctrinal extenso.

COHERENCIA CRITICA: Aviso de inasistencia = "dentro de las primeras 2 horas de iniciada la jornada". Esta regla debe ser IDENTICA en esta seccion y en la seccion de obligaciones. No cambiar.

## TITULO III: JORNADA, HORAS EXTRA Y DESCANSOS (Arts. 19-32)
- Art. 19: Jornada ordinaria. 42 horas semanales (Ley 21.561, vigente abril 2026, reduccion progresiva a 40h en 2028). Horario de ${E}: ${TURN}. Una regla clara, sin tabla extensa si no hay turnos complejos.
- Art. 20: Control de asistencia. Medio de registro: ${P}. Obligacion de registrar entrada y salida. No marcar tarjeta ajena es falta grave.
- Art. 21: Ausentismo. Aviso al jefe directo dentro de las primeras 2 horas de iniciada la jornada, por cualquier medio. Sin aviso justificado, la inasistencia es injustificada y puede sancionarse.
- Art. 22: Atrasos. Se registran y descuentan proporcionalmente. La reincidencia se sanciona conforme al sistema gradual.
- Art. 23: Permisos durante la jornada. Solicitud escrita o verbal al jefe directo. Imputacion al feriado o descuento segun acuerdo.
- Art. 24: Colacion. Tiempo no computable como jornada. Art. 34 CT.
- Art. 25: Teletrabajo. ${R === 'Educacion' || FUNC.toLowerCase().includes('oficina') ? `Dado el rubro, ${E} podra acordar teletrabajo por escrito. Se aplicara Ley 21.220: desconexion digital minima de 12 horas, provision de herramientas, cobertura del seguro de accidentes en el lugar designado.` : `${E} podra acordar teletrabajo por escrito cuando corresponda. Se aplica Ley 21.220.`}
- Art. 26: Horas extraordinarias. Solo con autorizacion escrita previa del empleador. Limite: 2 horas diarias. Art. 30-31 CT. Trabajar tiempo extra sin dicha autorizacion constituye infraccion a este reglamento y podra ser sancionado disciplinariamente. El tiempo efectivamente trabajado en esas condiciones sera evaluado caso a caso por el empleador conforme a la ley.
- Art. 27: Pago de horas extra. Las horas extras autorizadas se pagan con recargo del 50% sobre el sueldo convenido para la jornada ordinaria. Art. 32 CT.
- Art. 28: Descanso semanal. Domingo como regla general. Art. 38 CT.
- Art. 29: Feriado anual. 15 dias habiles con remuneracion integra. Irrenunciable. Art. 67 CT. Para trabajadores con mas de 10 anos laborados, se agrega 1 dia por cada 3 nuevos anos (vacaciones progresivas, Art. 68 CT).
- Art. 30: Fraccionamiento del feriado. El exceso sobre 10 dias habiles puede fraccionarse. Acumulacion hasta 2 periodos. Art. 70 CT.
- Art. 31: Feriado proporcional al termino del contrato. Art. 73 CT.
- Art. 32: Permisos especiales por fallecimiento. Hijo: 10 dias. Conyuge/conviviente: 7 dias. Hijo no nato: 7 dias habiles. Padre/madre: 4 dias. Fuero laboral de 1 mes para quien pierde un hijo o conyuge. Art. 66 CT.
${instrCambios}`;

        } else if (seccion === 3) {
          prompt = `${BASE}

Genera la SECCION 3 COMPACTA: Remuneraciones (Arts. 33-42).
Perfil compacto: cita la regla legal pertinente y aplica. Sin desarrollo doctrinal extenso.

## TITULO IV: DE LAS REMUNERACIONES (Arts. 33-42)
- Art. 33: Definicion de remuneracion y componentes. Que NO es remuneracion. Arts. 41-42 CT.
- Art. 34: Fecha y forma de pago. Dia 30 de cada mes o habil anterior. Deposito bancario o cuenta vista. Anticipo maximo 25% de la remuneracion liquida, solicitado antes del dia 10.
- Art. 35: Ingreso minimo. No puede ser inferior al minimo mensual vigente. Proporcional en jornadas parciales.
- Art. 36: Gratificaciones. ${E} optara por: (a) distribuir el 30% de las utilidades liquidas entre los trabajadores, o (b) pagar el 25% de la remuneracion anual de cada trabajador con tope de 4.75 ingresos minimos. Arts. 46-49 CT.
- Art. 37: Descuentos legales. Cotizaciones previsionales, impuesto unico, cuotas sindicales si corresponde. Limite del 30% para descuentos voluntarios. Art. 58 CT.
- Art. 38: Liquidacion de sueldo. Entrega mensual fisica o digital. Debe especificar remuneracion bruta, descuentos y liquido a pagar.
- Art. 39: Igualdad de remuneraciones. Hombres y mujeres que realicen el mismo trabajo perciben igual remuneracion. Las diferencias solo se justifican por capacidades, calificaciones o productividad objetivamente verificables. Art. 62 bis CT.
- Art. 40: Reclamo por remuneraciones. El trabajador puede reclamar por escrito a la gerencia de ${E}. Respuesta en 30 dias. En caso de no respuesta satisfactoria, puede recurrir a la Inspeccion del Trabajo.
- Art. 41: Asignaciones no remuneracionales. Viaticos, colacion, movilizacion: no sirven de base para calcular indemnizaciones.
- Art. 42: Finiquito y termino del contrato. Al termino, ${E} paga remuneraciones, indemnizaciones y demas prestaciones adeudadas. Ratificacion ante ministro de fe. Pago dentro de 5 dias habiles desde la separacion. Art. 163 CT.
${instrCambios}`;

        } else if (seccion === 4) {
          prompt = `${BASE}

Genera la SECCION 4 COMPACTA: Obligaciones y Prohibiciones fusionadas (Arts. 43-56).
Perfil compacto: listas directas y operativas. Sin desarrollo doctrinal. Cada punto debe ser practico y aplicable a ${R} con ${TRAB} trabajadores.

COHERENCIA CRITICA: En obligaciones, el aviso de inasistencia es "dentro de las primeras 2 horas de iniciada la jornada" (mismo que Art. 21).

## TITULO V: OBLIGACIONES Y PROHIBICIONES (Arts. 43-56)

### Obligaciones del trabajador (Arts. 43-51)
- Art. 43: Obligaciones de conducta. Solo las pertinentes para ${R}: puntualidad y asistencia, registrar correctamente la asistencia, avisar la inasistencia dentro de las primeras 2 horas de iniciada la jornada, cumplir las instrucciones del jefe directo con buena fe, tratar con respeto a companeros y clientes, cuidar los bienes de la empresa, mantener orden en el puesto de trabajo.
- Art. 44: Obligaciones de seguridad. Usar los EPP asignados, reportar condiciones inseguras al jefe directo, participar en capacitaciones de seguridad, no operar equipos sin capacitacion.
- Art. 45: Cuidado de bienes. El trabajador responde por los danos causados a bienes de la empresa cuando medie negligencia o descuido grave.
- Art. 46: Confidencialidad. Guardar reserva de informacion tecnica, comercial y de clientes de ${E}. Esta obligacion se extiende por un plazo razonable despues del termino del contrato.
- Art. 47: Actualizacion de datos personales. Informar cambios de domicilio, cargas familiares o sistema previsional en 5 dias habiles.
- Art. 48: Ante un accidente del trabajo. Avisar de inmediato al jefe directo, no mover al accidentado si hay riesgo de lesion grave, coordinar traslado a ${OA}.
- Art. 49: Trato y convivencia. Contribuir activamente a un ambiente de respeto y libre de violencia o acoso.
- Art. 50: Capacitacion. Asistir a las actividades de capacitacion programadas por ${E}. La inasistencia injustificada constituye incumplimiento de este reglamento.
- Art. 51: Uso de tecnologia corporativa. Solo para fines laborales. No instalar software no autorizado. No usar sistemas de la empresa para actividades personales de forma habitual.

### Prohibiciones del trabajador (Arts. 52-56)
- Art. 52: Prohibiciones de conducta. Trabajar horas extra sin autorizacion escrita, abandonar el puesto sin permiso, atender asuntos personales sistematicamente en horario de trabajo, prestar servicios a competidores de ${E} sin autorizacion.
- Art. 53: Prohibiciones de seguridad. No usar EPP, desactivar sistemas de seguridad, trabajar bajo efectos de alcohol o drogas, introducir sustancias prohibidas en instalaciones de ${E}.
- Art. 54: Prohibiciones sobre bienes. Usar bienes de ${E} para fines personales, sacar materiales sin autorizacion, dañar intencionalmente equipos o instalaciones. Art. 160 N6 CT.
- Art. 55: Prohibicion de acoso. Toda conducta constitutiva de acoso laboral o sexual segun el Protocolo Ley Karin (Titulo VII de este reglamento). Sancion maxima aplicable.
- Art. 56: Prohibiciones especificas del rubro ${R}. Conductas que comprometan la calidad del servicio educativo o la confidencialidad de informacion de alumnos o clientes.
${instrCambios}`;

        } else if (seccion === 5) {
          prompt = `${BASE}

Genera la SECCION 5 COMPACTA: Disciplina y Reclamos (Arts. 57-64).
Perfil compacto: sistema disciplinario claro, gradual y juridicamente prudente. Sin automatismo hacia el despido.

## TITULO VI: ORDEN, DISCIPLINA Y RECLAMOS (Arts. 57-64)
- Art. 57: Sistema de sanciones. Gradualidad obligatoria: (1) amonestacion verbal del jefe directo, (2) amonestacion escrita con copia al expediente, (3) amonestacion escrita con copia a la Inspeccion del Trabajo, (4) multa de entre el 10% y el 25% de la remuneracion diaria. La aplicacion de cada nivel considera la gravedad del hecho y los antecedentes del trabajador. Art. 154 N10 CT.
- Art. 58: Multas. No pueden exceder el 25% de la remuneracion diaria. Los fondos se destinan a bienestar de los trabajadores de ${E} o a capacitacion. Art. 157 CT.
- Art. 59: Derecho a reclamo. El trabajador puede reclamar la sancion aplicada ante la Inspeccion del Trabajo dentro del tercer dia habil desde su notificacion. Antes de aplicar una multa, el empleador permite que el trabajador presente sus descargos.
- Art. 60: Causales de termino sin derecho a indemnizacion. Art. 160 CT. Las 7 causales son situaciones que requieren verificacion y analisis previo, no consecuencias automaticas: (1) falta de probidad, acoso sexual o laboral, vias de hecho, injurias, conducta inmoral; (2) negociaciones prohibidas; (3) inasistencias injustificadas (2 dias seguidos, 2 lunes en el mes o 3 dias en total en el mes); (4) abandono del trabajo; (5) actos u omisiones que afecten la seguridad; (6) dano material intencional; (7) incumplimiento grave de las obligaciones del contrato. Ejemplos pertinentes para el rubro ${R}.
- Art. 61: Otras causales de termino. Art. 159 CT: mutuo acuerdo, renuncia (aviso 30 dias), muerte del trabajador, vencimiento del plazo, conclusion del trabajo. Art. 161 CT: necesidades de la empresa, con preaviso de 30 dias e indemnizacion legal.
- Art. 62: Investigacion disciplinaria. Ante una falta grave, ${E} inicia proceso interno: el trabajador conoce los cargos, tiene derecho a presentar descargos, y la resolucion se comunica en un plazo maximo de 10 dias habiles.
- Art. 63: Reclamos y peticiones de trabajadores. El trabajador puede presentar reclamos escritos a la gerencia de ${E}. Respuesta en 5 dias habiles.
- Art. 64: Relaciones laborales armonicas. ${E} promueve un ambiente de trabajo basado en el respeto mutuo y la comunicacion directa.
${instrCambios}`;

        } else if (seccion === 6) {
          prompt = `${BASE}

Genera la SECCION 6 COMPACTA: Higiene, Seguridad y Accidentes fusionadas (Arts. 65-76).
Perfil compacto: rubro ${R} con bajo riesgo fisico. Reglas practicas y suficientes, sin desarrollo extenso de riesgos industriales que no aplican.

## TITULO VII: HIGIENE, SEGURIDAD Y ACCIDENTES DEL TRABAJO (Arts. 65-76)

### Higiene y Seguridad (Arts. 65-70)
- Art. 65: Marco legal. Ley 16.744, DS 44/2023, Art. 184 CT (deber de proteccion del empleador), Ley 21.012.
- Art. 66: Obligaciones del empleador. ${E} garantiza: condiciones seguras de trabajo para el rubro ${R}, provision de EPP necesarios sin costo, informacion sobre riesgos del puesto, investigacion de accidentes.
- Art. 67: Obligaciones del trabajador. Usar EPP si se asignan, reportar condiciones inseguras, participar en capacitaciones, no operar equipos sin autorizacion.
- Art. 68: Riesgos especificos del rubro ${R}. Los principales riesgos identificados en ${E} son: [para consultoría/capacitación: riesgo ergonómico por trabajo prolongado con computador, riesgo psicosocial por interacción con público, riesgo de caída en desplazamientos, iluminación inadecuada]. Medidas preventivas para cada uno.
- Art. 69: Orden, limpieza y condiciones ambientales. Puesto de trabajo ordenado, pasillos despejados. Iluminacion, ventilacion y temperatura adecuadas. El trabajador que detecte una condicion inadecuada debe informar al jefe directo.
- Art. 70: Prevencion de incendios y emergencias. Extintores vigentes, vias de evacuacion senalizadas, punto de encuentro designado. Simulacro de evacuacion al menos una vez al ano. Numero de emergencia interno: ${P}.

### Accidentes del Trabajo (Arts. 71-76)
- Art. 71: Definiciones. Accidente del trabajo: lesion a causa o con ocasion del trabajo. Accidente de trayecto: en el trayecto directo entre domicilio y trabajo. Enfermedad profesional: causada directamente por el ejercicio de la profesion. Art. 5 Ley 16.744.
- Art. 72: Procedimiento ante un accidente. (1) Conservar la calma. (2) Avisar al jefe directo de inmediato. (3) Aplicar primeros auxilios basicos si se esta capacitado y es seguro. (4) No mover al accidentado si hay riesgo de lesion espinal. (5) Coordinar traslado a ${OA}. (6) Preservar el lugar del accidente para la investigacion.
- Art. 73: Denuncia del accidente. DIAT (Denuncia Individual de Accidente del Trabajo) ante ${OA} dentro de 24 horas. Puede llenarla el trabajador, el empleador o el medico que presto la primera atencion.
- Art. 74: Accidente de trayecto. Acreditar con parte policial, certificado medico de urgencia o declaracion jurada. Denuncia dentro de 24 horas.
- Art. 75: Prestaciones del seguro. Atencion medica gratuita en ${OA}, medicamentos, rehabilitacion, subsidio equivalente al 100% de la remuneracion durante la incapacidad temporal. Ley 16.744.
- Art. 76: Derecho a saber. Los trabajadores tienen derecho a conocer los riesgos de su puesto y las medidas preventivas adoptadas. Art. 21 DS 44/2023.
${instrCambios}`;

        } else if (seccion === 7) {
          prompt = `${BASE}

Genera la SECCION 7 COMPACTA: Protocolo Ley Karin completo en una sola seccion (Arts. 77-86).
Ley 21.643, vigente desde el 1 de agosto de 2024. Arts. 211-A al 211-I CT. DS 2/2024.
Perfil compacto: completo en contenido legal, sintetico en desarrollo.

## TITULO VIII: PROTOCOLO LEY KARIN - PREVENCION DEL ACOSO LABORAL, SEXUAL Y VIOLENCIA EN EL TRABAJO (Arts. 77-86)
- Art. 77: Fundamento y objetivo. Ley 21.643 vigente desde agosto 2024. ${E} se compromete a mantener un entorno laboral libre de violencia, con perspectiva de genero.
- Art. 78: Ambito. Todos los trabajadores y trabajadoras de ${E} sin excepcion, incluyendo contratistas, proveedores, visitas y practicantes.
- Art. 79: Definiciones. ACOSO SEXUAL: requerimientos sexuales no consentidos por cualquier medio que amenacen o perjudiquen la situacion laboral. Incluye: insinuaciones verbales o escritas, contacto fisico no deseado, envio de material sexual digital, comentarios de connotacion sexual. Caracteristica esencial: NO es consentido. ACOSO LABORAL: conductas de agresion u hostigamiento, reiteradas o unicas, que causen menoscabo, maltrato o humillacion. Incluye: aislamiento, humillacion publica, tareas degradantes, sobrecarga excesiva, acoso digital. VIOLENCIA POR TERCEROS: conductas de clientes, proveedores o usuarios que afecten a trabajadores/as en la prestacion de servicios.
- Art. 80: Conductas que NO constituyen acoso. Evaluaciones objetivas de desempeño, instrucciones de trabajo, cambios organizativos, medidas disciplinarias ajustadas a derecho, ejercicio legitimo de facultades directivas.
- Art. 81: Principios. Confidencialidad de los antecedentes, no represalia contra quien denuncia de buena fe, perspectiva de genero, imparcialidad del investigador, celeridad en los plazos.
- Art. 82: Canal de denuncia. (a) Correo electronico designado por ${E}: ${P}. (b) Formulario fisico disponible en la gerencia. (c) Directamente ante la Inspeccion del Trabajo. La denuncia puede ser anonima.
- Art. 83: Procedimiento y medidas de resguardo. Una vez recibida la denuncia: ${E} adopta medidas de resguardo inmediatas (separacion fisica, redistribucion de horario, trabajo remoto temporal) sin que esto implique prejuzgamiento. Dentro de los 5 dias habiles siguientes, inicia investigacion interna o deriva a la Inspeccion del Trabajo. La investigacion interna debe resolverse en maximo 30 dias habiles: investigador imparcial, notificacion de cargos al investigado, audiencias, analisis de pruebas, informe final con propuesta de medidas.
- Art. 84: Sanciones. Segun la gravedad establecida en la investigacion: amonestacion, multa, traslado, o despido conforme al Art. 160 N1 b) (acoso sexual) o f) (acoso laboral) CT. Las represalias contra quien denuncia de buena fe tambien seran sancionadas.
- Art. 85: Capacitacion. Al menos una capacitacion anual para todos los trabajadores/as sobre prevencion del acoso y violencia. Registro con lista de asistencia.
- Art. 86: Derivacion a atencion psicologica. ${E} podra gestionar atencion psicologica para la persona afectada a traves de ${OA} u otros mecanismos disponibles.
${instrCambios}`;

        } else if (seccion === 8) {
          prompt = `${BASE}

Genera la SECCION 8 COMPACTA FINAL: TEMER + ISTAS21 + Cargas + Maternidad + Datos Personales + Disposiciones Finales (Arts. 87-98).
Perfil compacto: cada materia con una regla clara y suficiente. Sin mini-capitulos doctrinales.

## TITULO IX: NORMATIVAS ESPECIFICAS (Arts. 87-98)

### TEMER, ISTAS21 y Manejo de Cargas (Arts. 87-90)
- Art. 87: Trastornos musculoesqueleticos (TEMER). Protocolo SUSESO. En ${E}, dado el rubro ${R}, los principales factores son el trabajo prolongado con computador y posturas inadecuadas. Medidas: pausas activas minimo 2 veces por jornada, ajuste ergonomico del puesto, evaluacion periodica.
- Art. 88: Riesgo psicosocial (ISTAS21). Protocolo SUSESO/ISTAS21 obligatorio. ${E} aplicara el cuestionario ISTAS21 al menos cada 2 anos, de forma anonima. Ante niveles de riesgo medio o alto, se diseñara un plan de accion.
- Art. 89: Manejo manual de cargas. Ley 20.001 y DS 63/2005. En caso de que alguna tarea requiera manejo de cargas: hombres maximo 25 kg, mujeres maximo 20 kg, embarazadas maximo 5 kg. Tecnica correcta: rodillas dobladas, espalda recta, levantar con la fuerza de las piernas.
- Art. 90: Capacitacion en seguridad. ${E} realiza al menos una capacitacion anual sobre: riesgos del puesto, prevencion de lesiones musculoesqueleticas, manejo del estres laboral, primeros auxilios basicos. Registro obligatorio.

### Proteccion de la Maternidad y Paternidad (Arts. 91-93)
- Art. 91: Fuero y descansos. Fuero maternal desde el embarazo hasta 1 ano post posnatal. Descanso prenatal: 6 semanas. Posnatal: 12 semanas. Posnatal parental adicional: 12 semanas transferibles en parte al padre. Permiso de paternidad: 5 dias pagados e irrenunciables. Arts. 194-197 CT, Ley 20.545.
- Art. 92: Sala cuna, amamantamiento y restricciones. Sala cuna obligatoria si ${E} emplea 20 o mas trabajadoras. Amamantamiento: 1 hora diaria hasta los 2 anos del hijo. Las trabajadoras embarazadas o en lactancia no realizaran tareas de alto esfuerzo fisico ni trabajo nocturno, siendo trasladadas a funciones compatibles con igual remuneracion. Arts. 202-206 CT.
- Art. 93: Otros permisos. Por enfermedad grave de hijo menor de 1 ano: licencia medica con subsidio. Art. 199 CT.

### Proteccion de Datos Personales (Art. 94)
- Art. 94: Datos personales de los trabajadores. Ley 21.719. ${E} trata datos de identificacion, laborales, de salud (solo para fines laborales) e imagenes de videovigilancia si aplica. Principios: licitud, finalidad, proporcionalidad. Derechos ARCO: el trabajador puede acceder, rectificar, cancelar u oponerse al tratamiento, dirigiendose a ${P}. Plazo de respuesta: 15 dias habiles.

## TITULO X: DISPOSICIONES FINALES (Arts. 95-98)
- Art. 95: Vigencia. Este reglamento entra en vigor 30 dias despues de ser puesto en conocimiento de los trabajadores, salvo objecion fundada de la Inspeccion del Trabajo. Art. 156 CT.
- Art. 96: Difusion. ${E} entrega una copia fisica o digital al ingreso. El trabajador firma cargo de recepcion. El reglamento esta disponible en cartelera.
- Art. 97: Modificaciones. Se realizaran conforme al procedimiento del Art. 6 de este reglamento.
- Art. 98: Normativa supletoria. En lo no previsto, se aplica el Codigo del Trabajo y las normas de la Direccion del Trabajo.

---

## NORMATIVA DE REFERENCIA
| Norma | Materia |
|-------|---------|
| Codigo del Trabajo DFL N1/2003 | Marco general laboral |
| Ley N16.744 | Accidentes del trabajo y EEPP |
| DS N44/2023 | Seguridad y Salud Ocupacional |
| Ley N21.643 Ley Karin | Prevencion acoso laboral, sexual y violencia (2024) |
| Ley N21.719 | Proteccion de datos personales |
| Ley N21.561 | Reduccion jornada laboral (42h desde abril 2026) |
| Ley N20.001 / DS 63/2005 | Manejo manual de cargas |
| Protocolo TEMER SUSESO | Trastornos musculoesqueleticos |
| Protocolo ISTAS21 SUSESO | Riesgos psicosociales |
| Ley N20.545 | Posnatal parental |
| DS N2/2024 | Politica Nacional de Seguridad y Salud |

---

## DECLARACION DE APROBACION

El presente Reglamento Interno de ${E} ha sido elaborado en cumplimiento del articulo 153 del Codigo del Trabajo.

${RL}
Representante Legal | ${E} | RUT: ${RUT}
${DIR}

*Elaborado: ${new Date().toLocaleDateString('es-CL')} - Version 01/${new Date().getFullYear()}*
${instrCambios}`;

        } else {
          return res.status(400).json({ error: `Seccion ${seccion} no valida para perfil compacto (1-8).` });
        }

      // ═══════════════════════════════════════════
      // ARQUITECTURA INTERMEDIA — 12 SECCIONES
      // ═══════════════════════════════════════════
      } else if (NIVEL === 'intermedio') {

        const INDICE_I = `## INDICE GENERAL
| N | TITULO | ARTICULOS |
|---|--------|-----------|
| I | Disposiciones Generales e Ingreso | 1-16 |
| II | Jornada de Trabajo | 17-26 |
| III | Horas Extra, Descansos y Licencias | 27-36 |
| IV | Remuneraciones | 37-46 |
| V | Obligaciones y Prohibiciones | 47-60 |
| VI | Disciplina y Reclamos | 61-70 |
| VII | Higiene y Seguridad | 71-82 |
| VIII | Accidentes del Trabajo y EEPP | 83-92 |
| IX | Protocolo Ley Karin | 93-104 |
| X | TEMER, ISTAS21 y Manejo de Cargas | 105-114 |
| XI | Maternidad, Paternidad y Datos | 115-122 |
| XII | Disposiciones Finales | 123-126 |`;

        const seccionesIntermedias = {
          1: `Portada + Titulo I Disposiciones Generales + Titulo II Ingreso (Arts. 1-16). ${INDICE_I}. Disposiciones: Arts. 1-7 (objeto, definiciones esenciales, definiciones operativas, valor juridico, entrega, vigencia, normativa supletoria). Ingreso: Arts. 8-16 (requisitos documentales pertinentes para ${R}, examenes preocupacionales segun riesgo del rubro, celebracion del contrato Art. 9 CT, contenido minimo Art. 10 CT, modificaciones, menores, documentos falsos, actualizacion antecedentes, inclusion laboral Ley 21.015). NO usar periodo de prueba como clausula general.`,
          2: `Titulo III Jornada de Trabajo (Arts. 17-26). Jornada 42h Ley 21.561 con horarios de ${E} (${TURN}), control de asistencia, ausentismo (aviso dentro de las primeras 2 horas de iniciada la jornada), atrasos, permisos durante jornada, colacion Art. 34 CT, teletrabajo Ley 21.220, cambios de turno.`,
          3: `Titulo IV Horas Extra, Descansos y Licencias (Arts. 27-36). Horas extra: autorizacion previa escrita, limite 2h, pago 50% Art. 32 CT (distinguir autorizacion/sancion disciplinaria/tratamiento del tiempo trabajado - no negar el pago de forma absoluta). Descanso semanal, feriado 15 dias Art. 67 CT, vacaciones progresivas, fraccionamiento, feriado proporcional, licencias medicas, permisos por fallecimiento Art. 66 CT.`,
          4: `Titulo V Remuneraciones (Arts. 37-46). Definicion, componentes, fecha y forma de pago, ingreso minimo, gratificaciones, descuentos legales, liquidacion, igualdad de remuneraciones Art. 62 bis CT, reclamo por remuneraciones, asignaciones no remuneracionales, finiquito Art. 163 CT.`,
          5: `Titulo VI Obligaciones y Prohibiciones (Arts. 47-60). Obligaciones: lista pertinente para ${R} (no maximalista), seguridad, cuidado de bienes, confidencialidad, actualizacion de datos (aviso inasistencia: primeras 2 horas de la jornada), ante accidente, convivencia, capacitacion, tecnologia. Prohibiciones: laborales, de seguridad, sobre bienes, control asistencia, sustancias, acoso (remision a Ley Karin), especificas del rubro ${R}.`,
          6: `Titulo VII Disciplina y Reclamos (Arts. 61-70). Sistema gradual de sanciones (verbal/escrita/con copia Inspeccion/multa Art. 154 N10 CT), multas Art. 157 CT, derecho a reclamo, causales Art. 160 CT (con gradualidad, no automatismo), causales Art. 161 CT, causales Art. 159 CT, investigacion disciplinaria interna, reclamos internos, relaciones laborales armonicas.`,
          7: `Titulo VIII Higiene y Seguridad (Arts. 71-82). Marco legal (Ley 16.744, DS 44/2023, Art. 184 CT), obligaciones del empleador y trabajador, identificacion de riesgos del rubro ${R} con controles jerarquicos, EPP pertinentes, señalizacion, orden y limpieza, prevencion incendios, primeros auxilios, CPHS si corresponde (25+ trabajadores), politica alcohol y drogas, derecho a saber Art. 21 DS 44/2023.`,
          8: `Titulo IX Accidentes del Trabajo y EEPP (Arts. 83-92). Definiciones Art. 5 Ley 16.744, procedimiento inmediato ante accidente (7 pasos, traslado a ${OA}), DIAT dentro de 24h, accidente de trayecto, investigacion 24-48h DS 44/2023, accidentes graves y fatales (notificacion Inspeccion del Trabajo y SEREMI de Salud 24h), enfermedades profesionales DIEP, prestaciones Ley 16.744, estadisticas de accidentabilidad, rehabilitacion y reincorporacion.`,
          9: `Titulo X Protocolo Ley Karin (Arts. 93-104). Ley 21.643 agosto 2024, Arts. 211-A al 211-I CT. Fundamento y objetivo, ambito (todos los trabajadores + contratistas + visitas), definiciones (acoso sexual, acoso laboral, violencia por terceros, conductas que NO constituyen acoso), principios (confidencialidad, no represalia, perspectiva de genero, imparcialidad, celeridad), canal de denuncia, medidas de resguardo inmediatas, procedimiento de investigacion interna 30 dias habiles, investigacion por Inspeccion del Trabajo, sanciones graduales, capacitacion anual.`,
          10: `Titulo XI TEMER, ISTAS21 y Manejo de Cargas (Arts. 105-114). TEMER: factores de riesgo, evaluacion anual, pausas activas, vigilancia medica con ${OA}. ISTAS21: 5 dimensiones, cuestionario cada 2 anos anonimo, plan de accion por nivel de riesgo. Manejo de cargas: Ley 20.001 y DS 63/2005, limites de peso (hombres 25kg, mujeres 20kg, embarazadas 5kg), tecnica correcta 7 pasos, capacitacion anual.`,
          11: `Titulo XII Maternidad, Paternidad y Datos Personales (Arts. 115-122). Maternidad: fuero maternal, descansos prenatal y posnatal Arts. 195-197 CT, permiso de paternidad 5 dias, sala cuna 20+ trabajadoras, amamantamiento, restricciones embarazo y lactancia Art. 202 CT, permiso por enfermedad grave hijo menor 1 ano. Datos personales: Ley 21.719, tipos de datos que trata ${E}, principios, derechos ARCO con plazo 15 dias habiles.`,
          12: `Titulo XIII Disposiciones Finales (Arts. 123-126) + Normativa de Referencia + Declaracion de Aprobacion. Vigencia Art. 156 CT (30 dias), difusion y entrega con firma de cargo, modificaciones, normativa supletoria. Tabla normativa completa. Declaracion firmada por ${RL}.`
        };

        if (seccionesIntermedias[seccion]) {
          prompt = `${BASE}

Genera la SECCION ${seccion} - PERFIL INTERMEDIO.

${INDICE_I}

Instrucciones especificas para esta seccion:
${seccionesIntermedias[seccion]}

Criterio: desarrollo moderado. Una regla clara y aplicable por articulo. Sin mini-capitulos doctrinales. Sin inflado.
${instrCambios}`;
        } else {
          return res.status(400).json({ error: `Seccion ${seccion} no valida para perfil intermedio (1-12).` });
        }

      // ═══════════════════════════════════════════
      // ARQUITECTURA EXTENSA — 16 SECCIONES
      // ═══════════════════════════════════════════
      } else {

        const INDICE_E = `## INDICE GENERAL
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
| XIV | TEMER, ISTAS21 y Manejo de Cargas | 115-128 |
| XV | Maternidad y Datos Personales | 129-139 |
| XVI | Disposiciones Finales | 140-142 |`;

        const seccionesExtensas = {
          1: `Portada + ${INDICE_E} + Titulo I Disposiciones Generales (Arts. 1-8). Objeto y ambito Art. 153 CT, definicion y valor juridico del reglamento, definiciones de empleador/trabajador/empresa Arts. 3 y 7 CT, jefe inmediato y estructura jerarquica, definiciones economicas (remuneracion/sueldo/gratificacion), definiciones operativas (jornada/turno/hora extra/feriado/licencia), entrega y recepcion con firma, modificacion del reglamento 30 dias. Empresa: ${E.toUpperCase()}, RUT: ${RUT}, Region: ${REG}, OA: ${OA}, Rep. Legal: ${RL}.`,
          2: `Titulo II Del Ingreso y Contratacion (Arts. 9-18). Requisitos de ingreso pertinentes para ${R} (esenciales / condicionales por cargo / no maximalistas), examenes preocupacionales con ${OA} segun riesgo real del rubro, acompanamiento al inicio (NO periodo de prueba como clausula general), celebracion del contrato Art. 9 CT, contenido minimo Art. 10 CT, modificaciones, menores, documentos falsos Art. 160 N1 CT, actualizacion antecedentes 5 dias, inclusion laboral Ley 21.015.`,
          3: `Titulo III Jornada de Trabajo Parte 1 (Arts. 19-26). Jornada 42h Ley 21.561 desde abril 2026 (reduccion progresiva a 40h en 2028), horarios de ${E} segun ${TURN}, control de asistencia, ausentismo (aviso dentro de las primeras 2 horas de iniciada la jornada - COHERENCIA CRITICA), atrasos, permisos durante jornada, colacion Art. 34 CT, teletrabajo Ley 21.220, cambios de turno 30 dias anticipacion.`,
          4: `Titulo IV Jornada Horas Extra y Descansos (Arts. 27-34). Horas extra: solo con autorizacion escrita previa, limite 2h diarias Arts. 30-31 CT. IMPORTANTE: distinguir claramente entre (a) exigencia interna de autorizacion, (b) consecuencias disciplinarias por incumplir, (c) tratamiento del tiempo efectivamente trabajado - NO negar el pago de forma absoluta. Pago 50% recargo Art. 32 CT. Descanso semanal Art. 38 CT, feriado 15 dias Art. 67 CT, vacaciones progresivas Art. 68 CT, fraccionamiento, feriado proporcional Art. 73 CT, permisos por fallecimiento tabla completa Art. 66 CT con fuero laboral 1 mes.`,
          5: `Titulo V De las Remuneraciones (Arts. 35-44). Definicion y componentes Arts. 41-42 CT, fecha y forma de pago dia 30, ingreso minimo, gratificaciones modalidades Arts. 46-49 CT, descuentos legales limite 30% Art. 58 CT, liquidacion de sueldo, igualdad de remuneraciones Art. 62 bis CT, reclamo 30 dias, asignaciones no remuneracionales, finiquito ratificacion ministro de fe 5 dias Art. 163 CT.`,
          6: `Titulo VI Obligaciones del Trabajador (Arts. 45-54). Lista equilibrada y pertinente para ${R}. No maximalista. Obligaciones de conducta, seguridad (EPP, reportar condiciones inseguras), cuidado de bienes (responsabilidad proporcional a negligencia), confidencialidad razonable post-contrato, actualizacion de antecedentes (aviso inasistencia: primeras 2 horas de la jornada - COHERENCIA CRITICA), procedimiento ante accidente traslado a ${OA}, trato y convivencia, capacitacion obligatoria, tecnologia corporativa.`,
          7: `Titulo VII Prohibiciones del Trabajador (Arts. 55-62). Redaccion sobria y proporcional. Prohibiciones laborales pertinentes para ${R}, de seguridad (EPP, operar sin capacitacion, alcohol y drogas con facultad de control), sobre bienes Art. 160 N6 CT, control de asistencia (marcar tarjeta ajena como falta grave Art. 160 N1 CT), sustancias (control aleatorio con protocolo), acoso y violencia (remision Ley Karin), especificas del rubro ${R}.`,
          8: `Titulo VIII Orden y Disciplina (Arts. 63-72). Sistema gradual de sanciones con gradualidad explicita (nunca automatismo al despido): verbal/escrita/con copia Inspeccion/multa 10-25% Art. 154 N10 CT. Multas destino bienestar Art. 157 CT. Derecho a reclamo 3er dia habil. Causales Art. 160 CT (las 7 causales como situaciones que requieren analisis, con ejemplos para ${R}). Causales Art. 161 CT, Art. 159 CT. Investigacion disciplinaria (10-15 dias habiles, derecho a descargos), reclamos internos 5 dias, relaciones laborales armonicas.`,
          9: `Titulo IX Higiene y Seguridad Parte 1 (Arts. 73-82). Marco normativo Ley 16.744, DS 44/2023 (reemplaza DS 40 y DS 54), Art. 184 CT. Obligaciones del empleador (Art. 184 CT). Obligaciones del trabajador en seguridad (proporcionales al riesgo real del rubro ${R}). Identificacion de riesgos: matriz IPER con 5-7 riesgos principales del rubro ${R} y controles jerarquicos (eliminacion, sustitucion, ingenieria, administrativo, EPP). EPP obligatorio para ${R}. Señalizacion, orden y limpieza. CPHS (25+ trabajadores, si no aplica: designar responsable interno). Departamento de Prevencion (100+ trabajadores, si no aplica indicar responsable interno). Politica alcohol y drogas con control aleatorio.`,
          10: `Titulo X Higiene y Seguridad Parte 2 (Arts. 83-90). Prevencion incendios (extintores vigentes, simulacros anuales, brigada, evacuacion paso a paso). Primeros auxilios (botiquines, trabajador certificado por turno, procedimiento ante accidente). Higiene industrial (iluminacion, ruido 85dB, temperatura 10-30 grados, ventilacion, ergonomia). Capacitaciones obligatorias (induccion al ingreso, anual en riesgos del rubro ${R}, registro). Riesgos especificos del rubro ${R}: 6-8 riesgos propios con descripcion, situacion y medida preventiva. PTS para tareas de mayor riesgo. Inspecciones periodicas y fiscalizacion. Derecho a saber Art. 21 DS 44/2023.`,
          11: `Titulo XI Accidentes del Trabajo y EEPP (Arts. 91-100). Definiciones Art. 5 Ley 16.744. Procedimiento ante accidente: 7 pasos claros con traslado a ${OA}. DIAT dentro de 24h. Accidente de trayecto (acreditacion). Investigacion 24-48h DS 44/2023 (causas inmediatas/basicas/raiz, medidas correctivas). Accidentes graves y fatales (notificacion Inspeccion del Trabajo y SEREMI 24h, suspension faenas). Enfermedades profesionales DIEP. Prestaciones Ley 16.744 (atencion gratuita, subsidio 100%, rehabilitacion). Estadisticas (frecuencia, gravedad, accidentabilidad). Rehabilitacion y reincorporacion gradual con restricciones medicas.`,
          12: `Titulo XII Protocolo Ley Karin Parte 1 (Arts. 101-107). Ley 21.643 agosto 2024, Arts. 211-A al 211-I CT, DS 2/2024. Fundamento y objetivo (perspectiva de genero, compromiso de ${E}). Ambito (todos los trabajadores + contratistas + visitas). Definicion acoso sexual (ejemplos verbales, fisicos, digitales, visuales; caracteristica: no consentido; Art. 2 CT). Definicion acoso laboral (conductas unicas o reiteradas que causen menoscabo o humillacion; Art. 2 CT). Violencia por terceros. Principios (confidencialidad, no represalia, perspectiva de genero, buena fe, imparcialidad, celeridad). Canal de denuncia (correo ${P}, formulario fisico, Inspeccion del Trabajo; anonimato).`,
          13: `Titulo XII Protocolo Ley Karin Parte 2 (Arts. 108-114). Procedimiento de denuncia (contenido minimo, constancia recepcion, inicio 5 dias habiles, opcion Inspeccion del Trabajo). Medidas de resguardo inmediatas (separacion fisica, redistribucion jornada, teletrabajo temporal, derivacion psicologica a traves de ${OA}, sin prejuzgamiento). Investigacion interna (investigador imparcial, notificacion cargos, audiencias, pruebas, informe final 30 dias habiles maximos). Investigacion por Inspeccion del Trabajo (cooperacion plena, adoptar medidas). Sanciones graduales (amonestacion, multa, traslado, despido Art. 160 N1 b) y f) CT; represalias sancionadas). Capacitacion anual obligatoria. Conductas que NO constituyen acoso (evaluaciones objetivas, instrucciones, medidas disciplinarias ajustadas a derecho).`,
          14: `Titulo XIV TEMER, ISTAS21 y Manejo de Cargas (Arts. 115-128). TEMER (115-118): marco legal SUSESO, factores de riesgo del rubro ${R}, evaluacion anual RULA/OCRA, medidas preventivas (rotacion, pausas activas 2 veces por jornada, rediseno ergonomico), vigilancia medica con ${OA}. ISTAS21 (119-121): marco legal SUSESO/ISTAS21 obligatorio 10+ trabajadores DS 44/2023, 5 dimensiones del riesgo psicosocial, cuestionario cada 2 anos anonimo, plan de accion por nivel de riesgo, CPHS participa. Manejo de Cargas (122-128): Ley 20.001 y DS 63/2005, limites (hombres 25kg, mujeres 20kg, embarazadas 5kg), tecnica correcta 7 pasos, medios mecanicos, restricciones embarazadas, capacitacion anual practica, pausas de recuperacion DS 63/2005, seguimiento CPHS.`,
          15: `Titulo XV Maternidad, Paternidad y Datos Personales (Arts. 129-139). Maternidad (129-136): marco legal Arts. 194-208 CT Ley 20.545, fuero maternal hasta 1 ano post posnatal, descansos (prenatal 6 semanas, posnatal 12 semanas, parental 12 semanas transferibles) Arts. 195-197 CT, permiso de paternidad 5 dias irrenunciable, sala cuna 20+ trabajadoras, amamantamiento 1 hora diaria hasta 2 anos Arts. 203-206 CT, restricciones embarazo y lactancia Art. 202 CT, enfermedad grave hijo menor 1 ano Art. 199 CT, permisos por fallecimiento Art. 66 CT. Datos Personales Ley 21.719 (137-139): tipos de datos que trata ${E}, principios (licitud, finalidad, proporcionalidad, seguridad, transparencia), derechos ARCO con responsable designado ${P} y plazo 15 dias habiles.`,
          16: `Titulo XVI Disposiciones Finales (Arts. 140-142) + Normativa de Referencia completa con tabla (16 normas: CT, Ley 16.744, DS 44/2023, Ley Karin 21.643, Ley 21.719, Ley 21.561, Ley 20.001, DS 63/2005, Ley 21.012, Ley 21.015, Ley 21.220, TEMER SUSESO, ISTAS21 SUSESO, Ley 20.545, DS 2/2024, DS 54/1969) + Declaracion de Aprobacion firmada por ${RL} con RUT ${RUT}. Vigencia Art. 156 CT (30 dias), difusion y entrega con firma de cargo, modificaciones y normativa supletoria.`
        };

        if (seccionesExtensas[seccion]) {
          prompt = `${BASE}

Genera la SECCION ${seccion} - PERFIL EXTENSO. Desarrollo completo con protocolos detallados.

${INDICE_E}

Instrucciones especificas para esta seccion:
${seccionesExtensas[seccion]}

Criterio: desarrollo completo y detallado. Cada articulo minimo 6-8 lineas. Procedimientos con pasos numerados. Tablas donde sea util.
${instrCambios}`;
        } else {
          return res.status(400).json({ error: `Seccion ${seccion} no valida para perfil extenso (1-16).` });
        }
      }

    // ═══════════════════════════════════════════
    // RESUMEN EJECUTIVO
    // ═══════════════════════════════════════════
    } else if (tipo === 'resumen_empleador') {
      prompt = `${BASE}

Genera un RESUMEN EJECUTIVO del RIOHS para Gerencia y RRHH de ${E}. Estilo ejecutivo, directo, accionable. Sin inflado juridico.

# RESUMEN EJECUTIVO - RIOHS ${new Date().getFullYear()}
## ${E} | Rubro: ${R} | ${TRAB||'?'} trabajadores

## Por que existe este documento
Que es el RIOHS, por que es obligatorio (Art. 153 CT) y que consecuencias tiene no tenerlo actualizado. Maximo 6 lineas.

## Obligaciones criticas del empleador
Lista de 10-12 obligaciones concretas. Para cada una: que es, que ley lo exige, que pasa si no se cumple. Incluir: entrega del RIOHS al trabajador, condiciones seguras (Art. 184 CT), protocolo Ley Karin, CPHS si corresponde (25+ trabajadores), capacitaciones, investigar accidentes, ISTAS21 cada 2 anos, TEMER, igualdad de remuneraciones, finiquito en plazo.

## Plazos clave que no puede olvidar
Tabla: | Obligacion | Plazo | Consecuencia del incumplimiento |
Incluir: accidentes (24h), Ley Karin inicio (5 dias habiles), Ley Karin resolucion (30 dias habiles), finiquito (5 dias habiles), ISTAS21 (cada 2 anos), contratos nuevos (15 dias).

## Los 5 riesgos legales mas importantes para ${E}
5 riesgos especificos para el rubro ${R} con la consecuencia legal concreta.

## Normativa reciente - Verificar que este incorporada
Ley Karin agosto 2024, DS 44/2023, Ley 21.719, Ley 21.561 (42h desde abril 2026). Una linea por norma.

---
*Este resumen no reemplaza el RIOHS completo. Ante dudas consulte con su asesor legal o la Inspeccion del Trabajo.*`;

    // ═══════════════════════════════════════════
    // INFORME DE CAMBIOS
    // ═══════════════════════════════════════════
    } else if (tipo === 'informe_cambios') {
      const lista = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo} - ${a.descripcion} (${a.normativa||''})`
      ).join('\n');
      prompt = `${BASE}

Genera un INFORME DE CAMBIOS para la auditoria del RIOHS de ${E}.

# INFORME DE ACTUALIZACION DEL RIOHS
## ${E} - ${new Date().toLocaleDateString('es-CL')}

## Resumen ejecutivo
5-6 lineas: cuantos cambios se realizaron (${(alertas_seleccionadas||[]).length}), de que tipo, impacto legal, estado actual del reglamento.

## Cambios realizados

### Incorporados (antes faltaban)
Lista de cambios tipo falta.

### Actualizados
Lista de cambios tipo cambio.

### Eliminados o derogados
Lista de cambios tipo sobra.

### Errores corregidos
Lista de cambios tipo error.

Cambios aplicados:
${lista}

## Estado del RIOHS actualizado
Verde: areas completamente actualizadas.
Amarillo: areas que requieren revision periodica.
Rojo: cambios pendientes si quedaron alertas sin aplicar.

## Proxima revision recomendada
Cuando hacer la proxima auditoria y que normativa monitorear.

*Informe generado el ${new Date().toLocaleDateString('es-CL')} - Sistema Mas Prevencion*`;

    // ═══════════════════════════════════════════
    // AUDITORIA ANALISIS
    // ═══════════════════════════════════════════
    } else if (tipo === 'auditoria_analisis') {
      let parte = req.body.parte || 1;
      prompt = `Eres experto en derecho laboral chileno con criterio editorial riguroso.
Empresa: ${E} | Rubro: ${R} | OA: ${OA}
Normativa vigente: DS 44/2023, Ley Karin 21.643 agosto 2024, Ley 21.719, Ley 21.561 (42h desde abril 2026), Ley 16.744.

FRAGMENTO DEL RIOHS A AUDITAR (parte ${parte} de 3):
${(documento_existente||'').substring(0,2500)}

Analiza este fragmento con criterio juridico y editorial. Detecta:
- Normativa faltante o desactualizada
- Redaccion excesivamente rigida o automaticamente sancionatoria
- Desequilibrios entre potestad del empleador y derechos del trabajador
- Articulos truncados o mal cerrados
- Inconsistencias internas
- "Periodo de prueba" como clausula general (es figura juridicamente delicada)
- Horas extra redactadas como negacion absoluta del pago
- Errores de codificacion visibles

Devuelve SOLO este JSON:
\`\`\`json
{"alertas":[{"id":1,"tipo":"falta","prioridad":"alta","titulo":"Titulo","descripcion":"Descripcion en 1-2 oraciones.","seccion":"Seccion o articulo","normativa":"Ley con ano"}]}
\`\`\`
TIPOS: falta o cambio o sobra o error
PRIORIDADES: alta o media o baja
5-10 alertas especificas para este fragmento.`;

    } else {
      return res.status(400).json({ error: 'Tipo no valido' });
    }

    // ═══════════════════════════════════════════
    // STREAMING GLOBAL
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
    try { res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`); res.end(); }
    catch { res.status(500).json({ error: error.message }); }
  }
}
