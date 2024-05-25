import { getCookie } from "./Utils.jsx";

export const BASE_URL = import.meta.env.VITE_BASE_URL;

async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  const response = await fetch(`${BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refresh }),
  });

  if (response.status === 401) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("userData");
    window.location.reload();
    return null;
  }

  const data = await response.json();
  localStorage.setItem("access", data.access);
  return data.access;
}

async function apiRequest(path, method, body = {}, isRetry = false) {
  let jwt = localStorage.getItem("access");
  const url = `${BASE_URL}/${path}`;

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  };

  if (jwt) {
    options.headers["Authorization"] = `Bearer ${jwt}`;
  }

  // if the request is not a GET request, add the body
  if (method !== "GET" && method !== "DELETE") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 401 && !isRetry) {
    await refreshToken();
    jwt = localStorage.getItem("access"); // update the jwt token with refreshed one
    if (jwt) {
      options.headers["Authorization"] = `Bearer ${jwt}`; // set the new token in headers
    }
    return apiRequest(path, method, body, true); // Note, that we're passing path, method, body here, not the url
  }

  if (!response.ok) {
    throw new Error("API request failed");
  }

  if (response.headers.get("content-length") > 0) {
    return await response.json();
  } else {
    return null;
  }
}

export default apiRequest;
