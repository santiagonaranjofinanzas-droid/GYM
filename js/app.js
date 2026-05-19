// APP.JS - PUNTO DE ENTRADA PRINCIPAL Y REGISTRO DE SERVICE WORKER

import { store } from './store.js';
import { initializeUI } from './ui.js';

// Inicializar la Aplicación al Cargar el DOM
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🦾 Inicializando Central de Progreso Híbrida Elite...");

  // 1. Inicializar el Store (Carga e inicializa el historial del LocalStorage / Mock Seeding)
  await store.init();

  // 2. Inicializar la Interfaz de Usuario y Event Listeners
  initializeUI();

  // 3. Registrar el Service Worker para funcionamiento 100% Offline (PWA)
  registerServiceWorker();
});

// Función para registrar el Service Worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './'
      });
      console.log('✅ ServiceWorker registrado con éxito. Scope:', registration.scope);
      
      // Control de actualizaciones del SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 Nueva versión disponible de Híbrida Elite. Por favor reinicia la aplicación.');
          }
        });
      });
    } catch (error) {
      console.error('❌ Error registrando el ServiceWorker:', error);
    }
  } else {
    console.warn('⚠️ Los Service Workers no están soportados en este navegador.');
  }
}
