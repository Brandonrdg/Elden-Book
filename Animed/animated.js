import { loginConGoogle, cerrarSesion, onUsuarioCambia, guardarBuildFirestore, obtenerMisBuilds, eliminarBuild, auth } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const statsCard = document.getElementById('stats-card');
    const container = document.querySelector('.container');

    if (!statsCard || !container) return;

    const statColors = {
        'vigor':        { dark: '#500a0a', light: '#ff4d4d' },
        'mente':        { dark: '#0a1a50', light: '#4d79ff' },
        'resistencia':  { dark: '#0a500a', light: '#4dff4d' },
        'fuerza':       { dark: '#4b3621', light: '#d2b48c' },
        'destreza':     { dark: '#50500a', light: '#ffff4d' },
        'inteligencia': { dark: '#2b0a50', light: '#a64dff' },
        'fe':           { dark: '#503c0a', light: '#ffd700' },
        'arcano':       { dark: '#300000', light: '#800000' }
    };

    const stats = ['Vigor', 'Mente', 'Resistencia', 'Fuerza', 'Destreza', 'Inteligencia', 'Fe', 'Arcano'];

    const statsPorClase = {
        'Vagabundo':  { nivel: 9,  Vigor: 15, Mente: 10, Resistencia: 11, Fuerza: 14, Destreza: 13, Inteligencia: 9,  Fe: 9,  Arcano: 7  },
        'Héroe':      { nivel: 7,  Vigor: 14, Mente: 9,  Resistencia: 12, Fuerza: 16, Destreza: 9,  Inteligencia: 7,  Fe: 8,  Arcano: 11 },
        'Confesor':   { nivel: 10, Vigor: 10, Mente: 13, Resistencia: 10, Fuerza: 12, Destreza: 12, Inteligencia: 9,  Fe: 14, Arcano: 9  },
        'Astrólogo':  { nivel: 6,  Vigor: 9,  Mente: 15, Resistencia: 9,  Fuerza: 8,  Destreza: 12, Inteligencia: 16, Fe: 7,  Arcano: 9  },
        'Samurái':    { nivel: 9,  Vigor: 12, Mente: 11, Resistencia: 13, Fuerza: 12, Destreza: 15, Inteligencia: 9,  Fe: 8,  Arcano: 8  },
        'Bandido':    { nivel: 5,  Vigor: 10, Mente: 11, Resistencia: 10, Fuerza: 9,  Destreza: 13, Inteligencia: 9,  Fe: 8,  Arcano: 14 },
        'Prisionero': { nivel: 9,  Vigor: 11, Mente: 12, Resistencia: 11, Fuerza: 11, Destreza: 14, Inteligencia: 14, Fe: 6,  Arcano: 9  },
        'Profeta':    { nivel: 7,  Vigor: 10, Mente: 14, Resistencia: 8,  Fuerza: 11, Destreza: 10, Inteligencia: 7,  Fe: 16, Arcano: 10 },
        'Guerrero':   { nivel: 8,  Vigor: 11, Mente: 12, Resistencia: 11, Fuerza: 10, Destreza: 16, Inteligencia: 10, Fe: 8,  Arcano: 9  },
        'Wretch':     { nivel: 1,  Vigor: 10, Mente: 10, Resistencia: 10, Fuerza: 10, Destreza: 10, Inteligencia: 10, Fe: 10, Arcano: 10 }
    };

    const classSelector = document.getElementById('class-selector');

    statsCard.innerHTML = '<h2>Stats</h2>';
    const statContainer = document.createElement('div');
    statContainer.className = 'stat-container';
    statsCard.appendChild(statContainer);

    const buildSummary = document.createElement('div');
    buildSummary.className = 'build-summary';
    buildSummary.style.color = 'gold';
    statsCard.appendChild(buildSummary);

    function calcularNivel(buildStats, clase) {
        const base = statsPorClase[clase];
        if (!base) return '?';
        let puntos = 0;
        stats.forEach(name => {
            puntos += Math.max(0, (buildStats[name] || 0) - (base[name] || 0));
        });
        return base.nivel + puntos;
    }

    function updateBuildSummary() {
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const claseActual = classSelector ? classSelector.value : 'Vagabundo';
        const base = statsPorClase[claseActual];
        let puntosGastados = 0;
        stats.forEach((name, i) => {
            if (inputs[i]) {
                const valorActual = Number(inputs[i].value);
                const valorBase = base[name] || 0;
                puntosGastados += Math.max(0, valorActual - valorBase);
            }
        });
        const nivel = base.nivel + puntosGastados;
        buildSummary.textContent = `NVL: ${nivel}`;
        const porcentajePoder = Math.min(nivel / 800, 1);
        container.style.setProperty('--nivel-poder', porcentajePoder);
    }

    stats.forEach(name => {
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.textContent = name;
        label.style.width = '120px';

        const range = document.createElement('input');
        range.type = 'range';
        range.min = '1';
        range.max = '99';
        range.value = '10';

        const valSpan = document.createElement('span');
        valSpan.className = 'stat-value';
        valSpan.textContent = range.value;

        const colors = statColors[name.toLowerCase()];

        const update = () => {
            const pct = ((range.value - range.min) / (range.max - range.min)) * 100;
            range.style.background = `linear-gradient(90deg, ${colors.dark} 0%, ${colors.light} ${pct}%, #111 ${pct}%)`;
            valSpan.textContent = range.value;
            valSpan.style.setProperty('--valor-stat', range.value);
            updateBuildSummary();
        };

        range.addEventListener('input', update);
        row.appendChild(label);
        row.appendChild(range);
        row.appendChild(valSpan);
        statContainer.appendChild(row);
        update();
    });

    // ─── APLICAR CLASE ────────────────────────────────────────────
    function aplicarClase(nombreClase) {
        const base = statsPorClase[nombreClase];
        if (!base) return;
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        stats.forEach((name, i) => {
            inputs[i].value = base[name];
            inputs[i].dispatchEvent(new Event('input'));
        });
    }

    if (classSelector) {
        classSelector.addEventListener('change', () => aplicarClase(classSelector.value));
        aplicarClase(classSelector.value);
    }

    // ─── EQUIPAMIENTO ─────────────────────────────────────────────
    const armasBtn      = document.getElementById('armas-btn');
    const armadurasBtn  = document.getElementById('armaduras-btn');
    const talismansBtn  = document.getElementById('talismans-btn');
    const selectorModal = document.getElementById('selector-modal');
    const modalTitle    = document.getElementById('modal-title');
    const modalOptions  = document.getElementById('modal-options');
    const closeModalBtn = document.getElementById('close-modal');

    const selectorData = {
        armas:     ['Espada Larga', 'Martillo de Guerra', 'Arco Largo', 'Daga', 'Lanza'],
        armaduras: ['Armadura de Hierro', 'Manto de Seda', 'Coraza del Caballero', 'Cota Ligera', 'Peto Antiguo'],
        talismans: ['Talisman de Fuerza', 'Talisman de Resistencia', 'Talisman de Mente', 'Talisman del Dragón', 'Talisman del Espíritu']
    };

    const selectedButtons = { armas: armasBtn, armaduras: armadurasBtn, talismans: talismansBtn };

    function closeSelector() {
        if (!selectorModal) return;
        if (typeof selectorModal.close === 'function') selectorModal.close();
        else selectorModal.style.display = 'none';
    }

    function openSelector(type, title, options) {
        if (!selectorModal || !modalTitle || !modalOptions) return;
        modalTitle.textContent = title;
        modalOptions.innerHTML = '';
        options.forEach(optionText => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'option-item';
            item.textContent = optionText;
            item.addEventListener('click', () => {
                if (selectedButtons[type]) selectedButtons[type].textContent = `${title}: ${optionText}`;
                closeSelector();
            });
            modalOptions.appendChild(item);
        });
        if (typeof selectorModal.showModal === 'function') selectorModal.showModal();
        else selectorModal.style.display = 'block';
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSelector);
    if (selectorModal) selectorModal.addEventListener('click', e => { if (e.target === selectorModal) closeSelector(); });
    if (armasBtn)     armasBtn.addEventListener('click',     () => openSelector('armas',     'Seleccionar arma',      selectorData.armas));
    if (armadurasBtn) armadurasBtn.addEventListener('click', () => openSelector('armaduras', 'Seleccionar armadura',  selectorData.armaduras));
    if (talismansBtn) talismansBtn.addEventListener('click', () => openSelector('talismans', 'Seleccionar talismán',  selectorData.talismans));

    // ─── GUARDAR Y COMPARTIR ──────────────────────────────────────
    function getBuildData() {
        const buildNameInput = document.getElementById('build-name');
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const statsData = {};
        stats.forEach((name, i) => { statsData[name] = Number(inputs[i].value); });
        return {
            nombre:   buildNameInput ? buildNameInput.value : 'Sin nombre',
            clase:    classSelector  ? classSelector.value  : '',
            arma:     armasBtn.textContent,
            armadura: armadurasBtn.textContent,
            talisman: talismansBtn.textContent,
            stats:    statsData
        };
    }

    function loadBuildData(data) {
        const buildNameInput = document.getElementById('build-name');
        if (buildNameInput) buildNameInput.value = data.nombre;
        if (classSelector && data.clase) {
            classSelector.value = data.clase;
            aplicarClase(data.clase);
        }
        if (data.arma)     armasBtn.textContent     = data.arma;
        if (data.armadura) armadurasBtn.textContent = data.armadura;
        if (data.talisman) talismansBtn.textContent = data.talisman;
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        stats.forEach((name, i) => {
            if (data.stats && data.stats[name] !== undefined) {
                inputs[i].value = data.stats[name];
                inputs[i].dispatchEvent(new Event('input'));
            }
        });
    }

    // SAVE BUILD
    const saveBuildBtn = document.getElementById('save-build-btn');
    if (saveBuildBtn) {
        saveBuildBtn.addEventListener('click', async () => {
            const buildData = getBuildData();
            localStorage.setItem('eldenbook_build', JSON.stringify(buildData));
            if (auth.currentUser) {
                try {
                    await guardarBuildFirestore(buildData);
                    saveBuildBtn.textContent = '✓ Guardado en la nube!';
                } catch (e) {
                    console.error(e);
                    saveBuildBtn.textContent = '✗ Error al guardar';
                }
            } else {
                saveBuildBtn.textContent = '✓ Guardado localmente';
            }
            saveBuildBtn.style.color = 'gold';
            setTimeout(() => {
                saveBuildBtn.textContent = 'Save Build';
                saveBuildBtn.style.color = '';
            }, 2000);
        });
    }

    // SHARE BUILD
    const shareBuildBtn = document.getElementById('share-build-btn');
    if (shareBuildBtn) {
        shareBuildBtn.addEventListener('click', () => {
            const buildData = getBuildData();
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(buildData))));
            const shareUrl = `${window.location.origin}${window.location.pathname}?build=${encoded}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                shareBuildBtn.textContent = '✓ Link copiado!';
                shareBuildBtn.style.color = 'gold';
                setTimeout(() => {
                    shareBuildBtn.textContent = 'Share Build';
                    shareBuildBtn.style.color = '';
                }, 2000);
            }).catch(() => {
                prompt('Copia este link:', shareUrl);
            });
        });
    }

    // Cargar build desde URL
    const urlParams  = new URLSearchParams(window.location.search);
    const buildParam = urlParams.get('build');
    if (buildParam) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(buildParam))));
            loadBuildData(decoded);
        } catch (e) {
            console.warn('Link de build inválido:', e);
        }
    }

    // ─── MIS BUILDS ───────────────────────────────────────────────
    const misBuildBtn    = document.getElementById('mis-builds-btn');
    const misBuildModal  = document.getElementById('mis-builds-modal');
    const misBuildLista  = document.getElementById('mis-builds-lista');
    const closeMisBuilds = document.getElementById('close-mis-builds');

    function closeMisBuildModal() {
        if (!misBuildModal) return;
        if (typeof misBuildModal.close === 'function') misBuildModal.close();
        else misBuildModal.style.display = 'none';
    }

    async function cargarMisBuilds() {
        if (!misBuildLista) return;
        misBuildLista.innerHTML = '<p style="color:gold; text-align:center;">Cargando...</p>';
        try {
            const builds = await obtenerMisBuilds();
            if (builds.length === 0) {
                misBuildLista.innerHTML = '<p style="color:#aaa; text-align:center;">No tienes builds guardadas aún.</p>';
                return;
            }
            misBuildLista.innerHTML = '';
            builds.forEach(build => {
                const card = document.createElement('div');
                card.className = 'build-card';
                const nivel = calcularNivel(build.stats || {}, build.clase || 'Vagabundo');
                card.innerHTML = `
                    <div class="build-card-info">
                        <span class="build-card-nombre">${build.nombre || 'Sin nombre'}</span>
                        <span class="build-card-meta">${build.clase || ''} · NVL ${nivel}</span>
                    </div>
                    <div class="build-card-actions">
                        <button class="btn-cargar">Cargar</button>
                        <button class="btn-eliminar">Eliminar</button>
                    </div>
                `;
                card.querySelector('.btn-cargar').addEventListener('click', () => {
                    loadBuildData(build);
                    closeMisBuildModal();
                });
                card.querySelector('.btn-eliminar').addEventListener('click', async () => {
                    await eliminarBuild(build.buildId);
                    card.remove();
                    if (misBuildLista.children.length === 0) {
                        misBuildLista.innerHTML = '<p style="color:#aaa; text-align:center;">No tienes builds guardadas aún.</p>';
                    }
                });
                misBuildLista.appendChild(card);
            });
        } catch (e) {
            console.error(e);
            misBuildLista.innerHTML = '<p style="color:red; text-align:center;">Error al cargar builds.</p>';
        }
    }

    if (misBuildBtn) {
        misBuildBtn.addEventListener('click', () => {
            cargarMisBuilds();
            if (typeof misBuildModal.showModal === 'function') misBuildModal.showModal();
            else misBuildModal.style.display = 'block';
        });
    }

    if (closeMisBuilds) closeMisBuilds.addEventListener('click', closeMisBuildModal);
    if (misBuildModal)  misBuildModal.addEventListener('click', e => { if (e.target === misBuildModal) closeMisBuildModal(); });

    // ─── AUTH UI ──────────────────────────────────────────────────
    const loginBtn     = document.getElementById('login-btn');
    const logoutBtn    = document.getElementById('logout-btn');
    const loginSection = document.getElementById('login-section');
    const userSection  = document.getElementById('user-section');
    const userFoto     = document.getElementById('user-foto');
    const userNombre   = document.getElementById('user-nombre');

    onUsuarioCambia((user) => {
        if (user) {
            loginSection.style.display = 'none';
            userSection.style.display  = 'flex';
            userFoto.src               = user.photoURL;
            userNombre.textContent     = user.displayName;
            if (misBuildBtn) misBuildBtn.style.display = 'inline-flex';
        } else {
            loginSection.style.display = 'block';
            userSection.style.display  = 'none';
            if (misBuildBtn) misBuildBtn.style.display = 'none';
        }
    });

    if (loginBtn)  loginBtn.addEventListener('click',  loginConGoogle);
    if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);
});