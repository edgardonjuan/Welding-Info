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
  const NOTE_SOURCE_OPTIONS = [
    { value: "general", label: "General reflection" },
    { value: "reading", label: "Reading insight" },
    { value: "practice", label: "Practice session" },
  ];
  const NOTE_SOURCE_LABELS = NOTE_SOURCE_OPTIONS.reduce((map, option) => {
    map[option.value] = option.label;
    return map;
  }, {});
  const STREAK_TYPE_LABELS = {
    practice: "Practice",
    reading: "Reading",
    notes: "Notes",
  };
  const noteContextControllers = [];

  function loadCustomReadings() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CUSTOM_READING_KEY) || "[]",
      );
      if (!Array.isArray(stored)) {
        return [];
      }

      const timestamp = Date.now();
      return stored
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          const id =
            typeof item.id === "string" && item.id
              ? item.id
              : `custom-${timestamp}-${index}`;
          const title =
            typeof item.title === "string" && item.title
              ? item.title
              : `Custom lesson ${index + 1}`;
          const tags = Array.isArray(item.tags)
            ? item.tags
            : item.tags
            ? [item.tags]
            : [];
          const uniqueTags = Array.from(
            new Set(tags.map((tag) => (typeof tag === "string" ? tag : "")).filter(Boolean)),
          );

          return {
            ...item,
            id,
            title,
            tags: uniqueTags,
            origin: "custom",
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.warn("Unable to parse saved readings", error);
      return [];
    }
  }

  function normalizeNote(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const id = typeof raw.id === "string" ? raw.id : `note-${Date.now()}`;
    const body = typeof raw.body === "string" ? raw.body : "";
    const createdAt =
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString();
    const source = NOTE_SOURCE_LABELS[raw.source] ? raw.source : "general";
    const relatedId =
      typeof raw.relatedId === "string" && raw.relatedId.trim()
        ? raw.relatedId.trim()
        : null;
    const relatedTitle =
      typeof raw.relatedTitle === "string" && raw.relatedTitle.trim()
        ? raw.relatedTitle.trim()
        : null;
    const tags = Array.isArray(raw.tags)
      ? raw.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean)
      : [];

    return {
      id,
      body,
      createdAt,
      source,
      relatedId,
      relatedTitle,
      tags,
    };
  }

  function loadNotes() {
    try {
      const stored = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
      let notes = Array.isArray(stored)
        ? stored
            .map((note) => normalizeNote(note))
            .filter((note) => note && note.body)
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

  function normalizeStreak(raw) {
    if (!raw || typeof raw !== "object") {
      return { count: 0, date: null, types: [] };
    }

    const count = Number(raw.count) || 0;
    const date = typeof raw.date === "string" ? raw.date : null;
    const types = Array.isArray(raw.types)
      ? raw.types
          .map((type) => (typeof type === "string" ? type.trim() : ""))
          .filter((type) => type)
      : [];

    return { count, date, types };
  }

  const templates = {
    tracker: document.getElementById("tracker-item-template"),
  };

  const state = {
    readings: JSON.parse(localStorage.getItem("reading-progress") || "{}"),
    practice: JSON.parse(localStorage.getItem("practice-progress") || "{}"),
    notes: loadNotes(),
    streak: (() => {
      try {
        const raw = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
        return normalizeStreak(raw);
      } catch (error) {
        console.warn("Unable to parse streak data", error);
        return { count: 0, date: null, types: [] };
      }
    })(),
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
  const streakTypesEl = document.querySelector("[data-streak-types]");
  const readingFilterEl = document.getElementById("reading-filter");
  const practiceFilterEl = document.getElementById("practice-filter");
  const addReadingForm = document.getElementById("add-reading-form");
  const customSummaryEl = document.getElementById("custom-reading-summary");
  const customListEl = document.getElementById("custom-reading-list");
  const noteForm = document.getElementById("note-form");
  const noteField = document.getElementById("note-text");
  const noteError = document.querySelector("[data-note-error]");
  const notesListEl = document.getElementById("notes-list");
  const emptyNotesEl = document.querySelector("[data-empty-notes]");
  const practiceEmptyEl = document.querySelector("[data-practice-empty]");
  const noteDialog = document.querySelector("[data-note-dialog]");
  const noteDialogField = noteDialog?.querySelector("[data-note-dialog-field]");
  const noteDialogError = noteDialog?.querySelector("[data-note-dialog-error]");
  const noteDialogForm = noteDialog?.querySelector("[data-note-dialog-form]");
  const noteDialogSource = noteDialog?.querySelector("[data-note-dialog-source]");
  const noteDialogRelatedWrapper = noteDialog?.querySelector(
    "[data-note-dialog-related-wrapper]",
  );
  const noteDialogRelatedSelect = noteDialog?.querySelector(
    "[data-note-dialog-related]",
  );
  const noteSourceSelect = document.querySelector("[data-note-source]");
  const noteRelatedWrapper = document.querySelector("[data-note-related-wrapper]");
  const noteRelatedSelect = document.querySelector("[data-note-related]");
  const backupExportButton = document.querySelector(
    '[data-action="export-data"]',
  );
  const backupImportInput = document.querySelector("[data-backup-input]");
  const backupMessageEl = document.querySelector("[data-backup-message]");

  const noteFormControls = setupNoteContextControls({
    sourceSelect: noteSourceSelect,
    relatedSelect: noteRelatedSelect,
    relatedWrapper: noteRelatedWrapper,
  });
  const noteDialogControls = setupNoteContextControls({
    sourceSelect: noteDialogSource,
    relatedSelect: noteDialogRelatedSelect,
    relatedWrapper: noteDialogRelatedWrapper,
  });

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
  const getPracticeItems = () => [...trackerData.practice];

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

  function updateStreak(action) {
    const today = new Date().toISOString().slice(0, 10);
    let { count, date, types } = state.streak;
    types = Array.isArray(types) ? types.slice() : [];

    const persist = () => {
      state.streak = { count, date, types };
      localStorage.setItem(STREAK_KEY, JSON.stringify(state.streak));
    };

    if (action && action.completed) {
      const normalizedType = STREAK_TYPE_LABELS[action.type]
        ? action.type
        : "practice";
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);

      if (date === today) {
        if (!types.includes(normalizedType)) {
          types.push(normalizedType);
          persist();
        }
      } else {
        if (date === yesterday) {
          count += 1;
        } else {
          count = 1;
        }
        date = today;
        types = [normalizedType];
        persist();
      }
    }

    if (streakCountEl) {
      const value = state.streak.count || 0;
      streakCountEl.textContent = `${value} ${value === 1 ? "day" : "days"}`;
    }

    if (streakTypesEl) {
      const currentTypes = Array.isArray(state.streak.types)
        ? state.streak.types
        : [];
      if (state.streak.date === today && currentTypes.length) {
        const labels = currentTypes.map(
          (type) => STREAK_TYPE_LABELS[type] || type,
        );
        streakTypesEl.textContent = `Today's credit: ${labels.join(", ")}`;
        streakTypesEl.hidden = false;
      } else {
        streakTypesEl.hidden = true;
        streakTypesEl.textContent = "";
      }
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
        const filters = new Set();
        if (item.focus) {
          filters.add(String(item.focus).toLowerCase());
        }
        wrapper.dataset.filters = Array.from(filters).join(",");
        wrapper.dataset.itemId = item.id;
      }

      checkbox.addEventListener("change", () => {
        state[progressKey][item.id] = checkbox.checked;
        localStorage.setItem(
          `${type}-progress`,
          JSON.stringify(state[progressKey]),
        );
        wrapper.dataset.state = checkbox.checked ? "done" : "pending";
        updateProgress();
        if (type === "practice" || type === "reading") {
          updateStreak({
            type,
            completed: checkbox.checked,
          });
        }

        if (type === "practice") {
          applyPracticeFilter();
        }
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

  function populatePracticeFilters() {
    if (!practiceFilterEl) return;

    const unique = new Set();
    getPracticeItems().forEach((item) => {
      if (item.focus) {
        unique.add(String(item.focus).toLowerCase());
      }
    });

    const current = practiceFilterEl.value;
    practiceFilterEl.innerHTML = "";

    const options = [
      { value: "all", label: "All practice" },
      ...Array.from(unique).map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
      })),
      { value: "done", label: "Completed reps" },
      { value: "pending", label: "Still to run" },
    ];

    options.forEach((option) => {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      practiceFilterEl.appendChild(node);
    });

    if (options.some((option) => option.value === current)) {
      practiceFilterEl.value = current;
    }
  }

  function applyPracticeFilter() {
    if (!practiceListEl || !practiceFilterEl) return;
    const filter = practiceFilterEl.value.toLowerCase();
    let visibleCount = 0;

    practiceListEl.querySelectorAll(".tracker-item").forEach((itemEl) => {
      let matches = false;

      if (filter === "all") {
        matches = true;
      } else if (filter === "done" || filter === "pending") {
        const state = (itemEl.dataset.state || "pending").toLowerCase();
        matches = filter === state;
      } else {
        const filters = (itemEl.dataset.filters || "")
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        matches = filters.includes(filter);
      }

      itemEl.hidden = !matches;
      if (matches) {
        visibleCount += 1;
      }
    });

    if (practiceEmptyEl) {
      practiceEmptyEl.hidden = visibleCount !== 0;
    }
  }

  function renderPracticeSection() {
    renderTracker(getPracticeItems(), practiceListEl, "practice");
    populatePracticeFilters();
    applyPracticeFilter();
    updateProgress();
  }

  function renderReadingSection() {
    renderTracker(getReadingItems(), readingListEl, "reading");
    populateReadingFilters();
    applyReadingFilter();
    updateCustomSummary();
    refreshAllNoteContextControls();
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

  function getNoteContextDetails(source, relatedId) {
    if (!relatedId) return null;
    if (source === "reading") {
      const item = getReadingItems().find((entry) => entry.id === relatedId);
      if (!item) return null;
      return {
        title: item.title,
        category: item.category,
        tags: Array.isArray(item.tags) ? item.tags : [],
      };
    }

    if (source === "practice") {
      const item = getPracticeItems().find((entry) => entry.id === relatedId);
      if (!item) return null;
      return {
        title: item.title,
        focus: item.focus,
      };
    }

    return null;
  }

  function buildNoteMetaFromSelection(sourceValue, relatedId) {
    const source = NOTE_SOURCE_LABELS[sourceValue] ? sourceValue : "general";
    const trimmedId = relatedId ? String(relatedId).trim() : "";
    const meta = { source };

    if (source !== "general" && trimmedId) {
      const details = getNoteContextDetails(source, trimmedId);
      if (details) {
        meta.relatedId = trimmedId;
        if (details.title) {
          meta.relatedTitle = details.title;
        }

        const tags = new Set();
        if (details.category) tags.add(details.category);
        if (details.focus) tags.add(details.focus);
        if (details.tags) {
          details.tags.forEach((tag) => tag && tags.add(tag));
        }
        meta.tags = Array.from(tags);
      }
    }

    if (!meta.tags) {
      meta.tags = [];
    }

    return meta;
  }

  function normalizeNoteMeta(meta) {
    if (!meta || typeof meta !== "object") {
      return { source: "general", tags: [] };
    }

    const source = NOTE_SOURCE_LABELS[meta.source] ? meta.source : "general";
    const normalized = { source };

    if (meta.relatedId && meta.relatedTitle) {
      normalized.relatedId = meta.relatedId;
      normalized.relatedTitle = meta.relatedTitle;
    }

    normalized.tags = Array.isArray(meta.tags)
      ? Array.from(new Set(meta.tags.filter(Boolean)))
      : [];

    return normalized;
  }

  function setupNoteContextControls({
    sourceSelect,
    relatedSelect,
    relatedWrapper,
  } = {}) {
    if (!sourceSelect || !relatedSelect || !relatedWrapper) {
      return null;
    }

    const populateSourceOptions = () => {
      const current = sourceSelect.value;
      sourceSelect.innerHTML = "";
      NOTE_SOURCE_OPTIONS.forEach((option) => {
        const node = document.createElement("option");
        node.value = option.value;
        node.textContent = option.label;
        sourceSelect.appendChild(node);
      });

      if (NOTE_SOURCE_OPTIONS.some((option) => option.value === current)) {
        sourceSelect.value = current;
      }
    };

    const populateRelatedOptions = () => {
      const source = sourceSelect.value;
      const shouldShow = source === "reading" || source === "practice";
      relatedWrapper.hidden = !shouldShow;

      const items = source === "reading" ? getReadingItems() : getPracticeItems();
      const previous = relatedSelect.value;

      relatedSelect.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "No linked item";
      relatedSelect.appendChild(defaultOption);

      if (shouldShow) {
        items.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.id;
          if (source === "practice") {
            const focusLabel = item.focus ? ` — ${item.focus}` : "";
            option.textContent = `${item.title}${focusLabel}`;
          } else {
            option.textContent = item.title;
          }
          relatedSelect.appendChild(option);
        });
      }

      if (
        shouldShow &&
        Array.from(relatedSelect.options).some((option) => option.value === previous)
      ) {
        relatedSelect.value = previous;
      } else {
        relatedSelect.value = "";
      }
    };

    sourceSelect.addEventListener("change", () => {
      populateRelatedOptions();
    });

    const controller = {
      sourceSelect,
      relatedSelect,
      relatedWrapper,
      refresh() {
        populateSourceOptions();
        populateRelatedOptions();
      },
      setContext(source, relatedId) {
        const normalized = NOTE_SOURCE_LABELS[source] ? source : "general";
        sourceSelect.value = normalized;
        populateRelatedOptions();
        if (relatedId) {
          const exists = Array.from(relatedSelect.options).some(
            (option) => option.value === relatedId,
          );
          relatedSelect.value = exists ? relatedId : "";
        } else {
          relatedSelect.value = "";
        }
      },
      getMeta() {
        const source = sourceSelect.value || "general";
        const relatedId = relatedSelect.value || "";
        return buildNoteMetaFromSelection(source, relatedId);
      },
    };

    populateSourceOptions();
    populateRelatedOptions();
    noteContextControllers.push(controller);
    return controller;
  }

  function refreshAllNoteContextControls() {
    noteContextControllers.forEach((controller) => {
      if (controller && typeof controller.refresh === "function") {
        controller.refresh();
      }
    });
  }

  function showBackupMessage(message, variant = "success") {
    if (!backupMessageEl) return;
    if (!message) {
      backupMessageEl.textContent = "";
      backupMessageEl.hidden = true;
      backupMessageEl.removeAttribute("data-variant");
      backupMessageEl.setAttribute("role", "status");
      return;
    }

    backupMessageEl.textContent = message;
    backupMessageEl.hidden = false;
    backupMessageEl.setAttribute("data-variant", variant);
    backupMessageEl.setAttribute("role", variant === "error" ? "alert" : "status");
  }

  function collectBackupData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        readings: state.readings,
        practice: state.practice,
        notes: state.notes,
        streak: state.streak,
        customReadings: state.customReadings,
      },
    };
  }

  function restoreBackup(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid backup file");
    }

    const data = payload.data;
    if (!data || typeof data !== "object") {
      throw new Error("Backup is missing data");
    }

    state.readings =
      data.readings && typeof data.readings === "object" ? data.readings : {};
    state.practice =
      data.practice && typeof data.practice === "object" ? data.practice : {};
    state.notes = Array.isArray(data.notes)
      ? data.notes
          .map((note) => normalizeNote(note))
          .filter((note) => note && note.body)
      : [];

    const normalizedCustomReadings = Array.isArray(data.customReadings)
      ? data.customReadings.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            item.id &&
            typeof item.title === "string" &&
            item.title,
        )
      : [];

    state.customReadings = normalizedCustomReadings.map((item) => {
      const tags = Array.isArray(item.tags)
        ? item.tags
        : item.tags
        ? [item.tags]
        : [];
      return {
        ...item,
        id: item.id,
        origin: item.origin || "custom",
        tags: Array.from(
          new Set(
            tags.map((tag) => (typeof tag === "string" ? tag : "")).filter(Boolean),
          ),
        ),
      };
    });
    state.streak = normalizeStreak(data.streak);

    localStorage.setItem("reading-progress", JSON.stringify(state.readings));
    localStorage.setItem("practice-progress", JSON.stringify(state.practice));
    saveNotes();
    saveCustomReadings();
    localStorage.setItem(STREAK_KEY, JSON.stringify(state.streak));

    if (readingListEl) {
      renderReadingSection();
    } else {
      updateCustomSummary();
    }

    if (practiceListEl) {
      renderPracticeSection();
    }

    renderNotes();
    refreshAllNoteContextControls();
    updateProgress();
    updateStreak();
  }

  function bindBackupControls() {
    if (!backupExportButton && !backupImportInput) {
      return;
    }

    if (backupExportButton) {
      backupExportButton.addEventListener("click", () => {
        try {
          const backup = collectBackupData();
          const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-");
          anchor.href = url;
          anchor.download = `welding-study-hub-backup-${timestamp}.json`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(url);
          showBackupMessage("Backup downloaded.", "success");
        } catch (error) {
          console.error("Unable to export backup", error);
          showBackupMessage("Couldn't create backup. Try again.", "error");
        }
      });
    }

    if (backupImportInput) {
      backupImportInput.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const payload = JSON.parse(text);
          restoreBackup(payload);
          showBackupMessage("Backup restored successfully.", "success");
        } catch (error) {
          console.error("Unable to restore backup", error);
          showBackupMessage(
            "Backup couldn't be restored. Double-check the file.",
            "error",
          );
        } finally {
          event.target.value = "";
        }
      });
    }
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

      const createChip = (text, className) => {
        if (!text) return null;
        const span = document.createElement("span");
        span.className = className;
        span.textContent = text;
        return span;
      };

      const chips = [];
      if (note.source && NOTE_SOURCE_LABELS[note.source]) {
        chips.push(
          createChip(
            NOTE_SOURCE_LABELS[note.source],
            "note-chip note-chip--source",
          ),
        );
      }

      if (note.relatedTitle) {
        const prefix =
          note.source === "practice"
            ? "Drill"
            : note.source === "reading"
            ? "Lesson"
            : "Context";
        chips.push(
          createChip(
            `${prefix}: ${note.relatedTitle}`,
            "note-chip note-chip--context",
          ),
        );
      }

      if (Array.isArray(note.tags)) {
        note.tags.forEach((tag) => {
          const chip = createChip(tag, "note-chip note-chip--tag");
          if (chip) {
            chips.push(chip);
          }
        });
      }

      const meta = document.createElement("div");
      meta.className = "note-meta";
      chips.forEach((chip) => {
        if (chip) meta.appendChild(chip);
      });

      const body = document.createElement("p");
      body.textContent = note.body;

      item.appendChild(header);
      if (meta.childElementCount) {
        item.appendChild(meta);
      }
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

  function addNote(body, meta) {
    const metadata = normalizeNoteMeta(meta);
    const note = {
      id: `note-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      source: metadata.source,
      relatedId: metadata.relatedId || null,
      relatedTitle: metadata.relatedTitle || null,
      tags: metadata.tags || [],
    };

    state.notes.unshift(note);
    saveNotes();
    renderNotes();
    updateStreak({ type: "notes", completed: true });
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

      const meta = noteFormControls?.getMeta?.() || {};
      addNote(body, meta);
      noteForm.reset();
      showNoteError("");
      noteField.focus();
    });

    noteForm.addEventListener("reset", () => {
      showNoteError("");
      noteFormControls?.setContext?.("general");
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

  function bindPracticeFilter() {
    if (!practiceFilterEl) return;
    practiceFilterEl.addEventListener("change", applyPracticeFilter);
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
        const origin = button.dataset.noteOrigin || "general";
        const relatedId = button.dataset.noteRelated || "";
        noteDialogControls?.setContext?.(origin, relatedId);
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

      const meta = noteDialogControls?.getMeta?.() || {};
      addNote(body, meta);
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
    renderPracticeSection();
    bindPracticeFilter();
  }

  if (notesListEl || noteForm) {
    bindNotesPage();
  }

  bindBackupControls();

  if (!readingListEl) {
    updateCustomSummary();
  }

  bindQuickNote();
  updateProgress();
  updateStreak();
})();
