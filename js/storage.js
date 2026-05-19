// STORAGE.JS - CAPA DE PERSISTENCIA ASÍNCRONA DE DATOS (COMPATIBLE CON BACKEND)

const LS_KEY_HISTORY = "hibrida_elite_history_v2";

export class StorageAdapter {
  /**
   * Carga el historial de entrenamientos desde LocalStorage de forma asíncrona.
   * La interfaz basada en promesas permite reemplazar este bloque por fetch() o
   * clientes de bases de datos como Supabase sin romper la interfaz UI.
   */
  static async getHistory() {
    return new Promise((resolve) => {
      // Simula latencia de red para comportamiento realista (ej. 50ms)
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
   * Limpia todo el historial.
   */
  static async clearHistory() {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(LS_KEY_HISTORY);
        resolve(true);
      }, 30);
    });
  }
}
