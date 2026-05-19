// UI.JS - RENDERIZADO Y CONTROL DE LA INTERFAZ DE USUARIO PRO

import { store } from './store.js';
import { suggestProgressiveOverload } from './math.js';

// Variables de Control Interno de UI
let chartInstance = null;
let activeTimerInterval = null;
let timerSecondsRemaining = 0;
let timerTotalSeconds = 0;

// Synthesizer de Chime de Alerta Deportivo (100% Offline mediante Web Audio API)
function playSportsChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (frequency, duration, startTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Secuencia de alerta: 3 beeps rápidos cortos y un beep final más largo y agudo
    playTone(880, 0.15, 0.0);
    playTone(880, 0.15, 0.3);
    playTone(880, 0.15, 0.6);
    playTone(1200, 0.6, 0.9);
  } catch (err) {
    console.error("Web Audio API falló:", err);
  }
}

// Inicializar la interfaz una vez que el DOM está cargado
export function initializeUI() {
  // Suscribir los actualizadores principales al Store Observable
  store.subscribe(renderWelcomeScreen);
  store.subscribe(renderDashboardUser);
  store.subscribe(renderWorkoutDayView);
  store.subscribe(renderAnalyticsView);
  store.subscribe(renderSettingsView);

  setupGeneralEventListeners();
  setupRestTimerUI();
}

// 1. Render de Selector de Perfiles (Pre-Loader)
function renderWelcomeScreen(state) {
  const welcomeScreen = document.getElementById("welcome-screen");
  const appContainer = document.getElementById("app-container");

  if (!state.activeUser) {
    welcomeScreen.classList.remove("hidden");
    appContainer.classList.add("hidden");

    // Mostrar el último entrenamiento guardado de cada sujeto en las tarjetas
    const users = ["mateo", "santiago", "alim"];
    users.forEach(user => {
      const userLogs = state.workoutsHistory.filter(w => w.userId === user);
      const badgeText = document.getElementById(`${user}-last-day`);
      
      if (userLogs.length > 0) {
        // Ordenar por fecha decreciente
        userLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = userLogs[0];
        const dayObj = window.ROUTINE_DB.find(d => d.id === latest.dayId);
        if (badgeText) badgeText.textContent = `${dayObj.name} (${dayObj.focus})`;
      } else {
        if (badgeText) badgeText.textContent = "Sin entrenamientos";
      }
    });
  } else {
    welcomeScreen.classList.add("hidden");
    appContainer.classList.remove("hidden");
  }
}

// 2. Render de navbar y cabeceras dinámicas
function renderDashboardUser(state) {
  if (!state.activeUser) return;

  const badge = document.getElementById("user-badge");
  badge.setAttribute("data-active", state.activeUser);
  
  document.getElementById("active-user-name").textContent = state.activeUser;
  document.getElementById("greeting-username").textContent = state.activeUser;

  // Actualizar la pestaña de navegación activa
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (btn.getAttribute("data-view") === state.activeView) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  document.querySelectorAll(".content-section").forEach(sec => {
    if (sec.id === `view-${state.activeView}`) {
      sec.classList.add("active");
    } else {
      sec.classList.remove("active");
    }
  });
}

// 3. Render de la Vista de Entrenamiento Activo
function renderWorkoutDayView(state) {
  if (!state.activeUser || state.activeView !== 'workout') return;

  const dayData = window.ROUTINE_DB.find(d => d.id === state.activeDay);
  if (!dayData) return;

  // Render del selector de días superior
  const daySelector = document.getElementById("day-selector");
  daySelector.innerHTML = "";

  window.ROUTINE_DB.forEach(day => {
    const card = document.createElement("div");
    card.className = `day-card ${day.id === state.activeDay ? "active" : ""}`;
    card.innerHTML = `
      <span class="day-name">${day.name}</span>
      <span class="day-focus">${day.focus.split(" ")[0]}</span>
    `;
    card.addEventListener("click", () => {
      store.setActiveDay(day.id);
    });
    daySelector.appendChild(card);
  });

  // Título e info del día
  document.getElementById("current-day-title").textContent = `Día ${dayData.name}`;
  document.getElementById("current-day-focus").textContent = dayData.focus;
  document.getElementById("current-day-volume").textContent = dayData.volumen;

  // Cargar lista de activación
  const activationCard = document.getElementById("activation-card");
  const activationList = document.getElementById("activation-list");
  activationList.innerHTML = "";
  
  if (dayData.activacion && dayData.activacion.length > 0) {
    activationCard.classList.remove("hidden");
    dayData.activacion.forEach((act, idx) => {
      const item = document.createElement("div");
      item.className = "checklist-item";
      item.innerHTML = `
        <input type="checkbox" class="checklist-checkbox" id="act-check-${idx}">
        <div class="checklist-text">
          <span class="checklist-name">${act.name}</span>
          <span class="checklist-target">Objetivo: ${act.reps}</span>
        </div>
      `;
      item.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) item.classList.add("checked");
        else item.classList.remove("checked");
      });
      activationList.appendChild(item);
    });
  } else {
    activationCard.classList.add("hidden");
  }

  // Renderizar Ejercicios Principales con RIR, sugerencias de sobrecarga y Checks
  const mainContainer = document.getElementById("main-exercises-container");
  mainContainer.innerHTML = "";

  dayData.principales.forEach(ex => {
    // Buscar historial previo
    const prevSession = getPreviousExerciseStats(state.activeUser, state.activeDay, ex.id, state.workoutsHistory);

    // Calcular la recomendación inteligente de Sobrecarga Progresiva
    const suggestion = suggestProgressiveOverload(ex.id, state.workoutsHistory, ex);

    const card = document.createElement("div");
    card.className = "exercise-card";
    card.setAttribute("data-ex-id", ex.id);

    // Renderizar cabecera de la tabla de series
    let setsHtml = "";
    for (let s = 1; s <= ex.sets; s++) {
      let prevVal = "—";
      let prevRIR = "";
      if (prevSession && prevSession[s - 1]) {
        const pSet = prevSession[s - 1];
        prevVal = `<span class="val">${pSet.weight}</span> kg x <span class="val">${pSet.reps}</span>`;
        if (pSet.rir !== undefined) {
          prevRIR = ` (RIR ${pSet.rir})`;
        }
      }

      setsHtml += `
        <div class="set-row" data-set-num="${s}">
          <div class="set-number">Set ${s}</div>
          <div class="previous-stats">Prev: ${prevVal}${prevRIR}</div>
          <div class="input-container">
            <input type="number" step="0.5" placeholder="0" class="set-input weight-input" id="${ex.id}-w-${s}">
            <span class="input-unit">kg</span>
          </div>
          <div class="input-container">
            <input type="number" placeholder="0" class="set-input reps-input" id="${ex.id}-r-${s}">
            <span class="input-unit">reps</span>
          </div>
          <div class="input-container">
            <select class="rir-select" id="${ex.id}-rir-${s}">
              <option value="0">RIR 0</option>
              <option value="1">RIR 1</option>
              <option value="2" selected>RIR 2</option>
              <option value="3">RIR 3</option>
              <option value="4">RIR 4+</option>
            </select>
          </div>
          <div class="complete-btn-container">
            <input type="checkbox" class="complete-checkbox" id="${ex.id}-chk-${s}">
          </div>
        </div>
      `;
    }

    // Renderizar caja de sugerencia inteligente si hay peso sugerido
    let suggestionHtml = "";
    if (suggestion.suggestedWeight) {
      suggestionHtml = `
        <div class="overload-suggestion">
          <div class="suggestion-text">
            💡 Sobrecarga Sugerida: <span class="highlight">${suggestion.suggestedWeight} kg</span> — <span class="reason">${suggestion.reason}</span>
          </div>
          <button class="btn-apply-suggestion" data-ex-id="${ex.id}" data-weight="${suggestion.suggestedWeight}">
            Aplicar
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="exercise-header">
        <div class="exercise-title-area">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-muscle-badge">${ex.group}</span>
        </div>
        <div class="exercise-target">Series: <span>${ex.sets}</span> | Rango: <span>${ex.reps} reps</span></div>
      </div>
      <div class="exercise-body">
        <div class="sets-table-header">
          <div>Serie</div>
          <div>Anterior</div>
          <div>Peso</div>
          <div>Reps</div>
          <div>RIR</div>
          <div>Check</div>
        </div>
        <div class="sets-list">
          ${setsHtml}
        </div>
        ${suggestionHtml}
      </div>
    `;

    mainContainer.appendChild(card);
  });

  // Bind del botón "Aplicar" para auto-llenar el peso sugerido
  mainContainer.querySelectorAll(".btn-apply-suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      const exId = btn.getAttribute("data-ex-id");
      const weightVal = btn.getAttribute("data-weight");
      
      const card = mainContainer.querySelector(`.exercise-card[data-ex-id="${exId}"]`);
      if (card) {
        card.querySelectorAll(".weight-input").forEach(input => {
          input.value = weightVal;
        });
        showToast("⚡ Sobrecarga Aplicada", `Se autollenó el peso sugerido de ${weightVal} kg en todas las series.`, "success");
      }
    });
  });

  // Bind del evento Checkbox de Serie Completada para disparar el Temporizador de Descanso
  mainContainer.querySelectorAll(".complete-checkbox").forEach(chk => {
    chk.addEventListener("change", (e) => {
      const row = chk.closest(".set-row");
      if (e.target.checked) {
        row.classList.add("completed");
        
        // Obtener el rango de reps para ajustar el tiempo inteligente
        const card = chk.closest(".exercise-card");
        const exId = card.getAttribute("data-ex-id");
        const exMeta = dayData.principales.find(x => x.id === exId);
        
        let seconds = 90; // Por defecto: 90s hipertrofia
        if (exMeta && exMeta.reps === "2-4") {
          seconds = 180; // 3 minutos para fuerza pura
        } else if (exMeta && exMeta.reps.includes("10-12")) {
          seconds = 60; // 60 segundos
        }

        startRestTimer(seconds);
      } else {
        row.classList.remove("completed");
      }
    });
  });

  // Core / Abdomen
  const coreCard = document.getElementById("core-card");
  const coreList = document.getElementById("core-list");
  coreList.innerHTML = "";

  if (dayData.core && dayData.core.length > 0) {
    coreCard.classList.remove("hidden");
    dayData.core.forEach((coreEx, idx) => {
      const item = document.createElement("div");
      item.className = "checklist-item";
      item.innerHTML = `
        <input type="checkbox" class="checklist-checkbox" id="core-check-${idx}">
        <div class="checklist-text">
          <span class="checklist-name">${coreEx.name}</span>
          <span class="checklist-target">Objetivo: ${coreEx.reps}</span>
        </div>
      `;
      item.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) item.classList.add("checked");
        else item.classList.remove("checked");
      });
      coreList.appendChild(item);
    });
  } else {
    coreCard.classList.add("hidden");
  }

  // Cardio
  const cardioCard = document.getElementById("cardio-card");
  const cardioCheckbox = document.getElementById("cardio-checkbox");
  cardioCheckbox.checked = false;
  document.getElementById("cardio-item").classList.remove("checked");

  if (dayData.cardio) {
    cardioCard.classList.remove("hidden");
    document.getElementById("cardio-name").textContent = dayData.cardio.name;
    document.getElementById("cardio-target").textContent = `Duración: ${dayData.cardio.duration}`;
    
    // Quitar listeners previos
    const newCardioCheckbox = cardioCheckbox.cloneNode(true);
    cardioCheckbox.parentNode.replaceChild(newCardioCheckbox, cardioCheckbox);
    
    newCardioCheckbox.addEventListener("change", (e) => {
      const parent = document.getElementById("cardio-item");
      if (e.target.checked) parent.classList.add("checked");
      else parent.classList.remove("checked");
    });
  } else {
    cardioCard.classList.add("hidden");
  }
}

// Helper: Extraer estadísticas anteriores del ejercicio
function getPreviousExerciseStats(userId, dayId, exerciseId, historyLogs) {
  const dayLogs = historyLogs
    .filter(w => w.userId === userId && w.dayId === dayId && w.exercises[exerciseId])
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (dayLogs.length > 0) {
    return dayLogs[0].exercises[exerciseId];
  }
  return null;
}

// 4. Render de la Vista de Analíticas y Gráficos
function renderAnalyticsView(state) {
  if (!state.activeUser || state.activeView !== 'analytics') return;

  // Actualizar métricas del dashboard
  const userLogs = state.workoutsHistory.filter(w => w.userId === state.activeUser);
  
  if (userLogs.length === 0) {
    document.getElementById("metric-avg-1rm").textContent = "—";
    document.getElementById("metric-total-volume").textContent = "—";
    document.getElementById("metric-consistency").textContent = "0";
    document.getElementById("metric-pr-count").textContent = "0";
    return;
  }

  // 1RM Promedio Fuerza (ejercicios primarios clave)
  const keyLifts = ["sentadilla", "press_banca", "peso_muerto_rumano", "dominadas_lastradas"];
  let sum1RM = 0;
  let count1RM = 0;

  keyLifts.forEach(liftId => {
    const liftLogs = userLogs
      .filter(w => w.exercises[liftId])
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (liftLogs.length > 0) {
      const sets = liftLogs[0].exercises[liftId];
      const max1RM = Math.max(...sets.map(s => s.oneRM));
      if (max1RM > 0) {
        sum1RM += max1RM;
        count1RM++;
      }
    }
  });

  const avg1RMVal = count1RM > 0 ? Math.round(sum1RM / count1RM) : 0;
  document.getElementById("metric-avg-1rm").textContent = avg1RMVal > 0 ? avg1RMVal : "—";
  
  const change1RM = document.getElementById("metric-change-1rm");
  change1RM.className = "metric-card-change neutral";
  change1RM.innerHTML = `Lifts analizados: ${count1RM}/4`;

  // Volumen de la Última Semana
  const sortedLogs = [...userLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest5 = sortedLogs.slice(0, 5);
  const totalVolVal = latest5.reduce((sum, log) => sum + log.volume, 0);
  document.getElementById("metric-total-volume").textContent = totalVolVal.toLocaleString();

  const changeVol = document.getElementById("metric-change-volume");
  if (sortedLogs.length >= 10) {
    const prev5 = sortedLogs.slice(5, 10);
    const prevVol = prev5.reduce((sum, log) => sum + log.volume, 0);
    const diff = totalVolVal - prevVol;
    const pct = prevVol > 0 ? Math.round((diff / prevVol) * 100) : 0;

    if (diff > 0) {
      changeVol.className = "metric-card-change up";
      changeVol.innerHTML = `▲ +${pct}% (Sobrecarga de Volumen)`;
    } else {
      changeVol.className = "metric-card-change neutral";
      changeVol.innerHTML = `Volumen estable de mantención`;
    }
  } else {
    changeVol.className = "metric-card-change up";
    changeVol.innerHTML = `Estableciendo línea base de carga`;
  }

  // Consistencia (Frecuencia)
  const sessionsCount = userLogs.length;
  const targetSessions = 15; // 3 semanas * 5 entrenamientos
  const consistencyPct = Math.min(100, Math.round((sessionsCount / targetSessions) * 100));
  document.getElementById("metric-consistency").textContent = consistencyPct;

  // PRs totales
  const uniquePRs = {};
  userLogs.forEach(log => {
    Object.keys(log.exercises).forEach(exId => {
      const sets = log.exercises[exId];
      const maxW = Math.max(...sets.map(s => s.weight));
      if (!uniquePRs[exId] || maxW > uniquePRs[exId]) {
        uniquePRs[exId] = maxW;
      }
    });
  });
  document.getElementById("metric-pr-count").textContent = Object.keys(uniquePRs).length;

  // Cargar ejercicios en el dropdown de analíticas si está vacío
  populateAnalyticsSelectors();

  // Render de gráficos interactivos
  renderProgressChart();

  // Render de tabla de historial
  renderHistoryTable(userLogs);
}

// Rellena selectores de ejercicios en analíticas
function populateAnalyticsSelectors() {
  const select = document.getElementById("select-chart-exercise");
  if (select.children.length > 0) return; // ya cargados

  const uniqueExercises = [];
  window.ROUTINE_DB.forEach(day => {
    day.principales.forEach(ex => {
      if (!uniqueExercises.some(e => e.id === ex.id)) {
        uniqueExercises.push(ex);
      }
    });
  });

  uniqueExercises.forEach(ex => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = ex.name;
    select.appendChild(opt);
  });
}

// Render del Gráfico de Chart.js
function renderProgressChart() {
  const select = document.getElementById("select-chart-exercise");
  const exerciseId = select.value;
  if (!exerciseId) return;

  const state = store.state;
  const userLogs = state.workoutsHistory
    .filter(w => w.userId === state.activeUser && w.exercises[exerciseId])
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (userLogs.length === 0) {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  const labels = userLogs.map(log => {
    const d = new Date(log.date);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  });

  const maxWeights = userLogs.map(log => {
    const sets = log.exercises[exerciseId];
    return Math.max(...sets.map(s => s.weight));
  });

  const max1RMs = userLogs.map(log => {
    const sets = log.exercises[exerciseId];
    return Math.max(...sets.map(s => s.oneRM));
  });

  const ctx = document.getElementById("progress-chart").getContext("2d");
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Peso Máximo (kg)",
          data: maxWeights,
          borderColor: "#00f59b",
          backgroundColor: "rgba(0, 245, 155, 0.05)",
          borderWidth: 3,
          pointBackgroundColor: "#00f59b",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.25,
          fill: true
        },
        {
          label: "1RM Estimado (kg)",
          data: max1RMs,
          borderColor: "#9d4edd",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: "#9d4edd",
          pointRadius: 4,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#f3f4f6", font: { family: 'Outfit', size: 12 } }
        },
        tooltip: {
          backgroundColor: "#0d1221",
          titleColor: "#f3f4f6",
          bodyColor: "#f3f4f6",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#828fa3" }
        },
        y: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#828fa3" }
        }
      }
    }
  });
}

// Render de la Tabla de Historial
function renderHistoryTable(userLogs) {
  const tbody = document.getElementById("history-table-body");
  tbody.innerHTML = "";

  const sorted = [...userLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(log => {
    const dObj = window.ROUTINE_DB.find(d => d.id === log.dayId);
    const dayName = dObj ? dObj.name : log.dayId;
    
    // Lista formateada de ejercicios
    const exList = Object.keys(log.exercises).map(exId => {
      const exMeta = dObj ? dObj.principales.find(x => x.id === exId) : null;
      const exName = exMeta ? exMeta.name : exId;
      const sets = log.exercises[exId];
      const maxW = Math.max(...sets.map(s => s.weight));
      return `${exName} (${maxW}kg)`;
    }).join(", ");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(log.date).toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
      <td><span class="history-day-badge ${log.dayId}">${dayName}</span></td>
      <td style="font-weight: 700;">${log.volume.toLocaleString()} kg</td>
      <td class="up">▲ Activo</td>
      <td><div class="history-details" title="${exList}">${exList}</div></td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// 5. EVENT LISTENERS GENERALES
// -------------------------------------------------------------
function setupGeneralEventListeners() {
  // Cambio de Perfil
  document.getElementById("btn-change-user").addEventListener("click", () => {
    store.setActiveUser(null);
  });

  // Login de tarjetas de perfiles
  document.querySelectorAll(".profile-card").forEach(card => {
    card.addEventListener("click", () => {
      const user = card.getAttribute("data-user");
      store.setActiveUser(user);
      
      // Feedback Háptico suave al loguear
      if (navigator.vibrate) navigator.vibrate(60);
      showToast("🦾 Perfil Cargado", `Bienvenido, ${user}. ¡A aplastar marcas!`, "success");
    });
  });

  // Tab buttons de navegación
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      store.setActiveView(view);
    });
  });

  // Guardar configuración de perfil físico (estatura, peso)
  document.getElementById("btn-save-settings").addEventListener("click", async () => {
    const heightVal = parseFloat(document.getElementById("settings-height").value);
    const weightVal = parseFloat(document.getElementById("settings-weight").value);

    if (!heightVal || heightVal <= 0 || !weightVal || weightVal <= 0) {
      showToast("⚠️ Valores Inválidos", "Por favor ingresa estatura y peso corporal mayores a cero.", "success");
      return;
    }

    try {
      await store.updateProfileSettings(store.state.activeUser, heightVal, weightVal);
      
      // Feedback Sonoro e Háptico
      if (navigator.vibrate) navigator.vibrate([60, 60]);
      showToast("⚙️ Configuración Guardada", `Se actualizó estatura a ${heightVal} cm y peso corporal de hoy a ${weightVal} kg.`, "success");
    } catch (err) {
      showToast("❌ Error al Guardar", err.message, "success");
    }
  });

  // Selectores de Gráfico
  document.getElementById("select-chart-exercise").addEventListener("change", () => {
    renderProgressChart();
  });

  // Guardar Sesión de entrenamiento
  document.getElementById("btn-save-workout").addEventListener("click", async () => {
    const dayData = window.ROUTINE_DB.find(d => d.id === store.state.activeDay);
    if (!dayData) return;

    const exercisesInputData = {};
    let filledCount = 0;

    dayData.principales.forEach(ex => {
      const sets = [];
      const card = document.querySelector(`.exercise-card[data-ex-id="${ex.id}"]`);
      if (!card) return;

      for (let s = 1; s <= ex.sets; s++) {
        const wVal = card.querySelector(`#${ex.id}-w-${s}`).value;
        const rVal = card.querySelector(`#${ex.id}-r-${s}`).value;
        const rirVal = card.querySelector(`#${ex.id}-rir-${s}`).value;

        if (wVal > 0 && rVal > 0) {
          sets.push({
            weight: parseFloat(wVal),
            reps: parseInt(rVal),
            rir: parseInt(rirVal)
          });
          filledCount++;
        }
      }
      if (sets.length > 0) {
        exercisesInputData[ex.id] = sets;
      }
    });

    if (filledCount === 0) {
      showToast("⚠️ Formulario Vacío", "Ingresa al menos el peso y repeticiones de una serie para guardar.", "success");
      return;
    }

    // Activación y Abdomen completados
    let actsChecked = true;
    if (dayData.activacion) {
      dayData.activacion.forEach((_, idx) => {
        const check = document.getElementById(`act-check-${idx}`);
        if (check && !check.checked) actsChecked = false;
      });
    }

    let coreChecked = true;
    if (dayData.core) {
      dayData.core.forEach((_, idx) => {
        const check = document.getElementById(`core-check-${idx}`);
        if (check && !check.checked) coreChecked = false;
      });
    }

    const cardioChecked = dayData.cardio ? document.getElementById("cardio-checkbox").checked : false;

    try {
      const res = await store.saveCurrentWorkout(
        store.state.activeDay,
        exercisesInputData,
        actsChecked,
        coreChecked,
        cardioChecked
      );

      // Feedback Háptico y Sonoro
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      showToast("🏋️‍♂️ Entrenamiento Guardado", `Sesión de ${dayData.name} registrada. Volumen total: ${res.volume} kg.`, "success");

      if (res.prsBroken.length > 0) {
        setTimeout(() => {
          res.prsBroken.forEach(pr => {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]); // Vibración especial de Récord
            showToast(
              "🔥 ¡NUEVO PR LOGRAMOS!", 
              `Batió marca en ${pr.exerciseName}: ${pr.weight} kg (${pr.oneRM} kg 1RM Est.)`, 
              "pr-hit"
            );
          });
        }, 800);
      }

      // Redirigir a analíticas
      setTimeout(() => {
        store.setActiveView("analytics");
      }, 1500);

    } catch (err) {
      showToast("❌ Error", err.message, "success");
    }
  });
}

// -------------------------------------------------------------
// 6. CONTROL Y UI DEL TEMPORIZADOR DE DESCANSO
// -------------------------------------------------------------
function setupRestTimerUI() {
  // Crear el HTML de la tarjeta flotante de Rest Timer dinámicamente
  const timerDiv = document.createElement("div");
  timerDiv.id = "rest-timer-card";
  timerDiv.className = "rest-timer-card";
  timerDiv.innerHTML = `
    <div class="rest-timer-circle-area">
      <svg class="rest-timer-svg">
        <circle class="rest-timer-bg-circle" cx="27" cy="27" r="25"></circle>
        <circle class="rest-timer-progress-circle" id="rest-timer-progress-circle" cx="27" cy="27" r="25"></circle>
      </svg>
      <div class="rest-timer-icon">⏱️</div>
    </div>
    <div class="rest-timer-content">
      <span class="rest-timer-label">Tiempo de Descanso</span>
      <span class="rest-timer-digits" id="rest-timer-digits">00:00</span>
    </div>
    <div class="rest-timer-actions">
      <button class="btn-timer-action" id="btn-timer-add-30">+30s</button>
      <button class="btn-timer-action" id="btn-timer-sub-30">-30s</button>
      <button class="btn-timer-action skip" id="btn-timer-skip">Omitir</button>
    </div>
  `;
  document.body.appendChild(timerDiv);

  // Bind de eventos de control del Timer
  document.getElementById("btn-timer-add-30").addEventListener("click", () => adjustTimer(30));
  document.getElementById("btn-timer-sub-30").addEventListener("click", () => adjustTimer(-30));
  document.getElementById("btn-timer-skip").addEventListener("click", stopRestTimer);
}

function startRestTimer(seconds) {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
  }

  timerTotalSeconds = seconds;
  timerSecondsRemaining = seconds;

  const card = document.getElementById("rest-timer-card");
  card.classList.add("active");

  updateTimerDisplay();

  activeTimerInterval = setInterval(() => {
    timerSecondsRemaining--;
    if (timerSecondsRemaining <= 0) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
      
      // Alerta Sonora y Háptica al llegar a 0
      playSportsChime();
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      
      showToast("⏱️ Descanso Completado", "Es momento de la siguiente serie. ¡Con todo!", "success");
      
      setTimeout(() => {
        card.classList.remove("active");
      }, 5000);
    }
    updateTimerDisplay();
  }, 1000);
}

function adjustTimer(amount) {
  timerSecondsRemaining = Math.max(0, timerSecondsRemaining + amount);
  timerTotalSeconds = Math.max(1, timerTotalSeconds + amount);
  updateTimerDisplay();
}

function stopRestTimer() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
  document.getElementById("rest-timer-card").classList.remove("active");
}

function updateTimerDisplay() {
  const digits = document.getElementById("rest-timer-digits");
  const m = Math.floor(timerSecondsRemaining / 60);
  const s = timerSecondsRemaining % 60;
  digits.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  // Actualizar el progress circular de SVG
  const circle = document.getElementById("rest-timer-progress-circle");
  const maxOffset = 157; // 2 * PI * r (r=25)
  const percentRemaining = timerSecondsRemaining / timerTotalSeconds;
  const offset = maxOffset * (1 - percentRemaining);
  circle.style.strokeDashoffset = isNaN(offset) ? 0 : offset;
}

// -------------------------------------------------------------
// 7. TOAST NOTIFICATIONS (POP-UPS DENTRO DE LA APP)
// -------------------------------------------------------------
export function showToast(title, message, type = "success") {
  const container = document.getElementById("toast-container");
  
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "🦾";
  if (type === "pr-hit") icon = "🔥";
  if (title.includes("Descanso")) icon = "⏱️";
  if (title.includes("Error")) icon = "❌";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-15px) scale(0.95)";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4500);
}

// -------------------------------------------------------------
// 8. RENDERIZADO Y CONTROL DE VISTA DE AJUSTES / PESO CORPORAL
// -------------------------------------------------------------
let weightChartInstance = null;

function renderSettingsView(state) {
  if (!state.activeUser || state.activeView !== 'settings') return;

  const profile = state.userProfiles ? state.userProfiles[state.activeUser] : null;
  const heightInput = document.getElementById("settings-height");
  const weightInput = document.getElementById("settings-weight");

  if (profile) {
    if (heightInput && !heightInput.matches(':focus')) {
      heightInput.value = profile.height || "";
    }
    if (weightInput && !weightInput.matches(':focus')) {
      weightInput.value = profile.weight || "";
    }
  }

  // Renderizar la tabla de historial de peso corporal
  renderWeightHistoryTable(state);

  // Renderizar el gráfico de peso corporal
  renderWeightHistoryChart(state);
}

function renderWeightHistoryTable(state) {
  const tbody = document.getElementById("weight-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const profile = state.userProfiles ? state.userProfiles[state.activeUser] : null;
  if (!profile || !profile.weightHistory || profile.weightHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 25px;">No hay registros de peso aún. Completa el formulario de arriba.</td></tr>`;
    return;
  }

  // Mostrar ordenado descendente por fecha
  const sorted = [...profile.weightHistory].sort((a, b) => new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00"));

  sorted.forEach(log => {
    const w = parseFloat(log.weight);
    const h = parseFloat(profile.height);
    let imcStr = "—";
    let statusStr = "—";
    let statusClass = "neutral";

    if (w > 0 && h > 0) {
      const imc = w / ((h / 100) * (h / 100));
      imcStr = imc.toFixed(1);
      
      if (imc < 18.5) {
        statusStr = "Bajo peso";
        statusClass = "low";
      } else if (imc < 25) {
        statusStr = "Normal";
        statusClass = "normal";
      } else if (imc < 30) {
        statusStr = "Sobrepeso";
        statusClass = "overweight";
      } else {
        statusStr = "Obesidad";
        statusClass = "obese";
      }
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(log.date + "T00:00:00").toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
      <td style="font-weight: 700; color: var(--accent);">${w} kg</td>
      <td>${h > 0 ? h + " cm" : "—"}</td>
      <td style="font-weight: 700;">${imcStr}</td>
      <td><span class="weight-status-badge ${statusClass}">${statusStr}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderWeightHistoryChart(state) {
  const profile = state.userProfiles ? state.userProfiles[state.activeUser] : null;
  if (!profile || !profile.weightHistory || profile.weightHistory.length === 0) {
    if (weightChartInstance) {
      weightChartInstance.destroy();
      weightChartInstance = null;
    }
    return;
  }

  // Ordenar cronológicamente para el gráfico de línea
  const sorted = [...profile.weightHistory].sort((a, b) => new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00"));
  
  const labels = sorted.map(log => {
    const d = new Date(log.date + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  });

  const weights = sorted.map(log => parseFloat(log.weight));

  const canvas = document.getElementById("weight-history-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Peso Corporal (kg)",
          data: weights,
          borderColor: "#3a86ff",
          backgroundColor: "rgba(58, 134, 255, 0.05)",
          borderWidth: 3,
          pointBackgroundColor: "#3a86ff",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.25,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#f3f4f6", font: { family: 'Outfit', size: 12 } }
        },
        tooltip: {
          backgroundColor: "#0d1221",
          titleColor: "#f3f4f6",
          bodyColor: "#f3f4f6",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#828fa3" }
        },
        y: {
          grid: { color: "rgba(255,255,255,0.03)" },
          ticks: { color: "#828fa3" }
        }
      }
    }
  });
}
