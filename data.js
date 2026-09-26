// Contenido de práctica: funciona sin internet y sin IA.
const PHRASES = {
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

const CATEGORY_NAMES = {
  seguridad: "Seguridad", mantenimiento: "Mantención", produccion: "Producción",
  fallas: "Fallas", social: "Social", errores: "Mis errores"
};

// Palabras técnicas para deletreo [inglés, español]
const WORDS = [
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

// Escenarios de conversación
const SCENARIOS = [
  { id:"arrival", es:"Recibir al técnico", en:"You just arrived at the sawmill in Chile. The learner is meeting you at the gate to welcome you and take you to the office." },
  { id:"breakdown", es:"Explicar una falla", en:"A machine on the production line (the learner decides which one) has a problem. You ask the learner detailed questions to understand the failure: when it started, symptoms, error codes, noises." },
  { id:"instructions", es:"Recibir instrucciones", en:"You are explaining to the learner a maintenance procedure step by step (for example changing saw blades or adjusting a sensor). Check that the learner understands and make them confirm or ask questions." },
  { id:"safety", es:"Seguridad en planta", en:"You are doing a safety walk through the mill with the learner. Talk about lockout/tagout, guards, PPE and risky areas." },
  { id:"parts", es:"Pedir repuestos", en:"You need to order spare parts. Ask the learner for part numbers, quantities and serial numbers, and make them spell codes." },
  { id:"lunch", es:"Colación y charla", en:"You are having lunch with the learner in the mill canteen. Casual small talk: family, Chile, food, weather, weekend, your home country." },
  { id:"report", es:"Reporte de turno", en:"At the end of the shift, you ask the learner for a report: production numbers, downtime, problems and what needs to be done tomorrow." }
];

const PERSONAS = {
  lars: { name:"Lars", es:"Lars, técnico sueco", en:"Lars, a friendly Swedish service technician from a sawmill machinery company. You speak clear international English (it is your second language), sometimes a little direct." },
  mike: { name:"Mike", es:"Mike, técnico canadiense", en:"Mike, a relaxed Canadian service technician from British Columbia. You speak natural North American English, with casual everyday expressions." }
};
