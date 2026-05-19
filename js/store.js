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
    // Limpieza única para producción: borra los datos mock viejos del navegador del desarrollador/usuario
    if (!localStorage.getItem("gym_prod_cleared_v1")) {
      localStorage.clear();
      localStorage.setItem("gym_prod_cleared_v1", "true");
    }

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
    return [];
  }

  // 7. Sembrado Dinámico de Configuración de Perfiles Físicos
  generateHistoricalSeedProfiles() {
    return {
      mateo: {
        height: 0,
        weight: 0,
        weightHistory: []
      },
      santiago: {
        height: 0,
        weight: 0,
        weightHistory: []
      },
      alim: {
        height: 0,
        weight: 0,
        weightHistory: []
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
