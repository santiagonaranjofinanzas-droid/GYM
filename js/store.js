// STORE.JS - GESTOR DE ESTADO CENTRAL REACTIVO (PATRÓN OBSERVABLE)

import { StorageAdapter } from './storage.js';
import { calculate1RM } from './math.js';

export class WorkoutStore {
  constructor() {
    this.state = {
      activeUser: null,
      activeDay: 'lunes',
      activeView: 'workout', // 'workout' | 'analytics' | 'settings'
      workoutsHistory: [],
      userProfiles: {}
    };
    this.subscribers = new Set();
  }

  // 1. Suscribirse a los cambios del Estado Central
  subscribe(fn) {
    this.subscribers.add(fn);
    // Ejecutar inmediatamente para configurar la vista inicial
    fn(this.state);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    this.subscribers.forEach((fn) => fn(this.state));
  }

  // 2. Inicializar el Store cargando datos previos y sembrando si es necesario
  async init() {
    let history = await StorageAdapter.getHistory();
    if (!history || history.length === 0) {
      history = this.generateHistoricalSeedData();
      await StorageAdapter.saveHistory(history);
    }
    this.state.workoutsHistory = history;

    let profiles = await StorageAdapter.getProfiles();
    if (!profiles) {
      profiles = this.generateHistoricalSeedProfiles();
      await StorageAdapter.saveProfiles(profiles);
    }
    this.state.userProfiles = profiles;

    this.notify();
  }

  // 3. Mutadores de Estado
  setActiveUser(user) {
    this.state.activeUser = user;
    this.notify();
  }

  setActiveDay(dayId) {
    this.state.activeDay = dayId;
    this.notify();
  }

  setActiveView(view) {
    this.state.activeView = view;
    this.notify();
  }

  // 4. Registrar nueva sesión de entrenamiento y verificar PRs
  async saveCurrentWorkout(dayId, exercisesInputData, actsChecked, coreChecked, cardioChecked) {
    const dayData = window.ROUTINE_DB.find(d => d.id === dayId);
    if (!dayData) throw new Error("Día de entrenamiento no encontrado en la rutina");

    const sessionExercises = {};
    let totalVolume = 0;
    let sum1RM = 0;
    let liftsCount = 0;
    let prsBroken = [];

    // Recorrer los ejercicios recibidos
    dayData.principales.forEach(ex => {
      const setsInput = exercisesInputData[ex.id];
      if (!setsInput || setsInput.length === 0) return;

      const setsData = [];
      setsInput.forEach((set, idx) => {
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps);
        const rir = set.rir !== undefined ? parseInt(set.rir) : 0;

        if (weight > 0 && reps > 0) {
          const oneRM = calculate1RM(weight, reps);
          const isPR = this.checkIsPersonalRecord(ex.id, weight, oneRM);

          if (isPR.weightPR || isPR.oneRMPR) {
            prsBroken.push({
              exerciseName: ex.name,
              weight: weight,
              oneRM: oneRM,
              type: isPR.weightPR ? "peso" : "1RM"
            });
          }

          setsData.push({
            weight: weight,
            reps: reps,
            rir: rir,
            oneRM: oneRM
          });

          totalVolume += weight * reps;
          sum1RM += oneRM;
          liftsCount++;
        }
      });

      if (setsData.length > 0) {
        sessionExercises[ex.id] = setsData;
      }
    });

    if (liftsCount === 0) {
      throw new Error("Ingresa al menos el peso y repeticiones de una serie para guardar.");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    
    // Sobreescribir si el usuario ya registró hoy para este día exacto
    const existingIndex = this.state.workoutsHistory.findIndex(
      w => w.userId === this.state.activeUser && w.date === todayStr && w.dayId === dayId
    );

    const newLog = {
      userId: this.state.activeUser,
      date: todayStr,
      dayId: dayId,
      exercises: sessionExercises,
      volume: totalVolume,
      avg1rm: liftsCount > 0 ? Math.round((sum1RM / liftsCount) * 10) / 10 : 0,
      activationsCompleted: actsChecked,
      coreCompleted: coreChecked,
      cardioCompleted: cardioChecked
    };

    if (existingIndex !== -1) {
      this.state.workoutsHistory[existingIndex] = newLog;
    } else {
      this.state.workoutsHistory.push(newLog);
    }

    // Persistir y notificar observadores
    await StorageAdapter.saveHistory(this.state.workoutsHistory);
    this.notify();

    return {
      volume: totalVolume,
      prsBroken: prsBroken
    };
  }

  // 5. Auxiliar de Chequeo de PRs
  checkIsPersonalRecord(exerciseId, weight, oneRM) {
    const userLogs = this.state.workoutsHistory.filter(w => w.userId === this.state.activeUser);
    let maxPrevWeight = 0;
    let maxPrev1RM = 0;

    userLogs.forEach(log => {
      const exData = log.exercises[exerciseId];
      if (exData) {
        exData.forEach(set => {
          if (set.weight > maxPrevWeight) maxPrevWeight = set.weight;
          if (set.oneRM > maxPrev1RM) maxPrev1RM = set.oneRM;
        });
      }
    });

    return {
      weightPR: weight > maxPrevWeight && maxPrevWeight > 0,
      oneRMPR: oneRM > maxPrev1RM && maxPrev1RM > 0
    };
  }

  // 6. Sembrado Dinámico de Datos Históricos (3 semanas)
  generateHistoricalSeedData() {
    const today = new Date();
    const seeded = [];

    const userBaselines = {
      mateo: {
        sentadilla: [95, 100, 105],
        bulgaras: [24, 26, 28],
        prensa: [160, 170, 180],
        press_banca: [80, 85, 90],
        press_militar: [50, 52.5, 55],
        dominadas_lastradas: [15, 17.5, 20],
        peso_muerto_rumano: [100, 105, 110],
        hip_thrust: [120, 130, 140],
        press_inclinado: [32, 34, 36],
        remo_barra: [70, 72.5, 75]
      },
      santiago: {
        sentadilla: [80, 85, 90],
        bulgaras: [20, 22, 24],
        prensa: [140, 150, 160],
        press_banca: [70, 75, 80],
        press_militar: [40, 42.5, 45],
        dominadas_lastradas: [5, 10, 12.5],
        peso_muerto_rumano: [85, 90, 95],
        hip_thrust: [100, 110, 120],
        press_inclinado: [26, 28, 30],
        remo_barra: [55, 60, 65]
      },
      alim: {
        sentadilla: [65, 70, 75],
        bulgaras: [14, 16, 18],
        prensa: [100, 110, 120],
        press_banca: [50, 55, 60],
        press_militar: [30, 32.5, 35],
        dominadas_lastradas: [0, 2.5, 5],
        peso_muerto_rumano: [60, 65, 70],
        hip_thrust: [80, 85, 90],
        press_inclinado: [18, 20, 22],
        remo_barra: [40, 45, 50]
      }
    };

    const users = ["mateo", "santiago", "alim"];
    
    for (let week = 1; week <= 3; week++) {
      const daysOffset = (3 - week) * 7;
      
      users.forEach(user => {
        window.ROUTINE_DB.forEach(day => {
          const workoutDate = new Date(today);
          let dayDiff = 0;
          if (day.id === "lunes") dayDiff = 5;
          else if (day.id === "martes") dayDiff = 4;
          else if (day.id === "miercoles") dayDiff = 3;
          else if (day.id === "jueves") dayDiff = 2;
          else if (day.id === "viernes") dayDiff = 1;
          
          workoutDate.setDate(today.getDate() - daysOffset - dayDiff);
          const dateString = workoutDate.toISOString().split("T")[0];

          const sessionExercises = {};
          let totalVolume = 0;
          let sum1RM = 0;
          let liftsCount = 0;

          day.principales.forEach(ex => {
            const setsData = [];
            const baseWeight = userBaselines[user][ex.id] 
              ? userBaselines[user][ex.id][week - 1] 
              : (ex.sets === 5 ? 40 : 20);
            
            for (let s = 1; s <= ex.sets; s++) {
              let reps = 7; 
              if (ex.reps === "2-4") reps = s <= 2 ? 4 : 3;
              else if (ex.reps === "6-8") reps = s === 1 ? 8 : 7;
              else if (ex.reps === "10-12") reps = s === 1 ? 12 : 10;
              
              let weight = baseWeight;
              if (s > 3) weight = Math.max(1, baseWeight - 5);

              // RIR simulados de 1 o 2 para progresión real
              const rir = (s === 1 && week === 3) ? 1 : 2;
              const oneRM = calculate1RM(weight, reps);
              
              setsData.push({
                weight: weight,
                reps: reps,
                rir: rir,
                oneRM: oneRM
              });

              totalVolume += weight * reps;
              sum1RM += oneRM;
              liftsCount++;
            }

            sessionExercises[ex.id] = setsData;
          });

          seeded.push({
            userId: user,
            date: dateString,
            dayId: day.id,
            exercises: sessionExercises,
            volume: totalVolume,
            avg1rm: liftsCount > 0 ? Math.round((sum1RM / liftsCount) * 10) / 10 : 0,
            activationsCompleted: true,
            coreCompleted: true,
            cardioCompleted: true
          });
        });
      });
    }

    return seeded;
  }

  // 7. Sembrado Dinámico de Configuración de Perfiles Físicos
  generateHistoricalSeedProfiles() {
    const today = new Date();
    const formatDate = (daysAgo) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split("T")[0];
    };

    return {
      mateo: {
        height: 178,
        weight: 82.5,
        weightHistory: [
          { date: formatDate(21), weight: 83.5 },
          { date: formatDate(14), weight: 83.0 },
          { date: formatDate(7), weight: 82.8 },
          { date: formatDate(0), weight: 82.5 }
        ]
      },
      santiago: {
        height: 174,
        weight: 76.2,
        weightHistory: [
          { date: formatDate(21), weight: 77.0 },
          { date: formatDate(14), weight: 76.8 },
          { date: formatDate(7), weight: 76.5 },
          { date: formatDate(0), weight: 76.2 }
        ]
      },
      alim: {
        height: 180,
        weight: 79.5,
        weightHistory: [
          { date: formatDate(21), weight: 81.0 },
          { date: formatDate(14), weight: 80.5 },
          { date: formatDate(7), weight: 80.0 },
          { date: formatDate(0), weight: 79.5 }
        ]
      }
    };
  }

  // Actualizar perfil físico (estatura, peso corporal y registro histórico)
  async updateProfileSettings(userId, height, weight) {
    if (!this.state.userProfiles) {
      this.state.userProfiles = {};
    }
    if (!this.state.userProfiles[userId]) {
      this.state.userProfiles[userId] = {
        height: 0,
        weight: 0,
        weightHistory: []
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const numericHeight = parseFloat(height) || 0;
    const numericWeight = parseFloat(weight) || 0;

    this.state.userProfiles[userId].height = numericHeight;
    this.state.userProfiles[userId].weight = numericWeight;

    // Buscar si ya existe un registro de peso para hoy
    const existingIndex = this.state.userProfiles[userId].weightHistory.findIndex(
      log => log.date === todayStr
    );

    if (existingIndex !== -1) {
      this.state.userProfiles[userId].weightHistory[existingIndex].weight = numericWeight;
    } else {
      this.state.userProfiles[userId].weightHistory.push({
        date: todayStr,
        weight: numericWeight
      });
    }

    // Ordenar historial por fecha cronológica
    this.state.userProfiles[userId].weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Guardar en Storage y notificar a la UI
    await StorageAdapter.saveProfiles(this.state.userProfiles);
    this.notify();
  }
}
export const store = new WorkoutStore();
