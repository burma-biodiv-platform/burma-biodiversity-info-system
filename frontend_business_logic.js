const state = {
  species: [],
  filteredSpecies: [],
  observations: [],
  documents: [],
  regions: [],
  selectedRegion: "All"
};

const $ = (sel) => document.querySelector(sel);

function normalize(v) { 
  return String(v || "").toLowerCase().trim(); 
}

function statusClass(status) {
  const value = normalize(status);
  if (value.includes("least")) return "status-lc";
  if (value.includes("near")) return "status-nt";
  if (value.includes("vulnerable")) return "status-vu";
  if (value.includes("endangered") && !value.includes("critically")) return "status-en";
  if (value.includes("critical")) return "status-cr";
  return "status-lc";
}

// Custom simple client-side page router
function showTab(tab) {
  document.querySelectorAll(".panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tab}`);
  });
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  $("#mobileNav")?.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Bind Page Tab Navigation buttons
function wireTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) showTab(tab);
    });
  });

  // Mobile menu button toggle
  $("#mobileMenuBtn")?.addEventListener("click", () => {
    $("#mobileNav")?.classList.toggle("hidden");
  });
}

// Sync Dropdown Options from DB state
function populateFormSelectors() {
  const taxonSelector = $("#observationTaxon");
  const regionSelector = $("#observationRegion");

  if (taxonSelector && state.species.length > 0) {
    taxonSelector.innerHTML = state.species.map(bird => 
      `<option value="${bird.id}">${bird.common_name} (${bird.scientific_name})</option>`
    ).join("");
  }

  if (regionSelector && state.regions.length > 0) {
    regionSelector.innerHTML = state.regions.map(reg => 
      `<option value="${reg.id}">${reg.name}</option>`
    ).join("");
  }
}

// Render dynamic homepage dashboard elements
function renderDashboard(data) {
  if (!data || !data.stats) return;
  
  if ($("#statSpeciesCount")) $("#statSpeciesCount").textContent = data.stats.species || 0;
  if ($("#statObservationsCount")) $("#statObservationsCount").textContent = data.stats.observations || 0;
  if ($("#statDocumentsCount")) $("#statDocumentsCount").textContent = data.stats.documents || 0;

  const speciesGrid = $("#recentSpeciesGrid");
  if (speciesGrid && data.recentSpecies) {
    speciesGrid.innerHTML = data.recentSpecies.map(bird => `
      <div class="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover-lift">
        <div>
          <span class="status-badge ${statusClass(bird.iucn_status)}">${bird.iucn_status}</span>
          <h4 class="font-bold text-sm text-slate-200 mt-2">${bird.common_name}</h4>
          <p class="text-xs text-emerald-400 italic">${bird.scientific_name}</p>
        </div>
        <button onclick="viewSpecificBird('${bird.common_name}')" class="text-left text-[11px] text-emerald-400 font-bold mt-4 hover:underline">
          View Profile &rarr;
        </button>
      </div>
    `).join("");
  }

  const obsList = $("#recentObservationsList");
  if (obsList && data.recentObservations) {
    obsList.innerHTML = data.recentObservations.map(o => `
      <div class="bg-slate-900 p-3.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
        <div>
          <p class="font-semibold text-slate-300">${o.common_name}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">${o.region_name} • By ${o.observer || "Anonymous"}</p>
        </div>
        <span class="bg-slate-950 px-2 py-1 rounded text-slate-400 text-[10px]">${o.count} seen</span>
      </div>
    `).join("");
  }
}

// Species Explorer Page Renderer
function renderSpeciesList() {
  const container = $("#speciesExplorerGrid");
  if (!container) return;

  const query = normalize($("#speciesSearchInput")?.value);
  const familyFilter = $("#speciesFilterFamily")?.value || "All";
  const statusFilter = $("#speciesFilterStatus")?.value || "All";

  const filtered = state.species.filter(bird => {
    const matchesSearch = !query || 
      normalize(bird.common_name).includes(query) || 
      normalize(bird.scientific_name).includes(query) || 
      normalize(bird.myanmar_name).includes(query) || 
      normalize(bird.family).includes(query);
    
    const matchesFamily = familyFilter === "All" || bird.family === familyFilter;
    const matchesStatus = statusFilter === "All" || bird.iucn_status === statusFilter;

    return matchesSearch && matchesFamily && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 text-sm">
        No bird taxons match the active search parameters.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(bird => `
    <div class="panel-card bg-slate-900/40 border-white/5 flex flex-col justify-between space-y-4 hover-lift">
      <div>
        <div class="flex items-start justify-between gap-2">
          <span class="status-badge ${statusClass(bird.iucn_status)}">${bird.iucn_status}</span>
          <span class="text-[10px] text-slate-500 font-semibold uppercase">${bird.family || "Accipitridae"}</span>
        </div>
        <div class="mt-3">
          <h3 class="text-lg font-black text-slate-100">${bird.common_name}</h3>
          <p class="text-xs text-emerald-400 italic">${bird.scientific_name} • <span class="text-amber-400 font-bold">${bird.myanmar_name || ""}</span></p>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed mt-3 line-clamp-3">${bird.description || ""}</p>
      </div>

      <div class="space-y-2 border-t border-white/5 pt-3">
        ${bird.smythies_quote ? `
          <p class="text-[10px] text-slate-500 italic line-clamp-2">
            <strong>Smythies:</strong> "${bird.smythies_quote}"
          </p>
        ` : ""}
        ${bird.harington_quote ? `
          <p class="text-[10px] text-slate-500 italic line-clamp-2">
            <strong>Harington:</strong> "${bird.harington_quote}"
          </p>
        ` : ""}
      </div>
    </div>
  `).join("");
}

// Redirect and search bird name instantly inside Explorer
window.viewSpecificBird = (birdName) => {
  showTab("species");
  const input = $("#speciesSearchInput");
  if (input) {
    input.value = birdName;
    renderSpeciesList();
  }
};

// Wire Interactive SVG Map Elements
function wireMap() {
  document.querySelectorAll(".map-state").forEach(el => {
    el.addEventListener("click", () => {
      const regionId = el.id.replace("path-", "");
      state.selectedRegion = regionId;
      
      // Update interactive labels
      if ($("#selectedRegionLabel")) $("#selectedRegionLabel").textContent = regionId;
      if ($("#clearMapFilter")) $("#clearMapFilter").classList.remove("hidden");

      // Highlight active path
      document.querySelectorAll(".map-state").forEach(p => p.classList.remove("fill-emerald-600"));
      el.classList.add("fill-emerald-600");

      updateMapSidebar(regionId);
    });
  });

  $("#clearMapFilter")?.addEventListener("click", () => {
    state.selectedRegion = "All";
    if ($("#selectedRegionLabel")) $("#selectedRegionLabel").textContent = "All Myanmar";
    if ($("#clearMapFilter")) $("#clearMapFilter").classList.add("hidden");
    document.querySelectorAll(".map-state").forEach(p => p.classList.remove("fill-emerald-600"));
    updateMapSidebar("All");
  });
}

// Update Map page sidebar details based on selected Region
function updateMapSidebar(regionId) {
  const sidebarTitle = $("#regionSidebarTitle");
  const sidebarDesc = $("#regionSidebarDesc");
  const speciesList = $("#regionalSpeciesList");

  if (!sidebarTitle || !sidebarDesc || !speciesList) return;

  if (regionId === "All") {
    sidebarTitle.textContent = "All Catalogued Wildlife";
    sidebarDesc.textContent = "Clicking on a region map displays endemic distributions and historical documentation by Bertram Smythies.";
    speciesList.innerHTML = `<p class="text-slate-500 text-xs p-4">Select a region to see native bird populations.</p>`;
    return;
  }

  // Look up details for the selected Region
  const regionObj = state.regions.find(r => r.name.toLowerCase().includes(regionId.toLowerCase()));
  if (regionObj) {
    sidebarTitle.textContent = regionObj.name;
    sidebarDesc.textContent = regionObj.description || "Historical records of biodiversity within this province.";
  }

  // Filter birds based on estimated sizes & habits for high fidelity simulation
  const matches = state.species.filter(bird => {
    if (regionId === "Kachin" || regionId === "Chin") {
      return bird.size === "Large" || bird.habitat.includes("Jungle") || bird.habitat.includes("Canopy");
    }
    if (regionId === "Ayeyarwady" || regionId === "Yangon") {
      return bird.habitat.includes("Wetlands") || bird.size === "Small" || bird.size === "Large";
    }
    return true; // default matching
  });

  if (matches.length === 0) {
    speciesList.innerHTML = `<p class="text-slate-500 text-xs p-4">No specific birds mapped yet to this province.</p>`;
    return;
  }

  speciesList.innerHTML = matches.map(bird => `
    <div onclick="viewSpecificBird('${bird.common_name}')" class="bg-slate-900 p-3 rounded-xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-colors">
      <div>
        <p class="text-xs font-bold text-slate-200">${bird.common_name}</p>
        <p class="text-[10px] text-emerald-400 italic">${bird.scientific_name}</p>
      </div>
      <span class="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-white/5">${bird.habitat}</span>
    </div>
  `).join("");
}

// Identification Wizard Key Engine
function wireIdentifyForm() {
  const inputs = ["#wizardSize", "#wizardColor", "#wizardHabitat"];
  inputs.forEach(sel => {
    $(sel)?.addEventListener("change", renderWizardRecommendations);
  });
}

function renderWizardRecommendations() {
  const sizeVal = $("#wizardSize")?.value || "All";
  const colorVal = $("#wizardColor")?.value || "All";
  const habitatVal = $("#wizardHabitat")?.value || "All";

  const container = $("#wizardResultsGrid");
  if (!container) return;

  const matches = state.species.filter(bird => {
    const sizeMatch = sizeVal === "All" || bird.size === sizeVal;
    const colorMatch = colorVal === "All" || bird.colors.includes(colorVal);
    const habitatMatch = habitatVal === "All" || bird.habitat.includes(habitatVal);
    return sizeMatch && colorMatch && habitatMatch;
  });

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-500 text-xs">
        No birds match current description criteria. Try simplifying.
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(bird => `
    <div onclick="viewSpecificBird('${bird.common_name}')" class="bg-slate-900 border border-white/5 p-4 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors flex items-start gap-3">
      <div class="w-8 h-8 rounded bg-emerald-500/15 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0">
        ${bird.common_name.charAt(0)}
      </div>
      <div>
        <p class="text-xs font-bold text-slate-200">${bird.common_name}</p>
        <p class="text-[10px] text-emerald-400 italic font-serif">${bird.scientific_name}</p>
        <p class="text-[10px] text-slate-400 mt-1 line-clamp-2">"${bird.smythies_quote || bird.description}"</p>
      </div>
    </div>
  `).join("");
}

// Sighting submission wire
function wireObservationForm() {
  const form = $("#observationForm");
  if (!form) return;

  // Set default date
  const dateInput = $("#observationDate");
  if (dateInput) dateInput.valueAsDate = new Date();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("taxon_id", $("#observationTaxon").value);
      formData.append("region_id", $("#observationRegion").value);
      formData.append("observation_date", $("#observationDate").value);
      formData.append("observer", $("#observationObserver").value.trim());
      formData.append("count", $("#observationCount").value || "1");
      formData.append("notes", $("#observationNotes").value.trim());
      formData.append("latitude", $("#observationLatitude").value || "");
      formData.append("longitude", $("#observationLongitude").value || "");

      const photoFile = $("#observationPhoto")?.files?.[0];
      if (photoFile) formData.append("photo", photoFile);

      await apiPostForm("/observations", formData);
      form.reset();
      if (dateInput) dateInput.valueAsDate = new Date();
      
      await refreshAll();
      showTab("observations");
    } catch (err) {
      console.error("Failed to submit field observation:", err);
    }
  });
}

// Document submission archive wire
function wireDocumentForm() {
  const form = $("#documentForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", $("#documentTitle").value.trim());
      formData.append("document_type", $("#documentCategory").value);
      formData.append("author", $("#documentSource").value.trim());
      formData.append("publication_year", $("#documentYear").value);
      formData.append("description", $("#documentSummary").value.trim());

      const file = $("#documentFile")?.files?.[0];
      if (file) formData.append("file", file);

      await apiPostForm("/documents", formData);
      form.reset();
      
      await refreshAll();
      showTab("documents");
    } catch (err) {
      console.error("Failed to save research document:", err);
    }
  });
}

// Render observations list
function renderObservations() {
  const container = $("#observationsList");
  if (!container) return;

  if (state.observations.length === 0) {
    container.innerHTML = `<div class="text-slate-500 text-xs p-4">No field observation logs catalogued yet.</div>`;
    return;
  }

  container.innerHTML = state.observations.map(o => `
    <div class="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-start gap-4">
        ${o.photo_path ? `
          <img src="${window.BBIS_API_BASE.replace('/api/v1', '')}${o.photo_path}" class="w-16 h-16 rounded-lg object-cover border border-white/10" alt="Observation Photo" />
        ` : `
          <div class="w-16 h-16 rounded-lg bg-slate-950 flex items-center justify-center text-slate-600 text-xs uppercase font-extrabold border border-white/5">No Pic</div>
        `}
        <div>
          <h4 class="font-bold text-slate-200">${o.common_name}</h4>
          <p class="text-xs text-emerald-400 italic">${o.scientific_name}</p>
          <p class="text-xs text-slate-400 mt-2">${o.notes || "No notes documented."}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-semibold">Observer: ${o.observer || "Anonymous"}</span>
            ${o.latitude && o.longitude ? `
              <span class="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-semibold">Loc: ${o.latitude}, ${o.longitude}</span>
            ` : ""}
          </div>
        </div>
      </div>

      <div class="text-right text-xs shrink-0">
        <p class="text-amber-400 font-extrabold">${o.count} Species Count</p>
        <p class="text-[10px] text-slate-500 mt-1">${o.region_name}</p>
        <p class="text-[10px] text-slate-500">${o.observation_date}</p>
      </div>
    </div>
  `).join("");
}

// Render literature archives
function renderDocuments() {
  const container = $("#documentsList");
  if (!container) return;

  if (state.documents.length === 0) {
    container.innerHTML = `<div class="text-slate-500 text-xs p-4">No documents contributed yet.</div>`;
    return;
  }

  container.innerHTML = state.documents.map(doc => `
    <div class="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="text-[9px] uppercase tracking-wider bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-bold">${doc.document_type}</span>
          <span class="text-[10px] text-slate-500 font-bold">${doc.publication_year}</span>
        </div>
        <h4 class="font-bold text-slate-200 mt-2">${doc.title}</h4>
        <p class="text-[11px] text-slate-400 mt-1">${doc.description || "No description provided."}</p>
        <p class="text-[10px] text-slate-500 mt-2">Contributed by: ${doc.author}</p>
      </div>

      ${doc.file_path ? `
        <a href="${window.BBIS_API_BASE.replace('/api/v1', '')}${doc.file_path}" target="_blank" class="block text-center text-xs bg-slate-950 hover:bg-slate-800 text-emerald-400 font-bold py-1.5 rounded border border-white/5">
          Download File
        </a>
      ` : ""}
    </div>
  `).join("");
}

// Master Fetch and Refresh Function
async function refreshAll() {
  try {
    const dashboardData = await apiGet("/dashboard");
    const speciesData = await apiGet("/species");
    const regionData = await apiGet("/regions");
    const obsData = await apiGet("/observations");
    const docsData = await apiGet("/documents");

    state.species = speciesData;
    state.regions = regionData;
    state.observations = obsData;
    state.documents = docsData;

    renderDashboard(dashboardData);
    renderSpeciesList();
    populateFormSelectors();
    renderWizardRecommendations();
    renderObservations();
    renderDocuments();

    // Populate Families dropdown filter list
    const familyFilter = $("#speciesFilterFamily");
    if (familyFilter) {
      const families = ["All", ...new Set(speciesData.map(b => b.family).filter(Boolean))];
      familyFilter.innerHTML = families.map(f => `<option value="${f}">${f}</option>`).join("");
    }
  } catch (err) {
    console.error("Failed to synchronise state with backend:", err);
  }
}

// Set up UI input filters
function wireFilters() {
  $("#speciesSearchInput")?.addEventListener("input", renderSpeciesList);
  $("#speciesFilterFamily")?.addEventListener("change", renderSpeciesList);
  $("#speciesFilterStatus")?.addEventListener("change", renderSpeciesList);
}

// Initialise Application Setup
(function init() {
  wireTabs();
  wireFilters();
  wireMap();
  wireIdentifyForm();
  wireObservationForm();
  wireDocumentForm();
  refreshAll();
})();