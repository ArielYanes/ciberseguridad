// Configuración global de Supabase para GitHub Pages
// ATENCIÓN: Reemplaza estos valores con la URL y tu "anon public key"
const _SUPABASE_URL = 'https://edrdxiyyxiedezwekwzo.supabase.co';


const _SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhicmtwb3JkYnNtcWVwcXRuYnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDg5OTEsImV4cCI6MjA5MjA4NDk5MX0.QpT3f5hQbhikLR6-3FeXc9ejMMmSMtAETLQs1K4vsfY';

// Inicializar cliente Supabase globalmente
window.supabaseClient = supabase.createClient(_SUPABASE_URL, _SUPABASE_ANON_KEY);
console.log(">>> CONFIG.JS CARGADO EXITOSAMENTE <<<", !!window.supabaseClient);
