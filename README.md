# Híbrida Elite v5.0 — Central de Progreso

**Híbrida Elite v5.0** es una aplicación web de alto rendimiento diseñada específicamente para atletas que siguen la rutina de entrenamiento híbrido (fuerza, hipertrofia, core y cardio) de 5 días. La aplicación tiene como propósito fundamental registrar, analizar y promover la **sobrecarga progresiva** diaria, proporcionando métricas deportivas de alto valor científico.

![Tema Premium Cyberpunk Deportivo](https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop)

---

## 🚀 Características Clave

* **Pantalla de Carga de Perfiles (Pre-Loader):** Selector inicial de perfiles con transiciones fluidas de glassmorphism para 3 atletas: **Mateo**, **Santiago** y **Alim**.
* **Base de Datos Sembrada:** Precarga automática de 3 semanas de históricos deportivos diferenciados para cada atleta con curvas de progreso reales.
* **Control de Sobrecarga Progresiva Real ("Beat the Grey"):** Muestra en cada set el rendimiento de la sesión anterior en gris atenuado, dándole al atleta el objetivo exacto a superar.
* **Fórmula de Fuerza Estimada (1RM Epley):** Calcula en tiempo real tu repetición máxima estimada en base a la fórmula científica:
  $$1RM = Peso \times (1 + \frac{Reps}{30})$$
* **Volumen Semanal de Carga:** Suma en tiempo real el tonelaje de trabajo ($Sets \times Reps \times Weight$) total y por grupo muscular.
* **Gráficas de Evolución Interactivas:** Alimentadas por **Chart.js** para visualizar las curvas de peso máximo y 1RM estimado a lo largo del tiempo.
* **Sistema de Récords Personales (PRs):** Escanea e indica cuándo rompes una marca personal en peso o fuerza estimada lanzando tostas especiales de celebración.
* **Persistencia Local:** Almacenamiento e integridad de datos segura mediante `LocalStorage`.

---

## 🛠️ Tecnologías Utilizadas

* **Estructura:** HTML5 Semántico.
* **Estilos:** Vanilla CSS3 con variables CSS (HSL), *glassmorphism*, filtros de fondo y animaciones de micro-interacciones.
* **Lógica y Estados:** JavaScript Moderno (ES6+).
* **Gráficas:** Chart.js (CDN).

---

## 🏃‍♂️ Instrucciones de Uso Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/santiagonaranjofinanzas-droid/GYM.git
   ```
2. Inicia un servidor web local en la carpeta del proyecto. Por ejemplo, utilizando Python:
   ```bash
   python -m http.server 8000
   ```
3. Abre tu navegador e ingresa a `http://localhost:8000`.

---

## 📋 Distribución de la Rutina (Híbrida Elite v5.0)

* **Lunes:** Pierna — Cuadricep (5 ejercicios principales + 4 core)
* **Martes:** Pecho & Hombros (6 ejercicios principales + cardio de alta intensidad)
* **Miércoles:** Espalda & Bíceps (6 ejercicios principales + cardio de alta intensidad)
* **Jueves:** Pierna — Posterior & Glúteo (5 ejercicios principales + 3 core)
* **Viernes:** Upper Body Completo (7 ejercicios principales + cardio de alta intensidad)

---

Desarrollado con ❤️ para atletas híbridos de alto rendimiento.
