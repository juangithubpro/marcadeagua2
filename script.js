// ==========================================================================
// ☁️ CONFIGURACIÓN DE TU BASE DE DATOS EN LA NUBE (SUPABASE)
// ==========================================================================
const SUPABASE_URL = "https://srxyihjzralnwmbghlbr.supabase.co";
const SUPABASE_KEY = "sb_publishable_DdxolSiFK1CKXxlOh1aUwg_b2qppEin";

// 🔥 MODIFICACIÓN BLINDADA: Inicialización dinámica segura para evitar bloqueos de red
let supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let formatoActual  = "post-vertical";
let posicionActual = "abajo-derecha";

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Si por velocidad de carga de red la librería tardó un pelín, la inicializamos acá
    if (!supabase && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    // Grillas de toggles vinculadas a tu HTML actual
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

    // Auto-login asíncrono desde la nube
    const tokenGuardado = localStorage.getItem('saas_token');
    if (tokenGuardado) {
        verificarSesionActiva(tokenGuardado);
    }
});

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
        console.error("Error de sesión:", err);
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

// ── 🔥 CORREGIDO: ALTURA EN AUTO PARA EVITAR DEFORMACIONES ────────
function aplicarEstilosLogo() {
    const logo   = document.getElementById('placa-logo');
    const rangeOp = document.getElementById('range-opacidad');
    const rangeSz = document.getElementById('range-tamano');
    if (!logo || !rangeOp || !rangeSz) return;

    logo.style.opacity = rangeOp.value;

    const sz = parseInt(rangeSz.value);
    if (posicionActual === 'centro-gigante') {
        logo.style.width  = `${sz * 3.5}px`;
        logo.style.height = 'auto'; // 👈 Auto previene que se aplaste en el centro
    } else {
        logo.style.width     = `${sz * 2.5}px`;
        logo.style.height    = 'auto';
        logo.style.transform = '';
    }
}

// ── Auth con Supabase ─────────────────────────────────────────────
async function validarToken() {
    const input    = document.getElementById('input-token');
    const errorEl  = document.getElementById('error-token');
    const btnEntrar = document.querySelector('.btn-primary');
    const token    = input?.value.trim().toUpperCase();

    if (!token) {
        if (errorEl) errorEl.textContent = 'Ingresá un token.';
        return;
    }

    // Intento de re-conexión de último minuto si el objeto falló al arrancar
    if (!supabase && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    if (!supabase) {
        if (errorEl) errorEl.textContent = 'Error de inicialización de base de datos.';
        return;
    }

    if (errorEl) errorEl.textContent = 'Validando credenciales... ⏳';
    if (btnEntrar) btnEntrar.disabled = true;

    try {
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
        if (errorEl) errorEl.textContent = 'Error de red al conectar con la nube.';
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

function updateContadorLocal(nuevoSaldo) {
    actualizarContadorGrafico(nuevoSaldo);
}

function actualizarContadorGrafico(cantidadCreditos) {
    const numEl   = document.getElementById('contador-creditos');
    const btnDl   = document.getElementById('btn-descargar');
    const txtDl   = document.getElementById('btn-dl-text');

    if (numEl) numEl.textContent = cantidadCreditos;
    if (btnDl) btnDl.disabled = (cantidadCreditos <= 0);
    if (txtDl && cantidadCreditos <= 0) txtDl.textContent = 'Sin créditos';
}

// ── Descarga con Sincronización Directa ───────────────────────────
async function procesarDescarga() {
    const token  = localStorage.getItem('saas_token');
    const lienzo = document.getElementById('lienzo-objetivo');
    const btnDl  = document.getElementById('btn-descargar');
    const txtDl  = document.getElementById('btn-dl-text');

    if (!lienzo || !supabase) return;

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

        const canvas = await html2canvas(lienzo, {
            useCORS: true,
            allowTaint: true,
            scale: 3,
            backgroundColor: null,
            logging: false
        });

        const nuevoSaldo = credActuales - 1;
        const { error: updateError } = await supabase.from('clientes').update({ creditos: nuevoSaldo }).eq('token', token);

        if (updateError) throw updateError;

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
        alert('Error de sincronización con la nube. Intentá de nuevo.');
        if (txtDl) txtDl.textContent = 'Guardar imagen';
        if (btnDl) btnDl.disabled = false;
    }
}

function cerrarSesion() {
    localStorage.removeItem('saas_token');
    location.reload();
}

// Función auxiliar para truncar strings largos
function truncar(nombre) {
    return nombre.length > 18 ? nombre.slice(0, 15) + '…' : nombre;
}