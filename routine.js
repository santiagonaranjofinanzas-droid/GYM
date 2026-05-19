// Híbrida Elite V5.0 - Base de Datos de la Rutina Semanal
window.ROUTINE_DB = [
  {
    id: "lunes",
    name: "Lunes",
    focus: "Pierna — Cuadricep",
    volumen: "5 principales + 4 core",
    activacion: [
      { name: "Extensiones de Pierna", reps: "3 x 15" }
    ],
    principales: [
      { id: "sentadilla", name: "Sentadilla Libre", sets: 5, reps: "2-4", group: "Cuádriceps" },
      { id: "bulgaras", name: "Búlgaras (Enfoque Glúteo)", sets: 3, reps: "6-8", group: "Glúteos" },
      { id: "prensa", name: "Prensa de Pierna", sets: 3, reps: "6-8", group: "Cuádriceps" },
      { id: "aductores", name: "Aductores en Máquina", sets: 4, reps: "10-12", group: "Aductores" },
      { id: "pantorrillas_lun", name: "Pantorrillas", sets: 3, reps: "6-8", group: "Pantorrillas" }
    ],
    core: [
      { name: "Crunch en polea", reps: "3 x 6-8" },
      { name: "Woodchopper en polea", reps: "4 x 10-12" },
      { name: "Vacuum abdominal", reps: "4 x 10-12 (5 seg)" },
      { name: "Extensión lumbar", reps: "3 x 12-15" }
    ],
    cardio: null
  },
  {
    id: "martes",
    name: "Martes",
    focus: "Pecho & Hombros",
    volumen: "6 principales + cardio",
    activacion: [
      { name: "Flexiones de pecho", reps: "3 x 15" }
    ],
    principales: [
      { id: "press_banca", name: "Press de Banca", sets: 5, reps: "2-4", group: "Pecho" },
      { id: "aperturas_polea", name: "Aperturas en Polea Sentado", sets: 3, reps: "6-8", group: "Pecho" },
      { id: "fondos_lastrados", name: "Fondos Lastrados", sets: 3, reps: "6-8", group: "Pecho" },
      { id: "press_militar", name: "Press Militar con Barra", sets: 3, reps: "6-8", group: "Hombros" },
      { id: "laterales_polea_mar", name: "Elevaciones Laterales en Polea", sets: 4, reps: "10-12", group: "Hombros" },
      { id: "ext_tras_nuca", name: "Extensión Tras Nuca (Tríceps)", sets: 4, reps: "10-12", group: "Tríceps" }
    ],
    core: null,
    cardio: { name: "Caminata de activación + 3 rounds x 3 min de alta intensidad", duration: "15 min + 3x3 min" }
  },
  {
    id: "miercoles",
    name: "Miércoles",
    focus: "Espalda & Bíceps",
    volumen: "6 principales + cardio",
    activacion: [
      { name: "Negativas + retracciones escapulares", reps: "4-6 / 4-6" }
    ],
    principales: [
      { id: "dominadas_lastradas", name: "Dominadas Lastradas", sets: 5, reps: "2-4", group: "Espalda" },
      { id: "jalon_neutro", name: "Jalón al Pecho (Agarre Neutro)", sets: 3, reps: "6-8", group: "Espalda" },
      { id: "jalon_mancuerna_inclinado", name: "Jalón con Mancuerna en Banco Inclinado", sets: 3, reps: "6-8", group: "Espalda" },
      { id: "face_pull", name: "Face Pull en Polea", sets: 4, reps: "10-12", group: "Hombros" },
      { id: "martillos", name: "Curl Martillo con Mancuerna", sets: 3, reps: "6-8", group: "Bíceps" },
      { id: "curl_inclinado", name: "Curl Sentado en Banco Inclinado", sets: 4, reps: "10-12", group: "Bíceps" }
    ],
    core: null,
    cardio: { name: "Caminata de activación + 3 rounds x 3 min de alta intensidad", duration: "15 min + 3x3 min" }
  },
  {
    id: "jueves",
    name: "Jueves",
    focus: "Pierna — Posterior & Glúteo",
    volumen: "5 principales + 3 core",
    activacion: [
      { name: "Curl nórdico excéntrico — isquios", reps: "1 x 4-6" },
      { name: "Extensiones con liga — glúteos", reps: "3 x 10-15" }
    ],
    principales: [
      { id: "peso_muerto_rumano", name: "Peso Muerto Rumano", sets: 5, reps: "2-4", group: "Isquios" },
      { id: "hip_thrust", name: "Hip Thrust (+ Isométrico 10s al final)", sets: 3, reps: "6-8", group: "Glúteos" },
      { id: "hack_de_frente", name: "Sentadilla Hack de Frente", sets: 3, reps: "6-8", group: "Cuádriceps" },
      { id: "abductores", name: "Abductores en Máquina", sets: 4, reps: "10-12", group: "Glúteos" },
      { id: "pantorrillas_jue", name: "Pantorrillas", sets: 3, reps: "6-8", group: "Pantorrillas" }
    ],
    core: [
      { name: "Elevación de piernas colgado", reps: "4 x 10-12" },
      { name: "Plancha lateral (Side Plank)", reps: "4 x 1 min (cada lado)" },
      { name: "Vacuum abdominal", reps: "4 x 10-12 (5 seg)" }
    ],
    cardio: null
  },
  {
    id: "viernes",
    name: "Viernes",
    focus: "Upper Body Completo",
    volumen: "7 principales + cardio",
    activacion: [
      { name: "Dominadas estrictas", reps: "2 x 5" },
      { name: "Flexiones de pecho", reps: "3 x 15" }
    ],
    principales: [
      { id: "press_inclinado", name: "Press Inclinado con Mancuernas", sets: 5, reps: "2-4", group: "Pecho" },
      { id: "remo_barra", name: "Remo con Barra", sets: 5, reps: "2-4", group: "Espalda" },
      { id: "cruces_polea", name: "Cruces en Polea", sets: 3, reps: "6-8", group: "Pecho" },
      { id: "elevaciones_y", name: "Elevaciones en Y para Hombro", sets: 4, reps: "10-12", group: "Hombros" },
      { id: "ext_polea_abajo", name: "Extensión de Tríceps en Polea Alta", sets: 3, reps: "6-8", group: "Tríceps" },
      { id: "laterales_polea_vie", name: "Elevaciones Laterales en Polea", sets: 4, reps: "10-12", group: "Hombros" },
      { id: "predicador", name: "Curl Predicador", sets: 3, reps: "6-8", group: "Bíceps" }
    ],
    core: null,
    cardio: { name: "Caminata de activación + 3 rounds x 3 min de alta intensidad", duration: "15 min + 3x3 min" }
  }
];
