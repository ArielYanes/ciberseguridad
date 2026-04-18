// Script para insertar datos de prueba en tabla devices
const https = require('https');

const url = new URL('https://xbrkpordbsmqepqtnbsa.supabase.co/rest/v1/devices');
const data = JSON.stringify({
    device_id: 'test-device-ariel-' + Date.now(),
    user_agent: 'Mozilla/5.0 Test Browser',
    platform: 'Windows',
    language: 'es-SV',
    screen_width: 1920,
    screen_height: 1080,
    ip: '192.168.1.1',
    status: 'active'
});

const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
        'apikey': 'sb_publishable_nAXLKVq9mMWJCze_Ovh3iA_F4nACspd',
        'Authorization': 'Bearer sb_publishable_nAXLKVq9mMWJCze_Ovh3iA_F4nACspd',
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Prefer': 'return=representation'
    }
};

const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', responseData);
        
        if (res.statusCode === 201) {
            console.log('✅ ÉXITO: Datos insertados correctamente en tabla devices');
        } else {
            console.log('❌ ERROR: No se pudieron insertar los datos');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ ERROR en la solicitud:', error.message);
});

req.write(data);
req.end();
