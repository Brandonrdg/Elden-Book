import { loginConGoogle, cerrarSesion, onUsuarioCambia, guardarBuildFirestore, obtenerMisBuilds, eliminarBuild, obtenerPerfil, contarMisBuilds, auth } from './firebase.js';

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

    // ─── EQUIPAMIENTO (definido aquí arriba para que actualizarEstadisticas lo use) ──
    const equipSlots = {
        'arma-derecha':    { type: 'armas',     label: '⚔️ Mano Derecha' },
        'arma-izquierda':  { type: 'armas',     label: '🛡️ Mano Izquierda' },
        'armadura-cabeza': { type: 'armaduras', label: '🪖 Cabeza' },
        'armadura-pecho':  { type: 'armaduras', label: '🥋 Pecho' },
        'armadura-manos':  { type: 'armaduras', label: '🧤 Manos' },
        'armadura-piernas':{ type: 'armaduras', label: '👢 Piernas' },
        'talisman-1':      { type: 'talismans', label: '🔮 Talismán 1' },
        'talisman-2':      { type: 'talismans', label: '🔮 Talismán 2' },
        'talisman-3':      { type: 'talismans', label: '🔮 Talismán 3' },
        'talisman-4':      { type: 'talismans', label: '🔮 Talismán 4' },
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

    // ─── ESTADÍSTICAS CALCULADAS ──────────────────────────────────
    function calcularHP(vigor) {
        if (vigor <= 25)      return Math.floor(300 + (vigor - 1) * (500 / 24));
        else if (vigor <= 40) return Math.floor(800 + (vigor - 25) * (320 / 15));
        else if (vigor <= 60) return Math.floor(1120 + (vigor - 40) * (280 / 20));
        else                  return Math.floor(1400 + (vigor - 60) * (200 / 39));
    }

    function calcularFP(mente) {
        if (mente <= 15)      return Math.floor(50 + (mente - 1) * (50 / 14));
        else if (mente <= 35) return Math.floor(100 + (mente - 15) * (100 / 20));
        else if (mente <= 60) return Math.floor(200 + (mente - 35) * (150 / 25));
        else                  return Math.floor(350 + (mente - 60) * (50 / 39));
    }

    function calcularStamina(resistencia) {
        if (resistencia <= 15)      return Math.floor(80 + (resistencia - 1) * (40 / 14));
        else if (resistencia <= 35) return Math.floor(120 + (resistencia - 15) * (40 / 20));
        else if (resistencia <= 60) return Math.floor(160 + (resistencia - 35) * (40 / 25));
        else                        return Math.floor(200 + (resistencia - 60) * (20 / 39));
    }

    function calcularCargaMaxima(fuerza) {
        return Math.round((40 + fuerza * 0.9) * 10) / 10;
    }

    function getNivelCarga(pesoActual, pesoMax) {
        const ratio = pesoActual / pesoMax;
        if (ratio <= 0.299) return { label: '⚡ Carga Ligera', color: '#2ecc71' };
        if (ratio <= 0.699) return { label: '🏃 Carga Media',  color: '#f1c40f' };
        if (ratio <= 0.999) return { label: '🐢 Carga Pesada', color: '#e67e22' };
        return                     { label: '🪨 Sobrecargado', color: '#e74c3c' };
    }

    function actualizarBuffs() {
        const buffsList = document.getElementById('buffs-lista');
        if (!buffsList) return;
        const buffs = [];
        Object.keys(equipSlots).forEach(slotId => {
            const btn = document.getElementById(slotId);
            if (btn && btn.dataset.description && btn.dataset.description !== 'undefined' && btn.dataset.itemName) {
                buffs.push({
                    nombre: btn.dataset.itemName,
                    descripcion: btn.dataset.description
                });
            }
        });
        if (buffs.length === 0) {
            buffsList.innerHTML = '<p class="buffs-empty">Equipa items para ver sus efectos</p>';
            return;
        }
        buffsList.innerHTML = '';
        buffs.forEach(buff => {
            const div = document.createElement('div');
            div.className = 'buff-item';
            div.innerHTML = `
                <span class="buff-nombre">${buff.nombre}</span>
                <span class="buff-desc">${buff.descripcion}</span>
            `;
            buffsList.appendChild(div);
        });
    }

    function actualizarEstadisticas() {
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const vigor       = inputs[0] ? Number(inputs[0].value) : 10;
        const mente       = inputs[1] ? Number(inputs[1].value) : 10;
        const resistencia = inputs[2] ? Number(inputs[2].value) : 10;
        const fuerza      = inputs[3] ? Number(inputs[3].value) : 10;

        const hp      = calcularHP(vigor);
        const fp      = calcularFP(mente);
        const stamina = calcularStamina(resistencia);
        const pesoMax = calcularCargaMaxima(fuerza);

        let pesoTotal = 0;
        Object.keys(equipSlots).forEach(slotId => {
            const btn = document.getElementById(slotId);
            if (btn) pesoTotal += Number(btn.dataset.weight || 0);
        });
        pesoTotal = Math.round(pesoTotal * 10) / 10;

        const maxHP = 1900, maxFP = 450, maxStamina = 240;

        const valHp      = document.getElementById('val-hp');
        const valFp      = document.getElementById('val-fp');
        const valStamina = document.getElementById('val-stamina');
        const valPeso    = document.getElementById('val-peso');
        const barHp      = document.getElementById('bar-hp');
        const barFp      = document.getElementById('bar-fp');
        const barStamina = document.getElementById('bar-stamina');
        const barPeso    = document.getElementById('bar-peso');
        const cargaLabel = document.getElementById('carga-label');

        if (valHp)      valHp.textContent      = hp;
        if (valFp)      valFp.textContent      = fp;
        if (valStamina) valStamina.textContent = stamina;
        if (valPeso)    valPeso.textContent    = `${pesoTotal} / ${pesoMax}`;

        if (barHp)      barHp.style.setProperty('--pct',      `${Math.min(hp / maxHP * 100, 100)}%`);
        if (barFp)      barFp.style.setProperty('--pct',      `${Math.min(fp / maxFP * 100, 100)}%`);
        if (barStamina) barStamina.style.setProperty('--pct', `${Math.min(stamina / maxStamina * 100, 100)}%`);
        if (barPeso)    barPeso.style.setProperty('--pct',    `${Math.min(pesoTotal / pesoMax * 100, 100)}%`);

        if (cargaLabel) {
            const carga = getNivelCarga(pesoTotal, pesoMax);
            cargaLabel.textContent = carga.label;
            cargaLabel.style.color = carga.color;
        }

        actualizarBuffs();
    }

    // ─── NIVEL Y SUMMARY ─────────────────────────────────────────
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
                puntosGastados += Math.max(0, Number(inputs[i].value) - (base[name] || 0));
            }
        });
        const nivel = base.nivel + puntosGastados;
        buildSummary.textContent = `NVL: ${nivel}`;
        container.style.setProperty('--nivel-poder', Math.min(nivel / 800, 1));
    }

    // ─── CREAR SLIDERS ────────────────────────────────────────────
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
            actualizarEstadisticas(); // ← aquí se actualiza todo junto
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

    // ─── MODAL EQUIPAMIENTO ───────────────────────────────────────
    const selectorModal = document.getElementById('selector-modal');
    const modalTitle    = document.getElementById('modal-title');
    const modalOptions  = document.getElementById('modal-options');
    const closeModalBtn = document.getElementById('close-modal');

    const apiEndpoints = {
        armas:     'https://eldenring.fanapis.com/api/weapons?limit=100',
        armaduras: 'https://eldenring.fanapis.com/api/armors?limit=100',
        talismans: 'https://eldenring.fanapis.com/api/talismans?limit=100'
    };

    const itemCache = { armas: null, armaduras: null, talismans: null };
    let slotActivo = null;

    function closeSelector() {
        if (!selectorModal) return;
        if (typeof selectorModal.close === 'function') selectorModal.close();
        else selectorModal.style.display = 'none';
        slotActivo = null;
    }

    async function openSelector(slotId, title, type) {
        if (!selectorModal || !modalTitle || !modalOptions) return;
        slotActivo = slotId;
        modalTitle.textContent = title;
        modalOptions.innerHTML = '<p style="color:gold; text-align:center;">Cargando...</p>';

        if (typeof selectorModal.showModal === 'function') selectorModal.showModal();
        else selectorModal.style.display = 'block';

        try {
            if (!itemCache[type]) {
                const res = await fetch(apiEndpoints[type]);
                const data = await res.json();
                itemCache[type] = data.data;
            }

            const items = itemCache[type];
            modalOptions.innerHTML = '';

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'option-item option-item--clear';
            clearBtn.textContent = '✕ Quitar item';
            clearBtn.addEventListener('click', () => {
                const btn = document.getElementById(slotActivo);
                if (btn) {
                    btn.innerHTML = equipSlots[slotActivo].label;
                    btn.dataset.itemId      = '';
                    btn.dataset.weight      = 0;
                    btn.dataset.description = '';
                    btn.dataset.itemName    = '';
                }
                actualizarEstadisticas();
                closeSelector();
            });
            modalOptions.appendChild(clearBtn);

            items.forEach(item => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'option-item';
                btn.innerHTML = `
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-img" onerror="this.style.display='none'">` : ''}
                    <span class="item-nombre">${item.name}</span>
                    ${item.weight ? `<span class="item-peso">Peso: ${item.weight}</span>` : ''}
                `;
                // Buscador
const searchInput = document.getElementById('modal-search-input');
if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const btns = modalOptions.querySelectorAll('.option-item:not(.option-item--clear)');
        btns.forEach(btn => {
            const nombre = btn.querySelector('.item-nombre')?.textContent.toLowerCase() || '';
            btn.style.display = nombre.includes(query) ? '' : 'none';
        });
    });
}
                btn.addEventListener('click', () => {
                    const slotBtn = document.getElementById(slotActivo);
                    if (slotBtn) {
                        slotBtn.innerHTML = `
                            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="slot-img" onerror="this.style.display='none'">` : ''}
                            <span>${item.name}</span>
                        `;
                        slotBtn.dataset.itemId      = item.id;
                        slotBtn.dataset.weight      = item.weight || 0;
                        slotBtn.dataset.description = item.description || '';
                        slotBtn.dataset.itemName    = item.name;
                    }
                    actualizarEstadisticas();
                    closeSelector();
                });
                modalOptions.appendChild(btn);
            });

        } catch (e) {
            console.error(e);
            modalOptions.innerHTML = '<p style="color:red; text-align:center;">Error al cargar items.</p>';
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSelector);
    if (selectorModal) selectorModal.addEventListener('click', e => { if (e.target === selectorModal) closeSelector(); });

    Object.entries(equipSlots).forEach(([slotId, info]) => {
        const btn = document.getElementById(slotId);
        if (btn) btn.addEventListener('click', () => openSelector(slotId, `Seleccionar ${info.label}`, info.type));
    });

    // ─── GUARDAR Y COMPARTIR ──────────────────────────────────────
    function getBuildData() {
        const buildNameInput = document.getElementById('build-name');
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const statsData = {};
        stats.forEach((name, i) => { statsData[name] = Number(inputs[i].value); });

        const equipData = {};
        Object.keys(equipSlots).forEach(slotId => {
            const btn = document.getElementById(slotId);
            equipData[slotId] = {
                name:        btn ? btn.textContent : '',
                itemId:      btn ? btn.dataset.itemId || '' : '',
                weight:      btn ? Number(btn.dataset.weight || 0) : 0,
                description: btn ? btn.dataset.description || '' : ''
            };
        });

        return {
            nombre: buildNameInput ? buildNameInput.value : 'Sin nombre',
            clase:  classSelector  ? classSelector.value  : '',
            equipo: equipData,
            stats:  statsData
        };
    }

    function loadBuildData(data) {
        const buildNameInput = document.getElementById('build-name');
        if (buildNameInput) buildNameInput.value = data.nombre || '';
        if (classSelector && data.clase) {
            classSelector.value = data.clase;
            aplicarClase(data.clase);
        }
        if (data.equipo) {
            Object.entries(data.equipo).forEach(([slotId, itemData]) => {
                const btn = document.getElementById(slotId);
                if (btn && itemData.name && itemData.name !== equipSlots[slotId]?.label) {
                    btn.textContent         = itemData.name;
                    btn.dataset.itemId      = itemData.itemId || '';
                    btn.dataset.weight      = itemData.weight || 0;
                    btn.dataset.description = itemData.description || '';
                }
            });
        }
        if (data.arma)     { const b = document.getElementById('arma-derecha');    if (b) b.textContent = data.arma; }
        if (data.armadura) { const b = document.getElementById('armadura-pecho');  if (b) b.textContent = data.armadura; }
        if (data.talisman) { const b = document.getElementById('talisman-1');      if (b) b.textContent = data.talisman; }

        const inputs = statContainer.querySelectorAll('input[type="range"]');
        stats.forEach((name, i) => {
            if (data.stats && data.stats[name] !== undefined) {
                inputs[i].value = data.stats[name];
                inputs[i].dispatchEvent(new Event('input'));
            }
        });
        actualizarEstadisticas();
    }

    // SAVE BUILD
   const saveBuildBtn = document.getElementById('save-build-btn');
if (saveBuildBtn) {
    saveBuildBtn.addEventListener('click', async () => {
        const buildData = getBuildData();
        localStorage.setItem('eldenbook_build', JSON.stringify(buildData));

        if (auth.currentUser) {
            try {
                // Verificar límite free
                const perfil = await obtenerPerfil();
                const isPremium = perfil?.isPremium || false;

                if (!isPremium) {
                    const totalBuilds = await contarMisBuilds();
                    if (totalBuilds >= 3) {
                        abrirModal(premiumModal);
                        return;
                    }
                }

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
                setTimeout(() => { shareBuildBtn.textContent = 'Share Build'; shareBuildBtn.style.color = ''; }, 2000);
            }).catch(() => { prompt('Copia este link:', shareUrl); });
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

    // ─── FUNCIONES GENÉRICAS PARA MODALES ────────────────────────

    const modalOverlay = document.getElementById('modal-overlay');

    function cerrarModal(modal) {
        if (!modal) return;
        if (typeof modal.close === 'function') modal.close();
        else modal.style.display = 'none';
    }

    function abrirModal(modal) {
        if (!modal) return;
        if (typeof modal.showModal === 'function') modal.showModal();
        else modal.style.display = 'block';
    }

    // ─── PREMIUM MODAL ────────────────────────────────────────────────
    const premiumModal    = document.getElementById('premium-modal');
    const closePremiumBtn = document.getElementById('close-premium-modal');

    if (closePremiumBtn) closePremiumBtn.addEventListener('click', () => cerrarModal(premiumModal));

    // Actualizar el overlay para cerrar también el premium modal
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            cerrarModal(document.getElementById('selector-modal'));
            cerrarModal(document.getElementById('mis-builds-modal'));
            cerrarModal(premiumModal);
            slotActivo = null;
        });
    }

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

    // Inicializar estadísticas al cargar
    actualizarEstadisticas();
});