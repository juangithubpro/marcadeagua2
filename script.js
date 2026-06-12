// ==========================================================================
// ☁️ CONFIGURACIÓN DE TU BASE DE DATOS EN LA NUBE (SUPABASE)
// ==========================================================================
// Remplazá estos dos strings con las credenciales que te da tu panel de Supabase:
const SUPABASE_URL = "https://TU_PROYECTO_ID.supabase.co";
const SUPABASE_KEY = "TU_SUPER_ANON_KEY_GIGANTE";

// Inicializamos el cliente global de Supabase en la app
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let formatoActual  = "post-vertical";
let posicionActual = "abajo-derecha";

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Grillas de toggles (Respetado idéntico)
    bindToggle('formato', (val) => {
        formatoActual = val;
        const lienzo = document.getElementById('lienzo-objetivo');
        if (lienzo) lienzo.className = `lienzo-producto formato-${val}`;
        aplicarEstilosLogo();
    });

    bindToggle('posicion', (val) => {
        posicionActual = val;
        const logo = document.getElementById('placa-logo');
        if (logo) {
            if (val !== 'centro-gigante') logo.style.transform = '';
            logo.className = `logo-marca-agua ${val}`;
            aplicarEstilosLogo();
        }
    });

    // Sliders
    const rangeOp  = document.getElementById('range-opacidad');
    const rangeSz  = document.getElementById('range-tamano');
    const valOp    = document.getElementById('val-opacidad');
    const valSz    = document.getElementById('val-tamano');

    rangeOp?.addEventListener('input', () => {
        if (valOp) valOp.textContent = Math.round(rangeOp.value * 100) + '%';
        aplicarEstilosLogo();
    });
    rangeSz?.addEventListener('input', () => {
        if (valSz) valSz.textContent = rangeSz.value;
        aplicarEstilosLogo();
    });

    // Input foto producto
    document.getElementById('input-foto')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const fondo = document.getElementById('placa-foto');
            if (fondo) {
                fondo.style.backgroundImage = `url('${ev.target.result}')`;
                fondo.classList.add('has-image');
            }
            const sub = document.getElementById('nombre-foto');
            if (sub) sub.textContent = truncar(file.name);
            document.getElementById('label-foto')?.classList.add('loaded');
        };
        reader.readAsDataURL(file);
    });

    // Input logo
    document.getElementById('input-logo')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const logo = document.getElementById('placa-logo');
            if (logo) {
                logo.src = ev.target.result;
                logo.style.display = 'block';
                aplicarEstilosLogo();
            }
            const sub = document.getElementById('nombre-logo');
            if (sub) sub.textContent = truncar(file.name);
            document.getElementById('label-logo')?.classList.add('loaded');
        };
        reader.readAsDataURL(file);
    });

    // Swipe táctil
    setupSwipe();

    // 🔥 Auto-login adaptado para validar estado de créditos real de forma asíncrona
    const tokenGuardado = localStorage.getItem('saas_token');
    if (tokenGuardado) {
        verificarSesionActiva(tokenGuardado);
    }
});

// Función auxiliar para el auto-login asíncrono seguro
async function verificarSesionActiva(token) {
    if (!supabase) return;
    try {
        const { data, error } = await supabase.from('clientes').select('*').eq('token', token).maybeSingle();
        if (data && !error) {
            cargarApp(token, data.creditos);
        } else {
            localStorage.removeItem('saas_token');
        }
    } catch (err) {
        console.error("Error de conexión inicial:", err);
    }
}

// ── Toggle groups ────────────────────────────────────────────────
function bindToggle(target, cb) {
    const wrap = document.querySelector(`[data-target="${target}"]`);
    if (!wrap) return;
    wrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-value]');
        if (!btn) return;
        wrap.querySelectorAll('[data-value]').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');
        cb(btn.getAttribute('data-value'));
    });
}

// ── Mobile tabs ──────────────────────────────────────────────────
function mobileTab(tab) {
    const controles = document.getElementById('panel-controles');
    const preview   = document.getElementById('panel-preview');
    const btnC      = document.getElementById('btn-tab-config');
    const btnP      = document.getElementById('btn-tab-preview');

    if (tab === 'config') {
        controles?.classList.remove('oculto');
        preview?.classList.remove('visible');
        btnC?.classList.add('activo');
        btnP?.classList.remove('activo');
    } else {
        controles?.classList.add('oculto');
        preview?.classList.add('visible');
        btnP?.classList.add('activo');
        btnC?.classList.remove('activo');
    }
}

function setupSwipe() {
    let startX = 0;
    const umbral = 60;

    const addSwipe = (el, onLeft, onRight) => {
        if (!el) return;
        el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        el.addEventListener('touchend',   e => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) < umbral) return;
            if (diff > 0) onLeft();
            else onRight();
        }, { passive: true });
    };

    addSwipe(document.getElementById('panel-controles'), () => mobileTab('preview'), () => {});
    addSwipe(document.getElementById('panel-preview'), () => {}, () => mobileTab('config'));
}

// ── Logo styles ──────────────────────────────────────────────────
function aplicarEstilosLogo() {
    const logo   = document.getElementById('placa-logo');
    const rangeOp = document.getElementById('range-opacidad');
    const rangeSz = document.getElementById('range-tamano');
    if (!logo || !rangeOp || !rangeSz) return;

    logo.style.opacity = rangeOp.value;

    const sz = parseInt(rangeSz.value);
    if (posicionActual === 'centro-gigante') {
        logo.style.width  = `${sz * 3.5}px`;
        logo.style.height = 'auto';
    } else {
        logo.style.width     = `${sz * 2.5}px`;
        logo.style.height    = 'auto';
        logo.style.transform = '';
    }
}

// ── Auth CON CONEXIÓN A INTERNET (SUPABASE) ────────────────────────
async function validarToken() {
    const input    = document.getElementById('input-token');
    const errorEl  = document.getElementById('error-token');
    const btnEntrar = document.querySelector('.btn-primary');
    const token    = input?.value.trim().toUpperCase();

    if (!token) {
        if (errorEl) errorEl.textContent = 'Ingresá un token.';
        return;
    }

    if (!supabase) {
        if (errorEl) errorEl.textContent = 'Error crítico de base de datos.';
        return;
    }

    if (errorEl) errorEl.textContent = 'Validando en la nube... ⏳';
    if (btnEntrar) btnEntrar.disabled = true;

    try {
        // Consultamos la tabla "clientes" filtrando por la columna "token"
        const { data, error } = await supabase.from('clientes').select('*').eq('token', token).maybeSingle();

        if (error) throw error;

        if (data) {
            if (errorEl) errorEl.textContent = '';
            localStorage.setItem('saas_token', token);
            cargarApp(token, data.creditos);
        } else {
            if (errorEl) errorEl.textContent = 'Token inválido.';
        }
    } catch (err) {
        console.error(err);
        if (errorEl) errorEl.textContent = 'Error de red al conectar con internet.';
    } finally {
        if (btnEntrar) btnEntrar.disabled = false;
    }
}

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const login = document.getElementById('pantalla-token');
    if (login && !login.classList.contains('view-oculta')) validarToken();
});

function cargarApp(token, creditosDesdeNube) {
    document.getElementById('pantalla-token')?.classList.add('view-oculta');
    document.getElementById('interfaz-principal')?.classList.remove('view-oculta');
    actualizarContadorGrafico(creditosDesdeNube);
    aplicarEstilosLogo();
}

function actualizarContadorGrafico(cantidadCreditos) {
    const numEl   = document.getElementById('contador-creditos');
    const btnDl   = document.getElementById('btn-descargar');
    const txtDl   = document.getElementById('btn-dl-text');

    if (numEl) numEl.textContent = cantidadCreditos;
    if (btnDl) btnDl.disabled = (cantidadCreditos <= 0);
    if (txtDl && cantidadCreditos <= 0) txtDl.textContent = 'Sin créditos';
}

// ── Descarga CON DESCUENTO DESDE LA NUBE ───────────────────────────
async function procesarDescarga() {
    const token  = localStorage.getItem('saas_token');
    const lienzo = document.getElementById('lienzo-objetivo');
    const btnDl  = document.getElementById('btn-descargar');
    const txtDl  = document.getElementById('btn-dl-text');

    if (!lienzo || !supabase) return;

    // 1. Validamos saldo real volviendo a preguntar en la nube (Evita fraudes de inspección)
    try {
        const { data, error } = await supabase.from('clientes').select('creditos').eq('token', token).maybeSingle();
        if (error || !data) throw new Error("No se pudo verificar el saldo.");
        
        let credActuales = data.creditos;
        if (credActuales <= 0) {
            actualizarContadorGrafico(0);
            return;
        }

        if (txtDl) txtDl.textContent = 'Procesando…';
        if (btnDl) btnDl.disabled = true;

        // 2. Render de la imagen
        const canvas = await html2canvas(lienzo, {
            useCORS: true,
            allowTaint: true,
            scale: 3,
            backgroundColor: null,
            logging: false
        });

        // 3. Descontamos el crédito directamente en la tabla de Supabase
        const nuevoSaldo = credActuales - 1;
        const { error: updateError } = await supabase.from('clientes').update({ creditos: nuevoSaldo }).eq('token', token);

        if (updateError) throw updateError;

        // 4. Descarga del archivo si impactó el descuento en internet
        const link = document.createElement('a');
        link.download = `watermark-pro-${formatoActual}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        actualizarContadorGrafico(nuevoSaldo);
        if (txtDl) txtDl.textContent = '¡Guardado! ↓';
        
        setTimeout(() => {
            if (txtDl) txtDl.textContent = 'Guardar imagen';
            if (btnDl && nuevoSaldo > 0) btnDl.disabled = false;
        }, 2500);

    } catch (err) {
        console.error(err);
        alert('Error al sincronizar con la nube. Intenta de nuevo.');
        if (txtDl) txtDl.textContent = 'Guardar imagen';
        if (btnDl) btnDl.disabled = false;
    }
}

function cerrarSesion() {
    localStorage.removeItem('saas_token');
    location.reload();
}

function truncar(nombre) {
    return nombre.length > 18 ? nombre.slice(0, 15) + '…' : nombre;
}