(function () {
  const cfg = window.KSU_SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.url.includes("YOUR_PROJECT_REF") || cfg.anonKey.includes("YOUR_SUPABASE")) {
    console.warn("KSU SmartPlan: configure js/supabase-config.js with your Supabase URL and publishable/anon key.");
    window.KSU_SUPABASE = null;
    return;
  }
  window.KSU_SUPABASE = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();
