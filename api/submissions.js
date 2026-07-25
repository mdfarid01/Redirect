const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE || "demo_submissions";

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
  const normalized = phone.replace(/[^\d+]/g, "");
  return /^\+?[1-9]\d{7,14}$/.test(normalized);
}

function normalizePhone(rawPhone) {
  return rawPhone.replace(/[^\d+]/g, "");
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return { supabaseUrl, supabaseKey };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error:
        "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or SUPABASE_SERVICE_ROLE_KEY on the server."
    });
  }

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

  const response = await fetch(`${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify([
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizePhone(phone.trim()),
        source_url:
          typeof source_url === "string"
            ? source_url.slice(0, 1000)
            : typeof referrer === "string"
              ? referrer.slice(0, 1000)
              : "",
        created_at: new Date().toISOString()
      }
    ])
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(500).json({ error: `Failed to save submission: ${response.status} ${text}` });
  }

  return res.status(201).json({ success: true });
};