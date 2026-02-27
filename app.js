import axios from "axios";

/* =========================
   CONFIG
========================= */
const API_BASE = "https://veff-2026-quotes.netlify.app/api/v1";
const LOCAL_API_BASE = "http://localhost:3000/api/v1";

/* =========================
   QUOTE FEATURE
========================= */

/**
 * Fetch a quote from the API
 * @param {string} category - quote category
 */
const loadQuote = async (category = "general") => {
  const quoteTextEl = document.getElementById("quote-text");
  const quoteAuthorEl = document.getElementById("quote-author");

  try {
    const response = await axios.get(`${API_BASE}/quotes`, {
      params: { category },
    });

    const data = response.data;

    const quoteText = data.quote ?? data.text ?? "";
    const quoteAuthor = data.author ?? data.name ?? "";

    quoteTextEl.textContent = `"${quoteText}"`;
    quoteAuthorEl.textContent = quoteAuthor;
  } catch (error) {
    quoteTextEl.textContent = "Oops... could not load quote.";
    quoteAuthorEl.textContent = "";
    console.error(error);
  }
};

/**
 * Attach event listeners for quote feature
 */
const wireQuoteEvents = () => {
  const select = document.getElementById("quote-category-select");
  const button = document.getElementById("new-quote-btn");

  if (select) {
    select.addEventListener("change", async (e) => {
      const category = e.target.value || "general";
      await loadQuote(category);
    });
  }

  if (button) {
    button.addEventListener("click", async () => {
      const category = select?.value || "general";
      await loadQuote(category);
    });
  }
};

/* =========================
   TASKS FEATURE (PART B)
========================= */

const fetchTasks = async () => {
  const response = await axios.get(`${LOCAL_API_BASE}/tasks`);
  return response.data; // array of tasks
};

const patchTaskFinished = async (id, finished) => {
  const response = await axios.patch(`${LOCAL_API_BASE}/tasks/${id}`, {
    finished,
  });
  return response.data;
};

const postNewTask = async (taskText) => {
  const response = await axios.post(`${LOCAL_API_BASE}/tasks`, {
    task: taskText,
  });
  return response.data;
};

const renderTaskList = (tasks) => {
  const listEl = document.querySelector(".task-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.finished === 1;

    const label = document.createElement("label");
    label.textContent = t.task;

    checkbox.addEventListener("change", async (e) => {
      const newFinished = e.target.checked ? 1 : 0;

      try {
        await patchTaskFinished(t.id, newFinished);
      } catch (error) {
        console.error(error);
      }

      // Keep UI in sync with backend (robust approach)
      await loadTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    listEl.appendChild(li);
  });
};

const loadTasks = async () => {
  try {
    const tasks = await fetchTasks();
    renderTaskList(tasks);
  } catch (error) {
    console.error(error);
  }
};

const handleAddTask = async () => {
  const inputEl = document.getElementById("new-task");
  const addBtn = document.getElementById("add-task-btn");
  if (!inputEl) return;

  const raw = inputEl.value ?? "";
  const taskText = raw.trim();

  // Empty/invalid tasks must not be added
  if (taskText.length === 0) return;

  // Optional: prevent double submit
  if (addBtn) addBtn.disabled = true;

  try {
    await postNewTask(taskText);
    inputEl.value = "";
  } catch (error) {
    console.error(error);
  } finally {
    if (addBtn) addBtn.disabled = false;
  }

  await loadTasks();
};

const wireTaskEvents = () => {
  const form = document.getElementById("submit-new-task");
  const addBtn = document.getElementById("add-task-btn");

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      await handleAddTask();
    });
  }

  // Pressing Enter in the input should also add a task
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleAddTask();
    });
  }
};

/* =========================
   NOTES FEATURE (PART B)
========================= */

let lastSavedNotes = "";

const fetchNotes = async () => {
  const response = await axios.get(`${LOCAL_API_BASE}/notes`);
  // backend returns { notes: "..." }
  return response.data?.notes ?? "";
};

const putNotes = async (notesText) => {
  const response = await axios.put(`${LOCAL_API_BASE}/notes`, {
    notes: notesText,
  });
  return response.data?.notes ?? notesText;
};

const setSaveNotesEnabled = (enabled) => {
  const saveBtn = document.getElementById("save-notes-btn");
  if (!saveBtn) return;
  saveBtn.disabled = !enabled;
};

const loadNotes = async () => {
  const textarea = document.getElementById("notes-text");
  if (!textarea) return;

  try {
    const notes = await fetchNotes();
    lastSavedNotes = notes;
    textarea.value = notes;
    setSaveNotesEnabled(false);
  } catch (error) {
    console.error(error);
  }
};

const wireNotesEvents = () => {
  const textarea = document.getElementById("notes-text");
  const saveBtn = document.getElementById("save-notes-btn");

  if (textarea) {
    textarea.addEventListener("input", () => {
      setSaveNotesEnabled(textarea.value !== lastSavedNotes);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const currentText = textarea?.value ?? "";

      try {
        const saved = await putNotes(currentText);
        lastSavedNotes = saved;
        
        if (textarea) textarea.value = saved;
        setSaveNotesEnabled(false);
      } catch (error) {
        console.error(error);
      }
    });
  }
};

/* =========================
   INIT
========================= */

/**
 * Initialize application
 */
const init = async () => {
   // Part A
  wireQuoteEvents();

  const select = document.getElementById("quote-category-select");
  const category = select?.value || "general";

  await loadQuote(category);

  // Part B
  wireTaskEvents();
  wireNotesEvents();

  await loadTasks();
  await loadNotes();
};

/* =========================
   EXPORT (DO NOT REMOVE)
========================= */

export { init, loadQuote, wireQuoteEvents };

init();
