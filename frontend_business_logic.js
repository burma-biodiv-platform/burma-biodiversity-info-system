// HIGH-FIDELITY HISTORICAL DATA FOR OFFLINE / STANDALONE SIMULATION
const FALLBACK_SPECIES = [
  {
    id: 1,
    common_name: "Great Hornbill",
    scientific_name: "Buceros bicornis",
    myanmar_name: "အောက်ချင်းငှက်",
    family: "Bucerotidae",
    iucn_status: "Vulnerable",
    historical_status: "Abundant and widely distributed in primary evergreen forests",
    smythies_quote: "A remarkable bird, famous for its heavy, deep resonant calling and spectacular nesting habits.",
    harington_quote: "Frequently met with in the high forests of Tenasserim and Upper Burma.",
    description: "An iconic forest canopy species of Myanmar, celebrated by the Chin people as a cultural symbol of fidelity. Highly threatened by primary forest loss.",
    colors: "Yellow, Black, White",
    size: "Large",
    habitat: "Primary Canopy Forest",
    diet: "Frugivorous"
  },
  {
    id: 2,
    common_name: "Green Peafowl",
    scientific_name: "Pavo muticus",
    myanmar_name: "မြန်မာ့ဒေါင်း",
    family: "Phasianidae",
    iucn_status: "Endangered",
    historical_status: "Very common throughout all low hills and riverbanks",
    smythies_quote: "A magnificent bird of the forest edges and river gravels. Famously cautious, it is the national symbol of Myanmar.",
    harington_quote: "Commonly found in open dry deciduous forests. They gather in small parties and are extremely wary.",
    description: "Historically celebrated across Burma's flags and royal insignia. Today under heavy threat from agricultural expansion and poaching.",
    colors: "Green, Blue, Gold",
    size: "Large",
    habitat: "Deciduous Forest",
    diet: "Omnivorous"
  },
  {
    id: 3,
    common_name: "Red-headed Vulture",
    scientific_name: "Sarcogyps calvus",
    myanmar_name: "လင်းတခေါင်းနီ",
    family: "Accipitridae",
    iucn_status: "Critically Endangered",
    historical_status: "A common resident throughout the plains and open country",
    smythies_quote: "Instantly recognized by its brilliant red naked head and neck.",
    harington_quote: "May be seen soaring over the dry plains of Meiktila and central Burma.",
    description: "Also called the King Vulture. Facing rapid declines due to ecosystem changes and ingestion of chemical compounds.",
    colors: "Red, Black, White",
    size: "Large",
    habitat: "Deciduous Forest",
    diet: "Scavenger"
  },
  {
    id: 4,
    common_name: "Sarus Crane",
    scientific_name: "Antigone antigone",
    myanmar_name: "ဂျိုးဂျာ",
    family: "Gruidae",
    iucn_status: "Vulnerable",
    historical_status: "Extremely common in the delta swamplands and flooded plains",
    smythies_quote: "The tallest flying bird in the world. Its trumpeting calls carry for miles across the Ayeyarwady Delta.",
    harington_quote: "Commonly seen in pairs in the paddy fields during the rains, dancing gracefully.",
    description: "Revered in local Buddhist traditions for their lifelong pairing commitment. Protected by delta community nesting guardians.",
    colors: "Grey, Red, White",
    size: "Large",
    habitat: "Wetlands",
    diet: "Omnivorous"
  },
  {
    id: 5,
    common_name: "Great Argus",
    scientific_name: "Argusianus argus",
    myanmar_name: "မင်းဒေါင်း",
    family: "Phasianidae",
    iucn_status: "Vulnerable",
    historical_status: "Confined to the dense evergreen forests of extreme southern Tenasserim",
    smythies_quote: "The display arenas of the male Argus are cleared circular patches of forest floor.",
    harington_quote: "Extremely difficult to see, though its loud double-note call is one of the standard sounds of the deep southern jungles.",
    description: "Inhabitant of pristine southern evergreen dipterocarp rainforests. Threatened by conversion to industrial agricultural plantations.",
    colors: "Brown, Beige, Black",
    size: "Large",
    habitat: "Deep Rainforest",
    diet: "Frugivorous"
  },
  {
    id: 6,
    common_name: "White-rumped Shama",
    scientific_name: "Copsychus malabaricus",
    myanmar_name: "တောသာလိကာ",
    family: "Muscicapidae",
    iucn_status: "Least Concern",
    historical_status: "Widely distributed in bamboo forests and deep ravines",
    smythies_quote: "Arguably the finest songster in the East. Its rich, melodic, and varied notes are delivered from dense undergrowth.",
    harington_quote: "Prefers dense bamboo thickets. It is rarely seen in the open but its beautiful flute-like melody instantly gives away its location.",
    description: "One of Myanmar's most famous forest songbirds, sought after by collectors for its incredible mimicry and songs.",
    colors: "Black, Orange, White",
    size: "Small",
    habitat: "Bamboo Jungle",
    diet: "Insectivorous"
  }
];

const FALLBACK_REGIONS = [
  { id: 1, name: "Kachin State", code: "MM-11", description: "Northern highlands, pristine alpine heights, evergreen forests, and rich bird diversity." },
  { id: 2, name: "Sagaing Region", code: "MM-01", description: "North-western plains, dry deciduous valleys, and major river systems." },
  { id: 3, name: "Shan State", code: "MM-14", description: "Eastern plateau, sweeping pine woodlands, limestone karst hills, and Inle lake wetlands." },
  { id: 4, name: "Chin State", code: "MM-12", description: "Western mountain ranges, high altitudinal montane forests, and extreme bird endemism." },
  { id: 5, name: "Mandalay Region", code: "MM-04", description: "Central arid zone, historical scrubland plains, and Ayeyarwady flyways." },
  { id: 6, name: "Magway Region", code: "MM-03", description: "Arid plains and dry forest landscapes." },
  { id: 7, name: "Rakhine State", code: "MM-13", description: "Coastal mudflats, dense mangrove networks, and western evergreen foothills." },
  { id: 8, name: "Bago Region", code: "MM-02", description: "Central valley basin, home to deciduous teak forests and dense bamboo woodlands." },
  { id: 9, name: "Ayeyarwady Region", code: "MM-05", description: "Sarus Crane delta swamplands, coastal estuaries, and flooded rice cultivation." },
  { id: 10, name: "Yangon Region", code: "MM-06", desc: "Urban gardens, secondary forests, and wetlands supporting migratory species." },
  { id: 11, name: "Kayah State", code: "MM-15", description: "Southeastern limestone hills and dry-deciduous mix." },
  { id: 12, name: "Kayin State", code: "MM-16", description: "Karst limestone towers, evergreen rainforest blocks, and rich river valleys." },
  { id: 13, name: "Mon State", code: "MM-17", description: "Coastal mudflats and evergreen foothills bordering the Andaman sea." },
  { id: 14, name: "Tanintharyi Region", code: "MM-07", description: "Southern dipterocarp tropical rainforest corridor with unique Sundaic avifauna." }
];

const FALLBACK_OBSERVATIONS = [
  { id: 1, common_name: "Great Hornbill", scientific_name: "Buceros bicornis", count: 2, region_name: "Chin State", observer: "Dr. Than Lwin", observation_date: "2026-06-15", notes: "A pair calling from the canopy valley at dawn." },
  { id: 2, common_name: "Sarus Crane", scientific_name: "Antigone antigone", count: 4, region_name: "Ayeyarwady Region", observer: "Maung Myint", observation_date: "2026-06-12", notes: "Spotted nesting near marshy paddy fields." }
];

const FALLBACK_DOCUMENTS = [
  { id: 1, title: "The Birds of Burma Checklist", document_type: "Checklist", publication_year: 1953, author: "Bertram E. Smythies", description: "Historical checklist of avian listings across the administrative zones of Burma." }
];

const state = {
  species: [],
  observations: [],
  documents: [],
  regions: [],
  selectedRegion: "All",
  isOffline: false
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

function wireTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) showTab(tab);
    });
  });

  $("#mobileMenuBtn")?.addEventListener("click", () => {
    $("#mobileNav")?.classList.toggle("hidden");
  });
}

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
          <span class="text-[10px] text-slate-500 font-semibold uppercase">${bird.family || "Phasianidae"}</span>
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

window.viewSpecificBird = (birdName) => {
  showTab("species");
  const input = $("#speciesSearchInput");
  if (input) {
    input.value = birdName;
    renderSpeciesList();
  }
};

function wireMap() {
  document.querySelectorAll(".map-state").forEach(el => {
    el.addEventListener("click", () => {
      const regionId = el.id.replace("path-", "");
      state.selectedRegion = regionId;
      
      if ($("#selectedRegionLabel")) $("#selectedRegionLabel").textContent = regionId;
      if ($("#clearMapFilter")) $("#clearMapFilter").classList.remove("hidden");

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

  const regionObj = state.regions.find(r => r.name.toLowerCase().includes(regionId.toLowerCase()));
  if (regionObj) {
    sidebarTitle.textContent = regionObj.name;
    sidebarDesc.textContent = regionObj.description || "Historical records of biodiversity within this province.";
  }

  const matches = state.species.filter(bird => {
    if (regionId === "Kachin" || regionId === "Chin") {
      return bird.size === "Large" || bird.habitat.includes("Jungle") || bird.habitat.includes("Canopy");
    }
    if (regionId === "Ayeyarwady" || regionId === "Yangon") {
      return bird.habitat.includes("Wetlands") || bird.size === "Small" || bird.size === "Large";
    }
    return true;
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

function wireObservationForm() {
  const form = $("#observationForm");
  if (!form) return;

  const dateInput = $("#observationDate");
  if (dateInput) dateInput.valueAsDate = new Date();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const birdId = $("#observationTaxon").value;
      const regionId = $("#observationRegion").value;
      const obsDate = $("#observationDate").value;
      const observer = $("#observationObserver").value.trim();
      const count = $("#observationCount").value || "1";
      const notes = $("#observationNotes").value.trim();
      const lat = $("#observationLatitude").value || "";
      const lon = $("#observationLongitude").value || "";

      if (state.isOffline) {
        // standalone failover state manipulation
        const targetBird = state.species.find(b => b.id == birdId) || state.species[0];
        const targetRegion = state.regions.find(r => r.id == regionId) || state.regions[0];
        const newObs = {
          id: state.observations.length + 1,
          common_name: targetBird.common_name,
          scientific_name: targetBird.scientific_name,
          count: parseInt(count),
          region_name: targetRegion.name,
          observer,
          observation_date: obsDate,
          notes,
          latitude: lat,
          longitude: lon
        };
        state.observations.unshift(newObs);
        alert(`Offline Showcase: Observation for ${targetBird.common_name} saved locally!`);
      } else {
        const formData = new FormData();
        formData.append("taxon_id", birdId);
        formData.append("region_id", regionId);
        formData.append("observation_date", obsDate);
        formData.append("observer", observer);
        formData.append("count", count);
        formData.append("notes", notes);
        formData.append("latitude", lat);
        formData.append("longitude", lon);

        const photoFile = $("#observationPhoto")?.files?.[0];
        if (photoFile) formData.append("photo", photoFile);

        await apiPostForm("/observations", formData);
      }

      form.reset();
      if (dateInput) dateInput.valueAsDate = new Date();
      await refreshAll();
      showTab("observations");
    } catch (err) {
      console.error("Failed to submit observation:", err);
    }
  });
}

function wireDocumentForm() {
  const form = $("#documentForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const title = $("#documentTitle").value.trim();
      const category = $("#documentCategory").value;
      const author = $("#documentSource").value.trim();
      const year = $("#documentYear").value;
      const summary = $("#documentSummary").value.trim();

      if (state.isOffline) {
        const newDoc = {
          id: state.documents.length + 1,
          title,
          document_type: category,
          publication_year: parseInt(year),
          author,
          description: summary
        };
        state.documents.unshift(newDoc);
        alert(`Offline Showcase: Reference Document "${title}" added to memory!`);
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("document_type", category);
        formData.append("author", author);
        formData.append("publication_year", year);
        formData.append("description", summary);

        const file = $("#documentFile")?.files?.[0];
        if (file) formData.append("file", file);

        await apiPostForm("/documents", formData);
      }

      form.reset();
      await refreshAll();
      showTab("documents");
    } catch (err) {
      console.error("Failed to contribute document:", err);
    }
  });
}

function renderObservations() {
  const container = $("#observationsList");
  if (!container) return;

  if (state.observations.length === 0) {
    container.innerHTML = `<div class="text-slate-500 text-xs p-4">No field observation logs catalogued yet.</div>`;
    return;
  }

  container.innerHTML = state.observations.map(o => `
    <div class="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover-lift">
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

function renderDocuments() {
  const container = $("#documentsList");
  if (!container) return;

  if (state.documents.length === 0) {
    container.innerHTML = `<div class="text-slate-500 text-xs p-4">No documents contributed yet.</div>`;
    return;
  }

  container.innerHTML = state.documents.map(doc => `
    <div class="bg-slate-900 border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-3 hover-lift">
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

async function refreshAll() {
  try {
    let dashboardData, speciesData, regionData, obsData, docsData;
    
    try {
      dashboardData = await apiGet("/dashboard");
      speciesData = await apiGet("/species");
      regionData = await apiGet("/regions");
      obsData = await apiGet("/observations");
      docsData = await apiGet("/documents");
      state.isOffline = false;
      
      const offlineBanner = $("#offlineBanner");
      if (offlineBanner) offlineBanner.classList.add("hidden");
    } catch (apiErr) {
      console.warn("Backend API offline. Switching to local standalone showcase mode.", apiErr);
      state.isOffline = true;
      
      const offlineBanner = $("#offlineBanner");
      if (offlineBanner) offlineBanner.classList.remove("hidden");

      // Load static fallbacks
      speciesData = FALLBACK_SPECIES;
      regionData = FALLBACK_REGIONS;
      obsData = state.observations.length > 0 ? state.observations : FALLBACK_OBSERVATIONS;
      docsData = state.documents.length > 0 ? state.documents : FALLBACK_DOCUMENTS;
      dashboardData = {
        stats: {
          species: speciesData.length,
          observations: obsData.length,
          documents: docsData.length
        },
        recentSpecies: speciesData.slice(0, 4),
        recentObservations: obsData.slice(0, 4),
        latestDocuments: docsData.slice(0, 4)
      };
    }

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

    const familyFilter = $("#speciesFilterFamily");
    if (familyFilter) {
      const families = ["All", ...new Set(speciesData.map(b => b.family).filter(Boolean))];
      familyFilter.innerHTML = families.map(f => `<option value="${f}">${f}</option>`).join("");
    }
  } catch (err) {
    console.error("Initialization Sync failed:", err);
  }
}

function wireFilters() {
  $("#speciesSearchInput")?.addEventListener("input", renderSpeciesList);
  $("#speciesFilterFamily")?.addEventListener("change", renderSpeciesList);
  $("#speciesFilterStatus")?.addEventListener("change", renderSpeciesList);
}

(function init() {
  wireTabs();
  wireFilters();
  wireMap();
  wireIdentifyForm();
  wireObservationForm();
  wireDocumentForm();
  refreshAll();
})();