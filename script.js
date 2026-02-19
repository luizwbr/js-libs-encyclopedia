/* global libraries, categories */

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────
  let state = {
    search: "",
    category: "all",
    sort: "name",
    view: "grid",
  };

  // ── DOM References ─────────────────────────────────────────────────────
  const grid = document.getElementById("libraries-grid");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const categoryFiltersEl = document.getElementById("category-filters");
  const noResults = document.getElementById("no-results");
  const resultsCount = document.getElementById("results-count");
  const totalCount = document.getElementById("total-count");
  const gridViewBtn = document.getElementById("grid-view-btn");
  const listViewBtn = document.getElementById("list-view-btn");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalContent = document.getElementById("modal-content");
  const modalClose = document.getElementById("modal-close");
  const resetFiltersBtn = document.getElementById("reset-filters");
  const heroBadgeCount = document.getElementById("hero-badge-count");
  const submitLibBtn = document.getElementById("submit-lib-btn");
  const submitModalOverlay = document.getElementById("submit-modal-overlay");
  const submitModalClose = document.getElementById("submit-modal-close");
  const submitLibForm = document.getElementById("submit-lib-form");

  // ── Category Counts ────────────────────────────────────────────────────
  function getCategoryCounts() {
    const counts = {};
    libraries.forEach(function (lib) {
      counts[lib.category] = (counts[lib.category] || 0) + 1;
    });
    return counts;
  }

  // ── Render Filters ─────────────────────────────────────────────────────
  function renderFilters() {
    const counts = getCategoryCounts();
    categoryFiltersEl.innerHTML = categories
      .map(function (cat) {
        const count = cat.id === "all" ? libraries.length : (counts[cat.id] || 0);
        if (cat.id !== "all" && count === 0) return "";
        const active = state.category === cat.id ? "active" : "";
        return `<button
          class="filter-btn ${active}"
          data-category="${cat.id}"
          aria-pressed="${state.category === cat.id}"
        >${cat.label} <span class="filter-count">${count}</span></button>`;
      })
      .join("");

    categoryFiltersEl.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.category = btn.dataset.category;
        renderFilters();
        renderCards();
      });
    });
  }

  // ── Filter + Sort ──────────────────────────────────────────────────────
  function getFilteredLibraries() {
    let list = libraries.slice();

    // Category filter
    if (state.category !== "all") {
      list = list.filter(function (lib) {
        return lib.category === state.category;
      });
    }

    // Search filter
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(function (lib) {
        return (
          lib.name.toLowerCase().includes(q) ||
          lib.description.toLowerCase().includes(q) ||
          lib.tags.some(function (tag) { return tag.toLowerCase().includes(q); }) ||
          lib.category.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    list.sort(function (a, b) {
      switch (state.sort) {
        case "stars":
          return parseFloat(b.stars) - parseFloat(a.stars);
        case "created":
          return b.created - a.created;
        case "created-asc":
          return a.created - b.created;
        default: // name
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }

  // ── Category Label ─────────────────────────────────────────────────────
  function getCategoryLabel(id) {
    const cat = categories.find(function (c) { return c.id === id; });
    return cat ? cat.label : id;
  }

  // ── Build Card HTML ────────────────────────────────────────────────────
  function buildCardHTML(lib) {
    const tagsHTML = lib.tags
      .slice(0, 4)
      .map(function (tag) { return `<span class="tag">${tag}</span>`; })
      .join("");

    return `
      <article
        class="library-card"
        tabindex="0"
        data-id="${lib.id}"
        aria-label="${lib.name} library"
        style="animation-delay: ${(lib.id % 10) * 30}ms"
      >
        <div class="card-header">
          <div class="card-logo-wrap">
            <div class="card-logo" aria-hidden="true">${lib.logo}</div>
            <div class="card-title-group">
              <h3 class="card-title">${lib.name}</h3>
              <span class="card-version">v${lib.version}</span>
            </div>
          </div>
          <div class="card-stars" aria-label="${lib.stars} GitHub stars">
            ★ ${lib.stars}
          </div>
        </div>
        <div class="card-body">
          <p class="card-description">${lib.description}</p>
          <div class="card-tags" aria-label="Tags">${tagsHTML}</div>
        </div>
        <div class="card-footer">
          <span class="card-category">${getCategoryLabel(lib.category)}</span>
          <span class="card-cta">Details →</span>
        </div>
      </article>`;
  }

  // ── Render Cards ───────────────────────────────────────────────────────
  function renderCards() {
    const filtered = getFilteredLibraries();

    if (filtered.length === 0) {
      grid.innerHTML = "";
      noResults.classList.remove("hidden");
      resultsCount.innerHTML = "<strong>0</strong> results";
      return;
    }

    noResults.classList.add("hidden");
    resultsCount.innerHTML = `<strong>${filtered.length}</strong> of ${libraries.length} libraries`;
    grid.innerHTML = filtered.map(buildCardHTML).join("");

    grid.querySelectorAll(".library-card").forEach(function (card) {
      card.addEventListener("click", function () { openModal(parseInt(card.dataset.id, 10)); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(parseInt(card.dataset.id, 10));
        }
      });
    });
  }

  // ── Modal ──────────────────────────────────────────────────────────────
  function openModal(libId) {
    const lib = libraries.find(function (l) { return l.id === libId; });
    if (!lib) return;

    const tagsHTML = lib.tags
      .map(function (tag) { return `<span class="modal-tag">${tag}</span>`; })
      .join("");

    modalContent.innerHTML = `
      <div class="modal-hero">
        <div class="modal-logo" aria-hidden="true">${lib.logo}</div>
        <div>
          <h2 class="modal-name" id="modal-title">${lib.name}</h2>
          <p class="modal-tagline">${getCategoryLabel(lib.category)} · Created ${lib.created} · ${lib.language}</p>
        </div>
      </div>

      <div class="modal-badges" aria-label="Library details">
        <span class="badge badge-version">v${lib.version}</span>
        <span class="badge badge-stars">★ ${lib.stars} stars</span>
        <span class="badge badge-year">Since ${lib.created}</span>
        <span class="badge badge-lang">${lib.language}</span>
      </div>

      <p class="modal-section-title">About</p>
      <p class="modal-description">${lib.description}</p>

      <p class="modal-section-title">Tags</p>
      <div class="modal-tags" aria-label="Tags">${tagsHTML}</div>

      <p class="modal-section-title">Links</p>
      <div class="modal-links">
        <a href="${lib.website}" class="modal-link website" target="_blank" rel="noopener noreferrer" aria-label="${lib.name} official website">
          🌐 Website
        </a>
        <a href="${lib.github}" class="modal-link github" target="_blank" rel="noopener noreferrer" aria-label="${lib.name} on GitHub">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          GitHub
        </a>
        <a href="https://www.npmjs.com/package/${lib.npm}" class="modal-link npm" target="_blank" rel="noopener noreferrer" aria-label="${lib.name} on npm">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zm-13.334-4h1.335v2.669h-1.335V9.998z"/></svg>
          npm
        </a>
      </div>`;

    modalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Focus management
    requestAnimationFrame(function () {
      modalClose.focus();
    });
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // ── Submit Library Modal ───────────────────────────────────────────────
  function openSubmitModal() {
    submitModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () {
      submitModalClose.focus();
    });
  }

  function closeSubmitModal() {
    submitModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  submitLibBtn.addEventListener("click", openSubmitModal);
  submitModalClose.addEventListener("click", closeSubmitModal);

  submitModalOverlay.addEventListener("click", function (e) {
    if (e.target === submitModalOverlay) closeSubmitModal();
  });

  submitLibForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(submitLibForm);
    var name = (data.get("name") || "").trim();
    var description = (data.get("description") || "").trim();
    var category = (data.get("category") || "").trim();
    var tags = (data.get("tags") || "").trim();
    var website = (data.get("website") || "").trim();
    var github = (data.get("github") || "").trim();
    var npm = (data.get("npm") || "").trim();
    var created = (data.get("created") || "").trim();
    var language = (data.get("language") || "").trim();

    if (!name || !description || !category || !language) return;

    var body = [
      "## New Library Submission",
      "",
      "| Field | Value |",
      "|-------|-------|",
      "| **Name** | " + name + " |",
      "| **Description** | " + description + " |",
      "| **Category** | " + category + " |",
      "| **Tags** | " + tags + " |",
      "| **Website** | " + (website || "—") + " |",
      "| **GitHub** | " + (github || "—") + " |",
      "| **npm** | " + (npm || "—") + " |",
      "| **Year Created** | " + (created || "—") + " |",
      "| **Language** | " + language + " |",
    ].join("\n");

    var issueUrl = "https://github.com/luizwbr/js-libs-encyclopedia/issues/new"
      + "?title=" + encodeURIComponent("Add Library: " + name)
      + "&body=" + encodeURIComponent(body)
      + "&labels=new-library";

    window.open(issueUrl, "_blank", "noopener,noreferrer");
  });

  // ── Event Listeners ────────────────────────────────────────────────────
  searchInput.addEventListener("input", function () {
    state.search = searchInput.value;
    renderCards();
  });

  sortSelect.addEventListener("change", function () {
    state.sort = sortSelect.value;
    renderCards();
  });

  gridViewBtn.addEventListener("click", function () {
    state.view = "grid";
    grid.classList.remove("list-view");
    gridViewBtn.classList.add("active");
    gridViewBtn.setAttribute("aria-pressed", "true");
    listViewBtn.classList.remove("active");
    listViewBtn.setAttribute("aria-pressed", "false");
  });

  listViewBtn.addEventListener("click", function () {
    state.view = "list";
    grid.classList.add("list-view");
    listViewBtn.classList.add("active");
    listViewBtn.setAttribute("aria-pressed", "true");
    gridViewBtn.classList.remove("active");
    gridViewBtn.setAttribute("aria-pressed", "false");
  });

  modalClose.addEventListener("click", closeModal);
  resetFiltersBtn.addEventListener("click", function () {
    state.search = "";
    state.category = "all";
    searchInput.value = "";
    renderFilters();
    renderCards();
  });

  // Close modal on overlay click
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!modalOverlay.classList.contains("hidden")) closeModal();
      if (!submitModalOverlay.classList.contains("hidden")) closeSubmitModal();
    }
    // Slash key focuses search
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // ── Initialise ─────────────────────────────────────────────────────────
  function init() {
    totalCount.textContent = libraries.length;
    heroBadgeCount.textContent = libraries.length + "+";
    renderFilters();
    renderCards();
  }

  init();
}());
