export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { cliente, tipo, seccion, documento_existente, alertas_seleccionadas } = req.body || {};
    if (!cliente?.empresa || !cliente?.rubro) return res.status(400).json({ error: 'Faltan datos' });

    const P = '[⚠️ PENDIENTE — completar antes de entrega al cliente]';
    const E = cliente.empresa;
    const R = cliente.rubro;
    const OA = cliente.organismo_administrador || P;

    const ctx = `Empresa: ${E} | RUT: ${cliente.rut||P} | Rubro: ${R} | Región: ${cliente.region||P} | Trabajadores: ${cliente.num_trabajadores||P} | Turnos: ${cliente.turnos||'Jornada diurna estándar'} | Sindicato: ${cliente.tiene_sindicato?'Sí':'No'} | Organismo Administrador: ${OA} | Representante Legal: ${cliente.representante_legal||P} | Dirección: ${cliente.direccion||P}`;

    const reglas = `REGLAS: Mínimo 6-8 líneas por artículo. Lenguaje formal-legal chileno. Cita artículos exactos del Código del Trabajo. Usa datos reales de ${E}. Mantén "${P}" donde faltan datos. NUNCA uses [COMPLETAR] — todo redactado y completo.`;

    let prompt = '';
    let usarWebSearch = false;
    let maxTokens = 3500;

    if (tipo === 'nuevo' && seccion) {

      if (seccion === 1) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 1 (Arts. 1-8):

# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
# ${E.toUpperCase()}
**RUT:** ${cliente.rut||P} | **Rubro:** ${R} | **Región:** ${cliente.region||P}
**Dirección:** ${cliente.direccion||P}
**Organismo Administrador:** ${OA}
**Representante Legal:** ${cliente.representante_legal||P}
**Versión 01 — ${new Date().getFullYear()}**

En cumplimiento del artículo 153 del Código del Trabajo (DFL N°1/2003), ${E} elabora el presente Reglamento Interno de Orden, Higiene y Seguridad. Este reglamento es parte integrante de cada contrato de trabajo y es de cumplimiento obligatorio desde el primer día de contratación.

## ÍNDICE GENERAL
| N° | TÍTULO | MATERIA | ARTÍCULOS |
|----|--------|---------|-----------|
| I | Disposiciones Generales | Objeto, ámbito y definiciones | 1–8 |
| II | Del Ingreso y Contratación | Requisitos, documentación, contrato | 9–18 |
| III | Jornada de Trabajo — Parte 1 | Horarios, control, permisos, colación | 19–26 |
| IV | Jornada — Horas Extra y Descansos | Horas extra, festivos, feriado, licencias | 27–34 |
| V | De las Remuneraciones | Pago, descuentos, gratificaciones, finiquito | 35–44 |
| VI | Obligaciones del Trabajador | Deberes generales y específicos | 45–54 |
| VII | Prohibiciones del Trabajador | Conductas prohibidas | 55–62 |
| VIII | Orden y Disciplina | Sanciones, multas, despido, reclamos | 63–72 |
| IX | Higiene y Seguridad — Parte 1 | Marco legal, EPP, riesgos, CPHS | 73–82 |
| X | Higiene y Seguridad — Parte 2 | Prevención, capacitación, riesgos específicos | 83–90 |
| XI | Accidentes del Trabajo y EEPP | Procedimiento, investigación, reporte | 91–100 |
| XII | Ley Karin — Parte 1 | Definiciones, canal denuncia, medidas resguardo | 101–107 |
| XIII | Ley Karin — Parte 2 | Investigación, sanciones, capacitación | 108–114 |
| XIV | TEMER · ISTAS21 · Cargas | Musculoesquelético, psicosocial, manejo cargas | 115–128 |
| XV | Maternidad y Datos Personales | Maternidad, paternidad, datos Ley 21.719 | 129–139 |
| XVI | Disposiciones Finales | Vigencia, difusión, normativa de referencia | 140–142 |

## TÍTULO I: DISPOSICIONES GENERALES

**Artículo 1°:** Objeto y ámbito. Qué regula este reglamento, a quiénes aplica (todos los trabajadores de ${E} en cualquier punto del territorio), carácter obligatorio desde el ingreso, relación con el contrato de trabajo. Art. 153 CT. Mínimo 8 líneas.

**Artículo 2°:** Definición de Reglamento Interno. Su valor jurídico, quién lo elabora, rol de la Inspección del Trabajo, plazo de objeción (30 días). Mínimo 6 líneas.

**Artículo 3°:** Empleador, Trabajador y Empresa. Una definición desarrollada por cada concepto. Arts. 3° y 7° CT. Mínimo 8 líneas.

**Artículo 4°:** Jefe Inmediato, Cargo, Faena y Dependencia Jerárquica. Estructura de autoridad en ${E} y sus implicancias. Mínimo 6 líneas.

**Artículo 5°:** Remuneración, Sueldo, Gratificación, Sobresueldo. Diferencias y tratamiento legal. Mínimo 6 líneas.

**Artículo 6°:** Jornada, Turno, Hora Extraordinaria, Feriado, Licencia Médica, Accidente del Trabajo. Una definición por concepto. Mínimo 8 líneas.

**Artículo 7°:** Entrega y recepción del reglamento. Obligación del empleador, firma de recepción, disponibilidad en carteleras y plataformas digitales. Mínimo 6 líneas.

**Artículo 8°:** Modificación del reglamento. Procedimiento, comunicación con 30 días de anticipación, participación del sindicato si existe, nueva aprobación Inspección del Trabajo. Mínimo 6 líneas.`;

      } else if (seccion === 2) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 2 (Arts. 9-18) — TÍTULO II: DEL INGRESO Y CONTRATACIÓN

**Artículo 9°:** Requisitos de ingreso a ${E}. Lista con mínimo 12 documentos exigibles: cédula de identidad y fotocopia, certificado AFP, FONASA/ISAPRE, curriculum vitae, certificado de antecedentes, residencia, estudios, matrimonio e hijos si corresponde, discapacidad si aplica, y otros del rubro ${R}. Mínimo 10 líneas.

**Artículo 10°:** Exámenes preocupacionales. Tipos según cargo y rubro ${R}, quién los realiza (${OA}), cuándo, resultados como condición de ingreso, confidencialidad. Mínimo 8 líneas.

**Artículo 11°:** Período de prueba. Condiciones, duración, derechos del trabajador. Mínimo 6 líneas.

**Artículo 12°:** Celebración del contrato. Plazos: 15 días (o 5 días si duración inferior a 30 días). Formato escrito, distribución de copias. Art. 9° CT. Mínimo 8 líneas.

**Artículo 13°:** Contenido mínimo del contrato. Literales a) hasta i) desarrollados: lugar y fecha, individualización, domicilios, naturaleza de servicios, remuneración, jornada, plazo, correos electrónicos. Art. 10 CT. Mínimo 10 líneas.

**Artículo 14°:** Modificaciones al contrato. Procedimiento escrito al dorso o en documentos anexos firmados por ambas partes. Mínimo 6 líneas.

**Artículo 15°:** Trabajadores menores de edad. Firma del representante legal, prohibición de contratar menores de 15 años, restricciones de jornada y horario. Art. 13 CT. Mínimo 6 líneas.

**Artículo 16°:** Documentos falsos al ingreso. Causal de terminación inmediata sin derecho a indemnización. Art. 160 N°1 a) CT. Mínimo 6 líneas.

**Artículo 17°:** Actualización de antecedentes personales. Obligación del trabajador de informar cambios en 5 días hábiles. Mínimo 5 líneas.

**Artículo 18°:** Inclusión laboral Ley 21.015. Cuota del 1% para 100+ trabajadores, adaptaciones razonables, registro. Mínimo 7 líneas.`;

      } else if (seccion === 3) {
        prompt = `Eres experto en legislación laboral chilena. Ley 21.561: jornada 42 horas vigente desde abril 2026. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 3 (Arts. 19-26) — TÍTULO III: JORNADA DE TRABAJO — PARTE 1

**Artículo 19°:** Jornada ordinaria. 42 horas semanales, Ley 21.561 vigente desde abril 2026 (reducción progresiva: 41h en 2027, 40h en 2028). Distribución para ${E} según turnos: ${cliente.turnos||'jornada diurna estándar'}. Tabla de horarios por área si corresponde. Mínimo 10 líneas.

**Artículo 20°:** Control de asistencia. Sistema de registro (tarjeta, biométrico, libro, dispositivo). Obligaciones del trabajador: registrar entrada y salida, no marcar tarjeta ajena (falta grave), informar a RRHH si hay problemas. Mínimo 8 líneas.

**Artículo 21°:** Ausentismo e inasistencias. Aviso dentro de 24 horas al jefe directo y/o RRHH. Dos inasistencias seguidas sin aviso pueden constituir abandono (Art. 160 N°3 CT). Descuento de remuneración por ausencias injustificadas. Mínimo 8 líneas.

**Artículo 22°:** Atrasos. Atrasos reiterados (más de 3 en el mes) se sancionarán conforme al Título VIII. Todo atraso se registra. Los atrasos no recuperados se descuentan proporcionalmente. Mínimo 6 líneas.

**Artículo 23°:** Permisos durante la jornada. Solicitud escrita y autorización previa del jefe directo. Permisos por emergencias familiares a través de RRHH. Imputación al feriado o descuento según acuerdo. Mínimo 6 líneas.

**Artículo 24°:** Colación. No computable como jornada, no remunerada (Art. 34 CT). ${E} dispone de [espacio habilitado]. Prohibido comer en puestos de trabajo o áreas de producción. Mínimo 6 líneas.

**Artículo 25°:** Teletrabajo — Ley 21.220. Cuando se acuerde por escrito: derecho a desconexión digital (mínimo 12 horas), provisión de equipos por el empleador, cobertura del seguro de accidentes en el lugar designado, reversibilidad. Mínimo 7 líneas.

**Artículo 26°:** Cambios de turno y jornada excepcional. Cambios informados con 30 días de anticipación. Sistemas de turno publicados en cartelera. Jornada excepcional requiere autorización de la Dirección del Trabajo. Mínimo 6 líneas.`;

      } else if (seccion === 4) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 30-32 CT horas extra; Arts. 35-38 CT descanso; Arts. 67-70 CT feriado; Art. 66 CT permisos fallecimiento. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 4 (Arts. 27-34) — TÍTULO IV: HORAS EXTRAORDINARIAS Y DESCANSOS

**Artículo 27°:** Horas extraordinarias — definición. Las que exceden la jornada semanal de 42 horas o las trabajadas en días de descanso. Solo por acuerdo escrito para necesidades temporales. Límite: 2 horas diarias. Arts. 30-31 CT. Mínimo 8 líneas.

**Artículo 28°:** Pago de horas extra. Recargo del 50% sobre el sueldo para jornada ordinaria. Se liquidan junto con la remuneración del período. Sin autorización no se genera derecho a pago. Art. 32 CT. Mínimo 7 líneas.

**Artículo 29°:** Descanso semanal. Domingo como día de descanso, salvo actividades exceptuadas (Art. 38 CT). Festivos también son días de descanso. Derecho a día compensatorio si se trabaja en esos días. Mínimo 7 líneas.

**Artículo 30°:** Feriado anual. 15 días hábiles con remuneración íntegra para trabajadores con más de 1 año. El sábado es siempre día inhábil. Irrenunciable, no compensable en dinero durante vigencia del contrato. Art. 67 CT. Mínimo 7 líneas.

**Artículo 31°:** Vacaciones progresivas. 1 día adicional por cada 3 nuevos años trabajados con ${E}, para trabajadores con más de 10 años de trabajo. Acreditar con certificado. Art. 68 CT. Mínimo 6 líneas.

**Artículo 32°:** Fraccionamiento y acumulación. El exceso sobre 10 días hábiles puede fraccionarse. Acumulación hasta 2 períodos. No compensable en dinero salvo término del contrato. Art. 70 CT. Mínimo 6 líneas.

**Artículo 33°:** Feriado proporcional. Al dejar de pertenecer a ${E} antes de cumplir el año, indemnización calculada proporcionalmente. Art. 73 CT. Mínimo 5 líneas.

**Artículo 34°:** Permisos especiales por fallecimiento.
| Causante | Días de permiso |
|----------|----------------|
| Hijo | 10 días continuos |
| Cónyuge o conviviente civil | 7 días continuos |
| Hijo no nato | 7 días hábiles |
| Padre o Madre | 4 días continuos |
Fuero laboral por 1 mes para quien pierde un hijo o cónyuge. No compensables en dinero. Art. 66 CT. Mínimo 8 líneas.`;

      } else if (seccion === 5) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 41-62 CT remuneraciones; Art. 163 CT finiquito. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 5 (Arts. 35-44) — TÍTULO V: DE LAS REMUNERACIONES

**Artículo 35°:** Definición de remuneración. Componentes: sueldo, sobresueldo, comisión, participación, gratificación. NO son remuneración: movilización, colación, viáticos, prestaciones familiares. Arts. 41-42 CT. Mínimo 8 líneas.

**Artículo 36°:** Fecha y forma de pago. Día 30 de cada mes o hábil anterior. Depósito bancario o cuenta vista. Anticipo de hasta el 25% solicitado antes del día 10. Mínimo 8 líneas.

**Artículo 37°:** Ingreso mínimo. No puede ser inferior al mínimo mensual vigente. En jornadas parciales, proporcional. Menores de 18 y mayores de 65 se rigen por mínimos específicos. Mínimo 6 líneas.

**Artículo 38°:** Gratificaciones. Modalidades: a) 30% de utilidades líquidas, o b) 25% de remuneración anual con tope 4,75 ingresos mínimos. Arts. 46-49 CT. Mínimo 8 líneas.

**Artículo 39°:** Descuentos legales. Cotizaciones previsionales, impuesto único, cuotas sindicales, dividendos hipotecarios (máximo 30%), multas del reglamento. Art. 58 CT. Mínimo 8 líneas.

**Artículo 40°:** Liquidación de sueldo. Entrega física o digital cada período. Debe indicar: remuneración bruta, descuentos con fundamento legal, remuneración líquida. Mínimo 6 líneas.

**Artículo 41°:** Igualdad de remuneraciones. Mismo trabajo = misma remuneración entre hombres y mujeres. Diferencias solo por capacidades, calificaciones o productividad. Art. 62 bis CT. Mínimo 7 líneas.

**Artículo 42°:** Procedimiento de reclamo por remuneraciones. Reclamo escrito a Gerencia de ${E}. Respuesta en 30 días. Si no satisface, recurrir a Inspección del Trabajo o Juzgado Laboral. Mínimo 7 líneas.

**Artículo 43°:** Asignaciones no remuneracionales. No sirven de base para indemnizaciones: movilización, colación, viáticos, desgaste de herramientas, prestaciones familiares. Mínimo 6 líneas.

**Artículo 44°:** Finiquito y término del contrato. ${E} pagará remuneraciones, indemnizaciones y prestaciones adeudadas. Ratificación ante ministro de fe. Pago dentro de 5 días hábiles desde la separación. Art. 163 CT. Mínimo 8 líneas.`;

      } else if (seccion === 6) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 6 (Arts. 45-54) — TÍTULO VI: OBLIGACIONES DEL TRABAJADOR

**Artículo 45°:** Obligaciones generales de conducta. Lista con literales a) hasta n) mínimo, cada uno explicado: puntualidad, registrar asistencia, avisar ausencias en 24h, buena fe, respetar órdenes, cortesía con compañeros y clientes, cuidar bienes, mantener orden y limpieza, denunciar irregularidades, actualizar antecedentes, colaborar con investigaciones internas. Mínimo 16 líneas.

**Artículo 46°:** Obligaciones de seguridad. Lista a) hasta j): usar EPP, asistir a capacitaciones, reportar condiciones inseguras, no operar equipos sin capacitación, respetar señalización, colaborar en investigación de accidentes, no ingresar a zonas de riesgo sin autorización, mantener puesto ordenado. Mínimo 12 líneas.

**Artículo 47°:** Cuidado y conservación de bienes. Máxima diligencia con maquinarias, vehículos, equipos, materiales. Responsabilidad por daños por negligencia. Aviso inmediato al jefe de cualquier deterioro o pérdida. Mínimo 8 líneas.

**Artículo 48°:** Confidencialidad. Mantener reserva de antecedentes técnicos, comerciales y financieros. Vigencia por 2 años post término del contrato. La infracción es falta grave. Mínimo 7 líneas.

**Artículo 49°:** Comunicación obligatoria. Informar en 5 días hábiles: cambio de domicilio, variación de cargas familiares, cambio de AFP/salud, circunstancias que afecten el cumplimiento laboral. Mínimo 6 líneas.

**Artículo 50°:** Ante un accidente del trabajo. Paso a paso: avisar al jefe, llamar al número de emergencia, aplicar primeros auxilios si está capacitado, no mover al accidentado salvo necesidad, coordinar traslado a ${OA}, completar la DIAT. Mínimo 8 líneas.

**Artículo 51°:** Trato y convivencia. Respeto mutuo con compañeros, superiores, clientes. Contribuir a ambiente libre de violencia y acoso. Reportar conflictos a RRHH. Mínimo 6 líneas.

**Artículo 52°:** Obligaciones específicas del rubro ${R}. Al menos 5-7 obligaciones técnicas propias de esta actividad: normas de calidad, procedimientos específicos, uso de herramientas, normas higiénicas si aplica. Mínimo 8 líneas.

**Artículo 53°:** Capacitación. Asistir obligatoriamente a todas las actividades programadas por ${E} (SENCE o internas). Inasistencia injustificada será sancionada como incumplimiento. Mínimo 6 líneas.

**Artículo 54°:** Uso de tecnología corporativa. Equipos, correo e internet de ${E} exclusivamente para fines laborales. No instalar software no autorizado. No acceder a sitios prohibidos. No realizar actividades contrarias a la ley. Mínimo 7 líneas.`;

      } else if (seccion === 7) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 7 (Arts. 55-62) — TÍTULO VII: PROHIBICIONES DEL TRABAJADOR

**Artículo 55°:** Prohibiciones laborales. Lista a) hasta h) mínimo: horas extra sin autorización escrita, abandonar puesto sin permiso, atender asuntos personales en jornada, cargos en empresas competidoras, revelar información reservada, dormir o comer en puestos de trabajo, usar internet para actividades no laborales, vehículos/equipos de la empresa para fines personales. Cada literal explicado. Mínimo 14 líneas.

**Artículo 56°:** Prohibiciones de seguridad. Lista a) hasta h): no usar EPP, operar maquinarias sin autorización, desactivar sistemas de seguridad, trabajar bajo efectos del alcohol o drogas, introducir/consumir alcohol en instalaciones, fumar fuera de zonas habilitadas, remover señalización de seguridad, realizar trabajos en altura sin protección si aplica al rubro ${R}. Mínimo 12 líneas.

**Artículo 57°:** Prohibiciones respecto a bienes de la empresa. Usar bienes de ${E} para beneficio propio, sacar materiales sin autorización, vender/prestar EPP, dañar intencionalmente bienes (Art. 160 N°6 CT), introducir personas no autorizadas. Mínimo 10 líneas.

**Artículo 58°:** Prohibiciones en control de asistencia. Marcar o registrar asistencia de otro trabajador, adulterar registros, no marcar durante más de 2 días seguidos sin causa. Constituyen falta grave. Art. 160 N°1 CT. Mínimo 7 líneas.

**Artículo 59°:** Sustancias prohibidas. Introducir, vender o consumir alcohol o drogas. Ingresar en estado de intemperancia o bajo efectos de sustancias. ${E} puede realizar controles aleatorios. Resultado positivo es falta grave. Mínimo 8 líneas.

**Artículo 60°:** Prohibición de acoso y violencia. Prohibida toda conducta constitutiva de acoso laboral, sexual o violencia en el trabajo conforme al Título XII (Protocolo Ley Karin). Sancionadas con máxima severidad incluyendo despido disciplinario. Mínimo 6 líneas.

**Artículo 61°:** Otras prohibiciones. Introducir armas, participar en juegos de azar en horario/instalaciones de trabajo, realizar propaganda política o religiosa, hacer circular peticiones o ventas sin autorización. Mínimo 7 líneas.

**Artículo 62°:** Prohibiciones específicas del rubro ${R}. Al menos 4-6 prohibiciones técnicas propias de esta actividad: acciones que comprometan la seguridad operacional, prohibiciones higiénicas, conductas que afecten calidad. Mínimo 7 líneas.`;

      } else if (seccion === 8) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 154-157 CT sanciones; Arts. 159-163 CT término del contrato. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 8 (Arts. 63-72) — TÍTULO VIII: DEL ORDEN Y LA DISCIPLINA

**Artículo 63°:** Sistema de sanciones — gradualidad. a) Amonestación verbal del jefe inmediato, b) Amonestación escrita con copia al expediente, c) Amonestación con copia a la Inspección del Trabajo, d) Multa del 10% al 25% de la remuneración diaria. Art. 154 N°10 CT. Mínimo 10 líneas.

**Artículo 64°:** Multas. Máximo 25% de remuneración diaria. Fondos destinados a bienestar social de los trabajadores o fondo de capacitación. Comunicación mensual del uso de fondos. Art. 157 CT. Mínimo 8 líneas.

**Artículo 65°:** Derecho a reclamo contra sanciones. Reclamo ante Inspección del Trabajo dentro del 3° día hábil desde notificación. ${E} notifica toda sanción por escrito con expresión de causa y permite descargos previos a multas. Mínimo 7 líneas.

**Artículo 66°:** Causales Art. 160 CT — sin derecho a indemnización. Las 7 causales debidamente comprobadas: 1) Falta de probidad, acoso sexual o laboral, vías de hecho, injurias, conducta inmoral; 2) Negociaciones prohibidas; 3) Inasistencias injustificadas; 4) Abandono del trabajo; 5) Actos que afecten la seguridad; 6) Daño material intencional; 7) Incumplimiento grave. Cada causal con ejemplos para el rubro ${R}. Mínimo 16 líneas.

**Artículo 67°:** Causal Art. 161 CT — necesidades de la empresa. Preaviso de 30 días o pago sustitutivo. Derecho a indemnización por años de servicio. Mínimo 8 líneas.

**Artículo 68°:** Causales Art. 159 CT. Mutuo acuerdo, renuncia (30 días anticipación), muerte del trabajador, vencimiento del plazo, conclusión del trabajo, caso fortuito. Cada causal explicada. Mínimo 8 líneas.

**Artículo 69°:** Finiquito y certificado de trabajo. Contenido obligatorio del finiquito, ratificación ante ministro de fe. Certificado con: fecha de ingreso, retiro y cargo. Art. 162 CT. Mínimo 7 líneas.

**Artículo 70°:** Peticiones y reclamos internos. Reclamos escritos a Gerencia de ${E}. Respuesta en 5 días hábiles. Peticiones colectivas por el sindicato o delegación de hasta 5 trabajadores. Mínimo 7 líneas.

**Artículo 71°:** Investigación disciplinaria interna. Ante falta grave: investigación interna, conocimiento de cargos, derecho a descargos, resolución en 15 días hábiles máximo. Mínimo 6 líneas.

**Artículo 72°:** Relaciones laborales armónicas. ${E} promueve relaciones de respeto mutuo, comunicación directa y resolución dialogada de conflictos. Instancias de mediación interna cuando corresponda. Mínimo 5 líneas.`;

      } else if (seccion === 9) {
        prompt = `Eres experto en legislación laboral chilena. Ley 16.744, DS 44/2023 (reemplaza DS 40 y DS 54), Art. 184 CT. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 9 (Arts. 73-82) — TÍTULO IX: HIGIENE Y SEGURIDAD — PARTE 1

**Artículo 73°:** Marco normativo. Ley 16.744, DS 44/2023 (SSO, reemplaza DS 40 y DS 54), Ley 21.012, Art. 184 CT (deber de protección). Mínimo 8 líneas.

**Artículo 74°:** Obligaciones del empleador. ${E} debe: garantizar condiciones seguras (Art. 184 CT), proporcionar EPP sin costo, mantener IPER actualizada, capacitación continua, investigar accidentes, implementar Programa de Prevención. DS 44/2023. Mínimo 10 líneas.

**Artículo 75°:** Obligaciones del trabajador en seguridad. Usar EPP, asistir a capacitaciones, reportar condiciones inseguras, no operar equipos sin autorización, respetar señalización, mantener orden, colaborar con CPHS y con investigaciones. Mínimo 10 líneas.

**Artículo 76°:** Identificación y control de riesgos. Matriz IPER para tareas del rubro ${R}. Control jerárquico: eliminación, sustitución, controles de ingeniería, controles administrativos, EPP. Revisión anual por el CPHS. Lista los 5-7 principales riesgos del rubro ${R} con su medida de control. Mínimo 12 líneas.

**Artículo 77°:** Elementos de Protección Personal (EPP). ${E} proporciona gratuitamente los EPP requeridos para el rubro ${R}: [lista EPP obligatorios: casco, guantes, calzado de seguridad, lentes, protector auditivo, ropa de trabajo, arnés si aplica]. Uso obligatorio en todo momento. Prohibido prestar o vender los EPP. ${E} los repone cuando están deteriorados. Mínimo 12 líneas.

**Artículo 78°:** Señalización. Zonas de riesgo, vías de evacuación, extintores, botiquines, puntos de encuentro, señales exigidas por normativa. Obligación de respetar y no remover señalización. Mínimo 7 líneas.

**Artículo 79°:** Orden y limpieza. Cada trabajador responsable de su puesto. Pasillos, escaleras y vías de evacuación siempre despejados. Almacenamiento en lugares designados. Inspecciones periódicas. Mínimo 7 líneas.

**Artículo 80°:** CPHS. Obligatorio para 25+ trabajadores: 3 representantes del empleador + 3 de los trabajadores. Funciones: asesorar en prevención, vigilar cumplimiento, investigar accidentes, recomendar medidas. Reunión mensual. DS 54/1969, DS 44/2023. Mínimo 10 líneas.

**Artículo 81°:** Departamento de Prevención. Obligatorio para 100+ trabajadores, a cargo de experto en prevención. Funciones: planificar Programa de Prevención, asesorar CPHS, registrar accidentabilidad, coordinar con ${OA}. Mínimo 7 líneas.

**Artículo 82°:** Política alcohol y drogas — tolerancia cero. No presentarse ni permanecer bajo efectos de sustancias. ${E} puede realizar controles aleatorios mediante test. Resultado positivo: falta grave al contrato. Mínimo 8 líneas.`;

      } else if (seccion === 10) {
        prompt = `Eres experto en legislación laboral chilena. DS 44/2023, Ley 16.744, normativa de prevención de incendios. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 10 (Arts. 83-90) — TÍTULO X: HIGIENE Y SEGURIDAD — PARTE 2

**Artículo 83°:** Prevención de incendios. Extintores en buen estado y carga vigente en todas las áreas. Todos deben conocer su ubicación y rutas de evacuación. Simulacros al menos una vez al año. Brigada de emergencia. Procedimiento de evacuación paso a paso. Mínimo 10 líneas.

**Artículo 84°:** Primeros auxilios. Botiquines abastecidos en instalaciones. Al menos un trabajador por turno certificado en primeros auxilios básicos. Ante accidente: conservar calma, llamar al número de emergencia, no mover al accidentado si hay sospecha de lesión espinal, aplicar primeros auxilios si está capacitado, coordinar traslado a ${OA}. Mínimo 8 líneas.

**Artículo 85°:** Higiene industrial — condiciones ambientales. ${E} controlará: iluminación (según tarea), ruido (límite 85 dB TWA jornada 8h), temperatura (10°C a 30°C trabajos sedentarios), ventilación adecuada, ergonomía en puestos de trabajo. Mediciones según exija ${OA} o Inspección del Trabajo. Mínimo 10 líneas.

**Artículo 86°:** Capacitaciones obligatorias en seguridad. a) Inducción al ingreso (antes de inicio de labores), b) Capacitación anual en riesgos del rubro ${R}, c) Uso y mantención de EPP, d) Primeros auxilios (personal designado), e) Uso de extintores y evacuación, f) Capacitaciones específicas exigidas por ${OA}. Registro obligatorio: lista de asistencia y evaluación. Mínimo 10 líneas.

**Artículo 87°:** Riesgos específicos del rubro ${R}. Identifica y desarrolla 6-8 riesgos propios de este rubro: descripción del riesgo, situación en que ocurre, medida preventiva principal. Esta identificación se actualiza anualmente. Mínimo 14 líneas.

**Artículo 88°:** Procedimientos de Trabajo Seguro (PTS). Para tareas de mayor riesgo en el rubro ${R}, ${E} dispone de PTS documentados que los trabajadores deben conocer y aplicar: análisis de riesgos, pasos seguros, EPP requerido, medidas de control, qué hacer en emergencia. Mínimo 7 líneas.

**Artículo 89°:** Inspecciones de seguridad. CPHS y administración de ${E} realizan inspecciones periódicas. No conformidades deben subsanarse en plazos establecidos. La Inspección del Trabajo, SEREMI de Salud y ${OA} tienen derecho a ingresar. Mínino 7 líneas.

**Artículo 90°:** Derecho a saber. Los trabajadores tienen derecho a conocer: riesgos de su puesto, sustancias peligrosas y sus HDS, EPP que deben usar, procedimientos de emergencia. ${E} garantiza esta información al ingreso. Art. 21 DS 44/2023. Mínimo 7 líneas.`;

      } else if (seccion === 11) {
        prompt = `Eres experto en legislación laboral chilena. Ley 16.744, DS 44/2023 investigación de accidentes. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 11 (Arts. 91-100) — TÍTULO XI: ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES

**Artículo 91°:** Definiciones. Accidente del trabajo: lesión a causa o con ocasión del trabajo que produzca incapacidad o muerte (Art. 5° Ley 16.744). Accidente de trayecto: en el trayecto directo entre habitación y lugar de trabajo. Enfermedad profesional: causada directamente por el ejercicio de la profesión. Mínimo 10 líneas.

**Artículo 92°:** Procedimiento inmediato ante un accidente. a) Conservar calma y evaluar, b) Avisar al jefe directo y/o supervisor de turno, c) Llamar al número de emergencia interno de ${E}, d) Aplicar primeros auxilios si está capacitado y es seguro, e) No mover al accidentado si hay sospecha de lesiones en columna, f) Coordinar traslado a ${OA}, g) Preservar el lugar del accidente para investigación. Mínimo 12 líneas.

**Artículo 93°:** DIAT — Denuncia Individual de Accidente del Trabajo. Todo accidente debe denunciarse a ${OA} dentro de las 24 horas. Puede llenarla el trabajador, el empleador o el médico que prestó primera atención. ${E} lleva registro de todos los accidentes. Mínimo 8 líneas.

**Artículo 94°:** Accidente de trayecto. Trayecto directo entre domicilio y trabajo. Acreditación: parte policial, certificado médico de urgencia, declaración jurada. Denuncia dentro de 24 horas. Mínimo 7 líneas.

**Artículo 95°:** Investigación de accidentes. Por CPHS o empleador, dentro de 24-48 horas. Debe determinar: causas inmediatas, básicas y raíz. Informe con medidas correctivas. DS 44/2023. Mínimo 10 líneas.

**Artículo 96°:** Accidentes graves y fatales — protocolo especial. a) Llamar a emergencias (132/131), b) Notificar a Inspección del Trabajo y SEREMI de Salud dentro de 24 horas, c) Suspender faenas en el área hasta que la autoridad lo autorice, d) Cooperar con investigación de organismos fiscalizadores. Mínimo 10 líneas.

**Artículo 97°:** Enfermedades profesionales. Denuncia mediante DIEP ante ${OA}. ${E} realizará vigilancia periódica de la salud de trabajadores expuestos a riesgos propios del rubro ${R}. Mínimo 7 líneas.

**Artículo 98°:** Prestaciones médicas y económicas. Derecho a: atención médica/quirúrgica/dental/hospitalaria gratuita en ${OA}, medicamentos y prótesis, rehabilitación, subsidio por incapacidad temporal (100% de remuneración), indemnización o pensión por incapacidad permanente. Ley 16.744. Mínimo 10 líneas.

**Artículo 99°:** Estadísticas de accidentabilidad. ${E} calcula mensualmente: tasa de frecuencia, tasa de gravedad, tasa de accidentabilidad. Reporta al CPHS mensualmente y a ${OA} según sus requerimientos. Mínimo 7 líneas.

**Artículo 100°:** Rehabilitación y reincorporación. ${E} apoya el proceso coordinando con ${OA}. Reincorporación gradual, adecuando el puesto de trabajo si necesario, respetando restricciones médicas. Mínimo 6 líneas.`;

      } else if (seccion === 12) {
        prompt = `Eres experto en legislación laboral chilena. Ley 21.643 (Ley Karin) vigente desde agosto 2024. Arts. 2°, 211-A al 211-I CT. DS N°2/2024. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 12 (Arts. 101-107) — TÍTULO XII: PROTOCOLO LEY KARIN — PARTE 1

**Artículo 101°:** Fundamento legal y objetivo. Ley 21.643 vigente desde 1° de agosto de 2024, modifica CT incorporando Arts. 211-A al 211-I. Exige Protocolo de Prevención con perspectiva de género. Compromiso de ${E} de crear entorno laboral libre de toda forma de violencia. DS 2/2024. Mínimo 10 líneas.

**Artículo 102°:** Ámbito de aplicación. Aplica a: todos los trabajadores/as de ${E} sin excepción de cargo o jerarquía, trabajadores de contratistas y subcontratistas en instalaciones de ${E}, proveedores, clientes, visitas y practicantes. Mínimo 7 líneas.

**Artículo 103°:** Definición de acoso sexual. Conducta de requerimientos sexuales no consentidos, por cualquier medio, que amenacen o perjudiquen la situación laboral. Incluye: insinuaciones sexuales verbales o escritas, contacto físico no deseado, solicitud de favores sexuales, envío de material sexual digital, acercamientos indebidos, comentarios de naturaleza sexual. La característica esencial: NO es deseada por quien la recibe. Art. 2° CT. Mínimo 12 líneas.

**Artículo 104°:** Definición de acoso laboral. Toda conducta de agresión u hostigamiento, ya sea una sola vez o reiterada, por cualquier medio, que cause menoscabo, maltrato o humillación, o amenace la situación laboral. Incluye: aislamiento, humillación pública, tareas degradantes, sobrecarga excesiva, exclusión sistemática, críticas destructivas, acoso digital. Art. 2° CT. Mínimo 12 líneas.

**Artículo 105°:** Violencia por terceros. Conductas de clientes, proveedores, usuarios o visitas que afecten a trabajadores/as de ${E} en su prestación de servicios: agresiones verbales, físicas, conductas intimidatorias, acoso de clientes, robos o asaltos. ${E} adoptará medidas de protección. Mínimo 8 líneas.

**Artículo 106°:** Principios del protocolo. a) Confidencialidad — antecedentes de investigación son reservados, b) No represalia — denunciante de buena fe protegido, c) Perspectiva de género — considera relaciones de poder y desigualdades, d) Presunción de buena fe — toda denuncia se tramita de buena fe, e) Imparcialidad — investigador sin conflicto de interés, f) Celeridad — plazos estrictos. Mínimo 10 líneas.

**Artículo 107°:** Canal de denuncia. Mecanismos disponibles: a) Correo electrónico designado por ${E}: ${P}, b) Formulario físico en Recursos Humanos, c) Denuncia verbal ante encargado/a designado/a, d) Directamente ante la Inspección del Trabajo. La denuncia puede ser anónima cuando se requiera por razones de seguridad. Mínimo 10 líneas.`;

      } else if (seccion === 13) {
        prompt = `Eres experto en legislación laboral chilena. Ley 21.643 Arts. 211-A al 211-I CT. Investigación interna: máximo 30 días hábiles. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 13 (Arts. 108-114) — TÍTULO XII: PROTOCOLO LEY KARIN — PARTE 2

**Artículo 108°:** Procedimiento de denuncia. Contenido mínimo: nombre y RUT del denunciante y denunciado, descripción detallada de hechos (fecha, lugar, testigos), relación laboral entre las partes. ${E} emite constancia escrita con fecha y hora. Dentro de 5 días hábiles el empleador inicia la investigación. El denunciante puede optar por derivar a la Inspección del Trabajo. Mínimo 10 líneas.

**Artículo 109°:** Medidas de resguardo inmediatas. Una vez recibida la denuncia, ${E} adopta de inmediato: a) Separación de espacios físicos entre denunciante y denunciado, b) Redistribución de jornada de trabajo, c) Modalidad de trabajo remoto temporal, d) Derivación a atención psicológica a través de ${OA}, e) Cualquier otra medida que resguarde dignidad y seguridad de la víctima. Estas medidas no implican prejuzgamiento. Mínimo 10 líneas.

**Artículo 110°:** Procedimiento de investigación interna. Debe: a) Ser conducida por persona imparcial, sin conflicto de interés y capacitada, b) Notificar al investigado los cargos y darle oportunidad de descargos, c) Citar a audiencias a denunciante, denunciado y testigos, d) Analizar todas las pruebas, e) Emitir informe final con conclusiones y propuesta de medidas, f) Todo dentro de 30 días hábiles máximo desde el inicio. Arts. 211-A al 211-I CT. Mínimo 14 líneas.

**Artículo 111°:** Investigación por la Inspección del Trabajo. El denunciante puede optar por esta vía. ${E} debe: cooperar plenamente con los fiscalizadores, proporcionar toda documentación y acceso requerido, adoptar las medidas que la Inspección ordene en su informe. Plazo de investigación: 30 días hábiles. Mínimo 8 líneas.

**Artículo 112°:** Sanciones aplicables. Según la gravedad establecida en la investigación: a) Amonestación verbal, b) Amonestación escrita, c) Multa hasta 25% de remuneración diaria, d) Traslado de área o función, e) Término del contrato sin derecho a indemnización (Art. 160 N°1 b) acoso sexual, o f) acoso laboral CT). Las represalias contra denunciantes de buena fe también serán sancionadas. Mínimo 10 líneas.

**Artículo 113°:** Capacitación y difusión anual. Al menos una capacitación anual sobre prevención del acoso y violencia, dirigida a todos los trabajadores/as. Contenido mínimo: definiciones legales, conductas prohibidas, canal de denuncia, procedimiento e investigación, sanciones. Registro con lista de asistencia y evaluación. El CPHS supervisa el cumplimiento. Mínimo 8 líneas.

**Artículo 114°:** Conductas que NO constituyen acoso. No se consideran acoso, si se ejercen de manera razonable y dentro del marco legal: evaluaciones de desempeño objetivas, instrucciones o cambios en asignaciones de trabajo, llamados de atención o medidas disciplinarias ajustadas a derecho, cambios organizativos, ejercicio legítimo de facultades directivas. La calificación depende del contexto y los hechos concretos. Mínimo 8 líneas.`;

      } else if (seccion === 14) {
        prompt = `Eres experto en legislación laboral chilena. Protocolo TEMER SUSESO; Protocolo ISTAS21 SUSESO; Ley 20.001 y DS 63/2005 manejo manual de cargas. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 14 (Arts. 115-128) — TÍTULO XIV: TEMER, ISTAS21 Y MANEJO DE CARGAS

**Artículo 115°:** Marco legal TEMER. Protocolo de Vigilancia de Trastornos Musculoesqueléticos de Extremidades Superiores, SUSESO/Ministerio de Salud. Obligatorio para el rubro ${R}. Objetivo: prevenir lesiones por trabajo repetitivo, posturas forzadas y uso de fuerza excesiva. Mínimo 7 líneas.

**Artículo 116°:** Factores de riesgo y evaluación. Principales factores: trabajo repetitivo, posturas forzadas, aplicación de fuerza, vibración, frío, presión mecánica. Evaluación mediante RULA, OCRA u otras metodologías validadas por SUSESO. Periodicidad anual o ante cambios en las condiciones. Mínimo 8 líneas.

**Artículo 117°:** Medidas preventivas TEMER. a) Rotación de puestos de trabajo, b) Pausas activas obligatorias (mínimo 2 veces por jornada, 10 minutos), c) Rediseño ergonómico de puestos, d) Herramientas adecuadas al tamaño y fuerza del trabajador, e) Capacitación en técnicas de trabajo que reduzcan la carga musculoesquelética. Mínimo 8 líneas.

**Artículo 118°:** Vigilancia médica y seguimiento. Exámenes médicos periódicos coordinados con ${OA} para trabajadores expuestos. Casos detectados: atención oportuna y adaptaciones del puesto. El CPHS supervisa el programa. Mínimo 7 líneas.

**Artículo 119°:** Marco legal ISTAS21. Protocolo de Vigilancia de Riesgos Psicosociales en el Trabajo, SUSESO/ISTAS21. Obligatorio para 10+ trabajadores, DS 44/2023. Objetivo: identificar y evaluar factores de riesgo psicosocial. Mínimo 7 líneas.

**Artículo 120°:** Dimensiones del riesgo psicosocial. ISTAS21 evalúa: a) Exigencias psicológicas (carga cuantitativa y emocional), b) Trabajo activo y desarrollo de habilidades, c) Apoyo social y calidad del liderazgo, d) Compensaciones (reconocimiento y seguridad laboral), e) Doble presencia (trabajo y vida familiar). Dimensiones de mayor riesgo identificadas en ${E} para el rubro ${R}. Mínimo 10 líneas.

**Artículo 121°:** Aplicación del cuestionario y medidas de intervención. Aplicación anónima y confidencial del cuestionario SUSESO/ISTAS21 al menos cada 2 años. Análisis de resultados por área. Plan de acción según nivel de riesgo: bajo, medio o alto. El CPHS participa en el análisis y seguimiento. Mínimo 8 líneas.

**Artículo 122°:** Marco legal Manejo Manual de Cargas. Ley N°20.001 y DS N°63/2005. Aplicación en ${E} para trabajos del rubro ${R}. Objetivo: proteger la salud musculoesquelética y prevenir accidentes por sobreesfuerzo. Mínimo 6 líneas.

**Artículo 123°:** Límites de peso. Hombres: 25 kg en condiciones ideales. Mujeres y trabajadores menores de 18 o mayores de 55 años: 20 kg. Trabajadoras embarazadas o en lactancia: máximo 5 kg. Condiciones distintas a las ideales reducen los límites (metodología NIOSH). Mínimo 8 líneas.

**Artículo 124°:** Técnica correcta de levantamiento. a) Evaluar el peso antes de levantar, b) Ubicarse cerca de la carga con pies al ancho de los hombros, c) Doblar rodillas manteniendo la espalda recta, d) Tomar firmemente con ambas manos, e) Levantarla con la fuerza de las piernas, f) Evitar girar el torso mientras se carga, g) Pedir ayuda o usar medios mecánicos si supera los límites. Mínimo 10 líneas.

**Artículo 125°:** Medidas de control y restricciones especiales. ${E} dispone de medios mecánicos para cargas que superan los límites legales. Trabajadoras embarazadas o en lactancia: prohibido manejo de cargas superiores a 5 kg, trabajo en equipo obligatorio para cualquier carga que requiera esfuerzo. Mínimo 7 líneas.

**Artículo 126°:** Capacitación en manejo de cargas. Anual para trabajadores expuestos: técnica correcta de levantamiento, factores de riesgo, uso de medios mecánicos, reconocimiento de síntomas de sobreesfuerzo. Incluye ejercicios prácticos y evaluación. Mínimo 6 líneas.

**Artículo 127°:** Pausas y recuperación. Trabajadores que realizan manejo manual frecuente tendrán pausas de recuperación adicionales según carga y frecuencia, conforme a tablas del DS 63/2005. Mínimo 5 líneas.

**Artículo 128°:** Seguimiento CPHS. El CPHS revisa periódicamente el cumplimiento. Los casos de lesiones por sobreesfuerzo se investigan como accidentes del trabajo y se adoptan medidas correctivas. Mínimo 5 líneas.`;

      } else if (seccion === 15) {
        // SECCIÓN 15: Solo Maternidad + Datos Personales
        prompt = `Eres experto en legislación laboral chilena. Arts. 194-208 CT maternidad; Ley 21.719 protección datos. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 15 (Arts. 129-139) — TÍTULOS XV Y XVI: MATERNIDAD/PATERNIDAD Y DATOS PERSONALES

## TÍTULO XV: PROTECCIÓN DE LA MATERNIDAD Y PATERNIDAD

**Artículo 129°:** Marco legal. Arts. 194-208 CT, Ley 20.545 (posnatal parental), normativa vigente. Protección integral en ${E}. Mínimo 6 líneas.

**Artículo 130°:** Fuero maternal y paternal. Desde el embarazo hasta 1 año después del posnatal. Despido requiere autorización judicial (desafuero). Extensión a trabajadores y trabajadoras que adopten un menor conforme a Ley 19.620. Mínimo 7 líneas.

**Artículo 131°:** Descansos de maternidad. Prenatal: 6 semanas antes del parto. Posnatal: 12 semanas después. Subsidio equivalente al 100% de la remuneración. Posnatal parental adicional de 12 semanas (transferibles en parte al padre). Arts. 195-197 CT. Mínimo 8 líneas.

**Artículo 132°:** Permiso de paternidad. 5 días pagados al nacimiento o adopción de un hijo. Uso desde el parto (días corridos) o distribuido dentro del primer mes. Irrenunciable. Art. 195 CT. Mínimo 6 líneas.

**Artículo 133°:** Sala cuna y amamantamiento. Obligación de sala cuna cuando ${E} emplea 20 o más trabajadoras. Derecho a 1 hora diaria de amamantamiento hasta los 2 años del hijo, fraccionable en dos períodos, sin descuento de remuneración ni del feriado. Arts. 203-206 CT. Mínimo 7 líneas.

**Artículo 134°:** Trabajo peligroso o nocturno durante el embarazo. Trabajadoras embarazadas o en lactancia no podrán realizar trabajos que requieran esfuerzo físico considerable ni trabajos nocturnos. ${E} las trasladará a un trabajo compatible conservando la misma remuneración. Art. 202 CT. Mínimo 6 líneas.

**Artículo 135°:** Permiso por enfermedad grave del hijo menor de 1 año. Cuando la salud de un hijo menor de 1 año requiera atención en el hogar por enfermedad grave, la trabajadora (o el padre en ciertos casos) tendrá derecho a licencia médica con subsidio. Art. 199 CT. Mínimo 6 líneas.

**Artículo 136°:** Permiso por muerte de hijo y cónyuge. Fuero laboral por 1 mes para quien pierde un hijo o cónyuge. El permiso se hace efectivo desde el día del fallecimiento o, en caso de defunción fetal, desde que se acredita con certificado. Art. 66 CT. Mínimo 6 líneas.

## TÍTULO XVI: PROTECCIÓN DE DATOS PERSONALES (Ley N°21.719)

**Artículo 137°:** Marco legal y ámbito. La Ley 21.719 establece obligaciones para ${E} respecto al tratamiento de datos personales de sus trabajadores. ${E} trata los siguientes datos: identificación (RUT, nombre, domicilio), laborales (cargo, remuneración, asistencia, evaluaciones), salud (solo para fines laborales), financieros (cuenta bancaria), imágenes de videovigilancia. La finalidad es exclusivamente laboral o de seguridad. Mínimo 10 líneas.

**Artículo 138°:** Principios del tratamiento. Licitud, finalidad, proporcionalidad, calidad, seguridad y transparencia. Cómo se aplica cada principio en ${E}. Mínimo 8 líneas.

**Artículo 139°:** Derechos del trabajador (ARCO). Los trabajadores tienen derecho a: a) Acceso — conocer qué datos tiene ${E} sobre ellos, b) Rectificación — corregir datos erróneos, c) Cancelación — eliminar datos que ya no sean necesarios, d) Oposición — oponerse al tratamiento en ciertos casos. Para ejercer estos derechos: dirigirse al encargado designado en ${E} (${P}). Plazo de respuesta: 15 días hábiles. Responsabilidad del encargado de datos de la empresa. Medidas de seguridad técnicas y organizativas para proteger los datos. Mínimo 12 líneas.`;

      } else if (seccion === 16) {
        // SECCIÓN 16: Solo Disposiciones Finales + Normativa + Declaración
        prompt = `Eres experto en legislación laboral chilena. Art. 156 CT vigencia del reglamento. ${reglas}
EMPRESA: ${ctx}

Genera la SECCIÓN 16 (Arts. 140-142) — TÍTULO XVII: DISPOSICIONES FINALES, NORMATIVA DE REFERENCIA Y DECLARACIÓN DE APROBACIÓN

## TÍTULO XVII: DISPOSICIONES FINALES

**Artículo 140°:** Vigencia del reglamento. El presente Reglamento Interno entrará en vigencia 30 días después de ser puesto en conocimiento de los trabajadores, salvo que la Inspección del Trabajo formule objeciones fundadas dentro de ese plazo. El reglamento fue depositado en la Inspección del Trabajo y en la SEREMI de Salud correspondientes, conforme a lo dispuesto en el Art. 156 del Código del Trabajo. Mínimo 8 líneas.

**Artículo 141°:** Difusión y entrega. ${E} entregará una copia física o digital de este reglamento a cada trabajador al momento del ingreso. El trabajador firmará un cargo de recepción. El reglamento estará disponible permanentemente en: a) Carteleras en todas las instalaciones de ${E}, b) Plataforma digital interna, c) Sistema de gestión de RRHH. La entrega y firma de recepción se registrará en el expediente personal del trabajador. Mínimo 8 líneas.

**Artículo 142°:** Normativa supletoria y modificaciones. En todo lo no previsto en este reglamento, se aplicarán las disposiciones del Código del Trabajo, sus reglamentos y la normativa de la Dirección del Trabajo. Toda modificación deberá realizarse conforme al procedimiento establecido en el Artículo 8° de este reglamento. ${E} se compromete a mantener este reglamento permanentemente actualizado ante cambios en la legislación laboral. Mínimo 8 líneas.

---

## NORMATIVA DE REFERENCIA

| N° | Norma | Materia | Año |
|----|-------|---------|-----|
| 1 | Código del Trabajo DFL N°1/2003 | Marco general laboral | 2003 |
| 2 | Ley N°16.744 | Accidentes del trabajo y enfermedades profesionales | 1968 |
| 3 | DS N°44/2023 | Seguridad y Salud Ocupacional (reemplaza DS 40 y DS 54) | 2023 |
| 4 | Ley N°21.643 — Ley Karin | Prevención acoso laboral, sexual y violencia | 2024 |
| 5 | Ley N°21.719 | Protección de datos personales | 2022 |
| 6 | Ley N°21.561 | Reducción jornada laboral (progresiva hasta 40h en 2028) | 2024 |
| 7 | Ley N°20.001 | Manejo manual de cargas humanas | 2005 |
| 8 | DS N°63/2005 | Reglamento manejo de cargas | 2005 |
| 9 | Ley N°21.012 | Garantía del derecho a la seguridad y salud | 2017 |
| 10 | Ley N°21.015 | Inclusión laboral personas con discapacidad | 2017 |
| 11 | Ley N°21.220 | Teletrabajo y trabajo a distancia | 2020 |
| 12 | Protocolo TEMER | Trastornos musculoesqueléticos de extremidades superiores | SUSESO |
| 13 | Protocolo SUSESO/ISTAS21 | Riesgos psicosociales en el trabajo | SUSESO |
| 14 | Ley N°20.545 | Posnatal parental | 2011 |
| 15 | DS N°2/2024 | Política Nacional de Seguridad y Salud en el Trabajo | 2024 |
| 16 | DS N°54/1969 | Constitución y funcionamiento de CPHS | 1969 |

---

## DECLARACIÓN DE VIGENCIA Y APROBACIÓN

El presente Reglamento Interno de Orden, Higiene y Seguridad de **${E}** ha sido elaborado conforme a lo dispuesto en el artículo 153 y siguientes del Código del Trabajo (DFL N°1/2003), y contiene las disposiciones mínimas exigidas por la Ley N°16.744, el DS N°44/2023 y demás normativa laboral vigente en Chile.

Este reglamento reemplaza y deja sin efecto cualquier reglamento interno anterior de ${E}.

**___________________________**
**${cliente.representante_legal||P}**
Representante Legal
**${E}**
RUT: ${cliente.rut||P}
Dirección: ${cliente.direccion||P}

*Fecha de elaboración: ${new Date().toLocaleDateString('es-CL')} — Versión 01/${new Date().getFullYear()}*`;

      } else {
        return res.status(400).json({ error: `Sección ${seccion} no válida. Válidas: 1-16.` });
      }

    // ═══════════════════════════════════════
    // RESUMEN EJECUTIVO PARA EL EMPLEADOR
    // ═══════════════════════════════════════
    } else if (tipo === 'resumen_empleador') {
      maxTokens = 3500;
      prompt = `Eres experto en legislación laboral chilena y comunicación ejecutiva.
EMPRESA: ${ctx}

Genera un RESUMEN EJECUTIVO del RIOHS para Gerencia y RRHH de ${E}. Directo, claro y accionable.

# RESUMEN EJECUTIVO — RIOHS ${new Date().getFullYear()}
## ${E} | Rubro: ${R}

## ¿Por qué existe este documento?
Qué es el RIOHS, por qué es obligatorio (Art. 153 CT), qué pasa si no se tiene o si está desactualizado. 6 líneas.

## Lo que el empleador DEBE hacer — 12 obligaciones críticas
Lista numerada. Por cada obligación: nombre, ley que la sustenta, consecuencia de incumplimiento. Incluir: entrega del RIOHS al trabajador, condiciones seguras (Art. 184 CT), protocolo Ley Karin, CPHS (25+ trabajadores), capacitaciones de seguridad, investigar accidentes (24-48h), ISTAS21 (cada 2 años), TEMER, igualdad de remuneraciones, pago de finiquito (5 días hábiles).

## Plazos clave que no puede olvidar
Tabla: | Obligación | Plazo | Consecuencia |
Incluye: accidentes (24h), Ley Karin (5 días inicio + 30 días resolución), finiquito (5 días), ISTAS21 (cada 2 años), liquidaciones (mensual).

## Los 5 riesgos legales más importantes para ${E}
5 riesgos con la multa o consecuencia legal específica para el rubro ${R}.

## Normativa reciente — Asegúrese de tenerla incorporada
Ley Karin (agosto 2024), DS 44/2023, Ley 21.719, Ley 21.561. Una línea por norma explicando qué implica.

---
*Este resumen no reemplaza el RIOHS completo.*`;

    // ═══════════════════════════════════════
    // INFORME DE CAMBIOS — simplificado
    // ═══════════════════════════════════════
    } else if (tipo === 'informe_cambios') {
      maxTokens = 3000;
      const lista = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo} — ${a.descripcion} (${a.normativa||''})`
      ).join('\n');

      prompt = `Eres experto en legislación laboral chilena.
EMPRESA: ${ctx}

Genera un INFORME DE CAMBIOS para la auditoría del RIOHS de ${E}.

# INFORME DE ACTUALIZACIÓN DEL RIOHS
## ${E} — ${new Date().toLocaleDateString('es-CL')}

## Resumen
En 5 líneas: cuántos cambios se realizaron (${(alertas_seleccionadas||[]).length}), de qué tipo, impacto legal de haberlos aplicado, estado actual del reglamento.

## Cambios aplicados

### Artículos o secciones AGREGADOS ⚠️
Lista numerada de los cambios de tipo "falta" aplicados. Por cada uno: qué se agregó y qué ley lo exige.

### Artículos ACTUALIZADOS 🔄
Lista numerada de los cambios de tipo "cambio". Por cada uno: qué se modificó y con qué normativa.

### Artículos ELIMINADOS o derogados 🗑️
Lista de los cambios de tipo "sobra". Por cada uno: qué se eliminó y por qué.

### Errores CORREGIDOS ❌
Lista de los cambios de tipo "error". Por cada uno: qué error se corrigió.

Los cambios aplicados fueron:
${lista}

## Estado del RIOHS actualizado
🟢 Áreas completamente actualizadas
🟡 Áreas que requieren revisión periódica
🔴 Cambios pendientes (si quedaron alertas sin aplicar)

## Próxima revisión recomendada
Cuándo hacer la próxima auditoría y qué normativa monitorear.

*Generado el ${new Date().toLocaleDateString('es-CL')} — Sistema Más Prevención*`;

    // ═══════════════════════════════════════
    // AUDITORÍA ANÁLISIS (con web search)
    // ═══════════════════════════════════════
  } else if (tipo === 'auditoria_analisis') {
      usarWebSearch = false;
      maxTokens = 1500;
      prompt = `Eres experto en legislación laboral chilena con acceso a búsqueda web.
Busca: "DS 44 2023 Chile ${new Date().getFullYear()}", "Ley Karin vigente Chile", "normativa laboral nueva Chile ${new Date().getFullYear()}", "seguridad ${R} Chile vigente".

EMPRESA: ${ctx}
DOCUMENTO A AUDITAR: ${(documento_existente||'').substring(0,2000)}

Devuelve SOLO este JSON:
\`\`\`json
{"alertas":[{"id":1,"tipo":"falta","prioridad":"alta","titulo":"Título","descripcion":"Descripción. Máximo 2 oraciones.","seccion":"Sección afectada","normativa":"Ley con año"}]}
\`\`\`
TIPOS: "falta"|"cambio"|"sobra"|"error" — PRIORIDADES: "alta"|"media"|"baja"
Genera 10-30 alertas específicas.`;

    // ═══════════════════════════════════════
    // AUDITORÍA APLICAR (con web search)
    // ═══════════════════════════════════════
    } else if (tipo === 'auditoria_aplicar') {
      usarWebSearch = true;
      maxTokens = 5000;
      const cambios = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo}: ${a.descripcion} — Normativa: ${a.normativa||''}`
      ).join('\n');
      prompt = `Eres experto en legislación laboral chilena con acceso a búsqueda web.
Busca el texto legal de: ${(alertas_seleccionadas||[]).map(a=>a.normativa).filter(Boolean).slice(0,4).join(', ')}

EMPRESA: ${ctx}
DOCUMENTO ORIGINAL: ${(documento_existente||'').substring(0,4000)}
CAMBIOS A APLICAR (${(alertas_seleccionadas||[]).length}):
${cambios}

Aplica SOLO estos cambios. FALTA: agrega el artículo completo. CAMBIO: reescribe completo con normativa actualizada. SOBRA: marca [DEROGADO]. ERROR: corrígelo. Entrega el documento COMPLETO en Markdown. Cada artículo mínimo 6 líneas.`;

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
