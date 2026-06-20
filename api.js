// api.js

window.BBIS_API_BASE =
    window.BBIS_API_BASE ||
    "http://localhost:8001/api/v1";

const API_BASE = window.BBIS_API_BASE;

async function apiGet(endpoint) {

    const response = await fetch(API_BASE + endpoint);

    if (!response.ok) {
        throw new Error(
            HTTP ${response.status}
        );
    }

    return response.json();

}

async function apiPostForm(endpoint, formData) {

    const response = await fetch(
        API_BASE + endpoint,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error(
            HTTP ${response.status}
        );
    }

    return response.json();

}
