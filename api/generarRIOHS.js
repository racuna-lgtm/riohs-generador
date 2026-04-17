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

      // ─────────────────────────────────────────
      // SECCIÓN 1: Portada + Índice + Título I
      // ─────────────────────────────────────────
      if (seccion === 1) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 1 del RIOHS:

# REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
# ${E.toUpperCase()}
**RUT:** ${cliente.rut||P} | **Rubro:** ${R} | **Región:** ${cliente.region||P}
**Dirección:** ${cliente.direccion||P}
**Organismo Administrador:** ${OA}
**Representante Legal:** ${cliente.representante_legal||P}
**Versión 01 — ${new Date().getFullYear()}**

En cumplimiento del artículo 153 del Código del Trabajo (DFL N°1/2003), ${E} elabora el presente Reglamento Interno de Orden, Higiene y Seguridad para regular las condiciones, requisitos, derechos, obligaciones y prohibiciones de todos sus trabajadores. Este reglamento es parte integrante de cada contrato de trabajo y es de cumplimiento obligatorio desde el primer día de contratación.

## ÍNDICE GENERAL
| N° | TÍTULO | MATERIA | ARTÍCULOS |
|----|--------|---------|-----------|
| I | Disposiciones Generales | Objeto, ámbito y definiciones | 1–8 |
| II | Del Ingreso y Contratación | Requisitos, documentación, contrato | 9–18 |
| III | De la Jornada de Trabajo | Horarios, turnos, asistencia, permisos | 19–26 |
| IV | Jornada: Horas Extra y Descansos | Horas extra, festivos, feriado | 27–34 |
| V | De las Remuneraciones | Pago, descuentos, gratificaciones, finiquito | 35–44 |
| VI | Obligaciones del Trabajador | Deberes generales y específicos | 45–54 |
| VII | Prohibiciones del Trabajador | Conductas prohibidas | 55–62 |
| VIII | Del Orden y la Disciplina | Sanciones, multas, despido, reclamos | 63–72 |
| IX | Higiene y Seguridad — Parte 1 | Marco legal, EPP, riesgos, CPHS | 73–82 |
| X | Higiene y Seguridad — Parte 2 | Prevención, capacitación, riesgos específicos | 83–90 |
| XI | Accidentes del Trabajo y EEPP | Procedimiento, investigación, reporte, mutualidad | 91–100 |
| XII | Ley Karin — Protocolo Acoso | Definiciones, canal denuncia, investigación, sanciones | 101–114 |
| XIII | TEMER · ISTAS21 · Cargas | Musculoesquelético, psicosocial, manejo de cargas | 115–128 |
| XIV | Maternidad, Datos y Cierre | Maternidad, datos personales, disposiciones finales | 129–142 |

## TÍTULO I: DISPOSICIONES GENERALES

**Artículo 1°:** Objeto y ámbito de aplicación. Explica qué regula este reglamento, a quiénes aplica (todos los trabajadores de ${E} en cualquier punto del territorio), carácter obligatorio desde el ingreso, y relación con el contrato de trabajo. Referencia Art. 153 CT. Mínimo 8 líneas.

**Artículo 2°:** Definición de Reglamento Interno. Qué es, su valor jurídico, quién lo elabora, rol de la Inspección del Trabajo en su aprobación, plazo de objeción (30 días). Mínimo 6 líneas.

**Artículo 3°:** Definición de Empleador, Trabajador y Empresa. Una definición desarrollada por cada concepto, con referencia a los Arts. 3° y 7° del Código del Trabajo. Mínimo 8 líneas.

**Artículo 4°:** Definición de Jefe Inmediato, Cargo, Faena y Dependencia Jerárquica. Explica la estructura de autoridad en ${E} y las implicancias para efectos de este reglamento. Mínimo 6 líneas.

**Artículo 5°:** Definiciones económicas: Remuneración, Sueldo, Gratificación, Sobresueldo. Diferencias entre cada concepto y su tratamiento legal. Mínimo 6 líneas.

**Artículo 6°:** Definiciones operacionales: Jornada, Turno, Hora Extraordinaria, Feriado, Licencia Médica, Accidente del Trabajo. Una definición por concepto. Mínimo 8 líneas.

**Artículo 7°:** Entrega y recepción del reglamento. Obligación del empleador de entregar copia al trabajador al ingreso. Firma de recepción. Disponibilidad en carteleras y plataformas digitales. Mínimo 6 líneas.

**Artículo 8°:** Modificación del reglamento. Procedimiento: elaboración de modificación, comunicación con 30 días de anticipación, participación del sindicato si existe, nueva aprobación por Inspección del Trabajo. Mínimo 6 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 2: Título II — Ingreso
      // ─────────────────────────────────────────
      } else if (seccion === 2) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 2 (Arts. 9-18) — TÍTULO II: DEL INGRESO Y CONTRATACIÓN

**Artículo 9°:** Requisitos de ingreso a ${E}. Lista completa con mínimo 12 documentos exigibles: cédula de identidad y fotocopia, certificado AFP, certificado FONASA/ISAPRE, curriculum vitae, certificado de antecedentes, certificado de residencia, certificado de estudios, certificado de matrimonio e hijos si corresponde, certificado de discapacidad si aplica, y otros específicos del rubro ${R}. Cada ítem explicado. Mínimo 10 líneas.

**Artículo 10°:** Exámenes preocupacionales. Tipos de exámenes según el cargo y el rubro ${R}, quién los realiza (${OA} o centro médico habilitado), cuándo se realizan (antes del inicio de labores), resultados como condición de ingreso, confidencialidad. Mínimo 8 líneas.

**Artículo 11°:** Período de prueba. Condiciones, duración, derechos del trabajador durante este período, cómo se formaliza en el contrato, restricciones. Mínimo 6 líneas.

**Artículo 12°:** Celebración del contrato de trabajo. Plazos legales: 15 días desde el ingreso (o 5 días si el contrato es por obra o servicio inferior a 30 días). Formato escrito obligatorio, distribución de copias, constancia de recepción. Art. 9° CT. Mínimo 8 líneas.

**Artículo 13°:** Contenido mínimo del contrato de trabajo. Lista desarrollada con literales a) hasta i): lugar y fecha, individualización de las partes, domicilios, naturaleza de los servicios, remuneración, jornada, plazo, correos electrónicos de ambas partes. Art. 10 CT. Mínimo 10 líneas.

**Artículo 14°:** Modificaciones al contrato de trabajo. Procedimiento: toda modificación debe constar por escrito al dorso del contrato o en documentos anexos firmados por ambas partes. Casos frecuentes: cambio de funciones, remuneración, lugar de trabajo. Mínimo 6 líneas.

**Artículo 15°:** Contrato de trabajadores menores de edad. Requisitos: firma del representante legal o Inspector del Trabajo. Prohibición de contratar menores de 15 años. Restricciones de jornada y horario para menores de 18 años. Art. 13 CT. Mínimo 6 líneas.

**Artículo 16°:** Documentos falsos al ingreso. La comprobación posterior de haber presentado documentos falsos o adulterados es causal de terminación inmediata del contrato sin derecho a indemnización, conforme al Art. 160 N°1 letra a) del Código del Trabajo. Falta grave de probidad. Mínimo 6 líneas.

**Artículo 17°:** Actualización de antecedentes personales. Obligación del trabajador de informar a ${E} cualquier cambio en sus antecedentes personales (domicilio, estado civil, cargas familiares, AFP, sistema de salud) dentro de los 5 días hábiles de producido el cambio. Mínimo 5 líneas.

**Artículo 18°:** Inclusión laboral — Ley N°21.015. Las empresas con 100 o más trabajadores deben contratar al menos el 1% de personas con discapacidad. Procedimiento de postulación, adaptaciones razonables del puesto, registro en el sistema de la Dirección del Trabajo. Mínimo 7 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 3: Título III — Jornada parte 1
      // ─────────────────────────────────────────
      } else if (seccion === 3) {
        prompt = `Eres experto en legislación laboral chilena. Ley 21.561 establece jornada de 42 horas semanales vigente desde abril 2026 (reducción progresiva a 40 horas hasta 2028). ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 3 (Arts. 19-26) — TÍTULO III: DE LA JORNADA DE TRABAJO (Parte 1)

**Artículo 19°:** Jornada ordinaria de trabajo. ${E} establece una jornada de 42 horas semanales, conforme a la Ley N°21.561 vigente desde el 26 de abril de 2026. Distribución semanal de lunes a viernes (y/o según el sistema de turnos: ${cliente.turnos||'jornada diurna estándar'}). Incluir tabla de horarios específicos de la empresa por área o planta si corresponde. Explicar que la jornada se reduce a 41 horas en 2027 y 40 horas en 2028. Mínimo 10 líneas.

**Artículo 20°:** Sistema de control de asistencia. ${E} registra la asistencia mediante [tarjeta de control / sistema biométrico / libro de asistencia / dispositivo móvil autorizado]. Obligaciones del trabajador: registrar entrada y salida diariamente, no marcar tarjeta ajena (falta grave), informar inmediatamente a RRHH si hay problemas con el sistema. Mínimo 8 líneas.

**Artículo 21°:** Ausentismo e inasistencias. El trabajador que no pueda asistir debe dar aviso dentro de las 24 horas a su jefe directo y/o Recursos Humanos, por cualquier medio. Dos inasistencias seguidas sin aviso pueden constituir abandono del trabajo (Art. 160 N°3 CT). Las ausencias sin justificación serán descontadas de la remuneración. Mínimo 8 líneas.

**Artículo 22°:** Atrasos. Los atrasos reiterados (más de 3 en el mes) serán sancionados conforme al sistema disciplinario del Título VIII de este reglamento. Todo atraso debe registrarse en el sistema de control. Los atrasos no recuperados se descuentan proporcionalmente de la remuneración. Mínimo 6 líneas.

**Artículo 23°:** Permisos durante la jornada. Todo permiso para ausentarse durante la jornada debe ser solicitado por escrito y autorizado por el jefe directo con anticipación. Permisos por emergencias familiares se tramitan con ${E} RRHH. Imputación al feriado legal o descuento según acuerdo. Mínimo 6 líneas.

**Artículo 24°:** Colación. El tiempo destinado a colación no se considera parte de la jornada de trabajo y no es remunerado (Art. 34 CT). ${E} dispone de [espacio/casino/sala de descanso] para que los trabajadores tomen su colación. Está prohibido comer en los puestos de trabajo o en áreas de producción. Mínimo 6 líneas.

**Artículo 25°:** Teletrabajo y trabajo a distancia — Ley N°21.220. Cuando por acuerdo escrito entre las partes se establezca modalidad de teletrabajo, se aplicarán las disposiciones de la Ley 21.220: derecho a desconexión digital (mínimo 12 horas), provisión de equipos por parte del empleador, cobertura del seguro de accidentes del trabajo en el lugar designado, derecho a reversibilidad. Mínimo 7 líneas.

**Artículo 26°:** Cambios de turno y jornada excepcional. Cualquier cambio en la distribución de la jornada ordinaria debe ser informado al trabajador con a lo menos 30 días de anticipación. Los sistemas de turnos rotativos deben ser publicados en cartelera. La jornada excepcional (superior a los límites legales) requiere autorización de la Dirección del Trabajo. Mínimo 6 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 4: Jornada parte 2 — Horas extra y descansos
      // ─────────────────────────────────────────
      } else if (seccion === 4) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 30-32 CT horas extraordinarias; Arts. 35-38 CT descanso dominical; Arts. 67-70 CT feriado anual; Art. 66 CT permisos por fallecimiento. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 4 (Arts. 27-34) — TÍTULO IV: JORNADA: HORAS EXTRAORDINARIAS Y DESCANSOS

**Artículo 27°:** Horas extraordinarias — definición. Son las que exceden la jornada semanal de 42 horas establecida en este reglamento, o las trabajadas en día de descanso sin ser compensadas. Solo pueden pactarse para atender necesidades temporales y deben constar por escrito con autorización previa del jefe directo. Límite: 2 horas diarias. Arts. 30-31 CT. Mínimo 8 líneas.

**Artículo 28°:** Pago de horas extraordinarias. Las horas extra se pagan con recargo del 50% sobre el sueldo convenido para la jornada ordinaria. Se liquidan junto con la remuneración del período. Quien permanezca en su puesto después del horario sin autorización expresa de su jefe directo no genera derecho a pago de horas extra. Art. 32 CT. Mínimo 7 líneas.

**Artículo 29°:** Descanso semanal. El día de descanso semanal es el domingo, salvo para actividades exceptuadas conforme al Art. 38 CT. Los días festivos legales son también días de descanso, salvo disposición contraria para el rubro ${R}. Los trabajadores con descanso en días distintos tendrán derecho a un día compensatorio en la semana. Mínimo 7 líneas.

**Artículo 30°:** Feriado anual. Los trabajadores con más de un año de servicio tendrán derecho a feriado anual de 15 días hábiles con remuneración íntegra. El sábado se considera siempre día inhábil para estos efectos. El feriado es irrenunciable y no puede compensarse en dinero durante la vigencia del contrato. Art. 67 CT. Mínimo 7 líneas.

**Artículo 31°:** Vacaciones progresivas. Todo trabajador con más de 10 años de trabajo (para uno o más empleadores, continuos o no) tendrá derecho a 1 día adicional de feriado por cada 3 nuevos años trabajados con ${E}. Debe acreditarse con certificado de vacaciones progresivas. Art. 68 CT. Mínimo 6 líneas.

**Artículo 32°:** Fraccionamiento y acumulación del feriado. El feriado puede ser continuo, pero el exceso sobre 10 días hábiles puede fraccionarse de común acuerdo. Puede acumularse por acuerdo de las partes hasta 2 períodos consecutivos. El feriado no puede compensarse en dinero salvo al término del contrato. Art. 70 CT. Mínimo 6 líneas.

**Artículo 33°:** Feriado proporcional. Si el trabajador deja de pertenecer a ${E} antes de cumplir el año que da derecho al feriado, percibirá una indemnización equivalente a la remuneración íntegra calculada proporcionalmente al tiempo trabajado desde la última anualidad o desde el ingreso. Art. 73 CT. Mínimo 5 líneas.

**Artículo 34°:** Permisos especiales con goce de remuneración. Por fallecimiento de familiares directos, el trabajador tendrá derecho a los siguientes permisos pagados, que deben hacerse efectivos desde el día del fallecimiento:

| Causante | Días de permiso |
|----------|----------------|
| Hijo | 10 días continuos |
| Cónyuge o conviviente civil | 7 días continuos |
| Hijo no nato (defunción fetal) | 7 días hábiles |
| Padre o Madre | 4 días continuos |

El trabajador que haga uso del permiso por muerte de un hijo o cónyuge gozará de fuero laboral por 1 mes desde el fallecimiento. Los días no pueden compensarse en dinero. Art. 66 CT. Mínimo 8 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 5: Título V — Remuneraciones
      // ─────────────────────────────────────────
      } else if (seccion === 5) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 41-62 CT sobre remuneraciones; Art. 163 CT finiquito. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 5 (Arts. 35-44) — TÍTULO V: DE LAS REMUNERACIONES

**Artículo 35°:** Definición de remuneración. Constituyen remuneración: sueldo o jornal, sobresueldo, comisión, participación y gratificación. NO constituyen remuneración: asignaciones de movilización, colación, viáticos, prestaciones familiares ni devoluciones de gastos. Art. 41-42 CT. Mínimo 8 líneas.

**Artículo 36°:** Fecha y forma de pago. Las remuneraciones se pagarán el día 30 de cada mes, o el día hábil inmediatamente anterior si ese día es sábado, domingo o festivo. El pago se efectúa mediante depósito en cuenta corriente o cuenta vista del trabajador. El trabajador podrá solicitar un anticipo de hasta el 25% de su remuneración mensual líquida, solicitado antes del día 10 del mes. Mínimo 8 líneas.

**Artículo 37°:** Ingreso mínimo. La remuneración no podrá ser inferior al ingreso mínimo mensual vigente fijado por ley. En jornadas parciales, el mínimo se calcula proporcionalmente a la jornada. Los trabajadores menores de 18 años o mayores de 65 años se rigen por los mínimos específicos establecidos por ley. Mínimo 6 líneas.

**Artículo 38°:** Gratificaciones. ${E} podrá pagar gratificación conforme a cualquiera de estas modalidades: a) Distribución del 30% de las utilidades líquidas entre los trabajadores proporcionalmente a sus remuneraciones, o b) Pago del 25% de la remuneración anual de cada trabajador con tope de 4,75 ingresos mínimos mensuales. Arts. 46-49 CT. Mínimo 8 líneas.

**Artículo 39°:** Descuentos legales. El empleador deducirá de las remuneraciones: a) Cotizaciones previsionales (AFP, salud), b) Impuesto único a la renta, c) Cuotas sindicales si el trabajador está afiliado, d) Dividendos hipotecarios a solicitud escrita del trabajador (máximo 30% de la remuneración), e) Multas establecidas en este reglamento. Art. 58 CT. Mínimo 8 líneas.

**Artículo 40°:** Liquidación de sueldo. El empleador entregará al trabajador una liquidación de remuneraciones por cada período de pago, en formato físico o digital, firmada por ambas partes. Debe indicar: remuneración bruta, todos los descuentos con su fundamento legal, y remuneración líquida a pagar. Mínimo 6 líneas.

**Artículo 41°:** Igualdad de remuneraciones. ${E} cumplirá estrictamente el principio de igual remuneración entre hombres y mujeres que realicen un mismo trabajo. Las diferencias sólo podrán justificarse en capacidades, calificaciones, idoneidad, responsabilidad o productividad. Art. 62 bis CT. Mínimo 7 líneas.

**Artículo 42°:** Procedimiento de reclamo por remuneraciones. La trabajadora o el trabajador que considere infringido su derecho a igual remuneración podrá presentar reclamo escrito a la Gerencia de ${E}. El empleador responderá por escrito dentro de 30 días. Si la respuesta no es satisfactoria, podrá recurrir a la Inspección del Trabajo o al Juzgado de Letras del Trabajo. Mínimo 7 líneas.

**Artículo 43°:** Asignaciones no remuneracionales. No constituyen remuneración y no sirven de base para el cálculo de indemnizaciones: a) Asignación de movilización, b) Asignación de colación, c) Viáticos, d) Asignación de desgaste de herramientas, e) Prestaciones familiares legales, f) Devoluciones de gastos por causa del trabajo. Mínimo 6 líneas.

**Artículo 44°:** Finiquito y término del contrato. Al término de la relación laboral, ${E} pagará al trabajador las remuneraciones, indemnizaciones y demás prestaciones adeudadas. El finiquito debe ser ratificado ante ministro de fe (Notario, Inspector del Trabajo, Oficial del Registro Civil). El pago debe realizarse dentro de los 5 días hábiles desde la separación del trabajador. Art. 163 CT. Mínimo 8 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 6: Obligaciones del Trabajador
      // ─────────────────────────────────────────
      } else if (seccion === 6) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 6 (Arts. 45-54) — TÍTULO VI: OBLIGACIONES DEL TRABAJADOR

**Artículo 45°:** Obligaciones generales de conducta. Los trabajadores de ${E} están obligados a cumplir fielmente las estipulaciones del contrato y de este reglamento. Detalla las obligaciones con literales a) hasta n) como mínimo: a) puntualidad y asistencia, b) registrar asistencia correctamente, c) informar ausencias en 24 horas, d) realizar funciones de buena fe, e) respetar órdenes del jefe directo, f) ser cortés con compañeros y clientes, g) cuidar bienes de la empresa, h) mantener orden y limpieza, i) usar racionalmente materiales, j) respetar normas internas, k) mantener el orden y limpieza de su área, l) denunciar irregularidades, m) actualizar antecedentes personales, n) colaborar con investigaciones internas. Cada literal explicado. Mínimo 16 líneas.

**Artículo 46°:** Obligaciones en materia de seguridad. Los trabajadores deberán: a) Usar correctamente los Elementos de Protección Personal asignados, b) Participar en todas las capacitaciones de seguridad programadas, c) Reportar inmediatamente al jefe directo toda condición insegura o peligrosa detectada, d) No operar maquinarias o equipos sin estar debidamente capacitado y autorizado, e) Respetar la señalización de seguridad, f) Colaborar con la investigación de accidentes e incidentes, g) No ingresar a zonas de riesgo sin autorización, h) Mantener su puesto de trabajo limpio y ordenado. Cada literal explicado. Mínimo 12 líneas.

**Artículo 47°:** Obligaciones de cuidado y conservación de bienes. Los trabajadores deberán emplear la máxima diligencia en el cuidado de maquinarias, vehículos, herramientas, equipos informáticos, materiales y demás bienes de ${E}. El daño causado por negligencia podrá ser imputado al trabajador conforme a las normas de responsabilidad civil. Deben dar aviso inmediato al jefe directo de cualquier deterioro, pérdida o descompostura. Mínimo 8 líneas.

**Artículo 48°:** Obligaciones de confidencialidad. Los trabajadores deberán mantener reserva de los antecedentes técnicos, comerciales, financieros y de cualquier otra índole que conozcan con motivo de su trabajo en ${E}. Esta obligación se extiende por 2 años después del término del contrato. La infracción constituye falta grave al contrato. Mínimo 7 líneas.

**Artículo 49°:** Comunicación obligatoria. Los trabajadores deben comunicar a ${E} dentro de los 5 días hábiles siguientes: a) Cambio de domicilio, b) Variación de cargas familiares, c) Cambio de AFP o sistema de salud, d) Cualquier circunstancia que afecte el cumplimiento de sus obligaciones laborales. Mínimo 6 líneas.

**Artículo 50°:** Obligaciones ante un accidente del trabajo. En caso de accidente, el trabajador o quien presencie el hecho debe: a) Dar aviso inmediato al jefe directo, b) Prestar primeros auxilios básicos si está capacitado, c) Trasladar al accidentado al centro asistencial de ${OA}, d) No mover ni alterar el lugar del accidente salvo por razones de seguridad, e) Completar la declaración individual de accidente del trabajo (DIAT). Mínimo 8 líneas.

**Artículo 51°:** Obligaciones de trato y convivencia. Los trabajadores deben mantener relaciones de respeto mutuo con compañeros, superiores, clientes y proveedores. Están obligados a contribuir a un ambiente laboral libre de violencia, acoso y discriminación. Cualquier conflicto debe ser reportado a RRHH para su gestión. Mínimo 6 líneas.

**Artículo 52°:** Obligaciones específicas del rubro ${R}. Detalla al menos 5-7 obligaciones técnicas o de procedimiento propias de este rubro: normas de calidad, procedimientos específicos, uso de herramientas, normas higiénicas si aplica, protocolos de atención a clientes, etc. Mínimo 8 líneas.

**Artículo 53°:** Obligaciones de capacitación. Los trabajadores deberán asistir obligatoriamente a todas las actividades de capacitación programadas por ${E}, ya sea en el contexto de la Franquicia SENCE o de capacitaciones internas. La inasistencia injustificada a una capacitación obligatoria será sancionada como incumplimiento del reglamento. Mínimo 6 líneas.

**Artículo 54°:** Uso de tecnología corporativa. Los trabajadores podrán usar los equipos informáticos, correo electrónico e internet de ${E} exclusivamente para fines laborales. El uso personal debe ser mínimo, razonable y no interferir con las labores. Los equipos corporativos no deben utilizarse para instalar software no autorizado, acceder a sitios prohibidos o realizar actividades contrarias a la ley. Mínimo 7 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 7: Prohibiciones
      // ─────────────────────────────────────────
      } else if (seccion === 7) {
        prompt = `Eres experto en legislación laboral chilena. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 7 (Arts. 55-62) — TÍTULO VII: PROHIBICIONES DEL TRABAJADOR

**Artículo 55°:** Prohibiciones en materia de conducta laboral. Se prohíbe a los trabajadores de ${E}: a) Trabajar horas extra sin autorización escrita previa del jefe directo, b) Ausentarse del puesto sin permiso durante la jornada, c) Atender asuntos personales en horas de trabajo, d) Desempeñar cargos en empresas competidoras del mismo rubro, e) Revelar información reservada de ${E} o de sus clientes, f) Dormir, comer o preparar comidas en los puestos de trabajo, g) Usar recursos de internet para actividades no laborales (redes sociales, entretenimiento, juegos), h) Utilizar vehículos o equipos de la empresa para fines personales. Lista extendida. Mínimo 14 líneas.

**Artículo 56°:** Prohibiciones en materia de seguridad. Se prohíbe: a) No usar los Elementos de Protección Personal asignados, b) Operar maquinarias o equipos sin capacitación y autorización, c) Desactivar o inutilizar sistemas de seguridad, protecciones o alarmas, d) Trabajar bajo los efectos del alcohol o drogas, e) Introducir o consumir bebidas alcohólicas en las instalaciones, f) Fumar fuera de las zonas habilitadas y señalizadas, g) Remover o alterar la señalización de seguridad, h) Realizar trabajos en altura sin los sistemas de protección correspondientes (si aplica al rubro ${R}). Mínimo 12 líneas.

**Artículo 57°:** Prohibiciones respecto a bienes de la empresa. Se prohíbe: a) Usar bienes de ${E} para beneficio propio o de terceros, b) Sacar materiales, herramientas o equipos de las instalaciones sin autorización, c) Vender, prestar o ceder los Elementos de Protección Personal asignados, d) Dañar o deteriorar intencionalmente bienes de la empresa (Art. 160 N°6 CT), e) Introducir personas no autorizadas a las instalaciones. Mínimo 10 líneas.

**Artículo 58°:** Prohibiciones en materia de control de asistencia. Se prohíbe: a) Marcar o registrar la asistencia de otro trabajador, b) Adulterar el registro de horas de llegada o salida, c) No marcar asistencia durante más de 2 días seguidos sin causa justificada. Estas conductas constituyen falta grave al contrato y pueden ser causal de despido conforme al Art. 160 N°1 CT. Mínimo 7 líneas.

**Artículo 59°:** Prohibiciones relacionadas con sustancias. Se prohíbe: a) Introducir, vender o consumir bebidas alcohólicas en dependencias de ${E}, b) Introducir, vender o consumir drogas o sustancias ilegales, c) Ingresar a trabajar en estado de intemperancia o bajo efectos de sustancias. ${E} se reserva el derecho de realizar controles aleatorios de alcohol y drogas conforme al protocolo establecido. Mínimo 8 líneas.

**Artículo 60°:** Prohibiciones de acoso y violencia. Se prohíbe toda conducta constitutiva de acoso laboral, acoso sexual o violencia en el trabajo, conforme a las definiciones establecidas en el Título XII de este reglamento (Protocolo Ley Karin). Estas conductas serán sancionadas con la máxima severidad, incluyendo el despido disciplinario. Mínimo 6 líneas.

**Artículo 61°:** Otras prohibiciones. Se prohíbe: a) Introducir armas de cualquier tipo a las instalaciones, b) Participar en juegos de azar en horas o instalaciones de trabajo, c) Realizar propaganda política o religiosa en el lugar de trabajo, d) Hacer circular peticiones, colectas o ventas sin autorización de la administración. Mínimo 7 líneas.

**Artículo 62°:** Prohibiciones específicas del rubro ${R}. Detalla al menos 4-6 prohibiciones técnicas o de procedimiento propias de este rubro: acciones que comprometan la seguridad operacional, prohibiciones higiénicas si aplica, conductas que afecten la calidad del servicio/producto, etc. Mínimo 7 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 8: Disciplina
      // ─────────────────────────────────────────
      } else if (seccion === 8) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 154-157 CT sobre sanciones; Arts. 159-163 CT sobre término del contrato. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 8 (Arts. 63-72) — TÍTULO VIII: DEL ORDEN Y LA DISCIPLINA

**Artículo 63°:** Sistema de sanciones — gradualidad. Las infracciones al presente reglamento se sancionarán en forma graduada: a) Primera vez: amonestación verbal del jefe inmediato, b) Reincidencia leve: amonestación escrita del jefe con poder de administración, con copia al expediente del trabajador, c) Reincidencia grave: amonestación escrita con copia a la Inspección del Trabajo, d) Última instancia: multa de entre el 10% y el 25% de la remuneración diaria. Art. 154 N°10 CT. Mínimo 10 líneas.

**Artículo 64°:** Multas — aplicación y destino. Las multas no podrán exceder el 25% de la remuneración diaria. Los fondos recaudados por multas serán destinados a: a) Fondo de bienestar social de los trabajadores de ${E}, o b) Incremento del fondo de capacitación. Se comunicará mensualmente al trabajador el estado de la aplicación de estos fondos. Art. 157 CT. Mínimo 8 líneas.

**Artículo 65°:** Derecho a reclamo contra sanciones. El trabajador que considere injusta una sanción podrá reclamar ante la Inspección del Trabajo dentro del tercer día hábil desde la notificación de la medida. ${E} notificará toda sanción por escrito con expresión de causa y permitirá al trabajador exponer sus descargos previos a la aplicación de multas. Mínimo 7 líneas.

**Artículo 66°:** Causales de terminación sin derecho a indemnización — Art. 160 CT. El contrato termina sin derecho a indemnización cuando el empleador invoca alguna de las siguientes causales debidamente comprobadas: 1) Falta de probidad, conductas de acoso sexual o laboral, vías de hecho, injurias, conducta inmoral; 2) Negociaciones prohibidas en el contrato; 3) Inasistencias injustificadas (2 días seguidos, 2 lunes en el mes, o 3 días en el mes); 4) Abandono del trabajo; 5) Actos u omisiones que afecten la seguridad; 6) Daño material intencional; 7) Incumplimiento grave de las obligaciones del contrato. Cada causal explicada con ejemplos para el rubro ${R}. Mínimo 16 líneas.

**Artículo 67°:** Causal de necesidades de la empresa — Art. 161 CT. El empleador podrá poner término al contrato invocando necesidades de la empresa (racionalización, modernización, bajas de productividad, cambios de mercado). Requiere dar aviso con 30 días de anticipación o pagar la remuneración correspondiente a ese período. El trabajador tiene derecho a indemnización por años de servicio. Mínimo 8 líneas.

**Artículo 68°:** Otras causales de terminación — Art. 159 CT. El contrato termina por: a) Mutuo acuerdo, b) Renuncia voluntaria (30 días de anticipación), c) Muerte del trabajador, d) Vencimiento del plazo convenido, e) Conclusión del trabajo o servicio que dio origen al contrato, f) Caso fortuito o fuerza mayor. Cada causal explicada. Mínimo 8 líneas.

**Artículo 69°:** Finiquito y certificado de trabajo. Al término del contrato, ${E} otorgará al trabajador un finiquito que exprese el estado de las obligaciones de las partes. Asimismo, si el trabajador lo solicita, se emitirá un certificado de trabajo que señale: fecha de ingreso, fecha de retiro y cargo desempeñado. Art. 162 CT. Mínimo 7 líneas.

**Artículo 70°:** Procedimiento interno de peticiones y reclamos. Los trabajadores podrán presentar reclamos o peticiones por escrito a la Gerencia de ${E}. La empresa responderá dentro de los 5 días hábiles siguientes. Las peticiones colectivas se transmitirán por medio del sindicato o, en su ausencia, por una delegación de hasta 5 trabajadores. Mínimo 7 líneas.

**Artículo 71°:** Investigación disciplinaria interna. Ante una denuncia de falta grave, ${E} podrá iniciar una investigación interna. El trabajador investigado tendrá derecho a conocer los cargos y a presentar sus descargos. La investigación deberá resolverse en un plazo máximo de 15 días hábiles. Mínimo 6 líneas.

**Artículo 72°:** Relaciones laborales armónicas. ${E} promueve activamente relaciones laborales basadas en el respeto mutuo, la comunicación directa y la resolución dialogada de conflictos. La empresa ofrecerá instancias de mediación interna cuando la situación así lo amerite. Mínimo 5 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 9: Higiene y Seguridad parte 1
      // ─────────────────────────────────────────
      } else if (seccion === 9) {
        prompt = `Eres experto en legislación laboral chilena. Ley 16.744, DS 44/2023 (reemplaza DS 40 y DS 54), Art. 184 CT (deber de protección). ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 9 (Arts. 73-82) — TÍTULO IX: HIGIENE Y SEGURIDAD EN EL TRABAJO (Parte 1)

**Artículo 73°:** Marco normativo de seguridad. La gestión de seguridad y salud en el trabajo de ${E} se rige por: Ley N°16.744 (accidentes del trabajo y enfermedades profesionales), DS N°44/2023 (Reglamento de Seguridad y Salud Ocupacional, que reemplaza los DS N°40 y DS N°54), Ley N°21.012 (garantía del derecho a la seguridad), Art. 184 del Código del Trabajo (deber de protección del empleador). Mínimo 8 líneas.

**Artículo 74°:** Obligaciones del empleador en seguridad. ${E} está obligada a: a) Tomar las medidas necesarias para proteger eficazmente la vida y salud de los trabajadores, b) Mantener las condiciones adecuadas de higiene y seguridad en el trabajo, c) Proporcionar los EPP necesarios sin costo para el trabajador, d) Implementar el Programa de Prevención de Riesgos, e) Mantener actualizada la matriz de identificación de peligros y evaluación de riesgos (IPER), f) Asegurar la capacitación continua en seguridad, g) Investigar todo accidente ocurrido. Art. 184 CT y DS 44/2023. Mínimo 10 líneas.

**Artículo 75°:** Obligaciones del trabajador en seguridad. Los trabajadores están obligados a: a) Usar correctamente los EPP asignados en todo momento que las condiciones de trabajo lo requieran, b) Participar en todas las capacitaciones de seguridad, c) Reportar inmediatamente al jefe directo toda condición insegura, incidente o accidente, d) No realizar trabajos para los que no ha sido capacitado y autorizado, e) Respetar la señalización de seguridad, f) Mantener limpio y ordenado su puesto de trabajo, g) Colaborar con el CPHS y con las investigaciones de accidentes. Mínimo 10 líneas.

**Artículo 76°:** Identificación y control de riesgos. ${E} mantiene una Matriz de Identificación de Peligros y Evaluación de Riesgos (IPER) actualizada para todas las tareas del rubro ${R}. Los principales riesgos identificados y sus medidas de control son: [lista los 5-7 principales riesgos del rubro ${R} con su medida de control: eliminación, sustitución, control de ingeniería, control administrativo, EPP]. El CPHS participará en la revisión anual de esta matriz. Mínimo 12 líneas.

**Artículo 77°:** Elementos de Protección Personal (EPP). ${E} proporcionará gratuitamente a todos los trabajadores que lo requieran los siguientes EPP según su cargo y las tareas del rubro ${R}: [lista los EPP obligatorios para este rubro: casco, guantes, calzado de seguridad, lentes, protector auditivo, ropa de trabajo, arnés si aplica, etc.]. Los EPP deben usarse en todo momento durante la realización de las tareas que los requieran. Está prohibido prestar o vender los EPP. ${E} los repondrá cuando estén deteriorados. Mínimo 12 líneas.

**Artículo 78°:** Señalización de seguridad. ${E} mantendrá señalización visible en todas las áreas de trabajo indicando: zonas de riesgo, vías de evacuación, ubicación de extintores, botiquines de primeros auxilios, puntos de encuentro y cualquier otra señal exigida por la normativa. Los trabajadores están obligados a respetar y no remover la señalización. Mínimo 7 líneas.

**Artículo 79°:** Orden, limpieza y condiciones del ambiente de trabajo. Cada trabajador es responsable del orden y limpieza de su puesto. Los pasillos, escaleras y vías de evacuación deben mantenerse siempre despejados. Las materias primas, productos y herramientas deben almacenarse en sus lugares designados. ${E} realizará inspecciones periódicas de orden y limpieza. Mínimo 7 líneas.

**Artículo 80°:** Comité Paritario de Higiene y Seguridad (CPHS). Las empresas con 25 o más trabajadores están obligadas a constituir un CPHS compuesto por 3 representantes del empleador y 3 de los trabajadores. Sus funciones principales son: asesorar e instruir sobre prevención, vigilar el cumplimiento de las medidas de prevención, investigar accidentes, y recomendar medidas correctivas. Se reunirá mensualmente. DS N°54/1969, DS N°44/2023. Mínimo 10 líneas.

**Artículo 81°:** Departamento de Prevención de Riesgos. Las empresas con 100 o más trabajadores deben contar con un Departamento de Prevención de Riesgos a cargo de un experto en prevención. Sus funciones incluyen: planificar y ejecutar el Programa de Prevención, asesorar al CPHS, registrar accidentabilidad, y coordinar con ${OA}. Mínimo 7 líneas.

**Artículo 82°:** Política de alcohol y drogas — Tolerancia cero. ${E} implementa una política de tolerancia cero respecto al consumo de alcohol y drogas. Los trabajadores no podrán presentarse a trabajar ni permanecer en el trabajo bajo los efectos de estas sustancias. ${E} podrá realizar controles aleatorios mediante test de alcoholemia o toxicológicos. Un resultado positivo constituye falta grave al contrato. Mínimo 8 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 10: Higiene y Seguridad parte 2
      // ─────────────────────────────────────────
      } else if (seccion === 10) {
        prompt = `Eres experto en legislación laboral chilena. DS 44/2023, Ley 16.744, normativa de prevención de incendios. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 10 (Arts. 83-90) — TÍTULO X: HIGIENE Y SEGURIDAD (Parte 2): PREVENCIÓN, CAPACITACIÓN Y RIESGOS ESPECÍFICOS

**Artículo 83°:** Prevención de incendios. ${E} mantendrá extintores en buen estado y con carga vigente en todas las áreas de trabajo, conforme a la normativa. Todos los trabajadores deben conocer la ubicación de los extintores y las rutas de evacuación. Se realizarán simulacros de evacuación al menos una vez al año. Se conformará una brigada de emergencia capacitada. Procedimiento de evacuación: señal de alarma, dejar lo que se está haciendo, evacuar por las vías señalizadas, reunirse en el punto de encuentro designado. Mínimo 10 líneas.

**Artículo 84°:** Primeros auxilios. ${E} mantendrá botiquines de primeros auxilios completamente abastecidos en las instalaciones. Al menos un trabajador por turno debe estar certificado en primeros auxilios básicos. Ante un accidente: a) Conservar la calma, b) Llamar al número de emergencia interno, c) No mover al accidentado si no es necesario, d) Aplicar primeros auxilios básicos si se está capacitado, e) Coordinar traslado a ${OA}. Mínimo 8 líneas.

**Artículo 85°:** Higiene industrial — Condiciones ambientales. ${E} controlará que las condiciones de trabajo cumplan con los límites permisibles de: a) Iluminación (según la tarea), b) Ruido (límite de 85 dB TWA para jornada de 8 horas), c) Temperatura (entre 10°C y 30°C en trabajos sedentarios), d) Ventilación (renovación de aire suficiente), e) Ergonomía (diseño adecuado del puesto de trabajo). Las mediciones se realizarán según lo exija ${OA} o la Inspección del Trabajo. Mínimo 10 líneas.

**Artículo 86°:** Capacitaciones obligatorias en seguridad. ${E} programará las siguientes capacitaciones: a) Inducción de seguridad al ingreso (obligatoria antes del inicio de labores), b) Capacitación anual en prevención de riesgos propios del rubro ${R}, c) Uso y mantención de EPP, d) Primeros auxilios (para personal designado), e) Uso de extintores y evacuación, f) Capacitaciones específicas exigidas por ${OA}. Toda capacitación quedará registrada con lista de asistencia y evaluación. Mínimo 10 líneas.

**Artículo 87°:** Riesgos específicos del rubro ${R} — Identificación. Los principales riesgos inherentes a las actividades de ${E} en el rubro ${R} son: [identifica y desarrolla 6-8 riesgos específicos de este rubro, con descripción del riesgo, situación en que ocurre, y medida preventiva principal]. Esta identificación se actualiza anualmente por el CPHS. Mínimo 14 líneas.

**Artículo 88°:** Procedimientos de trabajo seguro. Para las tareas de mayor riesgo en el rubro ${R}, ${E} dispone de Procedimientos de Trabajo Seguro (PTS) documentados, que los trabajadores deben conocer y aplicar. Los PTS contemplan: análisis de riesgos de la tarea, pasos seguros, EPP requerido, medidas de control, y qué hacer en caso de emergencia. Mínimo 7 líneas.

**Artículo 89°:** Inspecciones de seguridad. El CPHS y la administración de ${E} realizarán inspecciones periódicas de las instalaciones y puestos de trabajo. Las no conformidades detectadas deberán ser subsanadas en los plazos establecidos. La Inspección del Trabajo, la SEREMI de Salud y ${OA} tienen derecho a ingresar a las instalaciones para fiscalizar el cumplimiento de la normativa. Mínimo 7 líneas.

**Artículo 90°:** Derecho a saber. Los trabajadores tienen derecho a conocer: a) Los riesgos de su puesto de trabajo y las medidas preventivas, b) Las sustancias y materiales peligrosos que manejan y sus hojas de datos de seguridad (HDS), c) Los EPP que deben usar, d) Los procedimientos de emergencia. ${E} garantiza que esta información esté disponible y sea entregada al ingreso. Art. 21 DS 44/2023. Mínimo 7 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 11: Accidentes del Trabajo
      // ─────────────────────────────────────────
      } else if (seccion === 11) {
        prompt = `Eres experto en legislación laboral chilena. Ley 16.744 accidentes del trabajo; DS 44/2023 investigación de accidentes. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 11 (Arts. 91-100) — TÍTULO XI: ACCIDENTES DEL TRABAJO Y ENFERMEDADES PROFESIONALES

**Artículo 91°:** Definiciones legales. Accidente del trabajo: toda lesión que sufra un trabajador a causa o con ocasión del trabajo, y que le produzca incapacidad o muerte (Art. 5° Ley 16.744). Accidente de trayecto: el ocurrido en el trayecto directo entre la habitación y el lugar de trabajo o viceversa. Enfermedad profesional: la causada de manera directa por el ejercicio de la profesión o trabajo. Mínimo 10 líneas.

**Artículo 92°:** Procedimiento inmediato ante un accidente. Ante cualquier accidente, sea grave o leve: a) Conservar la calma y evaluar la situación, b) Dar aviso inmediato al jefe directo y/o supervisor de turno, c) Llamar al número de emergencia interno de ${E}, d) Aplicar primeros auxilios básicos si se está capacitado y es seguro hacerlo, e) No mover al accidentado si hay sospecha de lesiones en la columna, f) Coordinar traslado inmediato al centro asistencial de ${OA}, g) Preservar el lugar del accidente para la investigación. Mínimo 12 líneas.

**Artículo 93°:** Denuncia individual de accidente del trabajo (DIAT). Todo accidente del trabajo, sea o no grave, debe ser denunciado a ${OA} dentro de las 24 horas de ocurrido mediante la DIAT. Puede ser llenada por el trabajador, el empleador o el médico que presta la primera atención. ${E} llevará un registro de todos los accidentes y la documentación correspondiente. Mínimo 8 líneas.

**Artículo 94°:** Accidente de trayecto — procedimiento especial. Para que el accidente de trayecto sea cubierto por el seguro de la Ley 16.744, debe ocurrir en el trayecto directo entre el domicilio y el trabajo (o viceversa). Debe acreditarse con parte policial, certificado médico de urgencia, declaración jurada u otros medios. Plazo para presentar la denuncia: dentro de las 24 horas. Mínimo 7 líneas.

**Artículo 95°:** Investigación de accidentes. Todo accidente del trabajo debe ser investigado por el CPHS o, en su ausencia, por el empleador, dentro de las 24-48 horas de ocurrido. La investigación debe determinar: causas inmediatas, causas básicas y causas raíz. El informe debe contener las medidas correctivas para evitar la repetición. DS N°44/2023. Mínimo 10 líneas.

**Artículo 96°:** Accidentes graves y fatales — protocolo especial. En caso de accidente grave (con riesgo vital, amputación, politraumatismo) o fatal: a) Llamar inmediatamente a los servicios de emergencia (132 o 131), b) Notificar a la Inspección del Trabajo y a la SEREMI de Salud dentro de las 24 horas, c) Suspender las faenas en el área del accidente hasta que la autoridad lo autorice, d) Cooperar plenamente con la investigación de los organismos fiscalizadores. Mínimo 10 líneas.

**Artículo 97°:** Enfermedades profesionales. Las enfermedades originadas por las condiciones de trabajo deben ser denunciadas ante ${OA} mediante la DIEP (Denuncia Individual de Enfermedad Profesional). ${E} realizará vigilancia periódica de la salud de los trabajadores expuestos a riesgos de enfermedades profesionales propias del rubro ${R}. Mínimo 7 líneas.

**Artículo 98°:** Prestaciones médicas y económicas. Los trabajadores accidentados o que contraigan enfermedad profesional tienen derecho a: a) Atención médica, quirúrgica, dental y hospitalaria gratuita en ${OA}, b) Medicamentos y prótesis, c) Rehabilitación, d) Subsidio por incapacidad temporal (100% de la remuneración), e) Indemnización o pensión por incapacidad permanente. Ley N°16.744. Mínimo 10 líneas.

**Artículo 99°:** Estadísticas de accidentabilidad. ${E} calculará y registrará mensualmente: a) Tasa de frecuencia (N° de accidentes × 1.000.000 / horas hombre trabajadas), b) Tasa de gravedad (días perdidos × 1.000.000 / horas hombre trabajadas), c) Tasa de accidentabilidad. Estos datos se reportan al CPHS mensualmente y se remiten a ${OA} según sus requerimientos. Mínimo 7 líneas.

**Artículo 100°:** Rehabilitación y reincorporación. ${E} apoyará activamente el proceso de rehabilitación de los trabajadores accidentados, coordinando con ${OA} los tratamientos necesarios. La reincorporación al trabajo se hará de manera gradual, adecuando el puesto de trabajo si es necesario, respetando las restricciones médicas indicadas. Mínimo 6 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 12: Ley Karin — parte 1
      // ─────────────────────────────────────────
      } else if (seccion === 12) {
        prompt = `Eres experto en legislación laboral chilena. Ley N°21.643 (Ley Karin) vigente desde agosto 2024: Arts. 2°, 211-A al 211-I del Código del Trabajo. DS N°2/2024 Ministerio del Trabajo. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 12 (Arts. 101-107) — TÍTULO XII: PROTOCOLO LEY KARIN (Parte 1)

## TÍTULO XII: PROTOCOLO DE PREVENCIÓN DEL ACOSO LABORAL, ACOSO SEXUAL Y VIOLENCIA EN EL TRABAJO (Ley N°21.643 — Ley Karin)

**Artículo 101°:** Fundamento legal y objetivo. La Ley N°21.643 (Ley Karin), vigente desde el 1° de agosto de 2024, modificó el Código del Trabajo incorporando los artículos 211-A al 211-I. Esta ley exige a todo empleador implementar un Protocolo de Prevención del acoso laboral, sexual y la violencia en el trabajo, con perspectiva de género. ${E} se compromete a crear y mantener un entorno laboral libre de toda forma de violencia. Mínimo 10 líneas.

**Artículo 102°:** Ámbito de aplicación. Este protocolo aplica a: a) Todos los trabajadores/as de ${E} sin excepción de cargo o jerarquía, incluyendo gerentes, directores y supervisores, b) Trabajadores de empresas contratistas y subcontratistas que desarrollen labores en instalaciones de ${E}, c) Proveedores, clientes, visitas y alumnos en práctica que concurran a las dependencias de ${E}. Mínimo 7 líneas.

**Artículo 103°:** Definición de acoso sexual. Es aquella conducta en que una persona realiza, en forma indebida, por cualquier medio, requerimientos de carácter sexual no consentidos por quien los recibe, y que amenacen o perjudiquen su situación laboral. Incluye: insinuaciones sexuales verbales o escritas, contacto físico no deseado, solicitud de favores sexuales, envío de material sexual digital, acercamientos físicos indebidos, comentarios de naturaleza sexual. La característica esencial es que NO es deseada por quien la recibe. Art. 2° CT. Mínimo 12 líneas.

**Artículo 104°:** Definición de acoso laboral. Toda conducta que constituya agresión u hostigamiento ejercida por el empleador o uno o más trabajadores en contra de otro u otros trabajadores, por cualquier medio, ya sea que se manifieste una sola vez o de manera reiterada, y que tenga como resultado el menoscabo, maltrato o humillación, o bien amenace o perjudique su situación laboral. Incluye: aislamiento, humillación pública, asignación de tareas degradantes, sobrecarga excesiva, exclusión sistemática, críticas destructivas. Art. 2° CT. Mínimo 12 líneas.

**Artículo 105°:** Violencia en el trabajo por terceros. Son conductas de violencia en el trabajo las que afectan a las trabajadoras y trabajadores de ${E} con ocasión de la prestación de servicios, ejercidas por clientes, proveedores, usuarios o visitas. Incluye: agresiones verbales (gritos, insultos, amenazas), agresiones físicas, conductas intimidatorias, acoso por parte de clientes, robos o asaltos. ${E} adoptará medidas para proteger a los trabajadores expuestos. Mínimo 8 líneas.

**Artículo 106°:** Principios que rigen el protocolo. La gestión de denuncias de acoso y violencia en ${E} se regirá por los siguientes principios: a) Confidencialidad — todos los antecedentes de la investigación son reservados, b) No represalia — quien denuncia de buena fe está protegido de cualquier represalia, c) Perspectiva de género — se considerarán las relaciones de poder y desigualdades de género, d) Presunción de buena fe — toda denuncia se recibirá y tramitará de buena fe, e) Imparcialidad — el investigador no tendrá conflicto de interés, f) Celeridad — plazos estrictos que se cumplirán. Mínimo 10 líneas.

**Artículo 107°:** Canal de denuncia. Los trabajadores/as que sean víctimas o testigos de acoso laboral, sexual o violencia en el trabajo podrán realizar la denuncia por los siguientes medios: a) Correo electrónico designado: ${P} (Rafael: completar con el correo real del encargado), b) Formulario físico disponible en Recursos Humanos de ${E}, c) Denuncia verbal ante el/la encargado/a designado/a de ${E}, d) Directamente ante la Inspección del Trabajo competente. La denuncia podrá ser anónima cuando así se requiera por razones de seguridad. Mínimo 10 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 13: Ley Karin — parte 2
      // ─────────────────────────────────────────
      } else if (seccion === 13) {
        prompt = `Eres experto en legislación laboral chilena. Ley 21.643 Arts. 211-A al 211-I CT; plazos: investigación interna máximo 30 días hábiles; medidas de resguardo inmediatas obligatorias. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 13 (Arts. 108-114) — TÍTULO XII: PROTOCOLO LEY KARIN (Parte 2)

**Artículo 108°:** Procedimiento de denuncia. La denuncia debe contener: a) Nombre, apellidos y RUT del denunciante y del denunciado, b) Descripción detallada de los hechos (fecha, lugar, testigos si los hay), c) Relación laboral entre las partes, d) Firma o verificación de identidad. ${E} emitirá una constancia escrita de recepción con fecha y hora. Dentro de los 5 días hábiles siguientes, el empleador debe iniciar la investigación. El denunciante puede optar por derivar directamente a la Inspección del Trabajo. Mínimo 10 líneas.

**Artículo 109°:** Medidas de resguardo inmediatas. Una vez recibida la denuncia, y sin perjuicio de la investigación, ${E} adoptará de manera inmediata medidas de resguardo para proteger a la presunta víctima: a) Separación de espacios físicos entre denunciante y denunciado, b) Redistribución de la jornada de trabajo, c) Modalidad de trabajo remoto temporal, d) Derivación a atención psicológica a través de ${OA}, e) Cualquier otra medida que resguarde la dignidad y seguridad de la víctima. Estas medidas no implican prejuzgamiento. Mínimo 10 líneas.

**Artículo 110°:** Procedimiento de investigación interna. La investigación interna deberá: a) Ser conducida por una persona imparcial, sin conflicto de interés, debidamente capacitada, b) Notificar al trabajador investigado los cargos en su contra y darle oportunidad de presentar descargos, c) Citar a audiencias a denunciante, denunciado y testigos, d) Analizar todas las pruebas aportadas, e) Emitir un informe final con conclusiones fundadas y propuesta de medidas, f) Todo dentro de un plazo máximo de 30 días hábiles desde el inicio de la investigación. Arts. 211-A al 211-I CT. Mínimo 14 líneas.

**Artículo 111°:** Investigación por la Inspección del Trabajo. El denunciante puede optar por que la investigación sea realizada directamente por la Inspección del Trabajo. En este caso: a) ${E} debe cooperar plenamente con los funcionarios fiscalizadores, b) Proporcionar toda la documentación y acceso que se requiera, c) Adoptar las medidas que la Inspección ordene en su informe, d) El plazo de investigación es de 30 días hábiles. Mínimo 8 líneas.

**Artículo 112°:** Sanciones aplicables. Según la gravedad de los hechos establecidos en la investigación, se aplicarán las siguientes medidas: a) Amonestación verbal, b) Amonestación escrita, c) Multa de hasta el 25% de la remuneración diaria, d) Traslado de área o función, e) Término del contrato de trabajo sin derecho a indemnización, conforme al Art. 160 N°1 letras b) (acoso sexual) y f) (acoso laboral) del Código del Trabajo. Las represalias contra quien denuncia de buena fe también serán sancionadas. Mínimo 10 líneas.

**Artículo 113°:** Capacitación y difusión anual. ${E} realizará al menos una capacitación anual sobre prevención del acoso laboral, sexual y violencia en el trabajo, dirigida a todos los trabajadores/as. El contenido mínimo es: definiciones legales, conductas prohibidas, canal de denuncia, procedimiento de investigación y sanciones. La capacitación quedará registrada con lista de asistencia y evaluación. El CPHS supervisará el cumplimiento. Mínimo 8 líneas.

**Artículo 114°:** Conductas que NO constituyen acoso. No se consideran acoso laboral o sexual las siguientes conductas, siempre que se ejerzan de manera razonable y dentro del marco legal: a) Evaluaciones de desempeño realizadas en forma objetiva, b) Instrucciones o cambios en las asignaciones de trabajo, c) Llamados de atención o medidas disciplinarias ajustadas a derecho, d) Cambios organizativos o restructuraciones, e) Ejercicio legítimo de las facultades directivas del empleador. La calificación de cada situación dependerá del contexto y de los hechos concretos. Mínimo 8 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 14: TEMER + ISTAS21 + Cargas
      // ─────────────────────────────────────────
      } else if (seccion === 14) {
        prompt = `Eres experto en legislación laboral chilena. Protocolo TEMER SUSESO; Protocolo ISTAS21 SUSESO; Ley 20.001 y DS 63/2005 manejo manual de cargas. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 14 (Arts. 115-128) — TÍTULO XIII: TEMER, RIESGO PSICOSOCIAL Y MANEJO DE CARGAS

## TRASTORNOS MUSCULOESQUELÉTICOS (TEMER)

**Artículo 115°:** Marco legal TEMER. El Protocolo de Vigilancia de Trastornos Musculoesqueléticos de Extremidades Superiores (TEMER) del Ministerio de Salud/SUSESO es obligatorio para empresas del rubro ${R}. Su objetivo es prevenir las lesiones musculoesqueléticas derivadas del trabajo repetitivo, posturas forzadas y uso de fuerza excesiva. Mínimo 7 líneas.

**Artículo 116°:** Factores de riesgo y evaluación. Los principales factores de riesgo musculoesquelético en ${E} son: trabajo repetitivo, posturas forzadas, aplicación de fuerza, exposición a vibración, frío y presión mecánica directa. La evaluación se realiza mediante metodologías validadas (RULA, OCRA u otras aprobadas por SUSESO), con periodicidad anual o cuando cambien las condiciones de trabajo. Mínimo 8 líneas.

**Artículo 117°:** Medidas preventivas TEMER. Las principales medidas son: a) Rotación de puestos de trabajo, b) Pausas activas obligatorias (mínimo 2 veces por jornada, 10 minutos cada una), c) Rediseño ergonómico de puestos, d) Herramientas adecuadas al tamaño y fuerza del trabajador, e) Capacitación en técnicas de trabajo que reduzcan la carga musculoesquelética. Mínimo 8 líneas.

**Artículo 118°:** Vigilancia médica y seguimiento. Los trabajadores expuestos a factores de riesgo musculoesquelético deberán someterse a exámenes médicos periódicos coordinados con ${OA}. Los casos detectados recibirán atención oportuna y se realizarán adaptaciones del puesto de trabajo. El CPHS supervisará el cumplimiento del programa TEMER. Mínimo 7 líneas.

## FACTORES DE RIESGO PSICOSOCIAL (ISTAS21)

**Artículo 119°:** Marco legal ISTAS21. El Protocolo de Vigilancia de Riesgos Psicosociales en el Trabajo (SUSESO/ISTAS21) es obligatorio para empresas con 10 o más trabajadores, conforme al DS N°44/2023. Identifica y evalúa los factores de riesgo psicosocial presentes en el trabajo. Mínimo 7 líneas.

**Artículo 120°:** Dimensiones del riesgo psicosocial. El instrumento ISTAS21 evalúa las siguientes dimensiones: a) Exigencias psicológicas (carga cuantitativa y emocional), b) Trabajo activo y posibilidades de desarrollo, c) Apoyo social y calidad del liderazgo, d) Compensaciones (reconocimiento y seguridad), e) Doble presencia (trabajo y vida familiar). En ${E} se identifican como dimensiones de mayor riesgo: [mencionar 2-3 dimensiones relevantes para el rubro ${R}]. Mínimo 10 líneas.

**Artículo 121°:** Aplicación del cuestionario y medidas. ${E} aplicará el cuestionario SUSESO/ISTAS21 (versión breve o completa según corresponda) al menos cada 2 años, de manera anónima y confidencial. Los resultados se analizarán por área y se implementarán planes de acción según el nivel de riesgo detectado (bajo, medio o alto). El CPHS participará en el análisis y seguimiento. Mínimo 8 líneas.

## MANEJO MANUAL DE CARGAS

**Artículo 122°:** Marco legal. La Ley N°20.001 y su reglamento DS N°63/2005 regulan el peso máximo de carga humana en el trabajo. Su objetivo es proteger la salud musculoesquelética de los trabajadores y prevenir accidentes por sobreesfuerzo. Mínimo 6 líneas.

**Artículo 123°:** Límites de peso. Los pesos máximos permitidos para manejo manual son: a) Trabajadores hombres: 25 kg en condiciones ideales (se reduce con distancia, altura, frecuencia u otros factores), b) Trabajadoras mujeres y trabajadores menores de 18 o mayores de 55 años: 20 kg, c) Trabajadoras embarazadas o en período de lactancia: máximo 5 kg. Cuando las condiciones de trabajo son distintas a las ideales, los límites se reducen según la metodología NIOSH. Mínimo 8 líneas.

**Artículo 124°:** Técnica correcta de levantamiento. Al manejar cargas manualmente, los trabajadores deben: a) Evaluar el peso antes de levantar, b) Ubicarse cerca de la carga con los pies separados al ancho de los hombros, c) Doblar las rodillas manteniendo la espalda recta, d) Tomar la carga firmemente con ambas manos, e) Levantarla usando la fuerza de las piernas, no de la espalda, f) Evitar girar el torso mientras se carga, g) Pedir ayuda o usar medios mecánicos para cargas que superen los límites. Mínimo 10 líneas.

**Artículo 125°:** Medidas de control y restricciones especiales. ${E} dispondrá de medios mecánicos (carros, grúas, cintas transportadoras) para el manejo de cargas que superen los límites legales. Para las trabajadoras embarazadas o en lactancia, está prohibido el manejo de cargas superiores a 5 kg y el trabajo en equipo es obligatorio para cualquier carga que requiera esfuerzo. Mínimo 7 líneas.

**Artículo 126°:** Capacitación en manejo de cargas. ${E} capacitará anualmente a los trabajadores expuestos en: técnica correcta de levantamiento, identificación de factores de riesgo, uso de medios mecánicos disponibles, y reconocimiento de síntomas de sobreesfuerzo. La capacitación incluirá ejercicios prácticos y evaluación. Mínimo 6 líneas.

**Artículo 127°:** Pausas y recuperación. Los trabajadores que realicen manejo manual de cargas de manera frecuente tendrán pausas de recuperación adicionales según la carga y frecuencia de la tarea, conforme a las tablas del DS N°63/2005. Mínimo 5 líneas.

**Artículo 128°:** Seguimiento y vigilancia. El CPHS revisará periódicamente el cumplimiento de las normas de manejo de cargas. Los casos de lesiones por sobreesfuerzo se investigarán como accidentes del trabajo y se adoptarán medidas correctivas. Mínimo 5 líneas.`;

      // ─────────────────────────────────────────
      // SECCIÓN 14 (última): Maternidad + Datos + Cierre
      // ─────────────────────────────────────────
      } else if (seccion === 15) {
        prompt = `Eres experto en legislación laboral chilena. Arts. 194-208 CT maternidad; Ley 21.719 protección datos personales; Art. 156 CT vigencia del reglamento. ${reglas}

EMPRESA: ${ctx}

Genera la SECCIÓN 15 FINAL (Arts. 129-142):

## TÍTULO XIV: PROTECCIÓN DE LA MATERNIDAD Y PATERNIDAD

**Artículo 129°:** Marco legal. La protección de la maternidad y paternidad en ${E} se rige por los artículos 194 al 208 del Código del Trabajo, la Ley N°20.545 (posnatal parental) y sus modificaciones. Mínimo 6 líneas.

**Artículo 130°:** Fuero maternal y paternal. La trabajadora embarazada goza de fuero desde el inicio del embarazo hasta 1 año después de expirado el descanso de maternidad. El despido requiere autorización judicial (desafuero). Este fuero se extiende a trabajadores y trabajadoras que adopten un menor conforme a la Ley N°19.620. Mínimo 7 líneas.

**Artículo 131°:** Descansos de maternidad. La trabajadora tiene derecho a un descanso prenatal de 6 semanas antes del parto y posnatal de 12 semanas después, con goce de subsidio equivalente al 100% de la remuneración. Adicionalmente, dispone de posnatal parental de 12 semanas (transferibles en parte al padre). Art. 195-197 CT. Mínimo 8 líneas.

**Artículo 132°:** Permiso de paternidad. El padre trabajador tiene derecho a un permiso pagado de 5 días en caso de nacimiento o adopción de un hijo, que puede usar desde el parto (días corridos) o distribuir dentro del primer mes. Este derecho es irrenunciable. Art. 195 CT. Mínimo 6 líneas.

**Artículo 133°:** Sala cuna y amamantamiento. ${E} tiene obligación de sala cuna cuando emplea 20 o más trabajadoras. Toda trabajadora tiene derecho a una hora diaria de amamantamiento hasta que su hijo cumpla 2 años, fraccionable en dos períodos, sin descuento de remuneración ni del feriado. Art. 203-206 CT. Mínimo 7 líneas.

**Artículo 134°:** Trabajo peligroso o nocturno durante el embarazo. Las trabajadoras embarazadas o en período de lactancia no podrán realizar trabajos que requieran esfuerzo físico considerable ni trabajos nocturnos. ${E} las trasladará a un trabajo compatible con su estado, conservando la misma remuneración. Art. 202 CT. Mínimo 6 líneas.

**Artículo 135°:** Permiso por enfermedad grave del hijo menor de 1 año. Cuando la salud de un hijo menor de 1 año requiera atención en el hogar por enfermedad grave, la trabajadora (o el padre en ciertos casos) tendrá derecho a licencia médica con subsidio. Art. 199 CT. Mínimo 6 líneas.

## TÍTULO XV: PROTECCIÓN DE DATOS PERSONALES (Ley N°21.719)

**Artículo 136°:** Marco legal. La Ley N°21.719 de Protección de Datos Personales establece obligaciones para ${E} respecto al tratamiento de datos personales de sus trabajadores. Mínimo 6 líneas.

**Artículo 137°:** Datos que trata ${E}. ${E} trata los siguientes datos de sus trabajadores: a) Datos de identificación (RUT, nombre, domicilio, fecha de nacimiento), b) Datos laborales (cargo, remuneración, asistencia, evaluaciones), c) Datos de salud (licencias médicas, exámenes preocupacionales — solo para fines laborales), d) Datos financieros (cuenta bancaria para pago de remuneraciones), e) Imágenes de sistemas de videovigilancia. La finalidad de cada tratamiento es exclusivamente laboral o de seguridad. Mínimo 8 líneas.

**Artículo 138°:** Derechos del trabajador sobre sus datos. Los trabajadores tienen derecho a: a) Acceso — conocer qué datos tiene ${E} sobre ellos, b) Rectificación — corregir datos erróneos, c) Cancelación — solicitar la eliminación de datos que ya no sean necesarios, d) Oposición — oponerse al tratamiento en ciertos casos. Para ejercer estos derechos, el trabajador debe dirigirse a ${P} (Rafael: completar con el encargado de datos de la empresa). Plazo de respuesta: 15 días hábiles. Mínimo 8 líneas.

**Artículo 139°:** Seguridad y confidencialidad. ${E} adoptará las medidas técnicas y organizativas necesarias para proteger los datos personales de sus trabajadores contra acceso no autorizado, pérdida, destrucción o alteración. El personal con acceso a datos personales está obligado al deber de confidencialidad. La violación de datos debe comunicarse a la autoridad competente. Mínimo 7 líneas.

## TÍTULO XVI: DISPOSICIONES FINALES

**Artículo 140°:** Vigencia del reglamento. El presente Reglamento Interno entrará en vigencia 30 días después de ser puesto en conocimiento de los trabajadores, salvo que la Inspección del Trabajo formule objeciones fundadas dentro de ese plazo. Art. 156 CT. Mínimo 6 líneas.

**Artículo 141°:** Difusión y entrega. ${E} entregará una copia física o digital de este reglamento a cada trabajador al momento del ingreso. El trabajador firmará un cargo de recepción. El reglamento estará disponible permanentemente en carteleras de la empresa y en la plataforma digital interna. Mínimo 5 líneas.

**Artículo 142°:** Normativa supletoria y declaración de vigencia. En todo lo no previsto en este reglamento, se aplicarán las disposiciones del Código del Trabajo, sus reglamentos y la normativa de la Dirección del Trabajo. El presente Reglamento fue elaborado conforme al Art. 153 y siguientes del Código del Trabajo.

---

## NORMATIVA DE REFERENCIA
| N° | Norma | Materia | Año |
|----|-------|---------|-----|
| 1 | Código del Trabajo DFL N°1/2003 | Marco general laboral | 2003 |
| 2 | Ley N°16.744 | Accidentes del trabajo y EEPP | 1968 |
| 3 | DS N°44/2023 | Seguridad y Salud Ocupacional (reemplaza DS 40 y DS 54) | 2023 |
| 4 | Ley N°21.643 (Ley Karin) | Prevención acoso laboral y sexual | 2024 |
| 5 | Ley N°21.719 | Protección de datos personales | 2022 |
| 6 | Ley N°21.561 | Reducción jornada laboral | 2024 |
| 7 | Ley N°20.001 | Manejo manual de cargas | 2005 |
| 8 | DS N°63/2005 | Reglamento manejo de cargas | 2005 |
| 9 | Ley N°21.012 | Seguridad y salud en el trabajo | 2017 |
| 10 | Ley N°21.015 | Inclusión laboral discapacidad | 2017 |
| 11 | Ley N°21.220 | Teletrabajo | 2020 |
| 12 | Protocolo TEMER | Trastornos musculoesqueléticos | SUSESO |
| 13 | Protocolo ISTAS21 | Riesgo psicosocial | SUSESO |
| 14 | Ley N°20.545 | Posnatal parental | 2011 |
| 15 | DS N°2/2024 | Política Nacional de SST | 2024 |

---

## DECLARACIÓN DE APROBACIÓN

El presente Reglamento Interno de Orden, Higiene y Seguridad de **${E}** ha sido elaborado en conformidad con lo dispuesto en el artículo 153 y siguientes del Código del Trabajo.

**${cliente.representante_legal||P}**
Representante Legal
**${E}**
RUT: ${cliente.rut||P}

*${new Date().toLocaleDateString('es-CL')} — Versión 01/${new Date().getFullYear()}*`;

      } else {
        return res.status(400).json({ error: `Sección ${seccion} no válida. Secciones válidas: 1-15.` });
      }

    // ════════════════════════════════════════
    // RESUMEN EJECUTIVO PARA EL EMPLEADOR
    // ════════════════════════════════════════
    } else if (tipo === 'resumen_empleador') {
      prompt = `Eres experto en legislación laboral chilena y comunicación ejecutiva.

EMPRESA: ${ctx}

Genera un RESUMEN EJECUTIVO del RIOHS para que la Gerencia y RRHH de ${E} entiendan sus obligaciones sin leer el reglamento completo. Debe ser directo, claro y accionable.

# RESUMEN EJECUTIVO — RIOHS ${new Date().getFullYear()}
## ${E} | Rubro: ${R}

---

## ¿Por qué existe este documento y por qué importa?
Qué es el RIOHS, por qué es obligatorio (Art. 153 CT), cuál es la multa por no tenerlo, qué pasa si un trabajador lo incumple. 8 líneas.

---

## Lo que el empleador DEBE hacer — Obligaciones críticas
Lista de 12 obligaciones concretas del empleador, cada una en 2-3 líneas con la ley que la sustenta. Incluir: entrega del RIOHS al trabajador, condiciones seguras (Art. 184 CT), protocolo Ley Karin, CPHS si tiene 25+ trabajadores, capacitaciones, investigar accidentes, ISTAS21 cada 2 años, TEMER, igualdad de remuneraciones, licencias médicas, pago del finiquito en plazo.

---

## Fechas y plazos clave
Tabla: | Obligación | Plazo | Consecuencia del incumplimiento |
Incluye: investigación de accidentes (24-48h), respuesta denuncias Ley Karin (5 días hábiles inicio + 30 días hábiles resolución), pago finiquito (5 días hábiles), ISTAS21 (cada 2 años), entrega de liquidaciones (mensual), contratos nuevos (15 días).

---

## Los 5 riesgos legales más importantes para ${E}
Explica los 5 principales riesgos de incumplimiento para el rubro ${R}, con la multa o consecuencia legal de cada uno.

---

## Alertas de normativa reciente — Asegúrese de tenerlas incorporadas
Explica brevemente: Ley Karin (agosto 2024), DS 44/2023, Ley 21.719 (datos), reducción jornada Ley 21.561. Estado de implementación y qué hacer si falta alguna.

---

*Este resumen no reemplaza el RIOHS completo. Ante dudas consulte con su asesor legal o la Inspección del Trabajo.*`;

    // ════════════════════════════════════════
    // INFORME DE CAMBIOS
    // ════════════════════════════════════════
    } else if (tipo === 'informe_cambios') {
      const cambiosList = (alertas_seleccionadas || []).map((a, i) =>
        `${i + 1}. [${a.tipo.toUpperCase()}] ${a.titulo} — ${a.descripcion} (${a.normativa || ''})`
      ).join('\n');

      prompt = `Eres experto en legislación laboral chilena.

EMPRESA: ${ctx}

Genera un INFORME DE CAMBIOS para la auditoría del RIOHS de ${E}.

# INFORME DE ACTUALIZACIÓN DEL RIOHS
## ${E} — ${new Date().toLocaleDateString('es-CL')}

---

## Resumen ejecutivo
En 6-8 líneas: cuántos cambios se realizaron (${(alertas_seleccionadas||[]).length}), de qué tipo, cuál es el impacto legal de haberlos aplicado, y el estado actual del reglamento.

---

## Cambios realizados por categoría

Organiza los cambios en tablas por tipo:

### ⚠️ Artículos o secciones AGREGADOS
| N° | Sección agregada | Normativa que lo exige | Prioridad |

### 🔄 Artículos ACTUALIZADOS
| N° | Artículo | Cambio realizado | Normativa |

### 🗑️ Artículos ELIMINADOS o derogados
| N° | Artículo | Razón | Reemplazado por |

### ❌ Errores CORREGIDOS
| N° | Error corregido | Corrección aplicada |

Los ${(alertas_seleccionadas||[]).length} cambios aplicados fueron:
${cambiosList}

---

## Normativa incorporada en esta actualización
Por cada norma que motivó un cambio, explica en 2 líneas qué implicó para ${E}.

---

## Estado del RIOHS después de la actualización
🟢 Áreas completamente actualizadas
🟡 Áreas que requieren revisión periódica
🔴 Cambios pendientes (si quedaron alertas sin aplicar)

---

## Próxima revisión recomendada
Cuándo hacer la próxima auditoría y qué normativa hay que monitorear.

---
*Generado el ${new Date().toLocaleDateString('es-CL')} — Sistema Más Prevención*`;

    // ════════════════════════════════════════
    // AUDITORÍA — ANÁLISIS (con web search)
    // ════════════════════════════════════════
    } else if (tipo === 'auditoria_analisis') {
      usarWebSearch = true;
      maxTokens = 4000;
      prompt = `Eres experto en legislación laboral chilena con acceso a búsqueda web.

Busca normativa chilena vigente actualizada:
- "DS 44 2023 Chile actualizaciones ${new Date().getFullYear()}"
- "Ley Karin 21643 reglamento Chile"
- "normativa laboral nueva Chile ${new Date().getFullYear()}"
- "seguridad laboral ${R} Chile vigente"

EMPRESA: ${ctx}

DOCUMENTO A AUDITAR:
${(documento_existente||'').substring(0,7000)}

Devuelve SOLO este JSON:

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

TIPOS: "falta"|"cambio"|"sobra"|"error" — PRIORIDADES: "alta"|"media"|"baja"
Genera entre 10 y 30 alertas específicas.`;

    // ════════════════════════════════════════
    // AUDITORÍA — APLICAR CAMBIOS (con web search)
    // ════════════════════════════════════════
    } else if (tipo === 'auditoria_aplicar') {
      usarWebSearch = true;
      maxTokens = 5000;
      const cambios = (alertas_seleccionadas||[]).map((a,i)=>
        `${i+1}. [${a.tipo.toUpperCase()}] ${a.titulo}: ${a.descripcion} — Normativa: ${a.normativa||''}`
      ).join('\n');

      prompt = `Eres experto en legislación laboral chilena con acceso a búsqueda web.

Busca el texto legal exacto de las normativas mencionadas: ${(alertas_seleccionadas||[]).map(a=>a.normativa).filter(Boolean).slice(0,4).join(', ')}

EMPRESA: ${ctx}

DOCUMENTO ORIGINAL:
${(documento_existente||'').substring(0,4000)}

CAMBIOS A APLICAR (${(alertas_seleccionadas||[]).length}):
${cambios}

Aplica SOLO estos cambios. FALTA: agrega el artículo completo. CAMBIO: reescribe completo con normativa actualizada. SOBRA: marca [DEROGADO]. ERROR: corrígelo. Entrega el documento COMPLETO en Markdown con cada artículo mínimo 6 líneas.`;

    } else {
      return res.status(400).json({ error: 'Tipo no válido' });
    }

    // ════════════════════════════════════════
    // LLAMAR A CLAUDE
    // ════════════════════════════════════════
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
    if (!texto) throw new Error('Sin respuesta de texto del API');

    return res.status(200).json({ contenido: texto, tipo, seccion });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
