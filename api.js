// api.js

window.BBIS_API_BASE =
  window.BBIS_API_BASE ||
  "http://localhost:8001/api/v1";

const API_BASE = window.BBIS_API_BASE;

async function apiGet(path) {
  const res = await fetch(${API_BASE}${path});
  if (!res.ok) {
    const text = await res.text();
    throw new Error(GET ${path} failed: ${text});
  }
  return res.json();
}

async function apiPostForm(path, formData) {
  const res = await fetch(${API_BASE}${path}, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(POST ${path} failed: ${text});
  }
  return res.json();
}
