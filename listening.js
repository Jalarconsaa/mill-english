// Contexto real de la planta, usado también por la IA
const MILL_CONTEXT = `The mill is Aserradero Rumasal, a sawmill in Chile that processes radiata pine. Its machinery supplier is USNR, a company with engineers and technicians in the United States, Canada and Sweden.
Soon the mill will install a NEW EDGER (edger upgrade) with a USNR BioLuma scanner for quality/grade scanning (3D laser profiles and color vision, used by the optimizer to decide the best width and grade of each board).
In about two years there will be a big SAWMILL UPGRADE: removing the return (recirculation) line, adding a double log infeed, two primary breakdown machines and two chipper canters. The goal is to increase production from 28,000 to 45,000 cubic meters.
REAL PEOPLE AT RUMASAL (use these names when you mention coworkers): Mauro (plant manager), Rubén (sawmill manager), Luis (production planner), Juan and Rodrigo (shift supervisors), Pedro, Martín, Eduardo and Francisco (main line and edger operators), Mauricio and Ramón (resaw operators), Diego and Adolfo (trimmer operators), Osvaldo (stacker operator), Claudio and Moisés (debarker operators), Marco (green lumber dispatch, end painting and anti-sapstain dip), Michel (maintenance manager), Pablo, Gustavo, Dennis and Samuel (electricians), Maurizio, Marcelo, Miguel and Pelayo (mechanics), Myriam (warehouse manager), Beltrán, Ravanal and Erwin (saw shop / saw filing room).
USNR PEOPLE: Mattias and Joel (Swedish technicians), Álvaro (Canadian technician who also speaks Spanish), Paul (Swedish project manager), and other USNR technicians: Krim, Lenan, Andrew and Jonathan.`;

// Voces: mattias y joel (suecos), alvaro (Canadá), paul (jefe de proyecto), local (chileno)
const MILL_LISTEN_TOPICS = { edger: 'Canteadora USNR', upgrade: 'Upgrade del aserradero', ops: 'Operación y seguridad', social: 'Social' };

const MILL_DIALOGS = [
  { id: 'edger-arrival', topic: 'edger', level: 'B1', title: 'Llega la nueva canteadora',
    context: 'Álvaro, técnico de USNR, coordina con Rubén, jefe de aserradero, la llegada de la canteadora.',
    speakers: { A: ['Álvaro', 'alvaro'], B: ['Rubén', 'local'] },
    lines: [
      ['A', "Morning, Rubén. The trucks with the new edger left the port yesterday.", "Buenos días, Rubén. Los camiones con la canteadora nueva salieron del puerto ayer."],
      ['B', "Great news. When do you think they'll get here?", "Excelente noticia. ¿Cuándo crees que llegarán?"],
      ['A', "Probably Thursday morning. We'll need a crane and a clear area near the building.", "Probablemente el jueves en la mañana. Necesitaremos una grúa y un área despejada cerca del edificio."],
      ['B', "No problem. We can use the space next to the log yard.", "No hay problema. Podemos usar el espacio al lado de la cancha de rollizos."],
      ['A', "Perfect. The scanner frame comes in a separate box. Please keep it dry.", "Perfecto. El marco del escáner viene en una caja aparte. Por favor mantenla seca."],
      ['B', "Understood. How long will the installation take?", "Entendido. ¿Cuánto tomará la instalación?"],
      ['A', "About three weeks, and then one week of start-up and tuning.", "Unas tres semanas, y luego una semana de puesta en marcha y ajuste."],
      ['B', "Okay. I'll ask Luis, our planner, to schedule the shutdown.", "Bien. Le pediré a Luis, nuestro planificador, que programe la detención."]
    ],
    questions: [
      { q: 'When will the trucks probably arrive?', es: '¿Cuándo llegarán probablemente los camiones?', o: ['Thursday morning', 'Tomorrow night', 'Next month'], a: 0 },
      { q: 'What must be kept dry?', es: '¿Qué hay que mantener seco?', o: ['The saw blades', 'The scanner frame', 'The crane'], a: 1 },
      { q: 'How long is the installation?', es: '¿Cuánto dura la instalación?', o: ['One week', 'About three weeks', 'Two months'], a: 1 }
    ] },

  { id: 'bioluma-what', topic: 'edger', level: 'B1', title: '¿Qué hace el scanner BioLuma?',
    context: 'Joel, especialista en scanners de USNR, le explica el scanner a Martín, operador de canteadora.',
    speakers: { A: ['Joel', 'joel'], B: ['Martín', 'local'] },
    lines: [
      ['B', "Joel, what exactly does the new scanner do?", "Joel, ¿qué hace exactamente el escáner nuevo?"],
      ['A', "It scans every board before the edger. The sensors use lasers to measure the shape in 3D.", "Escanea cada tabla antes de la canteadora. Los sensores usan láseres para medir la forma en 3D."],
      ['A', "They also take color pictures, so the system can see knots, splits and stains.", "También toman fotos a color, así el sistema puede ver nudos, rajaduras y manchas."],
      ['B', "And then who decides where to cut?", "¿Y después quién decide dónde cortar?"],
      ['A', "The optimizer. It calculates the most valuable width and grade for each board.", "El optimizador. Calcula el ancho y el grado de mayor valor para cada tabla."],
      ['B', "So I don't have to choose the width anymore?", "¿O sea que ya no tengo que elegir el ancho?"],
      ['A', "Right. Your job is to watch the flow, check the screens and react to alarms.", "Así es. Tu trabajo es vigilar el flujo, revisar las pantallas y reaccionar a las alarmas."],
      ['B', "Sounds easier, but I'll need good training.", "Suena más fácil, pero voy a necesitar una buena capacitación."]
    ],
    questions: [
      { q: 'What do the lasers measure?', es: '¿Qué miden los láseres?', o: ['The shape of the board in 3D', 'The temperature', 'The speed of the saw'], a: 0 },
      { q: 'Why does the scanner take color pictures?', es: '¿Para qué toma fotos a color?', o: ['To print labels', 'To see knots, splits and stains', 'To count the operators'], a: 1 },
      { q: "What is Martín's new job?", es: '¿Cuál es el nuevo trabajo de Martín?', o: ['Choosing the width of every board', 'Watching the flow and reacting to alarms', 'Changing the saws every hour'], a: 1 }
    ] },

  { id: 'scanner-calibration', topic: 'edger', level: 'B2', title: 'Calibración del scanner',
    context: 'Mattias le enseña a Pablo, eléctrico, la rutina de calibración y limpieza.',
    speakers: { A: ['Mattias', 'mattias'], B: ['Pablo', 'local'] },
    lines: [
      ['A', "Pablo, the scanner is only as good as its calibration. We need to check it once a week.", "Pablo, el escáner es tan bueno como su calibración. Tenemos que revisarla una vez a la semana."],
      ['B', "What do we use for that?", "¿Qué usamos para eso?"],
      ['A', "A calibration target. You put it on the transport, run it through, and the software compares the readings.", "Un patrón de calibración. Lo pones en el transporte, lo haces pasar, y el software compara las lecturas."],
      ['B', "And if the readings are off?", "¿Y si las lecturas están desviadas?"],
      ['A', "First, clean the windows on the sensors. Sawdust and pitch are the usual suspects.", "Primero, limpia las ventanas de los sensores. El aserrín y la resina son los sospechosos habituales."],
      ['A', "Use the cloth and the cleaner we left in the cabinet. Never use a wire brush.", "Usa el paño y el limpiador que dejamos en el gabinete. Nunca uses una escobilla de acero."],
      ['B', "Got it. What about the air supply?", "Entendido. ¿Y el suministro de aire?"],
      ['A', "Check that the air purge is on. It keeps dust away from the lenses. If it still fails, call us.", "Revisa que el aire de purga esté encendido. Mantiene el polvo lejos de los lentes. Si aún falla, llámanos."]
    ],
    questions: [
      { q: 'How often should they check the calibration?', es: '¿Cada cuánto deben revisar la calibración?', o: ['Every day', 'Once a week', 'Once a year'], a: 1 },
      { q: 'What should they do first if the readings are off?', es: '¿Qué deben hacer primero si las lecturas están desviadas?', o: ['Call USNR', 'Clean the sensor windows', 'Change the saws'], a: 1 },
      { q: 'What should they never use?', es: '¿Qué nunca deben usar?', o: ['A wire brush', 'A cloth', 'Compressed air'], a: 0 }
    ] },

  { id: 'operator-training', topic: 'edger', level: 'A2', title: 'Capacitación de operadores',
    context: 'Álvaro capacita a Pedro, operador principal de línea, en la pantalla de la canteadora.',
    speakers: { A: ['Álvaro', 'alvaro'], B: ['Pedro', 'local'] },
    lines: [
      ['A', "Pedro, this is the main screen. Green means the line is running.", "Pedro, esta es la pantalla principal. Verde significa que la línea está funcionando."],
      ['B', "And red?", "¿Y rojo?"],
      ['A', "Red is an alarm. Read the message first, then press this button to see details.", "Rojo es una alarma. Primero lee el mensaje, luego aprieta este botón para ver detalles."],
      ['B', "Can I change the settings?", "¿Puedo cambiar la configuración?"],
      ['A', "No. Only the supervisor changes the settings. You can stop the line if there is a problem.", "No. Solo el supervisor cambia la configuración. Tú puedes detener la línea si hay un problema."],
      ['B', "Okay. Where is the emergency stop?", "Bien. ¿Dónde está la parada de emergencia?"],
      ['A', "Here, and there is another one next to the edger infeed.", "Aquí, y hay otra al lado de la entrada de la canteadora."],
      ['B', "Thank you, Álvaro. Can we practice again tomorrow?", "Gracias, Álvaro. ¿Podemos practicar de nuevo mañana?"]
    ],
    questions: [
      { q: 'What does green mean?', es: '¿Qué significa verde?', o: ['There is an alarm', 'The line is running', 'The shift is over'], a: 1 },
      { q: 'Who can change the settings?', es: '¿Quién puede cambiar la configuración?', o: ['Only the supervisor', 'All operators', 'Nobody'], a: 0 },
      { q: 'Where is the second emergency stop?', es: '¿Dónde está la segunda parada de emergencia?', o: ['In the office', 'Next to the edger infeed', 'At the log yard'], a: 1 }
    ] },

  { id: 'startup-day', topic: 'edger', level: 'B1', title: 'Primer día de puesta en marcha',
    context: 'Primer día con madera. Mattias y Juan, supervisor, revisan problemas.',
    speakers: { A: ['Mattias', 'mattias'], B: ['Juan', 'local'] },
    lines: [
      ['B', "Mattias, some boards are coming in crooked to the edger.", "Mattias, algunas tablas están entrando chuecas a la canteadora."],
      ['A', "Yes, I saw that. The positioning chains need a small adjustment.", "Sí, lo vi. Las cadenas de posicionamiento necesitan un pequeño ajuste."],
      ['B', "Should we stop the line?", "¿Deberíamos detener la línea?"],
      ['A', "Let's run twenty more boards first. I want to collect more data.", "Primero pasemos veinte tablas más. Quiero juntar más datos."],
      ['B', "Okay. Also, Eduardo says one saw is not moving to the right width.", "Bien. Además, Eduardo dice que una sierra no se mueve al ancho correcto."],
      ['A', "That could be the positioner. I'll check the feedback signal on the PLC.", "Eso podría ser el posicionador. Revisaré la señal de retroalimentación en el PLC."],
      ['B', "Do you need anything from maintenance?", "¿Necesitas algo de mantención?"],
      ['A', "Yes, please ask Michel for an electrician and a lockout at the end of the shift.", "Sí, por favor pídele a Michel un eléctrico y un bloqueo al final del turno."]
    ],
    questions: [
      { q: 'What problem does Juan report first?', es: '¿Qué problema reporta Juan primero?', o: ['Boards coming in crooked', 'The scanner is broken', 'No logs'], a: 0 },
      { q: 'Why does Mattias want to run twenty more boards?', es: '¿Por qué Mattias quiere pasar veinte tablas más?', o: ['To finish the order', 'To collect more data', 'To test the chipper'], a: 1 },
      { q: 'What does Mattias need at the end of the shift?', es: '¿Qué necesita Mattias al final del turno?', o: ['A forklift', 'An electrician and a lockout', 'A new scanner'], a: 1 }
    ] },

  { id: 'wane-grade', topic: 'edger', level: 'B2', title: 'Arista faltante (wane) y grado',
    context: 'Joel conversa con Luis, el planificador, sobre lo que pide el cliente de exportación.',
    speakers: { A: ['Joel', 'joel'], B: ['Luis', 'local'] },
    lines: [
      ['B', "Joel, our export customer is complaining about too much wane on the boards.", "Joel, nuestro cliente de exportación reclama que hay demasiada arista faltante en las tablas."],
      ['A', "We can tighten the wane allowance in the optimizer, but you'll lose some recovery.", "Podemos ajustar la tolerancia de arista en el optimizador, pero perderán algo de rendimiento."],
      ['B', "How much are we talking about?", "¿De cuánto estamos hablando?"],
      ['A', "It depends on your logs. Let's run a test for one shift and compare the numbers.", "Depende de sus rollizos. Hagamos una prueba de un turno y comparemos los números."],
      ['B', "Can we have different rules for different products?", "¿Podemos tener reglas distintas para productos distintos?"],
      ['A', "Absolutely. Each product has its own grade rules. The export boards can be stricter.", "Por supuesto. Cada producto tiene sus propias reglas de grado. Las tablas de exportación pueden ser más exigentes."],
      ['B', "Great. And the domestic market can accept a bit more wane.", "Excelente. Y el mercado nacional puede aceptar un poco más de arista."],
      ['A', "Exactly. That's how you get the best value from every log.", "Exacto. Así se obtiene el mejor valor de cada rollizo."]
    ],
    questions: [
      { q: 'What is the customer complaining about?', es: '¿De qué reclama el cliente?', o: ['Too much wane', 'Wrong color', 'Late delivery'], a: 0 },
      { q: 'What is the downside of tightening the wane allowance?', es: '¿Cuál es la desventaja de ajustar la tolerancia?', o: ['More noise', 'Losing some recovery', 'Slower trucks'], a: 1 },
      { q: 'What does Joel suggest?', es: '¿Qué sugiere Joel?', o: ['A one-shift test', 'Buying new logs', 'Stopping exports'], a: 0 }
    ] },

  { id: 'remote-support', topic: 'edger', level: 'B1', title: 'Soporte remoto',
    context: 'Rodrigo, supervisor, llama a Joel, que está en la oficina de USNR en Suecia, por una alarma.',
    speakers: { A: ['Rodrigo', 'local'], B: ['Joel', 'joel'] },
    lines: [
      ['A', "Hi Joel, this is Rodrigo from Rumasal in Chile. We have an alarm on the edger optimizer.", "Hola Joel, habla Rodrigo de Rumasal, en Chile. Tenemos una alarma en el optimizador de la canteadora."],
      ['B', "Hi Rodrigo. What does the message say?", "Hola Rodrigo. ¿Qué dice el mensaje?"],
      ['A', "It says 'scanner communication lost', and the line stopped.", "Dice 'se perdió la comunicación con el escáner', y la línea se detuvo."],
      ['B', "Okay. Can you open the remote connection so I can log in?", "Bien. ¿Puedes abrir la conexión remota para que pueda entrar?"],
      ['A', "Sure, give me two minutes. The IT guy is coming.", "Claro, dame dos minutos. Viene el de informática."],
      ['B', "While you wait, can you check if the network cable on the scanner frame is loose?", "Mientras esperas, ¿puedes revisar si el cable de red del marco del escáner está suelto?"],
      ['A', "You were right. The cable was loose. I plugged it back in.", "Tenías razón. El cable estaba suelto. Lo conecté de nuevo."],
      ['B', "Good. Reset the alarm and let me know if it happens again.", "Bien. Reinicia la alarma y avísame si vuelve a pasar."]
    ],
    questions: [
      { q: 'What does the alarm say?', es: '¿Qué dice la alarma?', o: ['Low oil pressure', 'Scanner communication lost', 'Saw overheating'], a: 1 },
      { q: 'Who is coming to help with the remote connection?', es: '¿Quién viene a ayudar con la conexión remota?', o: ['The IT guy', 'The manager', 'The electrician'], a: 0 },
      { q: 'What was the problem?', es: '¿Cuál era el problema?', o: ['A broken sensor', 'A loose network cable', 'No power'], a: 1 }
    ] },

  { id: 'upgrade-kickoff', topic: 'upgrade', level: 'B2', title: 'Reunión de inicio del upgrade',
    context: 'Paul (USNR) y Mauro, gerente de planta, presentan el proyecto de upgrade.',
    speakers: { A: ['Mauro', 'local'], B: ['Paul', 'paul'] },
    lines: [
      ['A', "Welcome, everyone. Paul, could you give us an overview of the upgrade project?", "Bienvenidos a todos. Paul, ¿podrías darnos una visión general del proyecto de upgrade?"],
      ['B', "Of course. The goal is to increase production from twenty-eight thousand to forty-five thousand cubic meters.", "Por supuesto. La meta es aumentar la producción de veintiocho mil a cuarenta y cinco mil metros cúbicos."],
      ['B', "To do that, we'll remove the return line and install a double log infeed.", "Para lograrlo, eliminaremos la línea de retorno e instalaremos una doble entrada de rollizos."],
      ['B', "There will be two primary breakdown machines and two chipper canters.", "Habrá dos máquinas principales de aserrío y dos chipper canter."],
      ['A', "What is the timeline?", "¿Cuál es el cronograma?"],
      ['B', "Engineering starts this year. The main installation will be in about two years.", "La ingeniería empieza este año. La instalación principal será en unos dos años."],
      ['A', "And how long will the mill be down?", "¿Y cuánto tiempo estará detenido el aserradero?"],
      ['B', "We're planning to do most of the work in phases to keep the shutdown as short as possible.", "Planeamos hacer la mayor parte del trabajo por etapas para que la detención sea lo más corta posible."]
    ],
    questions: [
      { q: 'What is the production goal?', es: '¿Cuál es la meta de producción?', o: ['From 28,000 to 45,000 cubic meters', 'From 45,000 to 60,000 cubic meters', 'From 20,000 to 28,000 cubic meters'], a: 0 },
      { q: 'What will be removed?', es: '¿Qué se eliminará?', o: ['The kiln', 'The return line', 'The log yard'], a: 1 },
      { q: 'How will they keep the shutdown short?', es: '¿Cómo mantendrán corta la detención?', o: ['By working in phases', 'By working only at night', 'By buying a second mill'], a: 0 }
    ] },

  { id: 'why-remove-return', topic: 'upgrade', level: 'B1', title: '¿Por qué eliminar el retorno?',
    context: 'Juan, supervisor, le pregunta a Paul por qué el retorno es un problema.',
    speakers: { A: ['Juan', 'local'], B: ['Paul', 'paul'] },
    lines: [
      ['A', "Paul, why do we need to remove the return line?", "Paul, ¿por qué tenemos que eliminar la línea de retorno?"],
      ['B', "Right now, many pieces go back to the same machine for a second cut. That slows everything down.", "Ahora, muchas piezas vuelven a la misma máquina para un segundo corte. Eso hace todo más lento."],
      ['A', "Yes, the headrig is always waiting for pieces to come back.", "Sí, la máquina principal siempre está esperando que vuelvan piezas."],
      ['B', "Exactly. The return is your bottleneck. With the new layout, the wood will flow in one direction.", "Exacto. El retorno es su cuello de botella. Con el nuevo layout, la madera fluirá en una sola dirección."],
      ['A', "So no piece goes backwards?", "¿O sea que ninguna pieza va hacia atrás?"],
      ['B', "That's the idea. Straight flow means more pieces per minute and fewer jams.", "Esa es la idea. Flujo directo significa más piezas por minuto y menos atascos."],
      ['A', "That also sounds safer for the operators.", "Eso también suena más seguro para los operadores."],
      ['B', "It is. Less handling, fewer transfers, fewer risks.", "Lo es. Menos manipulación, menos transferencias, menos riesgos."]
    ],
    questions: [
      { q: 'What is the problem with the return line?', es: '¿Cuál es el problema con el retorno?', o: ['Pieces go back and slow everything down', 'It is too cheap', 'It makes chips'], a: 0 },
      { q: 'How will the wood flow in the new layout?', es: '¿Cómo fluirá la madera en el nuevo layout?', o: ['In a circle', 'In one direction', 'By truck'], a: 1 },
      { q: 'What extra benefit does Juan mention?', es: '¿Qué beneficio adicional menciona Juan?', o: ['It is safer', 'It is quieter at night', 'It uses less paint'], a: 0 }
    ] },

  { id: 'double-infeed', topic: 'upgrade', level: 'B1', title: 'Doble entrada de madera',
    context: 'Mattias le explica a Rodrigo, supervisor, cómo funcionará la doble entrada de rollizos.',
    speakers: { A: ['Mattias', 'mattias'], B: ['Rodrigo', 'local'] },
    lines: [
      ['B', "Mattias, how will the double infeed work?", "Mattias, ¿cómo funcionará la doble entrada?"],
      ['A', "The logs will be sorted by diameter in the log yard. Small logs go to one line, large logs to the other.", "Los rollizos se clasificarán por diámetro en la cancha. Los chicos van a una línea y los grandes a la otra."],
      ['B', "So each line is designed for a range of diameters?", "¿O sea que cada línea está diseñada para un rango de diámetros?"],
      ['A', "Yes. That way each machine runs at its best speed and cutting pattern.", "Sí. Así cada máquina funciona a su mejor velocidad y patrón de corte."],
      ['B', "What happens if one line stops?", "¿Qué pasa si una línea se detiene?"],
      ['A', "The other one keeps running. You won't lose all your production.", "La otra sigue funcionando. No perderán toda la producción."],
      ['B', "That's a big improvement. Today, when the headrig stops, everything stops.", "Es una gran mejora. Hoy, cuando se detiene la máquina principal, se detiene todo."],
      ['A', "Exactly. Two lines give you flexibility.", "Exacto. Dos líneas les dan flexibilidad."]
    ],
    questions: [
      { q: 'How will the logs be sorted?', es: '¿Cómo se clasificarán los rollizos?', o: ['By color', 'By diameter', 'By weight of the truck'], a: 1 },
      { q: 'What happens if one line stops?', es: '¿Qué pasa si una línea se detiene?', o: ['Everything stops', 'The other line keeps running', 'The logs go back to the forest'], a: 1 },
      { q: 'What do two lines give the mill?', es: '¿Qué le dan dos líneas al aserradero?', o: ['Flexibility', 'More noise', 'Fewer workers'], a: 0 }
    ] },

  { id: 'chipper-canters', topic: 'upgrade', level: 'B2', title: 'Los chipper canter',
    context: 'Mattias conversa con Michel, jefe de mantención, sobre los chipper canter.',
    speakers: { A: ['Michel', 'local'], B: ['Mattias', 'mattias'] },
    lines: [
      ['A', "Mattias, what exactly will the chipper canters do?", "Mattias, ¿qué harán exactamente los chipper canter?"],
      ['B', "They turn the outside of the log into chips and leave flat faces, so the log becomes a cant.", "Convierten la parte exterior del rollizo en astillas y dejan caras planas, así el rollizo queda como un cant."],
      ['A', "So no more slabs going to the chipper?", "¿O sea que ya no van más lampazos al chipeador?"],
      ['B', "Much less. The chips go straight to the conveyor and then to the chip pile.", "Mucho menos. Las astillas van directo al transportador y luego a la pila de astillas."],
      ['A', "What about maintenance? How often do we change the knives?", "¿Y la mantención? ¿Cada cuánto cambiamos los cuchillos?"],
      ['B', "It depends on the wood and on dirt in the bark. We'll set up a knife change schedule together.", "Depende de la madera y de la tierra en la corteza. Armaremos juntos un programa de cambio de cuchillos."],
      ['A', "Then Beltrán and the saw shop team will need a good knife grinder.", "Entonces Beltrán y el equipo del taller de sierras van a necesitar una buena afiladora de cuchillos."],
      ['B', "Definitely. Sharp knives mean better chip quality and less power.", "Definitivamente. Cuchillos afilados significan mejor calidad de astilla y menos consumo de energía."]
    ],
    questions: [
      { q: 'What do chipper canters produce?', es: '¿Qué producen los chipper canter?', o: ['Chips and flat faces', 'Sawdust only', 'Finished boards'], a: 0 },
      { q: 'What does knife life depend on?', es: '¿De qué depende la vida de los cuchillos?', o: ['The wood and dirt in the bark', 'The weather only', 'The color of the logs'], a: 0 },
      { q: 'What do sharp knives give?', es: '¿Qué dan los cuchillos afilados?', o: ['More noise', 'Better chip quality and less power', 'More sawdust'], a: 1 }
    ] },

  { id: 'capacity-bottleneck', topic: 'upgrade', level: 'C1', title: 'Capacidad y cuellos de botella',
    context: 'Paul y Mauro, gerente de planta, analizan si el resto de la planta aguantará 45.000 m³.',
    speakers: { A: ['Mauro', 'local'], B: ['Paul', 'paul'] },
    lines: [
      ['A', "Paul, if the primary breakdown gets faster, won't the bottleneck just move downstream?", "Paul, si el aserrío principal se hace más rápido, ¿no se moverá el cuello de botella más adelante?"],
      ['B', "That's the right question. We've modeled the whole flow: edger, trimmer, sorter and stacker.", "Esa es la pregunta correcta. Modelamos todo el flujo: canteadora, trimmer, clasificadora y stacker."],
      ['B', "The new edger will cope, but the trimmer will be running close to its limit.", "La canteadora nueva dará abasto, pero el trimmer funcionará cerca de su límite."],
      ['A', "What about the kilns? We're already struggling with drying capacity.", "¿Y los secadores? Ya estamos complicados con la capacidad de secado."],
      ['B', "Kilns are outside our scope, but you'll definitely need more drying capacity for forty-five thousand.", "Los secadores están fuera de nuestro alcance, pero definitivamente necesitarán más capacidad de secado para cuarenta y cinco mil."],
      ['A', "And log supply. We'll have to secure more volume from the forest.", "Y el abastecimiento de rollizos. Tendremos que asegurar más volumen desde el bosque."],
      ['B', "Exactly. The upgrade only pays off if the whole chain keeps up.", "Exacto. El upgrade solo se paga si toda la cadena acompaña."],
      ['A', "Let's put together a list of risks and owners before the next meeting.", "Armemos una lista de riesgos y responsables antes de la próxima reunión."]
    ],
    questions: [
      { q: 'Which machine will run close to its limit?', es: '¿Qué máquina funcionará cerca de su límite?', o: ['The trimmer', 'The debarker', 'The chipper'], a: 0 },
      { q: 'What is outside USNR\'s scope?', es: '¿Qué está fuera del alcance de USNR?', o: ['The edger', 'The kilns', 'The sorter'], a: 1 },
      { q: 'What will they prepare before the next meeting?', es: '¿Qué prepararán antes de la próxima reunión?', o: ['A list of risks and owners', 'A party', 'A new price list'], a: 0 }
    ] },

  { id: 'shutdown-plan', topic: 'upgrade', level: 'B2', title: 'Plan de detención del upgrade',
    context: 'Paul y Rubén, jefe de aserradero, planifican las etapas de la detención.',
    speakers: { A: ['Paul', 'paul'], B: ['Rubén', 'local'] },
    lines: [
      ['A', "Rubén, we'd like to split the installation into three phases.", "Rubén, nos gustaría dividir la instalación en tres etapas."],
      ['B', "Okay. What happens in each phase?", "Bien. ¿Qué pasa en cada etapa?"],
      ['A', "Phase one is foundations and electrical work while the mill is still running.", "La etapa uno son las fundaciones y el trabajo eléctrico mientras el aserradero sigue funcionando."],
      ['A', "Phase two is the main shutdown: we remove the return and install the new machines.", "La etapa dos es la detención principal: sacamos el retorno e instalamos las máquinas nuevas."],
      ['B', "And phase three?", "¿Y la etapa tres?"],
      ['A', "Start-up and ramp-up. Production increases step by step over a few months.", "Puesta en marcha y aumento de producción. La producción sube paso a paso durante algunos meses."],
      ['B', "We'll need a safety plan for all the contractors on site.", "Vamos a necesitar un plan de seguridad para todos los contratistas en terreno."],
      ['A', "Agreed. Nobody starts work without a permit and a safety induction.", "De acuerdo. Nadie empieza a trabajar sin permiso y sin inducción de seguridad."]
    ],
    questions: [
      { q: 'How many phases are there?', es: '¿Cuántas etapas hay?', o: ['Two', 'Three', 'Five'], a: 1 },
      { q: 'What happens during phase two?', es: '¿Qué pasa en la etapa dos?', o: ['Foundations', 'The main shutdown and installation', 'Training only'], a: 1 },
      { q: 'What does every contractor need before starting?', es: '¿Qué necesita cada contratista antes de empezar?', o: ['A permit and a safety induction', 'A new truck', 'An English test'], a: 0 }
    ] },

  { id: 'critical-spares', topic: 'ops', level: 'B1', title: 'Repuestos críticos',
    context: 'Joel revisa con Myriam, jefa de bodega, los repuestos para la canteadora.',
    speakers: { A: ['Myriam', 'local'], B: ['Joel', 'joel'] },
    lines: [
      ['A', "Joel, which spare parts should we keep in the warehouse for the new edger?", "Joel, ¿qué repuestos deberíamos tener en bodega para la canteadora nueva?"],
      ['B', "I'll send you a list. The most critical are the positioner cylinders and one scanner sensor.", "Te enviaré una lista. Los más críticos son los cilindros de los posicionadores y un sensor del escáner."],
      ['A', "A whole sensor? That sounds expensive.", "¿Un sensor completo? Suena caro."],
      ['B', "It is, but the lead time is about twelve weeks. You can't wait that long with the line down.", "Lo es, pero el plazo de entrega es de unas doce semanas. No pueden esperar tanto con la línea parada."],
      ['A', "Understood. What about bearings and belts?", "Entendido. ¿Y rodamientos y correas?"],
      ['B', "Those you can buy locally. Just check the part numbers on the list.", "Esos los pueden comprar localmente. Solo revisen los números de parte en la lista."],
      ['A', "Perfect. Can you send the list by Friday?", "Perfecto. ¿Puedes enviar la lista antes del viernes?"],
      ['B', "Sure, I'll email it to you and to Michel.", "Claro, te la envío por correo a ti y a Michel."]
    ],
    questions: [
      { q: 'What is the lead time for a scanner sensor?', es: '¿Cuál es el plazo de entrega de un sensor?', o: ['Two days', 'About twelve weeks', 'One year'], a: 1 },
      { q: 'Which parts can they buy locally?', es: '¿Qué partes pueden comprar localmente?', o: ['Bearings and belts', 'Scanner sensors', 'The optimizer'], a: 0 },
      { q: 'Who will receive the list?', es: '¿Quién recibirá la lista?', o: ['Myriam and Michel', 'Only the manager', 'The customer'], a: 0 }
    ] },

  { id: 'install-safety', topic: 'ops', level: 'A2', title: 'Seguridad durante la instalación',
    context: 'Juan, supervisor, y Mattias hablan de seguridad antes de empezar el montaje.',
    speakers: { A: ['Juan', 'local'], B: ['Mattias', 'mattias'] },
    lines: [
      ['A', "Good morning, Mattias. Before you start, we need to talk about safety.", "Buenos días, Mattias. Antes de que empieces, tenemos que hablar de seguridad."],
      ['B', "Of course. What are the rules here?", "Por supuesto. ¿Cuáles son las reglas aquí?"],
      ['A', "Always wear your helmet, glasses, boots and hearing protection.", "Usa siempre casco, lentes, zapatos de seguridad y protección auditiva."],
      ['A', "Before you work on a machine, you must lock it out with your own lock.", "Antes de trabajar en una máquina, debes bloquearla con tu propio candado."],
      ['B', "Good. Where do I get a lock?", "Bien. ¿Dónde consigo un candado?"],
      ['A', "At the maintenance office. Also, the crane can only be used with a signal man.", "En la oficina de mantención. Además, la grúa solo se puede usar con un señalero."],
      ['B', "Understood. Safety first.", "Entendido. La seguridad primero."],
      ['A', "Thank you. Have a good day.", "Gracias. Que tengas un buen día."]
    ],
    questions: [
      { q: 'What must Mattias do before working on a machine?', es: '¿Qué debe hacer Mattias antes de trabajar en una máquina?', o: ['Lock it out with his own lock', 'Call his office', 'Clean it'], a: 0 },
      { q: 'Where can he get a lock?', es: '¿Dónde puede conseguir un candado?', o: ['At the maintenance office', 'At the canteen', 'At the gate'], a: 0 },
      { q: 'What does the crane need?', es: '¿Qué necesita la grúa?', o: ['A signal man', 'Two drivers', 'Nothing'], a: 0 }
    ] },

  { id: 'acceptance-test', topic: 'edger', level: 'C1', title: 'Prueba de aceptación',
    context: 'Paul y Mauro, gerente de planta, cierran la puesta en marcha de la canteadora.',
    speakers: { A: ['Paul', 'paul'], B: ['Mauro', 'local'] },
    lines: [
      ['A', "Mauro, the edger has been running for three weeks. We'd like to schedule the performance test.", "Mauro, la canteadora lleva tres semanas funcionando. Nos gustaría programar la prueba de rendimiento."],
      ['B', "Before that, there are still a few open items on the punch list.", "Antes de eso, todavía quedan algunos puntos pendientes en la lista de observaciones."],
      ['A', "Understood. Which ones are holding you back?", "Entendido. ¿Cuáles los están frenando?"],
      ['B', "The guarding on the outfeed and the operator manuals in Spanish.", "Las protecciones en la salida y los manuales del operador en español."],
      ['A', "The guards will be fixed this week. The manuals are being translated as we speak.", "Las protecciones se arreglan esta semana. Los manuales se están traduciendo en este momento."],
      ['B', "Good. For the test, we want to measure pieces per minute, uptime and recovery over five shifts.", "Bien. Para la prueba, queremos medir piezas por minuto, disponibilidad y rendimiento durante cinco turnos."],
      ['A', "That's fair. If we meet the targets, we'll sign the acceptance and the warranty period starts.", "Es justo. Si cumplimos las metas, firmamos la aceptación y empieza el período de garantía."],
      ['B', "Agreed. Let's lock in the dates.", "De acuerdo. Fijemos las fechas."]
    ],
    questions: [
      { q: 'What must be finished before the test?', es: '¿Qué hay que terminar antes de la prueba?', o: ['The open items on the punch list', 'The new kiln', 'The chipper canters'], a: 0 },
      { q: 'What will they measure?', es: '¿Qué medirán?', o: ['Pieces per minute, uptime and recovery', 'Only noise', 'The price of lumber'], a: 0 },
      { q: 'What starts after the acceptance?', es: '¿Qué empieza después de la aceptación?', o: ['The warranty period', 'A new shutdown', 'The installation'], a: 0 }
    ] },

  { id: 'lunch-chat', topic: 'social', level: 'A2', title: 'Charla en la colación',
    context: 'Álvaro y Francisco, operador de línea, almuerzan en el casino del aserradero.',
    speakers: { A: ['Francisco', 'local'], B: ['Álvaro', 'alvaro'] },
    lines: [
      ['A', "Álvaro, do you like Chilean food?", "Álvaro, ¿te gusta la comida chilena?"],
      ['B', "I love it. Yesterday I tried a completo. It was huge!", "Me encanta. Ayer probé un completo. ¡Era enorme!"],
      ['A', "Ha ha, yes. With avocado, tomato and mayo. Is the food very different in Canada?", "Ja ja, sí. Con palta, tomate y mayo. ¿La comida es muy distinta en Canadá?"],
      ['B', "A little. We eat a lot of burgers and poutine. It's fries with cheese and gravy.", "Un poco. Comemos muchas hamburguesas y poutine. Son papas fritas con queso y salsa."],
      ['A', "Sounds good. Is it cold where you live?", "Suena rico. ¿Hace frío donde vives?"],
      ['B', "In winter, yes. It can be minus twenty degrees.", "En invierno, sí. Puede llegar a veinte grados bajo cero."],
      ['A', "Wow. Here it rains a lot, but it's not that cold.", "Guau. Aquí llueve mucho, pero no hace tanto frío."],
      ['B', "I prefer your weather, to be honest.", "Prefiero su clima, para ser honesto."]
    ],
    questions: [
      { q: 'What did Álvaro eat yesterday?', es: '¿Qué comió Álvaro ayer?', o: ['A completo', 'Poutine', 'Fish'], a: 0 },
      { q: 'What is poutine?', es: '¿Qué es la poutine?', o: ['Fries with cheese and gravy', 'A type of bread', 'A soup'], a: 0 },
      { q: 'How cold can it be where Álvaro lives?', es: '¿Qué tan frío puede hacer donde vive Álvaro?', o: ['Minus twenty degrees', 'Five degrees', 'Zero degrees'], a: 0 }
    ] },

  { id: 'shift-handover', topic: 'ops', level: 'B1', title: 'Entrega de turno',
    context: 'Rodrigo, supervisor, le deja el resumen del turno a Álvaro, técnico de USNR que se queda en la noche.',
    speakers: { A: ['Rodrigo', 'local'], B: ['Álvaro', 'alvaro'] },
    lines: [
      ['A', "Álvaro, before I leave, here's a quick update for the night shift.", "Álvaro, antes de irme, aquí va un resumen rápido para el turno de noche."],
      ['A', "We produced a bit less today because the trimmer stopped for forty minutes.", "Hoy producimos un poco menos porque el trimmer se detuvo cuarenta minutos."],
      ['B', "What was the cause?", "¿Cuál fue la causa?"],
      ['A', "A broken chain link. Miguel from maintenance replaced it, but please keep an eye on it.", "Un eslabón de cadena cortado. Miguel, de mantención, lo cambió, pero por favor vigílalo."],
      ['B', "Will do. Anything else?", "Lo haré. ¿Algo más?"],
      ['A', "Bin number seven is out of service. Don't send boards there until tomorrow.", "El buzón número siete está fuera de servicio. No envíes tablas ahí hasta mañana."],
      ['B', "Got it. I'll let the operators know.", "Entendido. Les avisaré a los operadores."],
      ['A', "Thanks, Álvaro. Have a quiet night.", "Gracias, Álvaro. Que tengas una noche tranquila."]
    ],
    questions: [
      { q: 'Why did they produce less today?', es: '¿Por qué produjeron menos hoy?', o: ['The trimmer stopped for forty minutes', 'There were no logs', 'It was a holiday'], a: 0 },
      { q: 'What was broken?', es: '¿Qué estaba roto?', o: ['A chain link', 'A saw blade', 'The scanner'], a: 0 },
      { q: 'Which bin is out of service?', es: '¿Qué buzón está fuera de servicio?', o: ['Number seven', 'Number eleven', 'Number two'], a: 0 }
    ] }
];
