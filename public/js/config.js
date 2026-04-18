// Configuración global de Supabase para GitHub Pages
// ATENCIÓN: Reemplaza estos valores con la URL y tu "anon public key"
// ACTUALIZADO: 18 de abril de 2026 - Credenciales de usuario verificadas
const _SUPABASE_URL = 'https://xbrkpordbsmqepqtnbsa.supabase.co';


const _SUPABASE_ANON_KEY = 'sb_publishable_nAXLKVq9mMWJCze_Ovh3iA_F4nACspd';

// Inicializar cliente Supabase globalmente
window.supabaseClient = supabase.createClient(_SUPABASE_URL, _SUPABASE_ANON_KEY);
console.log(">>> CONFIG.JS CARGADO EXITOSAMENTE <<<", !!window.supabaseClient);
