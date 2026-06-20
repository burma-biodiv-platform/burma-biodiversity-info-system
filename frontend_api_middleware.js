/**
 * Myanmar Biodiversity Information System - API Bridge & Hybrid Sandbox Failover
 * Detects if the backend is hosted/reachable; falls back to HTML5 LocalStorage Sandbox
 * on static hosts (like GitHub Pages) to ensure full interactive functionality.
 */

const LOCAL_BACKEND_URL = "http://localhost:8000/api/v1";

// Auto-detect environment
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
window.BBIS_API_BASE = isLocalhost ? LOCAL_BACKEND_URL : "";

// Fallback Mock Datasets (Extracted from Smythies & Harington publications)
const BIRD_MOCK_DATA = [
  {
    id: 1,
    common_name: "Great Hornbill",
    scientific_name: "Buceros bicornis",
    myanmar_name: "အောက်ချင်းငှက်",
    family: "Bucerotidae",
    iucn_status: "Vulnerable",
    historical_status: "Abundant and widely distributed in primary evergreen forests",
    smythies_quote: "A remarkable bird, famous for its heavy, deep resonant calling and spectacular nesting habits. The female is sealed inside tree hollows with mud during incubation.",
    harington_quote: "Frequently met with in the high forests of Tenasserim and Upper Burma, where its loud grunting baritones echo across the valley.",
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
    smythies_quote: "A magnificent bird of the forest edges and river gravels. Famously cautious, it is the national symbol of Myanmar and can be heard calling 'kay-yaw' at dawn.",
    harington_quote: "Commonly found in open dry deciduous forests. They gather in small parties and are extremely wary, taking flight at the slightest alarm.",
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
    smythies_quote: "Instantly recognized by its brilliant red naked head and neck. It usually dominates other vultures at carcasses despite its slightly smaller size.",
    harington_quote: "May be seen soaring over the dry plains of Meiktila and central Burma, keeping watch for livestock mortalities.",
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
    smythies_quote: "The tallest flying bird in the world. Its trumpeting calls carry for miles across the Ayeyarwady Delta, where they nest in marshes.",
    harington_quote: "Commonly seen in pairs in the paddy fields during the rains, dancing gracefully with wings outspread.",
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
    smythies_quote: "The display arenas of the male Argus are cleared circular patches of forest floor. The enormous wing feathers decorated with eyespots are raised in an incredible fan display.",
    harington_quote: "Extremely difficult to see, though its loud double-note 'how-how' call is one of the standard sounds of the deep southern jungles.",
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
    smythies_quote: "Arguably the finest songster in the East. Its rich, melodic, and varied notes are delivered from dense undergrowth, punctuated by a characteristic tail flick.",
    harington_quote: "Prefers dense bamboo thickets. It is rarely seen in the open but its beautiful flute-like melody instantly gives away its location.",
    description: "One of Myanmar's most famous forest songbirds, sought after by collectors for its incredible mimicry and songs.",
    colors: "Black, Orange, White",
    size: "Small",
    habitat: "Bamboo Jungle",
    diet: "Insectivorous"
  }
];

const REGION_MOCK_DATA = [
  { id: 1, name: "Kachin State", code: "MM-11", description: "Northern highlands, pristine alpine heights, evergreen forests, and rich bird diversity." },
  { id: 2, name: "Sagaing Region", code: "MM-01", description: "North-western plains, dry deciduous valleys, and major river systems." },
  { id: 3, name: "Shan State", code: "MM-14", description: "Eastern plateau, sweeping pine woodlands, limestone karst hills, and Inle lake wetlands." },
  { id: 4, name: "Chin State", code: "MM-12", description: "Western mountain ranges, high altitudinal montane forests, and extreme bird endemism." },
  { id: 5, name: "Mandalay Region", code: "MM-04", description: "Central arid zone, historical scrubland plains, and Ayeyarwady flyways." },
  { id: 6, name: "Magway Region", code: "MM-03", description: "Arid plains and dry forest landscapes." },
  { id: 7, name: "Rakhine State", code: "MM-13", description: "Coastal mudflats, dense mangrove networks, and western evergreen foothills." },
  { id: 8, name: "Bago Region", code: "MM-02", description: "Central valley basin, home to deciduous teak forests and dense bamboo woodlands." },
  { id: 9, name: "Ayeyarwady Region", code: "MM-05", description: "Sarus Crane delta swamplands, coastal estuaries, and flooded rice cultivation." },
  { id: 10, name: "Yangon Region", code: "MM-06", description: "Urban gardens, secondary forests, and wetlands supporting migratory species." },
  { id: 11, name: "Kayah State", code: "MM-15", description: "Southeastern limestone hills and dry-deciduous mix." },
  { id: 12, name: "Kayin State", code: "MM-16", description: "Karst limestone towers, evergreen rainforest blocks, and rich river valleys." },
  { id: 13, name: "Mon State", code: "MM-17", description: "Coastal mudflats and evergreen foothills bordering the Andaman sea." },
  { id: 14, name: "Tanintharyi Region", code: "MM-07", description: "Southern dipterocarp tropical rainforest corridor with unique Sundaic avifauna." }
];

// Initialize Storage Sandbox Database if empty
if (!localStorage.getItem("bbis_observations")) {
  localStorage.setItem("bbis_observations", JSON.stringify([]));
}
if (!localStorage.getItem("bbis_documents")) {
  localStorage.setItem("bbis_documents", JSON.stringify([]));
}

// Check Backend Connectivity
let useSandboxMode = !isLocalhost;

async function checkApiConnection() {
  if (!isLocalhost) {
    useSandboxMode = true;
    toggleSandboxBanner(true);
    return;
  }
  try {
    const test = await fetch(`${LOCAL_BACKEND_URL}/dashboard`);
    if (test.ok) {
      useSandboxMode = false;
      toggleSandboxBanner(false);
    } else {
      useSandboxMode = true;
      toggleSandboxBanner(true);
    }
  } catch (err) {
    useSandboxMode = true;
    toggleSandboxBanner(true);
  }
}

function toggleSandboxBanner(show) {
  let banner = document.getElementById("sandboxBanner");
  if (!banner && show) {
    banner = document.createElement("div");
    banner.id = "sandboxBanner";
    banner.className = "bg-amber-500 text-slate-950 font-bold text-center py-2 px-4 text-xs transition-all relative z-50 flex items-center justify-center gap-2";
    banner.innerHTML = `
      <span>⚠️ Active Sandbox Mode: Backend is offline or unreachable. Using offline client-side web storage.</span>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  } else if (banner && !show) {
    banner.remove();
  }
}

// Master GET Bridge
async function apiGet(path) {
  await checkApiConnection();
  if (useSandboxMode) {
    return handleSandboxGet(path);
  }
  const res = await fetch(`${LOCAL_BACKEND_URL}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.statusText}`);
  }
  return res.json();
}

// Master POST Bridge
async function apiPostForm(path, formData) {
  await checkApiConnection();
  if (useSandboxMode) {
    return handleSandboxPost(path, formData);
  }
  const res = await fetch(`${LOCAL_BACKEND_URL}${path}`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.statusText}`);
  }
  return res.json();
}

// Handle GET calls using Client Local Sandbox
function handleSandboxGet(path) {
  if (path.includes("/dashboard")) {
    const obs = JSON.parse(localStorage.getItem("bbis_observations") || "[]");
    const docs = JSON.parse(localStorage.getItem("bbis_documents") || "[]");
    return {
      stats: {
        species: BIRD_MOCK_DATA.length,
        observations: obs.length,
        documents: docs.length,
        modules: 4
      },
      recentSpecies: BIRD_MOCK_DATA.slice(0, 6),
      recentObservations: obs.slice(0, 6),
      latestDocuments: docs.slice(0, 6)
    };
  }
  if (path.includes("/species")) {
    return BIRD_MOCK_DATA;
  }
  if (path.includes("/regions")) {
    return REGION_MOCK_DATA;
  }
  if (path.includes("/observations")) {
    const obs = JSON.parse(localStorage.getItem("bbis_observations") || "[]");
    return obs.map(o => {
      const bird = BIRD_MOCK_DATA.find(b => b.id == o.taxon_id) || BIRD_MOCK_DATA[0];
      const region = REGION_MOCK_DATA.find(r => r.id == o.region_id) || REGION_MOCK_DATA[0];
      return {
        ...o,
        common_name: bird.common_name,
        scientific_name: bird.scientific_name,
        iucn_status: bird.iucn_status,
        region_name: region.name
      };
    });
  }
  if (path.includes("/documents")) {
    return JSON.parse(localStorage.getItem("bbis_documents") || "[]");
  }
  return [];
}

// Handle POST calls using Client Local Sandbox
function handleSandboxPost(path, formData) {
  const data = {};
  for (let [key, val] of formData.entries()) {
    data[key] = val;
  }

  if (path.includes("/observations")) {
    const current = JSON.parse(localStorage.getItem("bbis_observations") || "[]");
    const newObs = {
      id: Date.now(),
      taxon_id: data.taxon_id,
      region_id: data.region_id,
      observation_date: data.observation_date,
      observer: data.observer || "Anonymous",
      count: parseInt(data.count || "1"),
      notes: data.notes || "",
      photo_path: null,
      latitude: data.latitude || null,
      longitude: data.longitude || null
    };
    current.unshift(newObs);
    localStorage.setItem("bbis_observations", JSON.stringify(current));
    return { id: newObs.id, message: "Observation stored locally!" };
  }

  if (path.includes("/documents")) {
    const current = JSON.parse(localStorage.getItem("bbis_documents") || "[]");
    const newDoc = {
      id: Date.now(),
      title: data.title,
      document_type: data.document_type || "Other",
      author: data.author || "Unknown",
      publication_year: data.publication_year || "2026",
      description: data.description || "",
      file_path: null,
      uploaded_at: new Date().toISOString()
    };
    current.unshift(newDoc);
    localStorage.setItem("bbis_documents", JSON.stringify(current));
    return { id: newDoc.id, message: "Document archived locally!" };
  }
}