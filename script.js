// Данные: массив задач
let tasks = JSON.parse(localStorage.getItem("kanban-tasks")) || [];

const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const themeToggle = document.getElementById("theme-toggle");

// --- 1. Сохранение и загрузка ---
function saveTasks() {
  localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
}

// --- 2. Отрисовка всех задач ---
function renderTasks() {
  // Очищаем все колонки
  document.getElementById("todo-list").innerHTML = "";
  document.getElementById("inprogress-list").innerHTML = "";
  document.getElementById("done-list").innerHTML = "";

  // Распределяем задачи по колонкам
  tasks.forEach((task, index) => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    taskEl.draggable = true;
    taskEl.dataset.index = index; // Запоминаем индекс задачи в массиве

    taskEl.innerHTML = `
      <span>${task.text}</span>
      <button class="delete-btn" title="Удалить">×</button>
    `;

    // Кнопка удаления (работает и на ПК, и на телефоне)
    taskEl.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // Чтобы не срабатывал клик по карточке
      tasks.splice(index, 1); // Удаляем из массива
      saveTasks();
      renderTasks();
    });

    // Добавляем в нужную колонку
    document.getElementById(task.status + "-list").appendChild(taskEl);
  });

  // После отрисовки навешиваем обработчики для Drag-and-Drop
  setupDragAndDrop();
}

// --- 3. Добавление новой задачи ---
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  // Добавляем в массив
  tasks.push({
    text: text,
    status: "todo", // По умолчанию всегда в "В планах"
  });

  taskInput.value = ""; // Очищаем поле
  saveTasks();
  renderTasks();
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// --- 4. Drag-and-Drop (Перетаскивание) ---
function setupDragAndDrop() {
  const tasksElements = document.querySelectorAll(".task");
  const columns = document.querySelectorAll(".column");

  // === ДЛЯ КОМПЬЮТЕРА (Мышь) ===
  tasksElements.forEach(task => {
    task.addEventListener("dragstart", () => {
      task.classList.add("dragging");
    });
    task.addEventListener("dragend", () => {
      task.classList.remove("dragging");
    });
  });

  columns.forEach(column => {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });
    column.addEventListener("drop", (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");
      
      const draggingTask = document.querySelector(".dragging");
      if (!draggingTask) return;
      
      moveTask(draggingTask.dataset.index, column.dataset.status);
    });
  });

  // === ДЛЯ ТЕЛЕФОНОВ (Касания) ===
  let activeTask = null;

  tasksElements.forEach(task => {
    // Начало касания
    task.addEventListener("touchstart", (e) => {
      // Если нажали на крестик — не перетаскиваем, а даем сработать клику
      if (e.target.closest(".delete-btn")) return;

      activeTask = task;
      activeTask.classList.add("dragging");
      e.preventDefault(); // Запрещаем выделение текста
    }, { passive: false });

    // Движение пальца
    task.addEventListener("touchmove", (e) => {
      if (!activeTask) return; 
      e.preventDefault();
      
      const touch = e.touches[0];
      const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (elementUnderFinger) {
        const column = elementUnderFinger.closest(".column");
        columns.forEach(c => c.classList.remove("drag-over"));
        if (column) column.classList.add("drag-over");
      }
    }, { passive: false });

    // Отпускание пальца
    task.addEventListener("touchend", (e) => {
      if (!activeTask) return; 

      activeTask.classList.remove("dragging");
      columns.forEach(c => c.classList.remove("drag-over"));
      
      const touch = e.changedTouches[0];
      const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (elementUnderFinger) {
        const column = elementUnderFinger.closest(".column");
        if (column) {
          moveTask(activeTask.dataset.index, column.dataset.status);
        }
      }
      
      activeTask = null;
    });
  });
}

// Вспомогательная функция для перемещения задачи
function moveTask(taskIndex, newStatus) {
  tasks[taskIndex].status = newStatus;
  saveTasks();
  renderTasks();
}

// --- 5. Темная тема ---
const currentTheme = localStorage.getItem("todo-theme");
if (currentTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    themeToggle.textContent = "🌙";
    localStorage.setItem("todo-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
    localStorage.setItem("todo-theme", "dark");
  }
});

// --- Старт программы ---
renderTasks();

// --- 6. Логика работы справки ---
const helpBtn = document.getElementById("help-btn");
const helpPanel = document.getElementById("help-panel");
const closeHelpBtn = document.getElementById("close-help");

// Открыть справку
helpBtn.addEventListener("click", () => {
  helpPanel.classList.remove("hidden");
  // Небольшая задержка, чтобы анимация сработала корректно
  setTimeout(() => {
    helpPanel.style.transform = "translateX(0)";
  }, 10);
});

// Закрыть справку
function closeHelp() {
  helpPanel.style.transform = "translateX(100%)";
  setTimeout(() => {
    helpPanel.classList.add("hidden");
  }, 300); // Ждем окончания анимации (0.3s)
}

closeHelpBtn.addEventListener("click", closeHelp);

// Закрытие по клику вне панели (на затемненном фоне)
document.addEventListener("click", (e) => {
  // Если панель открыта и клик был не по панели и не по кнопке открытия
  if (!helpPanel.classList.contains("hidden") && 
      !helpPanel.contains(e.target) && 
      e.target !== helpBtn) {
    closeHelp();
  }
});