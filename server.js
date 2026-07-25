const path = require("path");
const express = require("express");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const TABLE_NAME = process.env.SUBMISSIONS_TABLE || "demo_submissions";

if (!process.env.ADMIN_PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn('ADMIN_PASSWORD not set. Using the demo fallback password "change-me".');
}

const clients = new Set();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (process.env.FORCE_HTTPS === "true" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  return next();
});

function normalizePhone(rawPhone) {
  return rawPhone.replace(/[^\d+]/g, "");
}

function normalizeSourceUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href.slice(0, 2048) : "";
  } catch {
    return "";
  }
}

function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 100;
}

function isValidEmail(email) {
  if (typeof email !== "string") {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  if (typeof phone !== "string") {
    return false;
  }
  const normalized = normalizePhone(phone.trim());
  return /^\+?[1-9]\d{7,14}$/.test(normalized);
}

function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Dashboard"');
    return res.status(401).send("Authentication required");
  }

  const encoded = authHeader.split(" ")[1];
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [username, password] = decoded.split(":");

  if (!username || password !== ADMIN_PASSWORD) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Dashboard"');
    return res.status(401).send("Invalid credentials");
  }
  return next();
}

function adminPasswordHeaderAuth(req, res, next) {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return next();
}

async function fetchSubmissions() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch submissions: ${response.status} ${text}`);
  }
  return response.json();
}

async function insertSubmission(submission) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify([submission])
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to save submission: ${response.status} ${text}`);
  }
  return response.json();
}

function broadcast(eventName, payload) {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

app.get("/admin", basicAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/api/submissions", async (req, res) => {
  const { name, email, phone, source_url, referrer } = req.body || {};
  if (!isValidName(name)) {
    return res.status(400).json({ error: "Enter a valid full name." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "Enter a valid international phone number." });
  }

  try {
    const saved = await insertSubmission({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizePhone(phone.trim()),
      source_url: normalizeSourceUrl(source_url || referrer || req.headers.referer),
      created_at: new Date().toISOString()
    });
    broadcast("submission_created", saved[0]);
    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/submissions", basicAuth, async (_req, res) => {
  try {
    const rows = await fetchSubmissions();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/submissions-list", adminPasswordHeaderAuth, async (_req, res) => {
  try {
    const rows = await fetchSubmissions();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/submissions/stream", basicAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.add(res);
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on("close", () => {
    clients.delete(res);
  });
});

async function startServer() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or use SUPABASE_SERVICE_ROLE_KEY on the server."
    );
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Demo app running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});


async function insertSubmission(submission) {
  console.log("Submitting to Supabase:", submission);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify([submission])
  });

  console.log("Supabase Status:", response.status);

  const text = await response.text();
  console.log("Supabase Response:", text);

  if (!response.ok) {
    throw new Error(text);
  }

  return JSON.parse(text);
}
