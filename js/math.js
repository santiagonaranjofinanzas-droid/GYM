// MATH.JS - FÓRMULAS DE FUERZA Y ALGORITMOS DE SOBRECARGA PROGRESIVA

// 1. Cálculo de 1RM Estimado (Fórmula de Epley)
export function calculate1RM(weight, reps) {
  if (!weight || !reps) return 0;
  weight = parseFloat(weight);
  reps = parseInt(reps);
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// 2. Algoritmo de Sobrecarga Progresiva Inteligente
// Analiza el historial previo y determina el incremento recomendado en base a RIR y cumplimiento de volumen.
export function suggestProgressiveOverload(exerciseId, historyLogs, exMetadata) {
  // Filtrar entrenamientos del usuario para este ejercicio en orden cronológico (del más reciente al más antiguo)
  const exerciseLogs = historyLogs
    .filter(log => log.exercises && log.exercises[exerciseId])
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (exerciseLogs.length === 0) {
    return {
      suggestedWeight: null,
      reason: "Establecer línea base"
    };
  }

  // Tomar el registro más reciente
  const lastSessionSets = exerciseLogs[0].exercises[exerciseId];
  if (!lastSessionSets || lastSessionSets.length === 0) {
    return {
      suggestedWeight: null,
      reason: "Establecer línea base"
    };
  }

  // Encontrar el peso máximo y RIR promedio del último entrenamiento
  let maxWeight = 0;
  let totalRIR = 0;
  let validRIRCount = 0;
  let totalRepsCompleted = 0;
  
  lastSessionSets.forEach(set => {
    if (set.weight > maxWeight) maxWeight = set.weight;
    
    // El RIR puede ser 0, 1, 2, 3 o 4 (4+). Si es undefined, asumimos RIR 0
    const rir = set.rir !== undefined ? parseInt(set.rir) : 0;
    totalRIR += rir;
    validRIRCount++;
    totalRepsCompleted += parseInt(set.reps);
  });

  const avgRIR = validRIRCount > 0 ? totalRIR / validRIRCount : 0;
  const avgReps = validRIRCount > 0 ? totalRepsCompleted / validRIRCount : 0;

  // Analizar los objetivos del ejercicio (ej. "2-4", "6-8", "10-12")
  const repRangeStr = exMetadata.reps; // ej: "2-4"
  const rangeParts = repRangeStr.split("-");
  const minTargetReps = parseInt(rangeParts[0]) || 5;
  const maxTargetReps = parseInt(rangeParts[1]) || 8;

  // Determinar el incremento de peso sugerido
  let increment = 0;
  let reason = "";

  // ¿Completó todas las series y alcanzó repeticiones dentro del rango objetivo?
  const completedTargetSets = lastSessionSets.length >= exMetadata.sets;
  const metRepGoals = avgReps >= minTargetReps;

  if (completedTargetSets && metRepGoals) {
    if (avgRIR >= 2.0) {
      // Muy cómodo (alta reserva de reps) -> Incremento Fuerte (+2.5 kg o +5%)
      increment = maxWeight >= 80 ? 2.5 : 2.0; 
      // Si el peso es muy bajo (ej. mancuernas de 10kg), aumentamos proporcionalmente
      if (maxWeight < 20) increment = 1.0; 
      reason = `▲ +${increment}kg: RIR promedio alto (${avgRIR.toFixed(1)}). Movimiento muy veloz.`;
    } else if (avgRIR >= 1.0) {
      // Esfuerzo moderado -> Incremento Leve (+1.25 kg o +2.5%)
      increment = maxWeight >= 80 ? 1.25 : 1.0;
      if (maxWeight < 20) increment = 0.5;
      reason = `▲ +${increment}kg: Cumplió rango con RIR moderado (${avgRIR.toFixed(1)}).`;
    } else {
      // RIR 0 o muy cerca del fallo -> Mantener peso pero progresar en reps
      increment = 0;
      reason = `Stable: Al límite del fallo (RIR ${avgRIR.toFixed(1)}). Consolida repeticiones.`;
    }
  } else {
    // No completó las series o reps -> Mantener peso
    increment = 0;
    reason = `Stable: Completar ${exMetadata.sets} series de ${exMetadata.reps} antes de subir.`;
  }

  // Redondear el peso sugerido a múltiplos de 0.5 kg (estándar de discos de gym)
  let suggestedWeight = maxWeight + increment;
  suggestedWeight = Math.round(suggestedWeight * 2) / 2;

  return {
    suggestedWeight: suggestedWeight,
    reason: reason,
    lastWeight: maxWeight
  };
}
