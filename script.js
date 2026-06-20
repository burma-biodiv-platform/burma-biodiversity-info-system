const state = { species: [], filteredSpecies: [], identifications: [], observations: [], documents: [] };
const $ = (sel) => document.querySelector(sel);

function normalize(v) { return String(v || "").toLowerCase().trim(); }
function statusClass(status) {
  const value = normalize(status);
  if (value.includes("least")) return "status-lc";
  if (value.includes("near")) return "status-nt";
  if (value.includes("vulnerable")) return "status-vu";
  if (value.includes("endangered") && !value.includes("critically")) return "status-en";
  if (value.includes("critical")) return "status-cr";
  return "status-lc";
}
function fileToDataUrl(file) {
  if (!file) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
function showTab(tab) {
  document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${tab}`));
  document.querySelectorAll("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
  $("#mobileNav")?.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function wireTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tab)));
  document.querySelectorAll("[data-tab-target]").forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tabTarget)));
  $("#menuButton")?.addEventListener("click", () => $("#mobileNav")?.classList.toggle("hidden"));
}
function speciesDisplayName(item) { return item.common_name || item.name || "Unknown species"; }
function getRecordsCount(item) { return Number(item.observations_count || 0) + Number(item.identifications_count || 0); }
function renderStats() {
  const grid = $("#statsGrid"); if (!grid) return;
  const stats = [
    ["Species", state.filteredSpecies.length],
    ["Observations", state.observations.reduce((sum, o) => sum + Number(o.count || 1), 0)],
    ["Documents", state.documents.length],
    ["Identifications", state.identifications.length],
    ["Endemic", state.filteredSpecies.filter(s => s.endemic).length],
    ["Threatened", state.filteredSpecies.filter(s => /threatened|vulnerable|endangered|critical/i.test(s.iucn_status || "")).length]
  ];
  grid.innerHTML = stats.map(([label, value]) => `<div class="stat-card"><p class="text-3xl font-black">${value}</p><p class="mt-1 text-sm text-slate-300">${label}</p></div>`).join("");
}
function renderSpeciesCards() {
  const cards = $("#speciesCards"); const table = $("#speciesTable"); if (!cards || !table) return;
  cards.innerHTML = state.filteredSpecies.map(item => `
    <article class="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 hover-lift">
      <div class="relative">
        <img src="${item.image_url || item.photo_url || 'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?auto=format&fit=crop&w=1200&q=80'}" alt="${speciesDisplayName(item)}" class="h-56 w-full object-cover" />
        <div class="absolute left-4 top-4 flex gap-2">
          <span class="status-badge ${statusClass(item.iucn_status)}">${item.iucn_status || 'Unassessed'}</span>
          ${item.endemic ? '<span class="status-badge bg-fuchsia-400/15 text-fuchsia-200">Endemic</span>' : ''}
        </div>
      </div>
      <div class="p-5">
        <div class="flex items-start justify-between gap-3">
          <div><h3 class="text-xl font-bold">${speciesDisplayName(item)}</h3><p class="text-sm italic text-slate-400">${item.scientific_name || ''}</p></div>
          ${getRecordsCount(item) ? `<span class="record-pill">${getRecordsCount(item)} records</span>` : ""}
        </div>
        <p class="mt-3 text-sm text-slate-300">${item.description || 'No description available.'}</p>
        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          ${item.family ? `<span class="record-pill">${item.family}</span>` : ''}
          ${item.module_name ? `<span class="record-pill">${item.module_name}</span>` : ''}
          ${item.local_name ? `<span class="record-pill">${item.local_name}</span>` : ''}
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-3"><p class="text-xs text-slate-400">Habitats</p><p class="mt-1 font-semibold">${(item.habitats || []).join(", ") || "—"}</p></div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-3"><p class="text-xs text-slate-400">Regions</p><p class="mt-1 font-semibold">${(item.regions || []).join(", ") || "—"}</p></div>
        </div>
      </div>
    </article>
  `).join("");
  table.innerHTML = state.filteredSpecies.map(item => `
    <tr class="align-top">
      <td class="px-5 py-4"><div class="font-semibold text-slate-100">${speciesDisplayName(item)}</div><div class="text-xs text-slate-400">${item.endemic ? "Endemic" : "Native"}</div></td>
      <td class="px-5 py-4 italic text-slate-300">${item.scientific_name || ""}</td>
      <td class="px-5 py-4"><span class="status-badge ${statusClass(item.iucn_status)}">${item.iucn_status || "Unassessed"}</span></td>
      <td class="px-5 py-4 text-slate-300">${(item.habitats || []).join(", ") || "—"}</td>
      <td class="px-5 py-4 text-slate-200">${getRecordsCount(item)}</td>
    </tr>
  `).join("");
}
function renderOptions() {
  const list = $("#speciesOptions"); if (!list) return;
  list.innerHTML = state.species.map(item => `<option value="${speciesDisplayName(item)}"></option>`).join("");
}
function renderLists() {
  const observationsList = $("#observationsList");
  observationsList.innerHTML = state.observations.length ? state.observations.slice().reverse().map(obs => `
    <article class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-start justify-between gap-3"><div><h4 class="font-semibold">${obs.common_name || obs.scientific_name || "Observation"}</h4><p class="text-xs text-slate-400">${obs.region_name || "Unknown region"} • ${obs.observation_date || "No date"} • ${obs.observer || "Anonymous"}</p></div><span class="record-pill">Count ${obs.count || 1}</span></div>
      ${obs.notes ? `<p class="mt-3 text-sm text-slate-300">${obs.notes}</p>` : ""}
    </article>
  `).join("") : '<div class="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">No observations yet. Add the first field record.</div>';
  const identificationsList = $("#identificationsList");
  identificationsList.innerHTML = state.identifications.length ? state.identifications.slice().reverse().map(item => `
    <article class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-start justify-between gap-3"><div><h4 class="font-semibold">${item.identified_common_name || "Identification"}</h4><p class="text-xs text-slate-400">${item.identified_scientific_name || ""}</p></div><span class="record-pill">${item.confidence ? Math.round(Number(item.confidence) * 100) + "%" : "—"}</span></div>
      <p class="mt-2 text-sm text-slate-300">${item.notes || "Matched record."}</p>
    </article>
  `).join("") : '<div class="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">No identifications yet. Use the identify tab.</div>';
  const documentsList = $("#documentsList");
  documentsList.innerHTML = state.documents.length ? state.documents.slice().reverse().map(doc => `
    <article class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-start justify-between gap-3"><div><h4 class="font-semibold">${doc.title}</h4><p class="text-xs text-slate-400">${doc.document_type || "Document"} • ${doc.author || "Unknown author"}</p></div>${doc.file_path ? `<span class="record-pill">${doc.file_path.split("/").pop()}</span>` : ""}</div>
      ${doc.description ? `<p class="mt-3 text-sm text-slate-300">${doc.description}</p>` : ""}
      ${doc.file_path ? `<div class="mt-3"><a class="btn-secondary px-4 py-2" href="http://localhost:8000/${doc.file_path}" target="_blank" rel="noreferrer" type="button">Open file</a></div>` : ""}
    </article>
  `).join("") : '<div class="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">No documents uploaded yet.</div>';
}
function setFeaturedCard() {
  if (!state.species || state.species.length === 0) return;

  const featured =
    state.species.find(s =>
      normalize(s.common_name || "").includes("hornbill")
    ) || state.species[0];

  const heroImage = document.getElementById("heroImage");
  const heroName = document.getElementById("heroName");
  const heroSci = document.getElementById("heroSci");
  const heroStatus = document.getElementById("heroStatus");
  const heroHabitat = document.getElementById("heroHabitat");

  if (heroImage) {
    heroImage.src =
      featured.image_url ||
      featured.photo_url ||
      heroImage.src;

    heroImage.alt =
      featured.common_name ||
      featured.scientific_name ||
      "Featured species";
  }

  if (heroName) {
    heroName.textContent =
      featured.common_name ||
      featured.scientific_name ||
      "Unknown species";
  }

  if (heroSci) {
    heroSci.textContent =
      featured.scientific_name || "";
  }

  if (heroStatus) {
    heroStatus.textContent =
      featured.iucn_status || "Unassessed";
  }

  if (heroHabitat) {
    if (Array.isArray(featured.habitats) && featured.habitats.length > 0) {
      heroHabitat.textContent = featured.habitats.join(", ");
    } else {
      heroHabitat.textContent =
        featured.description || "Habitat information unavailable.";
    }
  }
}
function applyFilters() {
  const search = normalize($("#searchInput")?.value);
  const habitat = normalize($("#habitatFilter")?.value);
  const status = normalize($("#statusFilter")?.value);
  const region = normalize($("#regionFilter")?.value);
  state.filteredSpecies = state.species.filter(item => {
    const haystack = normalize([item.common_name, item.scientific_name, item.local_name, item.description, item.family, item.module_name, ...(item.habitats || []), ...(item.regions || [])].join(" "));
    return (!search || haystack.includes(search)) && (!habitat || normalize((item.habitats || []).join(" ")).includes(habitat)) && (!status || normalize(item.iucn_status).includes(status)) && (!region || normalize((item.regions || []).join(" ")).includes(region));
  });
  renderStats();
  renderSpeciesCards();
}
function wireFilters() {
  ["searchInput", "habitatFilter", "statusFilter", "regionFilter"].forEach(id => {
    const el = $("#" + id);
    el?.addEventListener("input", applyFilters);
    el?.addEventListener("change", applyFilters);
  });
  $("#resetFilters")?.addEventListener("click", () => { $("#searchInput").value = ""; $("#habitatFilter").value = ""; $("#statusFilter").value = ""; $("#regionFilter").value = ""; applyFilters(); });
}
function guessTaxonIdFromName(name) {
  const normalized = normalize(name);
  const item = state.species.find(s => normalize(speciesDisplayName(s)) === normalized || normalize(s.scientific_name) === normalized);
  return item ? item.id : null;
}
async function refreshAll() {
  try {
    const [
      species,
      observations,
      identifications,
      documents
    ] = await Promise.all([
      apiGet("/species?module=birds"),
      apiGet("/observations"),
      apiGet("/identifications"),
      apiGet("/documents")
    ]);

    state.species = species;
    state.observations = observations;
    state.identifications = identifications;
    state.documents = documents;
    state.filteredSpecies = [...state.species];

    renderStats();
    renderSpeciesCards();
    renderOptions();
    renderLists();

    try {
      setFeaturedCard();
    } catch (heroErr) {
      console.error("Hero update failed:", heroErr);
    }
  } catch (err) {
    console.error(err);
    const grid = document.getElementById("statsGrid");
    if (grid) {
      grid.innerHTML = 
        <div class="stat-card col-span-full">
          <p class="font-semibold text-rose-300">API connection failed</p>
          <p class="mt-1 text-sm text-slate-300">${err.message || "Could not connect to BBIS API."}</p>
        </div>
      ;
    }
  }
}
function wireIdentifyForm() {
  $("#identifyForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const guess = ($("#identifyGuess")?.value || "").trim();
    const best = state.species.find(s => normalize(speciesDisplayName(s)).includes(normalize(guess))) || state.species[0];
    const photoFile = $("#identifyPhoto")?.files?.[0];
    const formData = new FormData();
    formData.append("identified_taxon", best ? best.id : "");
    formData.append("confidence", "0.85");
    formData.append("identified_by", "Burma Birds Portal");
    formData.append("identified_on", new Date().toISOString().slice(0, 10));
    formData.append("notes", ($("#identifyNotes")?.value || "").trim() || "Preliminary identification");
    if (photoFile) formData.append("photo", photoFile);
    await apiPostForm("/identifications", formData);
    const preview = await (photoFile ? fileToDataUrl(photoFile) : Promise.resolve(""));
    $("#identifyResult").innerHTML = `<div class="flex items-start gap-4"><img src="${preview || (best?.image_url || best?.photo_url || '')}" alt="${best ? speciesDisplayName(best) : 'Bird'}" class="h-20 w-20 rounded-2xl border border-white/10 object-cover" /><div><p class="font-semibold text-emerald-300">Saved to BBIS</p><p class="mt-1 text-sm text-slate-300">${best ? speciesDisplayName(best) : "Identification recorded"}</p><p class="mt-1 text-xs text-slate-400">It will now appear in the species workflow.</p></div></div>`;
    $("#identifyForm").reset();
    await refreshAll();
    showTab("species");
  });
}
function wireObservationForm() {
  $("#observationDate").valueAsDate = new Date();
  $("#observationForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const speciesName = ($("#observationSpecies")?.value || "").trim();
    const speciesId = guessTaxonIdFromName(speciesName);
    if (!speciesId) return alert("Please select a species from the database.");
    const formData = new FormData();
    formData.append("taxon_id", String(speciesId));
    formData.append("observer", ($("#observationObserver")?.value || "Citizen scientist").trim());
    formData.append("observation_date", $("#observationDate")?.value || new Date().toISOString().slice(0, 10));
    formData.append("latitude", $("#observationLatitude")?.value || "");
    formData.append("longitude", $("#observationLongitude")?.value || "");
    formData.append("region_id", $("#observationRegion")?.value || "");
    formData.append("count", $("#observationCount")?.value || "1");
    formData.append("notes", ($("#observationNotes")?.value || "").trim());
    const photoFile = $("#observationPhoto")?.files?.[0];
    if (photoFile) formData.append("photo", photoFile);
    await apiPostForm("/observations", formData);
    $("#observationForm").reset();
    $("#observationDate").valueAsDate = new Date();
    await refreshAll();
    showTab("species");
  });
}
function wireDocumentForm() {
  $("#documentForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", ($("#documentTitle")?.value || "").trim());
    formData.append("description", ($("#documentSummary")?.value || "").trim());
    formData.append("document_type", $("#documentCategory")?.value || "Other");
    formData.append("publication_year", ($("#documentYear")?.value || "").trim());
    formData.append("author", ($("#documentSource")?.value || "").trim());
    const file = $("#documentFile")?.files?.[0];
    if (file) formData.append("file", file);
    await apiPostForm("/documents", formData);
    $("#documentForm").reset();
    await refreshAll();
    showTab("documents");
  });
}
(function init() {
  wireTabs(); wireFilters(); wireIdentifyForm(); wireObservationForm(); wireDocumentForm(); refreshAll();
})();
