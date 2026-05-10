// API client for making HTTP requests to the backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Normalize API response payload
function normalizePayload(payload) {
  if (payload && typeof payload === "object") {
    if (payload.data !== undefined) {
      return payload.data;
    }
    return payload;
  }
  return {};
}

// Extract error message from API response
function extractError(payload, fallbackMessage) {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.join(", ");
  }

  return payload.message || fallbackMessage;
}

// Make API request with error handling
export async function apiRequest(path, options = {}) {
  const requestOptions = {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  if (requestOptions.body && typeof requestOptions.body === "object") {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(extractError(payload, "Request failed"));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return {
    raw: payload,
    data: normalizePayload(payload),
    message: payload?.message || "",
  };
}

export { API_BASE_URL };
