(() => {
  const trackerData = {
    readings: [
      {
        id: "mig-basics",
        title: "Intro to MIG Welding Parameters",
        description: "Voltage, wire feed speed, contact tip to work distance",
        category: "process",
        link: "https://weldingtipsandtricks.com/mig-welding-basics.html",
        type: "Article",
        tags: ["process", "setup"],
      },
      {
        id: "safety-gear",
        title: "Personal Protective Equipment Checklist",
        description: "Helmet shade charts, gloves, jacket ratings",
        category: "safety",
        link: "https://www.lincolnelectric.com/en-us/support/welding-safety/Pages/welding-safety-gear.aspx",
        type: "Guide",
        tags: ["safety"],
      },
      {
        id: "joint-prep",
        title: "Preparing Joints for Strong Welds",
        description: "Cleaning, bevels, root gap, and fit-up for mild steel",
        category: "process",
        link: "https://www.millerwelds.com/resource/articles/welding-joint-preparation",
        type: "Article",
        tags: ["process", "fit-up"],
      },
      {
        id: "metallurgy",
        title: "Metallurgy Basics for Fabrication",
        description: "How heat-affected zones behave and why cooling matters",
        category: "theory",
        link: "https://materials.openstax.org/books/introduction-to-materials-science",
        type: "Chapter",
        tags: ["theory"],
      },
      {
        id: "symbols",
        title: "Reading Welding Symbols",
        description:
          "Blueprint interpretation essentials for fabrication drawings",
        category: "theory",
        link: "https://www.thefabricator.com/thefabricator/article/shopmanagement/welding-symbols-demystified",
        type: "Article",
        tags: ["theory", "blueprint"],
      },
      {
        id: "safety-ventilation",
        title: "Ventilation & Fume Safety",
        description:
          "Airflow strategies and respirator selection for indoor bays",
        category: "safety",
        link: "https://www.osha.gov/sites/default/files/publications/welding.pdf",
        type: "PDF",
        tags: ["safety", "environment"],
      },
    ],
    practice: [
      {
        id: "pads-of-beads",
        title: "Pads of Beads",
        description:
          "Run five steady beads focusing on travel speed and gun angle.",
        focus: "Fundamentals",
      },
      {
        id: "lap-joint",
        title: "Lap Joint Fillets",
        description:
          'Three 3" coupons, horizontal position, evaluate for undercut.',
        focus: "Positioning",
      },
      {
        id: "t-joint",
        title: "T-Joint Fillets",
        description: "Practice pushing vs pulling to compare penetration.",
        focus: "Technique",
      },
      {
        id: "butt-joint",
        title: "Butt Joint Root Pass",
        description:
          '1/8" plate with 1/16" gap, monitor heat input and tie-in.',
        focus: "Heat control",
      },
      {
        id: "fabrication-mini",
        title: "Mini Fabrication Project",
        description:
          "Assemble a small frame or rack; track prep, tack, and final welds.",
        focus: "Project",
      },
      {
        id: "cleanup",
        title: "Cleanup & Inspection",
        description:
          "Grind, wire brush, and photograph your best weld for review.",
        focus: "Quality",
      },
    ],
  };

  const CUSTOM_READING_KEY = "custom-readings";
  const NOTES_KEY = "welding-note-entries";
  const STREAK_KEY = "welding-streak";

  function loadCustomReadings() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CUSTOM_READING_KEY) || "[]",
      );
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      console.warn("Unable to parse saved readings", error);
      return [];
    }
  }

  function loadNotes() {
    try {
      const stored = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
      let notes = Array.isArray(stored)
        ? stored.filter(
            (note) =>
              note &&
              typeof note.id === "string" &&
              typeof note.body === "string" &&
              typeof note.createdAt === "string",
          )
        : [];

      const legacy = localStorage.getItem("welding-notes");
      if (legacy && legacy.trim()) {
        notes.unshift({
          id: `legacy-${Date.now()}`,
          body: legacy.trim(),
          createdAt: new Date().toISOString(),
        });
        localStorage.removeItem("welding-notes");
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      }

      return notes.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    } catch (error) {
      console.warn("Unable to parse saved notes", error);
      return [];
    }
  }

  const templates = {
    tracker: document.getElementById("tracker-item-template"),
  };

  const state = {
    readings: JSON.parse(localStorage.getItem("reading-progress") || "{}"),
    practice: JSON.parse(localStorage.getItem("practice-progress") || "{}"),
    notes: loadNotes(),
    streak: JSON.parse(
      localStorage.getItem(STREAK_KEY) || '{"count":0,"date":null}',
    ),
    customReadings: loadCustomReadings(),
  };

  const readingListEl = document.getElementById("reading-list");
  const practiceListEl = document.getElementById("practice-list");
  const readingCountEl = document.getElementById("reading-count");
  const practiceCountEl = document.getElementById("practice-count");
  const readingBarEl = document.getElementById("reading-bar");
  const practiceBarEl = document.getElementById("practice-bar");
  const overallPercentageEl = document.getElementById("overall-percentage");
  const streakCountEl = document.getElementById("streak-count");
  const readingFilterEl = document.getElementById("reading-filter");
  const addReadingForm = document.getElementById("add-reading-form");
  const customSummaryEl = document.getElementById("custom-reading-summary");
  const customListEl = document.getElementById("custom-reading-list");
  const noteForm = document.getElementById("note-form");
  const noteField = document.getElementById("note-text");
  const noteError = document.querySelector("[data-note-error]");
  const notesListEl = document.getElementById("notes-list");
  const emptyNotesEl = document.querySelector("[data-empty-notes]");
  const noteDialog = document.querySelector("[data-note-dialog]");
  const noteDialogField = noteDialog?.querySelector("[data-note-dialog-field]");
  const noteDialogError = noteDialog?.querySelector("[data-note-dialog-error]");
  const noteDialogForm = noteDialog?.querySelector("[data-note-dialog-form]");

  const circle = document.querySelector(".progress-ring circle:nth-of-type(2)");
  const circumference = 2 * Math.PI * 52;

  const formatPercent = (value) => `${Math.round(value * 100)}%`;
  const formatDateTime = (value) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  };

  const getReadingItems = () => [
    ...trackerData.readings,
    ...state.customReadings,
  ];

  function saveCustomReadings() {
    localStorage.setItem(
      CUSTOM_READING_KEY,
      JSON.stringify(state.customReadings),
    );
  }

  function saveNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
  }

  function setProgressArc(value) {
    if (!circle) return;
    const offset = circumference - value * circumference;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;
  }

  function updateProgress() {
    const readingItems = getReadingItems();
    const readingTotal = readingItems.length || 1;
    const readingDone = readingItems.filter(
      (item) => state.readings[item.id],
    ).length;
    const readingPercent = readingDone / readingTotal;

    const practiceTotal = trackerData.practice.length || 1;
    const practiceDone = trackerData.practice.filter(
      (item) => state.practice[item.id],
    ).length;
    const practicePercent = practiceDone / practiceTotal;

    const overallPercent = (readingPercent + practicePercent) / 2;

    if (readingCountEl)
      readingCountEl.textContent = formatPercent(readingPercent);
    if (practiceCountEl)
      practiceCountEl.textContent = formatPercent(practicePercent);
    if (readingBarEl) readingBarEl.style.width = formatPercent(readingPercent);
    if (practiceBarEl)
      practiceBarEl.style.width = formatPercent(practicePercent);
    if (overallPercentageEl)
      overallPercentageEl.textContent = formatPercent(overallPercent);

    setProgressArc(overallPercent);
  }

  function updateStreak(completedToday) {
    const today = new Date().toISOString().slice(0, 10);
    let { count, date } = state.streak;

    if (completedToday) {
      if (date === today) {
        // already counted today
      } else {
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);
        if (date === yesterday) {
          count += 1;
        } else {
          count = 1;
        }
        state.streak = { count, date: today };
        localStorage.setItem(STREAK_KEY, JSON.stringify(state.streak));
      }
    }

    if (streakCountEl) {
      const value = state.streak.count || 0;
      streakCountEl.textContent = `${value} ${value === 1 ? "day" : "days"}`;
    }
  }

  function renderTracker(list, target, type) {
    if (!target || !templates.tracker) return;
    target.innerHTML = "";

    const progressKey = type === "reading" ? "readings" : type;
    const progressState = state[progressKey] || {};
    const fragment = document.createDocumentFragment();

    list.forEach((item) => {
      const node = templates.tracker.content.cloneNode(true);
      const wrapper = node.querySelector(".tracker-item");
      const checkbox = node.querySelector(".toggle");
      const content = node.querySelector(".tracker-content");
      const titleEl = node.querySelector("h3");
      const descriptionEl = node.querySelector("p");
      const badgeEl = node.querySelector(".badge");
      const tagsEl = node.querySelector(".tags");
      const removeButton = node.querySelector(".remove-item");

      const isComplete = Boolean(progressState[item.id]);
      checkbox.checked = isComplete;
      checkbox.id = `${type}-${item.id}`;
      wrapper.dataset.state = isComplete ? "done" : "pending";

      const badgeLabel =
        type === "reading"
          ? item.type || item.category || "Resource"
          : item.focus || "";
      badgeEl.textContent = badgeLabel;

      descriptionEl.textContent = item.description || "";
      descriptionEl.hidden = !item.description;

      if (tagsEl) {
        tagsEl.innerHTML = "";
        const tagValues = new Set();
        if (item.tags && item.tags.length) {
          item.tags.forEach((tag) => tag && tagValues.add(tag));
        }
        if (type === "reading" && item.category) {
          tagValues.add(item.category);
        }

        if (tagValues.size) {
          tagsEl.hidden = false;
          tagValues.forEach((tag) => {
            const span = document.createElement("span");
            span.className = "tag";
            span.textContent = tag;
            tagsEl.appendChild(span);
          });
        } else {
          tagsEl.hidden = true;
        }
      }

      titleEl.textContent = "";
      if (item.link) {
        const anchor = document.createElement("a");
        anchor.href = item.link;
        anchor.target = "_blank";
        anchor.rel = "noopener";
        anchor.className = "resource-link";
        anchor.innerHTML = `${item.title} <span>↗</span>`;
        titleEl.appendChild(anchor);
      } else {
        titleEl.textContent = item.title;
      }

      if (type === "reading") {
        const filters = new Set();
        const pushFilter = (value) => {
          if (value) filters.add(String(value).toLowerCase());
        };

        pushFilter(item.category);
        pushFilter(item.type);
        if (item.tags && item.tags.length) {
          item.tags.forEach((tag) => pushFilter(tag));
        }

        wrapper.dataset.filters = Array.from(filters).join(",");
        wrapper.dataset.itemId = item.id;
        wrapper.dataset.origin = item.origin || "default";

        if (item.origin === "custom" || String(item.id).startsWith("custom-")) {
          removeButton.hidden = false;
          removeButton.addEventListener("click", (event) => {
            event.stopPropagation();
            removeCustomReading(item.id);
          });
        } else {
          removeButton.remove();
        }
      } else {
        removeButton.remove();
      }

      checkbox.addEventListener("change", () => {
        state[progressKey][item.id] = checkbox.checked;
        localStorage.setItem(
          `${type}-progress`,
          JSON.stringify(state[progressKey]),
        );
        wrapper.dataset.state = checkbox.checked ? "done" : "pending";
        updateProgress();
        updateStreak(type === "practice" && checkbox.checked);
      });

      if (content) {
        content.addEventListener("click", (event) => {
          if (event.target.closest("a")) return;
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }

      fragment.appendChild(node);
    });

    target.appendChild(fragment);
  }

  function populateReadingFilters() {
    if (!readingFilterEl) return;
    const unique = new Set(["safety", "process", "theory", "blueprint"]);
    state.customReadings.forEach((item) => {
      if (item.category) {
        unique.add(item.category.toLowerCase());
      }
      if (item.tags) {
        item.tags.forEach((tag) => unique.add(String(tag).toLowerCase()));
      }
    });

    const current = readingFilterEl.value;
    readingFilterEl.innerHTML = "";
    const baseOptions = [
      { value: "all", label: "All readings" },
      ...Array.from(unique).map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
      })),
      { value: "custom", label: "Custom only" },
    ];

    baseOptions.forEach((option) => {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      readingFilterEl.appendChild(node);
    });

    if (baseOptions.some((option) => option.value === current)) {
      readingFilterEl.value = current;
    }
  }

  function applyReadingFilter() {
    if (!readingListEl || !readingFilterEl) return;
    const filter = readingFilterEl.value.toLowerCase();
    const emptyMessage = readingListEl.nextElementSibling;
    let visibleCount = 0;

    readingListEl.querySelectorAll(".tracker-item").forEach((itemEl) => {
      if (filter === "all") {
        itemEl.hidden = false;
        visibleCount += 1;
        return;
      }

      if (filter === "custom") {
        const isCustom = (itemEl.dataset.origin || "") === "custom";
        itemEl.hidden = !isCustom;
        if (isCustom) visibleCount += 1;
        return;
      }

      const filters = (itemEl.dataset.filters || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      const matches = filters.includes(filter);
      itemEl.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (emptyMessage && emptyMessage.matches(".empty-message")) {
      emptyMessage.hidden = visibleCount !== 0;
    }
  }

  function renderReadingSection() {
    renderTracker(getReadingItems(), readingListEl, "reading");
    populateReadingFilters();
    applyReadingFilter();
    updateCustomSummary();
    updateProgress();
  }

  function updateCustomSummary() {
    if (!customSummaryEl || !customListEl) return;
    const hasCustom = state.customReadings.length > 0;
    customSummaryEl.hidden = !hasCustom;

    if (!hasCustom) {
      customListEl.innerHTML = "";
      return;
    }

    customListEl.innerHTML = "";
    state.customReadings.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.title;
      customListEl.appendChild(li);
    });
  }

  function renderNotes() {
    if (!notesListEl || !emptyNotesEl) return;
    notesListEl.innerHTML = "";

    const hasNotes = state.notes.length > 0;
    emptyNotesEl.hidden = hasNotes;

    if (!hasNotes) {
      return;
    }

    state.notes.forEach((note) => {
      const item = document.createElement("li");
      item.className = "note-entry";

      const header = document.createElement("header");
      const timeEl = document.createElement("time");
      timeEl.dateTime = note.createdAt;
      timeEl.textContent = formatDateTime(note.createdAt);
      header.appendChild(timeEl);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.dataset.noteId = note.id;
      removeButton.setAttribute("data-note-remove", note.id);
      header.appendChild(removeButton);

      const body = document.createElement("p");
      body.textContent = note.body;

      item.appendChild(header);
      item.appendChild(body);
      notesListEl.appendChild(item);
    });
  }

  function removeCustomReading(id) {
    state.customReadings = state.customReadings.filter(
      (item) => item.id !== id,
    );
    delete state.readings[id];
    saveCustomReadings();
    localStorage.setItem("reading-progress", JSON.stringify(state.readings));
    renderReadingSection();
  }

  function addNote(body) {
    const note = {
      id: `note-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
    };

    state.notes.unshift(note);
    saveNotes();
    renderNotes();
    return note;
  }

  function bindAddReadingForm() {
    if (!addReadingForm) return;
    const errorEl = addReadingForm.querySelector("[data-form-error]");
    const showFormError = (message) => {
      if (!errorEl) return;
      errorEl.textContent = message || "";
      errorEl.hidden = !message;
    };

    const formatCategory = (value) =>
      value
        ? value
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "";

    addReadingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showFormError("");

      const formData = new FormData(addReadingForm);
      const title = (formData.get("title") || "").trim();
      let link = (formData.get("link") || "").trim();
      const description = (formData.get("description") || "").trim();
      const categoryInput = (formData.get("category") || "").trim();

      if (!title) {
        showFormError("Add a lesson title to continue.");
        return;
      }

      if (!link) {
        showFormError("Paste the lesson link so we can save it.");
        return;
      }

      if (!/^([a-z][a-z0-9+.-]*:)/i.test(link)) {
        link = `https://${link.replace(/^\/+/, "")}`;
      }

      try {
        link = new URL(link).toString();
      } catch (error) {
        showFormError("That link doesn't look valid. Try adding the full URL.");
        return;
      }

      const category = formatCategory(categoryInput);
      const tags = categoryInput
        ? Array.from(
            new Set(
              [categoryInput, category, categoryInput.toLowerCase()].filter(
                Boolean,
              ),
            ),
          )
        : [];

      const normalizedTitle = title.toLowerCase();
      const duplicate = getReadingItems().some((item) => {
        const titleMatch =
          (item.title || "").trim().toLowerCase() === normalizedTitle;
        const linkMatch = item.link && item.link === link;
        return titleMatch || linkMatch;
      });

      if (duplicate) {
        showFormError("That lesson is already on your checklist.");
        return;
      }

      const customItem = {
        id: `custom-${Date.now()}`,
        title,
        link,
        description,
        category,
        type: category || "Custom",
        origin: "custom",
        tags,
      };

      state.customReadings.push(customItem);
      saveCustomReadings();
      addReadingForm.reset();
      const titleField = addReadingForm.querySelector('[name="title"]');
      if (titleField) {
        titleField.focus();
      }
      showFormError("");
      renderReadingSection();
    });
  }

  function bindClearCustomReadings() {
    document
      .querySelectorAll('[data-action="clear-custom-readings"]')
      .forEach((button) => {
        button.addEventListener("click", () => {
          if (!state.customReadings.length) {
            return;
          }
          state.customReadings = [];
          saveCustomReadings();
          const keys = Object.keys(state.readings);
          keys.forEach((key) => {
            if (key.startsWith("custom-")) {
              delete state.readings[key];
            }
          });
          localStorage.setItem(
            "reading-progress",
            JSON.stringify(state.readings),
          );
          renderReadingSection();
        });
      });
  }

  function bindNotesPage() {
    if (!noteForm || !noteField) return;

    const showNoteError = (message) => {
      if (!noteError) return;
      noteError.textContent = message || "";
      noteError.hidden = !message;
    };

    renderNotes();

    noteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const body = noteField.value.trim();

      if (!body) {
        showNoteError("Add a reflection before saving.");
        noteField.focus();
        return;
      }

      addNote(body);
      noteForm.reset();
      showNoteError("");
      noteField.focus();
    });

    noteForm.addEventListener("reset", () => {
      showNoteError("");
    });

    if (notesListEl) {
      notesListEl.addEventListener("click", (event) => {
        const button = event.target.closest("[data-note-remove]");
        if (!button) return;
        const { noteId } = button.dataset;
        if (!noteId) return;

        state.notes = state.notes.filter((note) => note.id !== noteId);
        saveNotes();
        renderNotes();
      });
    }

    document
      .querySelectorAll('[data-action="clear-notes"]')
      .forEach((button) => {
        button.addEventListener("click", () => {
          if (!state.notes.length) {
            return;
          }
          state.notes = [];
          saveNotes();
          renderNotes();
        });
      });
  }

  function bindReadingFilter() {
    if (!readingFilterEl) return;
    readingFilterEl.addEventListener("change", applyReadingFilter);
  }

  function bindResets() {
    document
      .querySelectorAll('[data-action="reset-readings"]')
      .forEach((button) => {
        button.addEventListener("click", () => {
          state.readings = {};
          localStorage.removeItem("reading-progress");
          renderReadingSection();
        });
      });
  }

  function bindQuickNote() {
    const triggers = document.querySelectorAll("[data-open-note]");
    if (
      !triggers.length ||
      !noteDialog ||
      !noteDialogField ||
      !noteDialogForm
    ) {
      return;
    }

    const showDialogError = (message) => {
      if (!noteDialogError) return;
      noteDialogError.textContent = message || "";
      noteDialogError.hidden = !message;
    };

    const closeDialog = () => {
      showDialogError("");
      if (typeof noteDialog.close === "function") {
        noteDialog.close();
      } else {
        noteDialog.removeAttribute("open");
      }
    };

    triggers.forEach((button) => {
      button.addEventListener("click", () => {
        showDialogError("");
        noteDialogField.value = "";
        if (typeof noteDialog.showModal === "function") {
          noteDialog.showModal();
        } else {
          noteDialog.setAttribute("open", "open");
        }
        setTimeout(() => noteDialogField.focus(), 50);
      });
    });

    noteDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });

    noteDialogForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const body = noteDialogField.value.trim();
      if (!body) {
        showDialogError("Add a reflection before saving.");
        noteDialogField.focus();
        return;
      }

      addNote(body);
      closeDialog();
    });

    noteDialogForm.addEventListener("reset", (event) => {
      event.preventDefault();
      closeDialog();
    });
  }

  if (readingListEl) {
    renderReadingSection();
    bindAddReadingForm();
    bindClearCustomReadings();
    bindReadingFilter();
    bindResets();
  } else {
    updateProgress();
  }

  if (practiceListEl) {
    renderTracker(trackerData.practice, practiceListEl, "practice");
  }

  if (notesListEl || noteForm) {
    bindNotesPage();
  }

  if (!readingListEl) {
    updateCustomSummary();
  }

  bindQuickNote();
  updateProgress();
  updateStreak(false);
})();
