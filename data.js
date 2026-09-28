// Contenido de práctica: funciona sin internet y sin IA.
const MILL_PHRASES = {
  seguridad: [
    ["Please put on your hard hat and safety glasses before entering the mill.", "Por favor ponte el casco y los lentes de seguridad antes de entrar al aserradero."],
    ["We need to lock out the machine before we open the guard.", "Tenemos que bloquear la máquina antes de abrir la protección."],
    ["Is the saw completely stopped?", "¿La sierra está completamente detenida?"],
    ["Wear hearing protection in this area. It is very loud.", "Usa protección auditiva en esta zona. Hay mucho ruido."],
    ["Don't stand under the log deck while it is running.", "No te pares debajo de la mesa de trozos mientras está funcionando."],
    ["Where is the emergency stop button?", "¿Dónde está el botón de parada de emergencia?"],
    ["Everyone has to sign in at the office first.", "Todos tienen que registrarse primero en la oficina."],
    ["Keep your hands away from the conveyor chain.", "Mantén las manos lejos de la cadena transportadora."]
  ],
  mantenimiento: [
    ["The bearing on the edger is overheating.", "El rodamiento del canteador se está sobrecalentando."],
    ["We changed the saw blades this morning.", "Cambiamos las hojas de sierra esta mañana."],
    ["How often should we grease this shaft?", "¿Cada cuánto deberíamos engrasar este eje?"],
    ["The hydraulic cylinder is leaking oil.", "El cilindro hidráulico está perdiendo aceite."],
    ["Can you check the tension on the band saw?", "¿Puedes revisar la tensión de la sierra huincha?"],
    ["We need a spare part. What is the part number?", "Necesitamos un repuesto. ¿Cuál es el número de parte?"],
    ["The maintenance is scheduled for Saturday morning.", "La mantención está programada para el sábado en la mañana."],
    ["The belt is worn out and needs to be replaced.", "La correa está gastada y hay que reemplazarla."]
  ],
  produccion: [
    ["We process about four hundred logs per shift.", "Procesamos unos cuatrocientos trozos por turno."],
    ["The kiln takes around three days to dry this lumber.", "El secador tarda unos tres días en secar esta madera."],
    ["The scanner decides the best cutting pattern for each log.", "El escáner decide el mejor patrón de corte para cada trozo."],
    ["The boards go from the trimmer to the sorter.", "Las tablas van de la despuntadora a la clasificadora."],
    ["We are cutting two by six boards today.", "Hoy estamos cortando tablas de dos por seis."],
    ["The moisture content is too high.", "El contenido de humedad está muy alto."],
    ["The stacker is full. We have to wait for the forklift.", "El apilador está lleno. Tenemos que esperar la grúa horquilla."],
    ["Our main species is radiata pine.", "Nuestra especie principal es el pino radiata."]
  ],
  fallas: [
    ["The line stopped about twenty minutes ago.", "La línea se detuvo hace unos veinte minutos."],
    ["There is an error message on the screen.", "Hay un mensaje de error en la pantalla."],
    ["The sensor is not detecting the boards.", "El sensor no está detectando las tablas."],
    ["It makes a strange noise when it starts.", "Hace un ruido raro cuando parte."],
    ["The motor keeps tripping the breaker.", "El motor sigue botando el automático."],
    ["We had a jam at the chipper.", "Tuvimos un atasco en el chipeador."],
    ["It works fine for an hour and then it fails.", "Funciona bien por una hora y después falla."],
    ["Could you show me how to reset the PLC?", "¿Me podría mostrar cómo reiniciar el PLC?"]
  ],
  social: [
    ["How was your flight from Sweden?", "¿Cómo estuvo tu vuelo desde Suecia?"],
    ["Would you like to have lunch with us?", "¿Te gustaría almorzar con nosotros?"],
    ["Is this your first time in Chile?", "¿Es tu primera vez en Chile?"],
    ["How long are you staying here?", "¿Cuánto tiempo te quedas aquí?"],
    ["The weather is usually rainy in winter.", "El clima suele ser lluvioso en invierno."],
    ["I'm still learning English, so please speak slowly.", "Todavía estoy aprendiendo inglés, así que por favor habla despacio."],
    ["Could you repeat that, please?", "¿Podrías repetir eso, por favor?"],
    ["Thanks for your help today. See you tomorrow.", "Gracias por tu ayuda hoy. Nos vemos mañana."]
  ]
};

const MILL_CATEGORY_NAMES = {
  seguridad: "Seguridad", mantenimiento: "Mantención", produccion: "Producción",
  fallas: "Fallas", social: "Social", errores: "Mis errores"
};

// Palabras técnicas para deletreo [inglés, español]
const MILL_WORDS = [
  ["bearing","rodamiento"],["blade","hoja"],["sawdust","aserrín"],["lumber","madera aserrada"],
  ["kiln","secador (horno)"],["edger","canteador"],["trimmer","despuntadora"],["planer","cepilladora"],
  ["debarker","descortezador"],["conveyor","transportador"],["chipper","chipeador"],["sorter","clasificador"],
  ["stacker","apilador"],["forklift","grúa horquilla"],["hydraulic","hidráulico"],["cylinder","cilindro"],
  ["pressure","presión"],["sensor","sensor"],["scanner","escáner"],["shaft","eje"],
  ["pulley","polea"],["sprocket","piñón"],["gearbox","caja reductora"],["grease","grasa"],
  ["leak","fuga"],["worn","gastado"],["alignment","alineación"],["tension","tensión"],
  ["breaker","automático"],["wrench","llave"],["schedule","programa / horario"],["shift","turno"],
  ["maintenance","mantención"],["guard","protección"],["lockout","bloqueo"],["moisture","humedad"],
  ["knot","nudo"],["board","tabla"],["measurement","medida"],["thickness","espesor"],
  ["width","ancho"],["length","largo"],["quality","calidad"],["species","especie"],
  ["throughput","producción por hora"],["downtime","tiempo detenido"],["spare","repuesto"],["warehouse","bodega"]
];

const NATO = {
  A:"Alpha",B:"Bravo",C:"Charlie",D:"Delta",E:"Echo",F:"Foxtrot",G:"Golf",H:"Hotel",I:"India",
  J:"Juliet",K:"Kilo",L:"Lima",M:"Mike",N:"November",O:"Oscar",P:"Papa",Q:"Quebec",R:"Romeo",
  S:"Sierra",T:"Tango",U:"Uniform",V:"Victor",W:"Whiskey",X:"X-ray",Y:"Yankee",Z:"Zulu"
};
const DIGIT_WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine"];

// Nuevas áreas del aserradero y supervisión
Object.assign(MILL_PHRASES, {
  recepcion: [
    ["The log trucks start arriving at six in the morning.", "Los camiones con rollizos empiezan a llegar a las seis de la mañana."],
    ["We measure the diameter and length of every log.", "Medimos el diámetro y el largo de cada rollizo."],
    ["These logs are too crooked for the main line.", "Estos rollizos están demasiado torcidos para la línea principal."],
    ["Please sort the logs by diameter in the log yard.", "Por favor clasifica los rollizos por diámetro en la cancha."],
    ["The loader puts the logs on the infeed deck.", "El cargador pone los rollizos en la mesa de alimentación."],
    ["The metal detector found a nail in this log.", "El detector de metales encontró un clavo en este rollizo."],
    ["We keep the log piles wet in summer so they don't crack.", "Mantenemos mojadas las pilas de rollizos en verano para que no se partan."]
  ],
  descortezador: [
    ["The debarker is not removing all the bark.", "El descortezador no está sacando toda la corteza."],
    ["The tips on the debarker arms are worn.", "Las puntas de los brazos del descortezador están gastadas."],
    ["Big logs sometimes get stuck in the debarker.", "Los rollizos grandes a veces se atascan en el descortezador."],
    ["Too much pressure damages the wood surface.", "Demasiada presión daña la superficie de la madera."],
    ["The bark goes on a conveyor to the boiler.", "La corteza va por un transportador a la caldera."],
    ["Check the rotor speed before you start the line.", "Revisa la velocidad del rotor antes de partir la línea."]
  ],
  resierra: [
    ["The resaw splits the thick pieces into thinner boards.", "La resierra divide las piezas gruesas en tablas más delgadas."],
    ["The boards from the resaw have uneven thickness.", "Las tablas de la resierra tienen espesor disparejo."],
    ["We change the resaw band every four hours.", "Cambiamos la huincha de la resierra cada cuatro horas."],
    ["Feed the pieces straight into the resaw.", "Alimenta las piezas derechas a la resierra."],
    ["The guide rollers on the resaw need adjustment.", "Los rodillos guía de la resierra necesitan ajuste."],
    ["The saw is wandering. Check the tension and the guides.", "La sierra se está desviando. Revisa la tensión y las guías."]
  ],
  trimmer: [
    ["The trimmer cuts the boards to the correct length.", "El trimmer corta las tablas al largo correcto."],
    ["Some trimmer saws are not dropping.", "Algunas sierras del trimmer no están bajando."],
    ["The optimizer chose the wrong length for this board.", "El optimizador eligió el largo equivocado para esta tabla."],
    ["We are losing too much wood at the trimmer.", "Estamos perdiendo demasiada madera en el trimmer."],
    ["The grader marks the defects before the trimmer.", "El clasificador marca los defectos antes del trimmer."],
    ["The boards are not square to the saws.", "Las tablas no llegan a escuadra con las sierras."]
  ],
  buzones: [
    ["The sorter drops each board into the correct bin.", "La clasificadora deja caer cada tabla en el buzón correcto."],
    ["Bin number twelve is full. Please empty it.", "El buzón número doce está lleno. Por favor vacíalo."],
    ["Two different lengths are falling into the same bin.", "Dos largos distintos están cayendo en el mismo buzón."],
    ["The bin gate is stuck open.", "La compuerta del buzón está pegada abierta."],
    ["We need to reassign the bins for the new order.", "Tenemos que reasignar los buzones para el nuevo pedido."],
    ["Boards are falling outside the bins.", "Las tablas están cayendo fuera de los buzones."]
  ],
  stacker: [
    ["The stacker builds the packages layer by layer.", "El stacker arma los paquetes capa por capa."],
    ["The stickers are not aligned in the package.", "Los separadores no están alineados en el paquete."],
    ["The stacker forks are jamming.", "Las horquillas del stacker se están atascando."],
    ["Each package has twenty two layers.", "Cada paquete tiene veintidós capas."],
    ["The sticker magazine is almost empty.", "El cargador de separadores está casi vacío."],
    ["The package is not square. Please check the stacker.", "El paquete no está cuadrado. Por favor revisa el stacker."]
  ],
  enzunchado: [
    ["The strapping machine puts four straps on each package.", "La enzunchadora pone cuatro zunchos en cada paquete."],
    ["The strap broke during tensioning.", "El zuncho se cortó al tensar."],
    ["We are running out of strap. Bring a new coil.", "Se nos está acabando el zuncho. Trae un rollo nuevo."],
    ["Put the corner protectors on before strapping.", "Pon los esquineros antes de enzunchar."],
    ["The strapping head is not sealing the strap.", "El cabezal de la enzunchadora no está sellando el zuncho."],
    ["Put the label on after strapping the package.", "Pon la etiqueta después de enzunchar el paquete."]
  ],
  antimancha: [
    ["The boards go through the anti sapstain dip to prevent blue stain.", "Las tablas pasan por el baño antimancha para evitar la mancha azul."],
    ["Check the chemical concentration in the tank every shift.", "Revisa la concentración del químico en el estanque cada turno."],
    ["Always wear gloves and goggles near the dip tank.", "Usa siempre guantes y antiparras cerca del estanque de baño."],
    ["The sprayers are clogged. Clean the nozzles.", "Los aspersores están tapados. Limpia las boquillas."],
    ["Let the treated wood drip before stacking.", "Deja escurrir la madera tratada antes de apilar."],
    ["Green lumber must be treated soon after sawing.", "La madera verde debe tratarse poco después de aserrarla."]
  ],
  pintado: [
    ["We paint the ends of the packages with the client's color.", "Pintamos las cabezas de los paquetes con el color del cliente."],
    ["The end coating helps prevent cracks in the boards.", "El sellador en las cabezas ayuda a evitar grietas en las tablas."],
    ["Use the blue paint for the export order.", "Usa la pintura azul para el pedido de exportación."],
    ["The spray nozzles need cleaning every day.", "Las boquillas de pintura necesitan limpieza todos los días."],
    ["The marking on this package is wrong.", "El marcado de este paquete está malo."],
    ["Let the paint dry before loading the truck.", "Deja secar la pintura antes de cargar el camión."]
  ],
  supervision: [
    ["Let's review yesterday's production and downtime.", "Revisemos la producción y el tiempo detenido de ayer."],
    ["Our lumber recovery was below target this week.", "Nuestro rendimiento de madera estuvo bajo la meta esta semana."],
    ["We need to plan the shutdown for next month.", "Tenemos que planificar la detención del próximo mes."],
    ["Who is responsible for this action item?", "¿Quién es responsable de esta tarea?"],
    ["The incident report must be sent today.", "El informe del incidente debe enviarse hoy."],
    ["What is the lead time for this spare part?", "¿Cuál es el plazo de entrega de este repuesto?"],
    ["Can we schedule a meeting with your engineering team?", "¿Podemos agendar una reunión con su equipo de ingeniería?"],
    ["We need to improve the uptime of this line.", "Tenemos que mejorar la disponibilidad de esta línea."],
    ["Please send me the quote before Friday.", "Por favor envíame la cotización antes del viernes."],
    ["I will follow up with the maintenance team.", "Voy a hacer seguimiento con el equipo de mantención."]
  ]
});
Object.assign(MILL_CATEGORY_NAMES, {
  recepcion: "Recepción de rollizos", descortezador: "Descortezador", resierra: "Resierra",
  trimmer: "Trimmer", buzones: "Buzones", stacker: "Stacker", enzunchado: "Enzunchado",
  antimancha: "Baño antimancha", pintado: "Pintado", supervision: "Supervisión y jefatura"
});
MILL_WORDS.push(
  ["bark","corteza"],["rotor","rotor"],["resaw","resierra"],["optimizer","optimizador"],["grader","clasificador"],
  ["bin","buzón"],["gate","compuerta"],["sticker","separador"],["package","paquete"],["layer","capa"],
  ["strap","zuncho"],["coil","rollo"],["label","etiqueta"],["sapstain","mancha azul"],["chemical","químico"],
  ["concentration","concentración"],["nozzle","boquilla"],["paint","pintura"],["coating","recubrimiento"],
  ["crooked","torcido"],["diameter","diámetro"],["loader","cargador"],["truck","camión"],["recovery","rendimiento"],
  ["target","meta"],["shutdown","detención"],["report","informe"],["meeting","reunión"],["quote","cotización"],
  ["budget","presupuesto"],["uptime","disponibilidad"],["incident","incidente"],["supervisor","supervisor"],["deadline","plazo"]
);


Object.assign(MILL_PHRASES, {
  canteadora: [
    ["The new edger has a BioLuma scanner for grade scanning.", "La canteadora nueva tiene un escáner BioLuma para escanear el grado."],
    ["The scanner measures every board in three dimensions.", "El escáner mide cada tabla en tres dimensiones."],
    ["The optimizer decides the best width for each board.", "El optimizador decide el mejor ancho para cada tabla."],
    ["Please clean the sensor windows at the start of every shift.", "Por favor limpia las ventanas de los sensores al inicio de cada turno."],
    ["We need to check the calibration once a week.", "Tenemos que revisar la calibración una vez a la semana."],
    ["The boards are not straight when they enter the edger.", "Las tablas no entran derechas a la canteadora."],
    ["The customer wants less wane on the export boards.", "El cliente quiere menos arista faltante en las tablas de exportación."],
    ["Can you connect remotely and check the optimizer?", "¿Puedes conectarte remotamente y revisar el optimizador?"]
  ],
  proyecto: [
    ["We want to increase production from 28,000 to 45,000 cubic meters.", "Queremos aumentar la producción de 28.000 a 45.000 metros cúbicos."],
    ["The return line will be removed in the upgrade.", "La línea de retorno se eliminará en el upgrade."],
    ["There will be a double log infeed and two primary machines.", "Habrá una doble entrada de rollizos y dos máquinas principales."],
    ["The chipper canters turn the slabs into chips.", "Los chipper canter convierten los lampazos en astillas."],
    ["The installation will be done in three phases.", "La instalación se hará en tres etapas."],
    ["The bottleneck will move to the trimmer.", "El cuello de botella se moverá al trimmer."],
    ["We need more drying capacity for the new volume.", "Necesitamos más capacidad de secado para el nuevo volumen."],
    ["What is the timeline for the engineering phase?", "¿Cuál es el cronograma de la etapa de ingeniería?"]
  ]
});
Object.assign(MILL_CATEGORY_NAMES, { canteadora: "Canteadora USNR", proyecto: "Upgrade del aserradero" });
MILL_WORDS.push(["calibration","calibración"],["wane","arista faltante"],["grade","grado"],["infeed","entrada"],["outfeed","salida"],
  ["positioner","posicionador"],["commissioning","puesta en marcha"],["bottleneck","cuello de botella"],["layout","distribución"],
  ["canter","canteador perfilador"],["chips","astillas"],["slab","lampazo"],["capacity","capacidad"],["timeline","cronograma"],
  ["warranty","garantía"],["contractor","contratista"],["permit","permiso"],["throughput","producción por hora"]);

// Escenarios de conversación (group = grupo en el menú)
const MILL_SCENARIOS = [
  { group:"Proyectos USNR", id:"edger-startup", es:"Puesta en marcha canteadora nueva", en:"The new USNR edger with the BioLuma scanner is starting up this week. Talk with the learner about first problems, board positioning, alarms, operator training and what to check every shift." },
  { group:"Proyectos USNR", id:"bioluma", es:"Scanner BioLuma y optimizador", en:"Explain and discuss the BioLuma scanner and the optimizer with the learner: laser profiles, color vision, defects, wane and grade rules, calibration, cleaning the sensors, remote support." },
  { group:"Proyectos USNR", id:"upgrade", es:"Upgrade del aserradero (2 años)", en:"Discuss the sawmill upgrade planned in about two years: removing the return line, double log infeed, two primary breakdown machines, two chipper canters, going from 28,000 to 45,000 cubic meters. Ask the learner about current problems, bottlenecks and expectations." },
  { group:"Proyectos USNR", id:"progress", es:"Reunión de avance del proyecto", en:"Weekly progress meeting of the upgrade project: schedule, delays, engineering drawings, foundations, electrical work, contractors, safety, open issues and next steps." },
  { group:"Situaciones", id:"arrival", es:"Recibir al técnico", en:"You just arrived at the sawmill in Chile. The learner is meeting you at the gate to welcome you and take you to the office." },
  { group:"Situaciones", id:"breakdown", es:"Explicar una falla", en:"A machine on the production line (the learner decides which one) has a problem. You ask detailed questions to understand the failure: when it started, symptoms, error codes, noises." },
  { group:"Situaciones", id:"instructions", es:"Recibir instrucciones", en:"You are explaining a maintenance procedure step by step (for example changing saw blades or adjusting a sensor). Check that the learner understands and make them confirm or ask questions." },
  { group:"Situaciones", id:"safety", es:"Seguridad en planta", en:"You are doing a safety walk through the mill with the learner. Talk about lockout/tagout, guards, PPE and risky areas." },
  { group:"Situaciones", id:"parts", es:"Pedir repuestos", en:"You need to order spare parts. Ask the learner for part numbers, quantities and serial numbers, and make them spell codes." },
  { group:"Situaciones", id:"lunch", es:"Colación y charla", en:"You are having lunch with the learner in the mill canteen. Casual small talk: family, Chile, food, weather, weekend, your home country." },
  { group:"Situaciones", id:"report", es:"Reporte de turno", en:"At the end of the shift, you ask the learner for a report: production numbers, downtime, problems and what needs to be done tomorrow." },

  { group:"Equipos", id:"yard", es:"Recepción de rollizos", en:"You are at the log yard and log receiving area with the learner: log trucks, measuring diameter and length, sorting logs, loaders, infeed deck, metal detector, rejected logs." },
  { group:"Equipos", id:"debarker", es:"Descortezador", en:"You are checking the ring debarker with the learner: bark not fully removed, worn tips, arm pressure, rotor speed, logs getting stuck, bark conveyor." },
  { group:"Equipos", id:"resaw", es:"Resierra", en:"You are working on the resaw with the learner: uneven thickness, band saw changes, tension, guide rollers, feed speed, saw deviation." },
  { group:"Equipos", id:"trimmer", es:"Trimmer", en:"You are at the trimmer with the learner: saws not dropping, optimizer choosing wrong lengths, wood loss, board positioning, grader marks." },
  { group:"Equipos", id:"bins", es:"Buzones (clasificación)", en:"You are at the sorter bins with the learner: boards in the wrong bin, full bins, stuck gates, reassigning bins for a new order." },
  { group:"Equipos", id:"stacker", es:"Stacker", en:"You are at the stacker with the learner: package layers, sticker alignment, sticker magazine, forks jamming, packages not square." },
  { group:"Equipos", id:"strapping", es:"Enzunchado", en:"You are at the strapping machine with the learner: number of straps, strap breaking, sealing head problems, corner protectors, labels." },
  { group:"Equipos", id:"dip", es:"Baño antimancha", en:"You are at the anti-sapstain treatment (dip tank or spray) with the learner: chemical concentration, blue stain prevention, clogged nozzles, dripping, safety with chemicals." },
  { group:"Equipos", id:"painting", es:"Pintado de madera", en:"You are at the package end-painting and marking station with the learner: client colors, end coating to prevent cracks, spray nozzles, wrong marking, drying time." },

  { group:"Supervisión y jefatura", id:"prodmeeting", es:"Reunión de producción", en:"You are in a production meeting with the learner, who is a supervisor. Review production, downtime, lumber recovery vs target, main problems and action items." },
  { group:"Supervisión y jefatura", id:"vendor", es:"Reunión con el proveedor", en:"The learner is a sawmill manager meeting you, the machinery supplier's representative. Discuss a performance problem, warranty, quotes, lead times and next steps. Be polite but negotiate." },
  { group:"Supervisión y jefatura", id:"shutdown", es:"Planificar detención", en:"You and the learner (a supervisor) plan a maintenance shutdown: dates, duration, tasks, contractors, spare parts, safety and who is responsible for each task." },
  { group:"Supervisión y jefatura", id:"incident", es:"Informe de incidente", en:"There was a safety incident at the mill. You ask the learner (a supervisor) what happened, when, who was involved, root cause and corrective actions." },
  { group:"Supervisión y jefatura", id:"handover", es:"Entrega de turno", en:"The learner is a shift supervisor handing over the shift to you: production, pending problems, machines down, safety issues and priorities." },
  { group:"Supervisión y jefatura", id:"training", es:"Capacitar a operadores", en:"The learner is a supervisor and asks you to help plan training for the operators on a new machine: topics, schedule, language barriers, checking understanding." }
];

const MILL_PERSONAS = {
  mattias: { name:"Mattias", es:"Mattias, técnico sueco", en:"Mattias, a friendly Swedish service technician (a man) from USNR, the sawmill machinery supplier. You speak clear international English (it is your second language), calm and precise, sometimes a little direct." },
  joel: { name:"Joel", es:"Joel, técnico sueco", en:"Joel, a young and energetic Swedish service technician (a man) from USNR, specialist in scanners and optimization software. You speak fluent international English with a Swedish touch, practical and friendly." },
  alvaro: { name:"Álvaro", es:"Álvaro, técnico de Canadá (también habla español)", en:"Álvaro, a Canadian service technician (a man) from USNR in British Columbia. You speak natural North American English and you also speak Spanish (your parents are Latin American). You always speak English, but if the learner is clearly lost or writes in Spanish, you may add ONE short clarification in Spanish in parentheses, then continue in English." },
  paul: { name:"Paul", es:"Paul, jefe de proyecto sueco", en:"Paul, a Swedish project manager (a man) from USNR. Professional, organized, focused on results, schedule, safety and costs. Clear international English." }
};

// Test de nivel: 3 preguntas por nivel, de A1 a C1 (una de cada nivel es de listening)
const TEST_QUESTIONS = [
  { lvl: 'A1', q: 'Where ___ the emergency stop?', es: '¿Dónde está la parada de emergencia?', o: ['is', 'are', 'am'], a: 0 },
  { lvl: 'A1', q: 'How do you say "casco" in English?', o: ['hard hat', 'hard shoe', 'head glass'], a: 0 },
  { lvl: 'A1', audio: 'Please close the door.', q: 'What does he ask?', es: '¿Qué pide?', o: ['Close the door', 'Open the window', 'Stop the line'], a: 0 },
  { lvl: 'A2', q: 'Yesterday we ___ the saw blades.', o: ['changed', 'change', 'changing'], a: 0 },
  { lvl: 'A2', q: 'The bearing is too hot. It is ___.', o: ['overheating', 'overeating', 'overcooking'], a: 0 },
  { lvl: 'A2', audio: 'The trucks will arrive on Thursday morning, not on Wednesday.', q: 'When will the trucks arrive?', es: '¿Cuándo llegan los camiones?', o: ['Thursday morning', 'Wednesday morning', 'Thursday night'], a: 0 },
  { lvl: 'B1', q: 'If the scanner ___ dirty, the readings will be wrong.', o: ['is', 'will be', 'was being'], a: 0 },
  { lvl: 'B1', q: 'We have been waiting for the spare part ___ three weeks.', o: ['for', 'since', 'during'], a: 0 },
  { lvl: 'B1', audio: "I'd check the air supply first, and if that doesn't work, give us a call.", q: 'What should they do first?', es: '¿Qué deben hacer primero?', o: ['Check the air supply', 'Call the technician', 'Change the sensor'], a: 0 },
  { lvl: 'B2', q: 'The line ___ stopped if the operator had seen the alarm.', o: ["wouldn't have", "won't have", "didn't"], a: 0 },
  { lvl: 'B2', q: 'Can we ___ the meeting to next Tuesday? (postpone)', o: ['push back', 'push over', 'push through'], a: 0 },
  { lvl: 'B2', audio: "We could tighten the wane allowance, but bear in mind you'd lose some recovery.", q: 'What is the drawback?', es: '¿Cuál es la desventaja?', o: ['Losing some recovery', 'Getting more wane', 'Slower saws'], a: 0 },
  { lvl: 'C1', q: '___ the delays, the project was delivered on budget.', o: ['Despite', 'Although', 'However'], a: 0 },
  { lvl: 'C1', q: '"The supplier is dragging its feet" means…', o: ['It is being slow on purpose', 'It is walking around the mill', 'It is working very fast'], a: 0 },
  { lvl: 'C1', audio: "Frankly, unless the whole chain keeps up, the upgrade won't pay off, however fast the new machines are.", q: "What is the speaker's main point?", es: '¿Cuál es la idea principal?', o: ['The whole production chain must improve too', 'The new machines are too slow', 'The upgrade is cheap'], a: 0 }
];
const LEVEL_DESC = {
  A1: 'Principiante: entiendes palabras y frases muy simples. Empezaremos con lo básico del trabajo diario.',
  A2: 'Básico: te defiendes con frases cortas y temas conocidos. Ideal para practicar situaciones concretas de la planta.',
  B1: 'Intermedio: puedes explicar problemas simples y entender a los técnicos si hablan claro.',
  B2: 'Intermedio alto: puedes discutir temas técnicos con bastante fluidez. Ahora toca sonar más natural.',
  C1: 'Avanzado: manejas reuniones y negociaciones. Trabajaremos matices, expresiones y rapidez.'
};
