const SUBMISSIONS_TABLE = process.env.SUBMISSIONS_TABLE || "demo_submissions";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return { supabaseUrl, supabaseKey };
}

module.exports = async function handler(_req, res) {
  if (_req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error:
        "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or SUPABASE_SERVICE_ROLE_KEY on the server."
    });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${SUBMISSIONS_TABLE}?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return res.status(500).json({ error: `Failed to fetch submissions: ${response.status} ${text}` });
  }

  const rows = await response.json();
  return res.status(200).json(rows);
};