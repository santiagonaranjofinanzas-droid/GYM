// STORAGE.JS - CAPA DE PERSISTENCIA ASÍNCRONA DE DATOS (COMPATIBLE CON BACKEND)

const LS_KEY_HISTORY = "hibrida_elite_history_v2";
const LS_KEY_PROFILES = "hibrida_elite_profiles_v2";

export class StorageAdapter {
  /**
   * Carga el historial de entrenamientos desde LocalStorage de forma asíncrona.
   */
  static async getHistory() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(LS_KEY_HISTORY);
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve([]);
        }
      }, 50);
    });
  }

  /**
   * Guarda el historial de entrenamientos de forma asíncrona.
   * @param {Array} history 
   */
  static async saveHistory(history) {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(history));
        resolve(true);
      }, 50);
    });
  }

  /**
   * Carga la configuración de perfiles físicos desde LocalStorage.
   */
  static async getProfiles() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(LS_KEY_PROFILES);
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve(null);
        }
      }, 50);
    });
  }

  /**
   * Guarda la configuración de perfiles físicos.
   * @param {Object} profiles 
   */
  static async saveProfiles(profiles) {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(LS_KEY_PROFILES, JSON.stringify(profiles));
        resolve(true);
      }, 50);
    });
  }

  /**
   * Limpia todo el historial y perfiles.
   */
  static async clearHistory() {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(LS_KEY_HISTORY);
        localStorage.removeItem(LS_KEY_PROFILES);
        resolve(true);
      }, 30);
    });
  }
}

