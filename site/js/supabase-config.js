/* =====================================================================
   Public website — Supabase connection config
   ---------------------------------------------------------------------
   This is the SAME project/keys as admin/js/supabase-config.js — kept as
   a separate copy so the public pages don't need to reach into the
   admin folder. If you ever change your Supabase project or anon key,
   update BOTH this file and admin/js/supabase-config.js.
   The anon key is safe here — Row Level Security only allows the public
   to READ the gallery and project showcase, nothing else.
===================================================================== */
const SUPABASE_URL = "https://pelkootzjmcppuljgbqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbGtvb3R6am1jcHB1bGpnYnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDY3NDEsImV4cCI6MjA5NTM4Mjc0MX0.rjuqM25Tx0pQNm-vZ9VdxkePimuUqYapU9bwmUhx2fw";
