const SOURCE_STORAGE_KEY = "feedback-source-url";

function normalizeSourceUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function getInboundSourceUrl() {
  const params = new URLSearchParams(window.location.search);
  // source_url is the recommended parameter. The aliases make existing extension
  // links continue to work while they are being updated.
  return normalizeSourceUrl(
    params.get("source_url") || params.get("sourceUrl") || params.get("source") || ""
  );
}

function getLandingSourceUrl() {
  const suppliedSource = getInboundSourceUrl();
  const referrerSource = normalizeSourceUrl(document.referrer);
  const source = suppliedSource || referrerSource;

  if (source) {
    sessionStorage.setItem(SOURCE_STORAGE_KEY, source);
  }

  return source || normalizeSourceUrl(sessionStorage.getItem(SOURCE_STORAGE_KEY) || "");
}

function getStoredSourceUrl() {
  return normalizeSourceUrl(sessionStorage.getItem(SOURCE_STORAGE_KEY) || "");
}
