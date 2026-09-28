// ================= Temas de práctica =================
// Cada tema trae sus personajes, escenarios, frases, vocabulario y conversaciones de listening.
// Los personajes de Bomberos y Fitness son ficticios. Cada uno usa una de las 4 "voces" de Ajustes.

Object.assign(MILL_PERSONAS.mattias, { voice: 'mattias', greet: "Hi, I'm Mattias. Let's check the edger together." });
Object.assign(MILL_PERSONAS.joel, { voice: 'joel', greet: "Hey, I'm Joel. I'll take care of the scanner today." });
Object.assign(MILL_PERSONAS.alvaro, { voice: 'alvaro', greet: "Hi, I'm Alvaro. How's the trimmer running today?" });
Object.assign(MILL_PERSONAS.paul, { voice: 'paul', greet: "Good morning, I'm Paul. Let's review the project schedule." });

// ---------- Bomberos y emergencias ----------
const FIRE_CONTEXT = `The learner is a volunteer firefighter in Chile (in Chile all firefighters are volunteers: "Bomberos de Chile", organized in local "compañías"). They practice English for international trainings and exchanges, working with foreign rescue teams (for example USAR teams after an earthquake), helping foreign tourists in emergencies and reading technical manuals.
Topics: structural firefighting, SCBA (breathing apparatus), hoses and nozzles, ventilation, search and rescue, vehicle extrication, rope rescue, first aid and trauma care, hazardous materials, incident command system (ICS), radio communication, and wildland/forest fires, which are very common in the Chilean summer.`;

const FIRE_PERSONAS = {
  dan:    { voice: 'alvaro',  name: 'Dan',    es: 'Dan, capitán de bomberos de EE.UU.', en: 'Dan, an experienced fire captain (a man) from a big US city fire department. He leads international training exchanges. Calm, clear, very safety-focused, uses real fireground vocabulary.', greet: "Hey, I'm Captain Dan. Ready for today's drill?" },
  liam:   { voice: 'mattias', name: 'Liam',   es: 'Liam, paramédico del Reino Unido', en: 'Liam, a British paramedic (a man) who teaches trauma care and first aid to firefighters. Friendly, precise, British English.', greet: "Hi, I'm Liam, the paramedic. Let's go over patient care." },
  tom:    { voice: 'joel',    name: 'Tom',    es: 'Tom, instructor de rescate de Australia', en: 'Tom, an Australian urban search and rescue (USAR) and rope rescue instructor (a man). Practical, energetic, a bit informal.', greet: "G'day, I'm Tom. Let's get the rope rescue gear ready." },
  robert: { voice: 'paul',    name: 'Robert', es: 'Robert, comandante de incidentes de Canadá', en: 'Robert, a Canadian fire chief and incident commander (a man), expert in the incident command system (ICS) and wildland fires. Structured and formal.', greet: "Good morning, I'm Chief Robert. Let's set up incident command." }
};
const FIRE_SCENARIOS = [
  { group: 'Emergencias', id: 'f-structure', es: 'Incendio estructural', en: 'You and the learner arrive at a house fire. Talk about size-up, water supply, SCBA, attack line, search and ventilation. Give and confirm orders.' },
  { group: 'Emergencias', id: 'f-car', es: 'Accidente vehicular y rescate', en: 'A car crash with a trapped driver. Discuss scene safety, stabilizing the vehicle, extrication tools, patient care and communication with paramedics.' },
  { group: 'Emergencias', id: 'f-wildland', es: 'Incendio forestal', en: 'A wildland fire near houses in the Chilean summer. Talk about wind, fire line, evacuation, water tenders, aircraft and safety zones.' },
  { group: 'Emergencias', id: 'f-tourist', es: 'Ayudar a un turista', en: 'You play a foreign tourist injured or lost during an emergency. The learner, a Chilean firefighter, must calm you, ask questions and give instructions.' },
  { group: 'Emergencias', id: 'f-hazmat', es: 'Materiales peligrosos', en: 'A truck is leaking an unknown chemical. Talk about identification, isolation distance, wind direction, protective equipment and decontamination.' },
  { group: 'Entrenamiento', id: 'f-exchange', es: 'Intercambio internacional', en: 'The learner is visiting a foreign fire department in an exchange program. Talk about how Chilean volunteer firefighters work, equipment, training and differences between countries.' },
  { group: 'Entrenamiento', id: 'f-firstaid', es: 'Primeros auxilios y trauma', en: 'Training on first aid: checking a patient, bleeding control, CPR, burns and fractures. Ask the learner to explain each step.' },
  { group: 'Entrenamiento', id: 'f-radio', es: 'Radio y mando de incidentes', en: 'Practice radio communication and ICS: clear short messages, status reports, requesting resources, confirming orders, using plain language.' },
  { group: 'Entrenamiento', id: 'f-usar', es: 'Rescate tras un terremoto (USAR)', en: 'After an earthquake, an international USAR team works with the Chilean firefighters. Talk about building collapse, search dogs, marking systems, shoring and victim extraction.' }
];
const FIRE_PHRASES = {
  estructural: [
    ["Check your air before you enter the building.", "Revisa tu aire antes de entrar al edificio."],
    ["We need a second hose line on the back side.", "Necesitamos una segunda línea de manguera por el lado de atrás."],
    ["Stay low. The smoke is very hot up there.", "Mantente abajo. El humo está muy caliente arriba."],
    ["Primary search is complete. No victims found.", "Búsqueda primaria completa. No se encontraron víctimas."],
    ["Open the roof for ventilation.", "Abran el techo para ventilar."],
    ["The fire is spreading to the second floor.", "El fuego se está extendiendo al segundo piso."]
  ],
  rescate: [
    ["Stabilize the vehicle before we cut the doors.", "Estabilicen el vehículo antes de cortar las puertas."],
    ["The driver is trapped and conscious.", "El conductor está atrapado y consciente."],
    ["Bring the hydraulic cutter and the spreader.", "Traigan la cizalla y el separador hidráulico."],
    ["Protect the patient with a blanket while we cut.", "Protejan al paciente con una manta mientras cortamos."],
    ["Check the anchor before you go down the rope.", "Revisa el anclaje antes de bajar por la cuerda."],
    ["We have a victim under the collapsed wall.", "Tenemos una víctima bajo el muro colapsado."]
  ],
  primerosauxilios: [
    ["Is the patient breathing?", "¿El paciente está respirando?"],
    ["Apply direct pressure to stop the bleeding.", "Aplica presión directa para detener el sangrado."],
    ["Start chest compressions right now.", "Comienza las compresiones torácicas ahora mismo."],
    ["Cool the burn with clean water for twenty minutes.", "Enfría la quemadura con agua limpia por veinte minutos."],
    ["Don't move him. He may have a spinal injury.", "No lo muevan. Puede tener una lesión en la columna."],
    ["The ambulance will arrive in five minutes.", "La ambulancia llegará en cinco minutos."]
  ],
  forestal: [
    ["The wind is changing direction. Pull back now.", "El viento está cambiando de dirección. Retírense ahora."],
    ["We need to build a fire line along this road.", "Necesitamos hacer un cortafuego a lo largo de este camino."],
    ["Evacuate the houses on the hill.", "Evacúen las casas del cerro."],
    ["The helicopter will drop water on the east side.", "El helicóptero lanzará agua en el lado este."],
    ["Always know your escape route and safety zone.", "Siempre conoce tu ruta de escape y tu zona de seguridad."],
    ["The fire jumped the road.", "El fuego cruzó el camino."]
  ],
  radio: [
    ["Command, this is Engine Two. We are on scene.", "Comando, aquí Carro Dos. Estamos en el lugar."],
    ["Copy that. Proceed to the north side.", "Recibido. Diríjanse al lado norte."],
    ["We need two more ambulances at this location.", "Necesitamos dos ambulancias más en esta ubicación."],
    ["Say again, your message was broken.", "Repita, su mensaje llegó cortado."],
    ["All units, evacuate the building now.", "Todas las unidades, evacúen el edificio ahora."],
    ["Mayday, mayday, firefighter down on the second floor.", "Mayday, mayday, bombero caído en el segundo piso."]
  ]
};
const FIRE_CATEGORY_NAMES = { estructural: 'Incendio estructural', rescate: 'Rescate', primerosauxilios: 'Primeros auxilios', forestal: 'Incendio forestal', radio: 'Radio y mando', errores: 'Mis errores' };
const FIRE_CATEGORY_EN = { estructural: 'structural firefighting', rescate: 'vehicle extrication, rope and collapse rescue', primerosauxilios: 'first aid and trauma care', forestal: 'wildland and forest fires', radio: 'radio communication and incident command' };
const FIRE_WORDS = [
  ['hose', 'manguera'], ['nozzle', 'pitón'], ['hydrant', 'grifo'], ['ladder', 'escala'], ['helmet', 'casco'], ['breathing apparatus', 'equipo de respiración'],
  ['smoke', 'humo'], ['flames', 'llamas'], ['ventilation', 'ventilación'], ['search', 'búsqueda'], ['rescue', 'rescate'], ['victim', 'víctima'],
  ['trapped', 'atrapado'], ['injured', 'herido'], ['bleeding', 'sangrado'], ['breathing', 'respirando'], ['unconscious', 'inconsciente'], ['stretcher', 'camilla'],
  ['burn', 'quemadura'], ['fracture', 'fractura'], ['extrication', 'extricación'], ['spreader', 'separador'], ['cutter', 'cizalla'], ['rope', 'cuerda'],
  ['anchor', 'anclaje'], ['collapse', 'colapso'], ['evacuation', 'evacuación'], ['wildfire', 'incendio forestal'], ['firebreak', 'cortafuego'], ['wind', 'viento'],
  ['engine', 'carro bomba'], ['ambulance', 'ambulancia'], ['command', 'mando'], ['hazardous', 'peligroso'], ['leak', 'fuga'], ['decontamination', 'descontaminación']
];
const FIRE_LISTEN_TOPICS = { emergency: 'Emergencias', training: 'Entrenamiento', care: 'Primeros auxilios' };
const FIRE_DIALOGS = [
  { id: 'f-house-fire', topic: 'emergency', level: 'B1', title: 'Llegada a un incendio de casa', context: 'El capitán Dan da órdenes al llegar a un incendio. Felipe es bombero voluntario chileno.',
    speakers: { A: ['Dan', 'dan'], B: ['Felipe', 'local'] },
    lines: [
      ['A', "Felipe, smoke showing from the second floor. Is anyone still inside?", "Felipe, sale humo del segundo piso. ¿Queda alguien adentro?"],
      ['B', "The neighbor says an old man lives there alone.", "El vecino dice que ahí vive un señor mayor solo."],
      ['A', "Okay. You and Nico mask up and do a primary search. I'll get a hose line to the front door.", "Bien. Tú y Nico pónganse las máscaras y hagan la búsqueda primaria. Yo llevo una línea a la puerta principal."],
      ['B', "Copy. How much air do we have?", "Recibido. ¿Cuánto aire tenemos?"],
      ['A', "Check your gauge. If your alarm goes off, you come out. No exceptions.", "Revisa tu manómetro. Si suena tu alarma, sales. Sin excepciones."],
      ['B', "Understood. We'll search the bedrooms first.", "Entendido. Buscaremos primero en los dormitorios."],
      ['A', "Good. Stay low and keep in contact with the wall.", "Bien. Mantente abajo y en contacto con la pared."]
    ],
    questions: [
      { q: 'Where is the smoke coming from?', es: '¿De dónde sale el humo?', o: ['The second floor', 'The garage', 'The roof'], a: 0 },
      { q: 'Who might be inside?', es: '¿Quién podría estar adentro?', o: ['An old man', 'A child', 'Nobody'], a: 0 },
      { q: 'What must they do if the alarm goes off?', es: '¿Qué deben hacer si suena la alarma?', o: ['Come out', 'Keep searching', 'Call the chief'], a: 0 }
    ] },
  { id: 'f-crash', topic: 'emergency', level: 'B1', title: 'Rescate en accidente vehicular', context: 'Tom y Camila trabajan en un auto con el conductor atrapado.',
    speakers: { A: ['Tom', 'tom'], B: ['Camila', 'local'] },
    lines: [
      ['A', "Camila, first things first. Is the car stable?", "Camila, lo primero es lo primero. ¿El auto está estable?"],
      ['B', "Not yet. I'm putting the blocks under the wheels now.", "Todavía no. Estoy poniendo las cuñas bajo las ruedas ahora."],
      ['A', "Great. Disconnect the battery too. The airbags haven't deployed.", "Muy bien. Desconecta también la batería. Los airbags no se han activado."],
      ['B', "Done. The driver is conscious but his legs are trapped.", "Listo. El conductor está consciente pero tiene las piernas atrapadas."],
      ['A', "Okay, we'll remove the door and push the dashboard. Talk to him while we cut.", "Bien, sacaremos la puerta y empujaremos el tablero. Háblale mientras cortamos."],
      ['B', "Sir, my name is Camila. We are going to get you out. Stay still, please.", "Señor, me llamo Camila. Lo vamos a sacar. Quédese quieto, por favor."],
      ['A', "Nice work. Cover him with a blanket. Cutting now.", "Buen trabajo. Tápalo con una manta. Cortando ahora."]
    ],
    questions: [
      { q: 'What is the first thing Tom asks?', es: '¿Qué pregunta Tom primero?', o: ['If the car is stable', 'If the driver has insurance', 'Where the ambulance is'], a: 0 },
      { q: 'Why does Tom want the battery disconnected?', es: '¿Por qué quiere desconectar la batería?', o: ["The airbags haven't deployed", 'To save power', 'To start the engine'], a: 0 },
      { q: 'What does Camila do while they cut?', es: '¿Qué hace Camila mientras cortan?', o: ['Talks to the driver', 'Calls the police', 'Moves the car'], a: 0 }
    ] },
  { id: 'f-wildland', topic: 'emergency', level: 'B2', title: 'Incendio forestal y cambio de viento', context: 'El comandante Robert coordina por radio con Ignacio en un incendio forestal.',
    speakers: { A: ['Robert', 'robert'], B: ['Ignacio', 'local'] },
    lines: [
      ['A', "Ignacio, what's your status on the east flank?", "Ignacio, ¿cuál es tu estado en el flanco este?"],
      ['B', "We've got the fire line holding, but the wind is picking up from the south.", "La línea de fuego está aguantando, pero el viento está aumentando desde el sur."],
      ['A', "That could push it toward the houses on the ridge. Start evacuating them now.", "Eso podría empujarlo hacia las casas de la loma. Empiecen a evacuarlas ahora."],
      ['B', "Copy. How long until the aircraft arrives?", "Recibido. ¿Cuánto falta para que llegue el avión?"],
      ['A', "About fifteen minutes. Keep your crew near the safety zone by the river.", "Unos quince minutos. Mantén a tu equipo cerca de la zona de seguridad junto al río."],
      ['B', "Understood. We'll pull back if the fire jumps the road.", "Entendido. Nos retiraremos si el fuego cruza el camino."],
      ['A', "Good call. Report every ten minutes.", "Buena decisión. Reporta cada diez minutos."]
    ],
    questions: [
      { q: 'Where is the wind coming from?', es: '¿De dónde viene el viento?', o: ['From the south', 'From the north', 'There is no wind'], a: 0 },
      { q: 'What must they do with the houses on the ridge?', es: '¿Qué deben hacer con las casas de la loma?', o: ['Evacuate them', 'Paint them', 'Ignore them'], a: 0 },
      { q: 'Where is the safety zone?', es: '¿Dónde está la zona de seguridad?', o: ['By the river', 'On the ridge', 'In the forest'], a: 0 }
    ] },
  { id: 'f-cpr', topic: 'care', level: 'A2', title: 'Reanimación (RCP)', context: 'Liam enseña RCP a Valentina en un entrenamiento.',
    speakers: { A: ['Liam', 'liam'], B: ['Valentina', 'local'] },
    lines: [
      ['A', "Valentina, the patient is not breathing. What do you do first?", "Valentina, el paciente no respira. ¿Qué haces primero?"],
      ['B', "I call for help and ask for the defibrillator.", "Pido ayuda y pido el desfibrilador."],
      ['A', "Perfect. Now start chest compressions. Hands in the middle of the chest.", "Perfecto. Ahora comienza las compresiones. Manos en el centro del pecho."],
      ['B', "How fast should I push?", "¿Qué tan rápido debo presionar?"],
      ['A', "About two per second. Push hard and let the chest come back up.", "Unas dos por segundo. Presiona fuerte y deja que el pecho vuelva a subir."],
      ['B', "Okay. And when the defibrillator arrives?", "Bien. ¿Y cuando llegue el desfibrilador?"],
      ['A', "Turn it on and follow the voice instructions. Don't stop compressions until it tells you.", "Enciéndelo y sigue las instrucciones de voz. No detengas las compresiones hasta que te lo indique."]
    ],
    questions: [
      { q: 'What does Valentina do first?', es: '¿Qué hace Valentina primero?', o: ['Calls for help and asks for the defibrillator', 'Gives water', 'Moves the patient'], a: 0 },
      { q: 'How fast should she push?', es: '¿Qué tan rápido debe presionar?', o: ['About two per second', 'One per minute', 'As slow as possible'], a: 0 },
      { q: 'What should she do with the defibrillator?', es: '¿Qué debe hacer con el desfibrilador?', o: ['Follow the voice instructions', 'Read the manual first', 'Wait for the doctor'], a: 0 }
    ] },
  { id: 'f-usar', topic: 'training', level: 'B2', title: 'Equipo USAR después de un terremoto', context: 'Tom llega con un equipo internacional y coordina con Andrés, bombero chileno.',
    speakers: { A: ['Andrés', 'local'], B: ['Tom', 'tom'] },
    lines: [
      ['A', "Welcome, Tom. The building on the corner partially collapsed. We think two people are inside.", "Bienvenido, Tom. El edificio de la esquina colapsó parcialmente. Creemos que hay dos personas adentro."],
      ['B', "Thanks. Our search dogs can start right away. Has anyone heard voices?", "Gracias. Nuestros perros de búsqueda pueden empezar de inmediato. ¿Alguien escuchó voces?"],
      ['A', "Yes, a neighbor heard knocking from the ground floor, on the left side.", "Sí, un vecino escuchó golpes desde el primer piso, por el lado izquierdo."],
      ['B', "Good. Before anyone goes in, we need to shore up that wall. It looks unstable.", "Bien. Antes de que alguien entre, hay que apuntalar ese muro. Se ve inestable."],
      ['A', "We have timber for shoring in our truck.", "Tenemos madera para apuntalar en nuestro carro."],
      ['B', "Perfect. We'll mark the building with our search codes so every team knows what's been checked.", "Perfecto. Marcaremos el edificio con nuestros códigos de búsqueda para que todos sepan qué se revisó."]
    ],
    questions: [
      { q: 'How many people may be inside?', es: '¿Cuántas personas podría haber adentro?', o: ['Two', 'Five', 'None'], a: 0 },
      { q: 'What must they do before going in?', es: '¿Qué deben hacer antes de entrar?', o: ['Shore up the wall', 'Wait for the rain', 'Cut the power'], a: 0 },
      { q: 'Why do they mark the building?', es: '¿Por qué marcan el edificio?', o: ['So every team knows what has been checked', 'To decorate it', 'For the insurance'], a: 0 }
    ] },
  { id: 'f-exchange', topic: 'training', level: 'A2', title: 'Intercambio: bomberos voluntarios', context: 'Dan le pregunta a Felipe cómo funcionan los bomberos en Chile.',
    speakers: { A: ['Dan', 'dan'], B: ['Felipe', 'local'] },
    lines: [
      ['A', "Felipe, is it true that all firefighters in Chile are volunteers?", "Felipe, ¿es verdad que todos los bomberos en Chile son voluntarios?"],
      ['B', "Yes, it's true. We don't get paid. We have other jobs.", "Sí, es verdad. No nos pagan. Tenemos otros trabajos."],
      ['A', "Wow. What do you do when there's an emergency at work?", "Guau. ¿Qué haces cuando hay una emergencia en el trabajo?"],
      ['B', "My company usually lets me go. Many bosses respect firefighters.", "Mi empresa normalmente me deja ir. Muchos jefes respetan a los bomberos."],
      ['A', "That's amazing. How often do you train?", "Es increíble. ¿Cada cuánto entrenan?"],
      ['B', "Every week, usually on weekends and some evenings.", "Todas las semanas, normalmente los fines de semana y algunas tardes."]
    ],
    questions: [
      { q: 'Do Chilean firefighters get paid?', es: '¿A los bomberos chilenos les pagan?', o: ['No, they are volunteers', 'Yes, very well', 'Only the chiefs'], a: 0 },
      { q: "What does Felipe's company usually do?", es: '¿Qué hace normalmente la empresa de Felipe?', o: ['Lets him go', 'Fires him', 'Calls the police'], a: 0 },
      { q: 'When do they train?', es: '¿Cuándo entrenan?', o: ['Weekends and some evenings', 'Only in summer', 'Never'], a: 0 }
    ] }
];

// ---------- Fitness ----------
const FIT_CONTEXT = `The learner trains in gyms in Chile and wants to understand and speak fitness English: videos, coaches, articles and conversations with trainers or foreign gym-goers.
Topics: strength training (squat, bench press, deadlift, overhead press, rows, pull-ups), exercise technique, hypertrophy, programming (sets, reps, RPE, RIR, progressive overload, deload, periodization), conditioning and cardio, mobility, warm-up, injury prevention and rehab, recovery and sleep, and nutrition basics (protein, calories, bulking and cutting).`;
const FIT_PERSONAS = {
  jake: { voice: 'alvaro',  name: 'Jake', es: 'Jake, coach de fuerza de EE.UU.', en: 'Jake, an American strength coach (a man) and former powerlifter. Motivating, direct, loves technique and progressive overload. Uses gym slang naturally.', greet: "What's up, I'm Jake. Ready to lift heavy today?" },
  ben:  { voice: 'mattias', name: 'Ben',  es: 'Ben, entrenador personal del Reino Unido', en: 'Ben, a British personal trainer (a man) specialized in hypertrophy and body composition. Friendly, explains the science simply. British English.', greet: "Hiya, I'm Ben. Let's plan your training week." },
  kai:  { voice: 'joel',    name: 'Kai',  es: 'Kai, coach de acondicionamiento de Australia', en: 'Kai, an Australian conditioning and functional fitness coach (a man). High energy, informal, loves circuits and cardio.', greet: "G'day, I'm Kai. Let's get that heart rate up!" },
  mark: { voice: 'paul',    name: 'Mark', es: 'Mark, kinesiólogo deportivo de Canadá', en: 'Mark, a Canadian sports physiotherapist (a man). Calm and precise, focused on mobility, pain, injury prevention and safe return to training.', greet: "Hello, I'm Mark, the physio. How is your body feeling?" }
};
const FIT_SCENARIOS = [
  { group: 'En el gimnasio', id: 'g-squat', es: 'Corregir la técnica de sentadilla', en: 'You coach the learner on the squat: stance, bracing, depth, knees, bar position. Ask what they feel and give cues.' },
  { group: 'En el gimnasio', id: 'g-deadlift', es: 'Peso muerto seguro', en: 'You teach the deadlift: setup, hip hinge, neutral back, bar close to the body, lockout. Check understanding.' },
  { group: 'En el gimnasio', id: 'g-share', es: 'Compartir máquina y pedir spotter', en: 'Casual gym talk: asking how many sets are left, working in, asking for a spot on the bench press, gym etiquette.' },
  { group: 'Planificación', id: 'g-program', es: 'Armar una rutina semanal', en: 'Design a weekly program with the learner: goals, days per week, split, sets, reps, RPE, progressive overload and deload.' },
  { group: 'Planificación', id: 'g-plateau', es: 'Estancado: no subo de peso', en: 'The learner is stuck on a plateau. Ask about sleep, food, volume, intensity and recovery, and suggest changes.' },
  { group: 'Planificación', id: 'g-nutrition', es: 'Nutrición y proteína', en: 'Talk about nutrition for muscle gain or fat loss: calories, protein per day, meal timing, supplements (creatine), hydration.' },
  { group: 'Salud', id: 'g-injury', es: 'Dolor o lesión', en: 'The learner has pain (shoulder, knee or lower back). As a physio, ask questions about the pain and suggest safe modifications. Remind them to see a professional in person.' },
  { group: 'Salud', id: 'g-mobility', es: 'Movilidad y calentamiento', en: 'Plan a good warm-up and mobility routine before lifting: hips, ankles, thoracic spine, shoulders.' },
  { group: 'Salud', id: 'g-cardio', es: 'Cardio y acondicionamiento', en: 'Talk about conditioning: intervals, zone 2, circuits, heart rate, and how to combine cardio with strength training.' }
];
const FIT_PHRASES = {
  fuerza: [
    ["Brace your core before you start the lift.", "Aprieta el abdomen antes de empezar el levantamiento."],
    ["Keep the bar close to your body.", "Mantén la barra cerca del cuerpo."],
    ["Drive through your heels.", "Empuja con los talones."],
    ["Don't lock your knees at the top.", "No bloquees las rodillas arriba."],
    ["Can you spot me on the bench press?", "¿Me puedes asistir en el press de banca?"],
    ["I hit a new personal record today.", "Hoy logré un nuevo récord personal."]
  ],
  programacion: [
    ["Do four sets of eight reps.", "Haz cuatro series de ocho repeticiones."],
    ["Rest two minutes between sets.", "Descansa dos minutos entre series."],
    ["Add a little weight every week.", "Agrega un poco de peso cada semana."],
    ["This set should feel like an RPE of eight.", "Esta serie debería sentirse como un RPE de ocho."],
    ["Next week is a deload week.", "La próxima semana es de descarga."],
    ["I train legs twice a week.", "Entreno piernas dos veces por semana."]
  ],
  tecnica: [
    ["Keep your back neutral.", "Mantén la espalda neutra."],
    ["Push your knees out as you squat down.", "Empuja las rodillas hacia afuera al bajar en la sentadilla."],
    ["Squeeze your shoulder blades together.", "Junta las escápulas."],
    ["Control the weight on the way down.", "Controla el peso al bajar."],
    ["Your hips are rising too fast.", "Tus caderas están subiendo demasiado rápido."],
    ["Breathe in at the bottom and out at the top.", "Inhala abajo y exhala arriba."]
  ],
  nutricion: [
    ["How much protein do you eat per day?", "¿Cuánta proteína comes al día?"],
    ["I'm eating in a small calorie surplus.", "Estoy comiendo con un pequeño superávit calórico."],
    ["She is cutting for a competition.", "Ella está en déficit para una competencia."],
    ["Drink more water during your workout.", "Toma más agua durante tu entrenamiento."],
    ["Creatine is one of the most studied supplements.", "La creatina es uno de los suplementos más estudiados."],
    ["Eat a meal with carbs and protein after training.", "Come algo con carbohidratos y proteína después de entrenar."]
  ],
  salud: [
    ["I feel pain in my lower back when I deadlift.", "Siento dolor en la zona lumbar cuando hago peso muerto."],
    ["Warm up for ten minutes before lifting.", "Calienta diez minutos antes de levantar."],
    ["Sleep is the best recovery tool.", "Dormir es la mejor herramienta de recuperación."],
    ["Stop the exercise if the pain gets sharp.", "Detén el ejercicio si el dolor se vuelve agudo."],
    ["My shoulder feels tight after bench press.", "Siento el hombro apretado después del press de banca."],
    ["Stretch your hip flexors after the session.", "Estira los flexores de cadera después de la sesión."]
  ]
};
const FIT_CATEGORY_NAMES = { fuerza: 'Fuerza', programacion: 'Series y rutinas', tecnica: 'Técnica', nutricion: 'Nutrición', salud: 'Salud y lesiones', errores: 'Mis errores' };
const FIT_CATEGORY_EN = { fuerza: 'strength training and heavy lifts', programacion: 'sets, reps and program design', tecnica: 'exercise technique cues', nutricion: 'nutrition, protein and supplements', salud: 'warm-up, mobility, pain and recovery' };
const FIT_WORDS = [
  ['squat', 'sentadilla'], ['deadlift', 'peso muerto'], ['bench press', 'press de banca'], ['pull-up', 'dominada'], ['row', 'remo'], ['lunge', 'zancada'],
  ['set', 'serie'], ['rep', 'repetición'], ['rest', 'descanso'], ['weight', 'peso'], ['barbell', 'barra'], ['dumbbell', 'mancuerna'],
  ['plate', 'disco'], ['rack', 'rack'], ['bench', 'banca'], ['grip', 'agarre'], ['core', 'core / zona media'], ['glutes', 'glúteos'],
  ['hamstrings', 'isquiotibiales'], ['quads', 'cuádriceps'], ['shoulder', 'hombro'], ['lower back', 'zona lumbar'], ['warm-up', 'calentamiento'], ['stretch', 'estiramiento'],
  ['mobility', 'movilidad'], ['soreness', 'dolor muscular'], ['injury', 'lesión'], ['recovery', 'recuperación'], ['protein', 'proteína'], ['calories', 'calorías'],
  ['bulking', 'volumen'], ['cutting', 'definición'], ['plateau', 'estancamiento'], ['deload', 'descarga'], ['strength', 'fuerza'], ['endurance', 'resistencia']
];
const FIT_LISTEN_TOPICS = { gym: 'En el gimnasio', plan: 'Planificación', health: 'Salud y nutrición' };
const FIT_DIALOGS = [
  { id: 'g-squat-cues', topic: 'gym', level: 'A2', title: 'Técnica de sentadilla', context: 'Jake corrige la sentadilla de Matías.',
    speakers: { A: ['Jake', 'jake'], B: ['Matías', 'local'] },
    lines: [
      ['A', "Nice set, Matías. But your knees are going in at the bottom.", "Buena serie, Matías. Pero tus rodillas se van hacia adentro abajo."],
      ['B', "Really? I didn't notice. What should I do?", "¿En serio? No me di cuenta. ¿Qué debo hacer?"],
      ['A', "Push your knees out, like you're spreading the floor with your feet.", "Empuja las rodillas hacia afuera, como si separaras el piso con los pies."],
      ['B', "Okay. Should I lower the weight?", "Bien. ¿Debería bajar el peso?"],
      ['A', "Yes, drop ten kilos and focus on the technique for now.", "Sí, baja diez kilos y concéntrate en la técnica por ahora."],
      ['B', "Got it. And my breathing?", "Entendido. ¿Y la respiración?"],
      ['A', "Big breath in before you go down, brace your core, and breathe out at the top.", "Toma una gran bocanada antes de bajar, aprieta el abdomen y exhala arriba."]
    ],
    questions: [
      { q: "What is the problem with Matías's squat?", es: '¿Cuál es el problema de la sentadilla?', o: ['His knees go in', 'He goes too fast', 'His grip is wrong'], a: 0 },
      { q: 'How much weight should he remove?', es: '¿Cuánto peso debe quitar?', o: ['Ten kilos', 'Twenty kilos', 'Nothing'], a: 0 },
      { q: 'When should he breathe out?', es: '¿Cuándo debe exhalar?', o: ['At the top', 'At the bottom', 'Never'], a: 0 }
    ] },
  { id: 'g-work-in', topic: 'gym', level: 'A2', title: '¿Puedo alternar contigo?', context: 'Kai le pregunta a Sebastián si puede compartir la máquina.',
    speakers: { A: ['Kai', 'kai'], B: ['Sebastián', 'local'] },
    lines: [
      ['A', "Hey mate, how many sets have you got left?", "Hola amigo, ¿cuántas series te quedan?"],
      ['B', "Just two more. Do you want to work in?", "Solo dos más. ¿Quieres alternar conmigo?"],
      ['A', "That'd be great, thanks. I'm using lighter weight, so I'll change the plates.", "Sería genial, gracias. Uso menos peso, así que cambiaré los discos."],
      ['B', "No problem. Can you spot me on my last set?", "No hay problema. ¿Me puedes asistir en mi última serie?"],
      ['A', "Sure. How many reps are you going for?", "Claro. ¿Cuántas repeticiones vas a hacer?"],
      ['B', "Five, but I might need help on the last one.", "Cinco, pero puede que necesite ayuda en la última."]
    ],
    questions: [
      { q: 'How many sets does Sebastián have left?', es: '¿Cuántas series le quedan a Sebastián?', o: ['Two', 'Five', 'None'], a: 0 },
      { q: 'What does Kai have to change?', es: '¿Qué tiene que cambiar Kai?', o: ['The plates', 'The bench', 'His shoes'], a: 0 },
      { q: 'How many reps will Sebastián do?', es: '¿Cuántas repeticiones hará Sebastián?', o: ['Five', 'Ten', 'Twelve'], a: 0 }
    ] },
  { id: 'g-program', topic: 'plan', level: 'B1', title: 'Armando la rutina', context: 'Ben ayuda a Daniela a planificar su semana de entrenamiento.',
    speakers: { A: ['Ben', 'ben'], B: ['Daniela', 'local'] },
    lines: [
      ['A', "So, Daniela, how many days a week can you train?", "Entonces, Daniela, ¿cuántos días a la semana puedes entrenar?"],
      ['B', "Four days, but only one hour each time.", "Cuatro días, pero solo una hora cada vez."],
      ['A', "Perfect for an upper-lower split. Two upper body days and two lower body days.", "Perfecto para una rutina torso-pierna. Dos días de torso y dos de pierna."],
      ['B', "How many sets should I do for each muscle?", "¿Cuántas series debería hacer por músculo?"],
      ['A', "Start with about ten hard sets per muscle per week, and add more if you recover well.", "Empieza con unas diez series intensas por músculo a la semana, y agrega más si te recuperas bien."],
      ['B', "And how do I know if a set is hard enough?", "¿Y cómo sé si una serie es suficientemente intensa?"],
      ['A', "Stop when you have one or two reps left in the tank. That's the sweet spot.", "Para cuando te queden una o dos repeticiones en reserva. Ese es el punto ideal."]
    ],
    questions: [
      { q: 'How many days can Daniela train?', es: '¿Cuántos días puede entrenar Daniela?', o: ['Four', 'Three', 'Six'], a: 0 },
      { q: 'What kind of split does Ben suggest?', es: '¿Qué tipo de rutina sugiere Ben?', o: ['Upper-lower', 'Full body every day', 'Only cardio'], a: 0 },
      { q: 'When should she stop a set?', es: '¿Cuándo debe terminar una serie?', o: ['With one or two reps left', 'When she feels pain', 'After twenty reps'], a: 0 }
    ] },
  { id: 'g-plateau', topic: 'plan', level: 'B2', title: 'Estancado en press de banca', context: 'Jake analiza con Rodrigo por qué no progresa.',
    speakers: { A: ['Rodrigo', 'local'], B: ['Jake', 'jake'] },
    lines: [
      ['A', "Jake, my bench press has been stuck at eighty kilos for two months.", "Jake, mi press de banca lleva dos meses estancado en ochenta kilos."],
      ['B', "Classic plateau. How are you sleeping?", "Estancamiento clásico. ¿Cómo estás durmiendo?"],
      ['A', "Honestly, about six hours. Work has been crazy.", "Honestamente, unas seis horas. El trabajo ha estado muy intenso."],
      ['B', "That's a big factor. And are you eating enough protein?", "Eso influye mucho. ¿Y estás comiendo suficiente proteína?"],
      ['A', "I think so, but I'm trying to lose some fat at the same time.", "Creo que sí, pero al mismo tiempo estoy tratando de bajar grasa."],
      ['B', "There it is. Being in a deficit with little sleep makes it really hard to get stronger. Let's add a deload week and then change your rep scheme.", "Ahí está. Estar en déficit y dormir poco hace muy difícil ponerse más fuerte. Agreguemos una semana de descarga y luego cambiemos el esquema de repeticiones."]
    ],
    questions: [
      { q: 'How long has Rodrigo been stuck?', es: '¿Hace cuánto está estancado?', o: ['Two months', 'Two weeks', 'One year'], a: 0 },
      { q: 'How many hours does he sleep?', es: '¿Cuántas horas duerme?', o: ['About six', 'About nine', 'About four'], a: 0 },
      { q: 'What does Jake suggest first?', es: '¿Qué sugiere Jake primero?', o: ['A deload week', 'Training every day', 'Stopping protein'], a: 0 }
    ] },
  { id: 'g-shoulder', topic: 'health', level: 'B1', title: 'Dolor de hombro', context: 'Mark, kinesiólogo, conversa con Carolina sobre su hombro.',
    speakers: { A: ['Mark', 'mark'], B: ['Carolina', 'local'] },
    lines: [
      ['A', "Carolina, where exactly do you feel the pain?", "Carolina, ¿dónde exactamente sientes el dolor?"],
      ['B', "In the front of my shoulder, when I lower the bar on the bench press.", "En la parte delantera del hombro, cuando bajo la barra en el press de banca."],
      ['A', "Is it a sharp pain or more like a dull ache?", "¿Es un dolor agudo o más bien una molestia sorda?"],
      ['B', "It's a dull ache, but it gets worse at the end of the session.", "Es una molestia sorda, pero empeora al final de la sesión."],
      ['A', "Try a narrower grip and don't bring the bar so low for now. And add some band work for your upper back.", "Prueba un agarre más cerrado y por ahora no bajes tanto la barra. Y agrega ejercicios con banda para la espalda alta."],
      ['B', "Should I stop training?", "¿Debería dejar de entrenar?"],
      ['A', "Not necessarily. Keep training what doesn't hurt, and if it doesn't improve in two weeks, come and see me.", "No necesariamente. Sigue entrenando lo que no duele, y si no mejora en dos semanas, ven a verme."]
    ],
    questions: [
      { q: 'Where is the pain?', es: '¿Dónde está el dolor?', o: ['In the front of the shoulder', 'In the knee', 'In the lower back'], a: 0 },
      { q: 'What kind of pain is it?', es: '¿Qué tipo de dolor es?', o: ['A dull ache', 'A sharp pain', 'No pain'], a: 0 },
      { q: 'What should she do if it does not improve?', es: '¿Qué debe hacer si no mejora?', o: ['See Mark in two weeks', 'Train heavier', 'Stop eating'], a: 0 }
    ] },
  { id: 'g-protein', topic: 'health', level: 'A2', title: 'Proteína y comidas', context: 'Ben responde las dudas de nutrición de Javiera.',
    speakers: { A: ['Javiera', 'local'], B: ['Ben', 'ben'] },
    lines: [
      ['A', "Ben, how much protein do I need to build muscle?", "Ben, ¿cuánta proteína necesito para ganar músculo?"],
      ['B', "A good target is about one point six to two grams per kilo of body weight each day.", "Una buena meta es de uno coma seis a dos gramos por kilo de peso corporal al día."],
      ['A', "That sounds like a lot. Do I need protein shakes?", "Suena como mucho. ¿Necesito batidos de proteína?"],
      ['B', "Not really. Shakes are just convenient. Eggs, chicken, fish, beans and yogurt work great.", "No realmente. Los batidos solo son prácticos. Huevos, pollo, pescado, porotos y yogur funcionan muy bien."],
      ['A', "And should I eat right after training?", "¿Y debería comer justo después de entrenar?"],
      ['B', "It helps, but your total protein for the day matters much more.", "Ayuda, pero la proteína total del día importa mucho más."]
    ],
    questions: [
      { q: 'What is a good protein target?', es: '¿Cuál es una buena meta de proteína?', o: ['1.6 to 2 grams per kilo per day', '10 grams per day', '5 grams per kilo per hour'], a: 0 },
      { q: 'Are protein shakes necessary?', es: '¿Son necesarios los batidos?', o: ['No, they are just convenient', 'Yes, always', 'Only at night'], a: 0 },
      { q: 'What matters most?', es: '¿Qué importa más?', o: ['Total protein for the day', 'Eating at midnight', 'The brand of the shake'], a: 0 }
    ] }
];

// Avatares de los personajes nuevos
Object.assign(AVATARS, {
  dan:    { bg: '#FF6B8B', skin: '#E3B38E', hair: '#4A3325', hairStyle: 'short', beard: 'mustache', hat: '#D62828', shirt: '#1F2A44', vest: true },
  liam:   { bg: '#3DD68C', skin: '#F4D3B5', hair: '#C9803E', hairStyle: 'short', shirt: '#2E7D32' },
  tom:    { bg: '#F2B705', skin: '#D6A57C', hair: '#6B4A2E', hairStyle: 'messy', beard: 'stubble', hat: '#FF8A3D', shirt: '#E4572E' },
  robert: { bg: '#4DA3FF', skin: '#EBC1A0', hair: '#C4C7CB', hairStyle: 'receding', beard: 'full', hat: '#F4F4F0', shirt: '#1F2A44', blazer: true },
  jake:   { bg: '#FF8A3D', skin: '#C68F66', hair: '#1E1A18', hairStyle: 'short', beard: 'full', shirt: '#26282B' },
  ben:    { bg: '#4DA3FF', skin: '#F1C9A5', hair: '#8A5A34', hairStyle: 'messy', shirt: '#3A7BD5' },
  kai:    { bg: '#FF6B8B', skin: '#D6A57C', hair: '#E3C16F', hairStyle: 'messy', beard: 'stubble', shirt: '#2EC4B6' },
  mark:   { bg: '#2EC4B6', skin: '#EBC1A0', hair: '#4A3325', hairStyle: 'receding', glasses: true, shirt: '#F4F4F0' }
});

const TOPICS = {
  mill: {
    id: 'mill', icon: '🪵', name: 'Aserradero', nameEn: 'mixed sawmill topics',
    setting: 'You are visiting a sawmill in Chile.', learner: 'a Chilean sawmill worker at Rumasal',
    vocabHint: 'Use real sawmill vocabulary when it fits (saw blades, edger, trimmer, kiln, conveyor, bearings, PLC, lockout, shift, downtime...).',
    wordsLabel: 'Vocabulario del aserradero',
    context: MILL_CONTEXT, personas: MILL_PERSONAS, scenarios: MILL_SCENARIOS, phrases: MILL_PHRASES,
    categoryNames: MILL_CATEGORY_NAMES, categoryEn: {}, words: MILL_WORDS, dialogs: MILL_DIALOGS, listenTopics: MILL_LISTEN_TOPICS,
    locals: 'a real Rumasal person from the list above, chosen to fit the topic',
    aiTopics: [
      ['the new USNR edger with the BioLuma scanner', 'Canteadora nueva y scanner BioLuma'],
      ['the sawmill upgrade: removing the return line, double infeed, two primary machines, two chipper canters', 'Upgrade del aserradero'],
      ['increasing production from 28,000 to 45,000 cubic meters, bottlenecks and planning', 'Aumento de producción a 45.000 m³'],
      ['troubleshooting a machine breakdown with a USNR technician', 'Falla de una máquina'],
      ['safety during installation and maintenance', 'Seguridad'],
      ['log yard, debarker, trimmer, sorter bins, stacker, strapping, anti-sapstain dip and end painting', 'Equipos de la planta'],
      ['a supervisors and managers meeting with the machinery supplier', 'Supervisión y jefatura'],
      ['casual conversation with visiting technicians', 'Conversación casual']
    ]
  },
  fire: {
    id: 'fire', icon: '🚒', name: 'Bomberos y emergencias', nameEn: 'firefighting and emergency response',
    setting: 'You are working with Chilean volunteer firefighters in an international training or a real emergency.', learner: 'a Chilean volunteer firefighter',
    vocabHint: 'Use real firefighting and emergency vocabulary when it fits (SCBA, hose line, nozzle, size-up, primary search, extrication, triage, mayday, incident command...).',
    wordsLabel: 'Vocabulario de bomberos',
    context: FIRE_CONTEXT, personas: FIRE_PERSONAS, scenarios: FIRE_SCENARIOS, phrases: FIRE_PHRASES,
    categoryNames: FIRE_CATEGORY_NAMES, categoryEn: FIRE_CATEGORY_EN, words: FIRE_WORDS, dialogs: FIRE_DIALOGS, listenTopics: FIRE_LISTEN_TOPICS,
    locals: 'a Chilean volunteer firefighter (invent a common Chilean first name)',
    aiTopics: [
      ['a structural house fire: size-up, attack line, search and ventilation', 'Incendio estructural'],
      ['vehicle extrication at a car crash', 'Rescate vehicular'],
      ['a wildland fire near houses in the Chilean summer', 'Incendio forestal'],
      ['first aid, CPR and trauma care', 'Primeros auxilios'],
      ['a hazardous materials leak', 'Materiales peligrosos'],
      ['an international USAR team after an earthquake', 'Terremoto y USAR'],
      ['radio communication and incident command', 'Radio y mando'],
      ['an international exchange between fire departments', 'Intercambio internacional']
    ]
  },
  fit: {
    id: 'fit', icon: '🏋️', name: 'Fitness', nameEn: 'strength training and fitness',
    setting: 'You are at a gym, talking with a Chilean person who trains regularly.', learner: 'a Chilean gym-goer who does strength training',
    vocabHint: 'Use real gym and training vocabulary when it fits (sets, reps, RPE, progressive overload, brace, hip hinge, deload, PR, spot, cutting, bulking...).',
    wordsLabel: 'Vocabulario de fitness',
    context: FIT_CONTEXT, personas: FIT_PERSONAS, scenarios: FIT_SCENARIOS, phrases: FIT_PHRASES,
    categoryNames: FIT_CATEGORY_NAMES, categoryEn: FIT_CATEGORY_EN, words: FIT_WORDS, dialogs: FIT_DIALOGS, listenTopics: FIT_LISTEN_TOPICS,
    locals: 'a Chilean gym-goer (invent a common Chilean first name)',
    aiTopics: [
      ['squat, bench press and deadlift technique', 'Técnica de los básicos'],
      ['designing a weekly training program', 'Armar una rutina'],
      ['breaking a strength plateau', 'Estancamiento'],
      ['nutrition, protein and supplements', 'Nutrición'],
      ['shoulder, knee or lower back pain and safe training', 'Dolor y lesiones'],
      ['warm-up and mobility', 'Movilidad'],
      ['cardio, intervals and conditioning', 'Cardio y acondicionamiento'],
      ['casual talk and etiquette at the gym', 'Charla en el gimnasio']
    ]
  }
};

// Tema activo del usuario actual (se elige en Inicio)
const TOPIC_ID = (() => {
  try {
    const p = JSON.parse(localStorage.getItem('me_profiles') || 'null');
    const u = p && p.list && p.list.find(x => x.id === p.current);
    return (u && TOPICS[u.topic]) ? u.topic : 'mill';
  } catch { return 'mill'; }
})();
const TOPIC = TOPICS[TOPIC_ID];
const PHRASES = TOPIC.phrases, CATEGORY_NAMES = TOPIC.categoryNames, WORDS = TOPIC.words, SCENARIOS = TOPIC.scenarios.slice(),
  PERSONAS = TOPIC.personas, DIALOGS = TOPIC.dialogs, LISTEN_TOPICS = TOPIC.listenTopics, CONTEXT = TOPIC.context;
