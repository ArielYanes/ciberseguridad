// Script para desactivar RLS y configurar Supabase correctamente
const https = require('https');

// SQL para desactivar RLS en ambas tablas
const sqlQueries = [
    'ALTER TABLE public.credentials DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;'
];

function executeSql(sql) {
    return new Promise((resolve, reject) => {
        const url = new URL('https://xbrkpordbsmqepqtnbsa.supabase.co/rest/v1/rpc/query');
        
        // Usar el endpoint de queries directamente
        const data = JSON.stringify({
            query: sql
        });

        const options = {
            hostname: 'xbrkpordbsmqepqtnbsa.supabase.co',
            path: '/rest/v1',
            method: 'POST',
            headers: {
                'apikey': 'sb_publishable_nAXLKVq9mMWJCze_Ovh3iA_F4nACspd',
                'Authorization': 'Bearer sb_publishable_nAXLKVq9mMWJCze_Ovh3iA_F4nACspd',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    response: responseData
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Ejecutar las queries
console.log('Desactivando RLS en las tablas...\n');

sqlQueries.forEach((query, index) => {
    console.log(`Query ${index + 1}: ${query}`);
    console.log('Nota: Requiere usar la API SQL de Supabase con credenciales de administrador\n');
});

console.log('⚠️ Para completar esta configuración, ve a Supabase y:');
console.log('1. Ve a SQL Editor');
console.log('2. Copia y ejecuta estas queries:');
console.log('');
console.log('ALTER TABLE public.credentials DISABLE ROW LEVEL SECURITY;');
console.log('ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;');
console.log('');
console.log('Después, el sitio web podrá guardar datos sin problemas.');
