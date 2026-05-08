import { loginConGoogle, cerrarSesion, onUsuarioCambia, guardarBuildFirestore, obtenerMisBuilds, eliminarBuild, auth } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const statsCard = document.getElementById('stats-card');
    const container = document.querySelector('.container');

    if (!statsCard || !container) return;

    // ─── MODALES ──────────────────────────────────────────────────
    const modalOverlay = document.getElementById('modal-overlay');

    function abrirModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        if (modalOverlay) modalOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        const hayModalActivo = document.querySelectorAll('.modal.active').length > 0;
        if (!hayModalActivo && modalOverlay) {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            cerrarModal(document.getElementById('selector-modal'));
            cerrarModal(document.getElementById('mis-builds-modal'));
            slotActivo = null;
        });
    }

    // ─── DATOS ────────────────────────────────────────────────────
    const statColors = {
        'vigor':        { dark: '#500a0a', light: '#ff4d4d' },
        'mind':         { dark: '#0a1a50', light: '#4d79ff' },
        'endurance':    { dark: '#0a500a', light: '#4dff4d' },
        'strength':     { dark: '#4b3621', light: '#d2b48c' },
        'dexterity':    { dark: '#50500a', light: '#ffff4d' },
        'intelligence': { dark: '#2b0a50', light: '#a64dff' },
        'faith':        { dark: '#503c0a', light: '#ffd700' },
        'arcane':       { dark: '#300000', light: '#800000' }
    };

    const stats = ['Vigor', 'Mind', 'Endurance', 'Strength', 'Dexterity', 'Intelligence', 'Faith', 'Arcane'];

    const statsByClass = {
        'Vagabond':   { level: 9,  Vigor: 15, Mind: 10, Endurance: 11, Strength: 14, Dexterity: 13, Intelligence: 9,  Faith: 9,  Arcane: 7  },
        'Hero':       { level: 7,  Vigor: 14, Mind: 9,  Endurance: 12, Strength: 16, Dexterity: 9,  Intelligence: 7,  Faith: 8,  Arcane: 11 },
        'Confessor':  { level: 10, Vigor: 10, Mind: 13, Endurance: 10, Strength: 12, Dexterity: 12, Intelligence: 9,  Faith: 14, Arcane: 9  },
        'Astrologer': { level: 6,  Vigor: 9,  Mind: 15, Endurance: 9,  Strength: 8,  Dexterity: 12, Intelligence: 16, Faith: 7,  Arcane: 9  },
        'Samurai':    { level: 9,  Vigor: 12, Mind: 11, Endurance: 13, Strength: 12, Dexterity: 15, Intelligence: 9,  Faith: 8,  Arcane: 8  },
        'Bandit':     { level: 5,  Vigor: 10, Mind: 11, Endurance: 10, Strength: 9,  Dexterity: 13, Intelligence: 9,  Faith: 8,  Arcane: 14 },
        'Prisoner':   { level: 9,  Vigor: 11, Mind: 12, Endurance: 11, Strength: 11, Dexterity: 14, Intelligence: 14, Faith: 6,  Arcane: 9  },
        'Prophet':    { level: 7,  Vigor: 10, Mind: 14, Endurance: 8,  Strength: 11, Dexterity: 10, Intelligence: 7,  Faith: 16, Arcane: 10 },
        'Warrior':    { level: 8,  Vigor: 11, Mind: 12, Endurance: 11, Strength: 10, Dexterity: 16, Intelligence: 10, Faith: 8,  Arcane: 9  },
        'Wretch':     { level: 1,  Vigor: 10, Mind: 10, Endurance: 10, Strength: 10, Dexterity: 10, Intelligence: 10, Faith: 10, Arcane: 10 }
    };

    const equipSlots = {
        'arma-derecha':    { type: 'weapons', label: '⚔️ Right Hand' },
        'arma-izquierda':  { type: 'weapons', label: '🛡️ Left Hand' },
        'armadura-cabeza': { type: 'armor',   label: '🪖 Head' },
        'armadura-pecho':  { type: 'armor',   label: '🥋 Chest' },
        'armadura-manos':  { type: 'armor',   label: '🧤 Hands' },
        'armadura-piernas':{ type: 'armor',   label: '👢 Legs' },
        'talisman-1':      { type: 'talismans', label: '🔮 Talisman 1' },
        'talisman-2':      { type: 'talismans', label: '🔮 Talisman 2' },
        'talisman-3':      { type: 'talismans', label: '🔮 Talisman 3' },
        'talisman-4':      { type: 'talismans', label: '🔮 Talisman 4' },
    };

    const armorFilter = {
        'armadura-cabeza':  'Helm',
        'armadura-pecho':   'Chest Armor',
        'armadura-manos':   'Gauntlets',
        'armadura-piernas': 'Leg Armor'
    };

    const classSelector = document.getElementById('class-selector');

    // ─── STATS CARD ───────────────────────────────────────────────
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

    function calcularFP(mind) {
        if (mind <= 15)      return Math.floor(50 + (mind - 1) * (50 / 14));
        else if (mind <= 35) return Math.floor(100 + (mind - 15) * (100 / 20));
        else if (mind <= 60) return Math.floor(200 + (mind - 35) * (150 / 25));
        else                 return Math.floor(350 + (mind - 60) * (50 / 39));
    }

    function calcularStamina(endurance) {
        if (endurance <= 15)      return Math.floor(80 + (endurance - 1) * (40 / 14));
        else if (endurance <= 35) return Math.floor(120 + (endurance - 15) * (40 / 20));
        else if (endurance <= 60) return Math.floor(160 + (endurance - 35) * (40 / 25));
        else                      return Math.floor(200 + (endurance - 60) * (20 / 39));
    }

    function calcularMaxWeight(strength) {
        return Math.round((40 + strength * 0.9) * 10) / 10;
    }

    function getLoadLevel(current, max) {
        const ratio = current / max;
        if (ratio <= 0.299) return { label: '⚡ Light Load',  color: '#2ecc71' };
        if (ratio <= 0.699) return { label: '🏃 Medium Load', color: '#f1c40f' };
        if (ratio <= 0.999) return { label: '🐢 Heavy Load',  color: '#e67e22' };
        return                     { label: '🪨 Overloaded',  color: '#e74c3c' };
    }

    function updateBuffs() {
        const buffsList = document.getElementById('buffs-lista');
        if (!buffsList) return;
        const buffs = [];
        Object.keys(equipSlots).forEach(slotId => {
            const btn = document.getElementById(slotId);
            if (btn && btn.dataset.description && btn.dataset.description !== 'undefined' && btn.dataset.itemName) {
                buffs.push({ name: btn.dataset.itemName, description: btn.dataset.description });
            }
        });
        if (buffs.length === 0) {
            buffsList.innerHTML = '<p class="buffs-empty">Equip items to see their effects</p>';
            return;
        }
        buffsList.innerHTML = '';
        buffs.forEach(buff => {
            const div = document.createElement('div');
            div.className = 'buff-item';
            div.innerHTML = `
                <span class="buff-nombre">${buff.name}</span>
                <span class="buff-desc">${buff.description}</span>
            `;
            buffsList.appendChild(div);
        });
    }

    function updateStats() {
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const vigor      = inputs[0] ? Number(inputs[0].value) : 10;
        const mind       = inputs[1] ? Number(inputs[1].value) : 10;
        const endurance  = inputs[2] ? Number(inputs[2].value) : 10;
        const strength   = inputs[3] ? Number(inputs[3].value) : 10;

        const hp        = calcularHP(vigor);
        const fp        = calcularFP(mind);
        const stamina   = calcularStamina(endurance);
        const maxWeight = calcularMaxWeight(strength);

        let totalWeight = 0;
        Object.keys(equipSlots).forEach(slotId => {
            const btn = document.getElementById(slotId);
            if (btn) totalWeight += Number(btn.dataset.weight || 0);
        });
        totalWeight = Math.round(totalWeight * 10) / 10;

        const maxHP = 1900, maxFP = 450, maxStamina = 240;

        const valHp      = document.getElementById('val-hp');
        const valFp      = document.getElementById('val-fp');
        const valStamina = document.getElementById('val-stamina');
        const valPeso    = document.getElementById('val-peso');
        const barHp      = document.getElementById('bar-hp');
        const barFp      = document.getElementById('bar-fp');
        const barStamina = document.getElementById('bar-stamina');
        const barPeso    = document.getElementById('bar-peso');
        const loadLabel  = document.getElementById('carga-label');

        if (valHp)      valHp.textContent      = hp;
        if (valFp)      valFp.textContent      = fp;
        if (valStamina) valStamina.textContent = stamina;
        if (valPeso)    valPeso.textContent    = `${totalWeight} / ${maxWeight}`;

        if (barHp)      barHp.style.setProperty('--pct',      `${Math.min(hp / maxHP * 100, 100)}%`);
        if (barFp)      barFp.style.setProperty('--pct',      `${Math.min(fp / maxFP * 100, 100)}%`);
        if (barStamina) barStamina.style.setProperty('--pct', `${Math.min(stamina / maxStamina * 100, 100)}%`);
        if (barPeso)    barPeso.style.setProperty('--pct',    `${Math.min(totalWeight / maxWeight * 100, 100)}%`);

        if (loadLabel) {
            const load = getLoadLevel(totalWeight, maxWeight);
            loadLabel.textContent = load.label;
            loadLabel.style.color = load.color;
        }

        updateBuffs();
    }

    // ─── LEVEL AND SUMMARY ────────────────────────────────────────
    function calculateLevel(buildStats, characterClass) {
        const base = statsByClass[characterClass];
        if (!base) return '?';
        let points = 0;
        stats.forEach(name => {
            points += Math.max(0, (buildStats[name] || 0) - (base[name] || 0));
        });
        return base.level + points;
    }

    function updateBuildSummary() {
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const currentClass = classSelector ? classSelector.value : 'Vagabond';
        const base = statsByClass[currentClass];
        if (!base) return;
        let pointsSpent = 0;
        stats.forEach((name, i) => {
            if (inputs[i]) pointsSpent += Math.max(0, Number(inputs[i].value) - (base[name] || 0));
        });
        const level = base.level + pointsSpent;
        buildSummary.textContent = `LVL: ${level}`;
        container.style.setProperty('--nivel-poder', Math.min(level / 800, 1));
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
            updateStats();
        };

        range.addEventListener('input', update);
        row.appendChild(label);
        row.appendChild(range);
        row.appendChild(valSpan);
        statContainer.appendChild(row);
        update();
    });

    // ─── APPLY CLASS ─────────────────────────────────────────────
    function applyClass(className) {
        const base = statsByClass[className];
        if (!base) return;
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        stats.forEach((name, i) => {
            inputs[i].value = base[name];
            inputs[i].dispatchEvent(new Event('input'));
        });
    }

    if (classSelector) {
        classSelector.addEventListener('change', () => applyClass(classSelector.value));
        applyClass(classSelector.value);
    }

    // ─── MODAL EQUIPMENT ─────────────────────────────────────────
    const selectorModal = document.getElementById('selector-modal');
    const modalTitle    = document.getElementById('modal-title');
    const modalOptions  = document.getElementById('modal-options');
    const closeModalBtn = document.getElementById('close-modal');

    const itemCache = {};
    let slotActivo = null;

    async function fetchAll(type) {
        let all = [];
        let page = 0;
        const limit = 100;
        const baseUrl = type === 'armor' ? 'https://eldenring.fanapis.com/api/armors'
                      : type === 'weapons' ? 'https://eldenring.fanapis.com/api/weapons'
                      : 'https://eldenring.fanapis.com/api/talismans';

        while (true) {
            const res = await fetch(`${baseUrl}?limit=${limit}&page=${page}`);
            const data = await res.json();
            const items = data.data || [];
            all = [...all, ...items];
            if (all.length >= data.total || items.length === 0) break;
            page++;
        }
        return all;
    }

    function closeSelector() {
        cerrarModal(selectorModal);
        slotActivo = null;
    }

    async function openSelector(slotId, title, type) {
        if (!selectorModal || !modalTitle || !modalOptions) return;
        slotActivo = slotId;
        modalTitle.textContent = title;
        modalOptions.innerHTML = '<p style="color:gold; text-align:center;">Loading...</p>';
        abrirModal(selectorModal);

        const searchInput = document.getElementById('modal-search-input');
        if (searchInput) {
            searchInput.value = '';
            if (searchInput._handler) searchInput.removeEventListener('input', searchInput._handler);
        }

        try {
            if (!itemCache[type]) {
                itemCache[type] = await fetchAll(type);
            }

            let items = itemCache[type];

            if (type === 'armor') {
                const category = armorFilter[slotId];
                const filtered = items.filter(item => item.category === category);
                items = filtered.length > 0 ? filtered : items;
            }

            modalOptions.innerHTML = '';

            // Clear button
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'option-item option-item--clear';
            clearBtn.textContent = '✕ Remove item';
            clearBtn.addEventListener('click', () => {
                const btn = document.getElementById(slotActivo);
                if (btn) {
                    btn.innerHTML           = equipSlots[slotActivo].label;
                    btn.dataset.itemId      = '';
                    btn.dataset.weight      = 0;
                    btn.dataset.description = '';
                    btn.dataset.itemName    = '';
                    btn.removeAttribute('data-itemname');
                }
                updateStats();
                closeSelector();
            });
            modalOptions.appendChild(clearBtn);

            items.forEach(item => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'option-item';
                btn.innerHTML = `
                    <span class="item-nombre">${item.name}</span>
                    ${item.weight ? `<span class="item-peso">Weight: ${item.weight}</span>` : ''}
                `;
                btn.addEventListener('click', () => {
                    const slotBtn = document.getElementById(slotActivo);
                    if (slotBtn) {
                        slotBtn.innerHTML = `
                            <span>${item.name}</span>
                        `;
                        slotBtn.dataset.itemId      = item.id;
                        slotBtn.dataset.weight      = item.weight || 0;
                        slotBtn.dataset.description = item.description || '';
                        slotBtn.dataset.itemName    = item.name;
                        slotBtn.setAttribute('data-itemname', item.name);
                        slotBtn.classList.add('equip-anim');
                        setTimeout(() => slotBtn.classList.remove('equip-anim'), 400);
                    }
                    updateStats();
                    closeSelector();
                });
                modalOptions.appendChild(btn);
            });

            // Search
            if (searchInput) {
                const handler = () => {
                    const query = searchInput.value.toLowerCase();
                    modalOptions.querySelectorAll('.option-item:not(.option-item--clear)').forEach(b => {
                        const name = b.querySelector('.item-nombre')?.textContent.toLowerCase() || '';
                        b.style.display = name.includes(query) ? '' : 'none';
                    });
                };
                searchInput._handler = handler;
                searchInput.addEventListener('input', handler);
                searchInput.focus();
            }

        } catch (e) {
            console.error(e);
            modalOptions.innerHTML = '<p style="color:red; text-align:center;">Error loading items.</p>';
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeSelector);
    Object.entries(equipSlots).forEach(([slotId, info]) => {
        const btn = document.getElementById(slotId);
        if (btn) btn.addEventListener('click', () => openSelector(slotId, `Select ${info.label}`, info.type));
    });

    // ─── SAVE & SHARE ────────────────────────────────────────────
    function getBuildData() {
        const buildNameInput = document.getElementById('build-name');
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        const statsData = {};
        stats.forEach((name, i) => { statsData[name] = Number(inputs[i].value); });

        const equipment = {};
        Object.keys(equipSlots).forEach(slotId => {
            const btn = document.getElementById(slotId);
            equipment[slotId] = {
                name:        btn ? (btn.dataset.itemName || '') : '',
                itemId:      btn ? btn.dataset.itemId      || '' : '',
                weight:      btn ? Number(btn.dataset.weight || 0) : 0,
                description: btn ? btn.dataset.description || '' : ''
            };
        });

        return {
            name:           buildNameInput ? buildNameInput.value : 'Unnamed',
            characterClass: classSelector  ? classSelector.value  : '',
            equipment,
            stats: statsData
        };
    }

    function loadBuildData(data) {
        const buildNameInput = document.getElementById('build-name');
        if (buildNameInput) buildNameInput.value = data.name || '';
        if (classSelector && data.characterClass) {
            classSelector.value = data.characterClass;
            applyClass(data.characterClass);
        }
        if (data.equipment) {
            Object.entries(data.equipment).forEach(([slotId, itemData]) => {
                const btn = document.getElementById(slotId);
                if (btn && itemData.name && itemData.name !== equipSlots[slotId]?.label) {
                    btn.textContent         = itemData.name;
                    btn.dataset.itemId      = itemData.itemId      || '';
                    btn.dataset.weight      = itemData.weight      || 0;
                    btn.dataset.description = itemData.description || '';
                    btn.dataset.itemName    = itemData.name        || '';
                    btn.setAttribute('data-itemname', itemData.name || '');
                }
            });
        }
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        stats.forEach((name, i) => {
            if (data.stats && data.stats[name] !== undefined) {
                inputs[i].value = data.stats[name];
                inputs[i].dispatchEvent(new Event('input'));
            }
        });
        updateStats();
    }

    // SAVE BUILD
    const saveBuildBtn = document.getElementById('save-build-btn');
    if (saveBuildBtn) {
        saveBuildBtn.addEventListener('click', async () => {
            const buildData = getBuildData();
            localStorage.setItem('tarnishedbook_build', JSON.stringify(buildData));

            if (auth.currentUser) {
                try {
                    await guardarBuildFirestore(buildData);
                    saveBuildBtn.textContent = '✓ Saved to cloud!';
                } catch (e) {
                    console.error(e);
                    saveBuildBtn.textContent = '✗ Save error';
                }
            } else {
                saveBuildBtn.textContent = '✓ Saved locally';
            }

            saveBuildBtn.style.color = 'gold';
            setTimeout(() => { saveBuildBtn.textContent = 'Save Build'; saveBuildBtn.style.color = ''; }, 2000);
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
                shareBuildBtn.textContent = '✓ Link copied!';
                shareBuildBtn.style.color = 'gold';
                setTimeout(() => { shareBuildBtn.textContent = 'Share Build'; shareBuildBtn.style.color = ''; }, 2000);
            }).catch(() => { prompt('Copy this link:', shareUrl); });
        });
    }

    // Load from URL
    const urlParams  = new URLSearchParams(window.location.search);
    const buildParam = urlParams.get('build');
    if (buildParam) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(buildParam))));
            loadBuildData(decoded);
        } catch (e) {
            console.warn('Invalid build link:', e);
        }
    }

    // ─── MY BUILDS ───────────────────────────────────────────────
    const misBuildBtn    = document.getElementById('mis-builds-btn');
    const misBuildModal  = document.getElementById('mis-builds-modal');
    const misBuildLista  = document.getElementById('mis-builds-lista');
    const closeMisBuilds = document.getElementById('close-mis-builds');

    function closeMisBuildModal() { cerrarModal(misBuildModal); }

    async function loadMyBuilds() {
        if (!misBuildLista) return;
        misBuildLista.innerHTML = '<p style="color:gold; text-align:center;">Loading...</p>';
        try {
            const builds = await obtenerMisBuilds();
            if (builds.length === 0) {
                misBuildLista.innerHTML = '<p style="color:#aaa; text-align:center;">You have no saved builds yet.</p>';
                return;
            }
            misBuildLista.innerHTML = '';
            builds.forEach(build => {
                const card = document.createElement('div');
                card.className = 'build-card';
                const level = calculateLevel(build.stats || {}, build.characterClass || 'Vagabond');
                card.innerHTML = `
                    <div class="build-card-info">
                        <span class="build-card-nombre">${build.name || 'Unnamed'}</span>
                        <span class="build-card-meta">${build.characterClass || ''} · LVL ${level}</span>
                    </div>
                    <div class="build-card-actions">
                        <button class="btn-cargar">Load</button>
                        <button class="btn-eliminar">Delete</button>
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
                        misBuildLista.innerHTML = '<p style="color:#aaa; text-align:center;">You have no saved builds yet.</p>';
                    }
                });
                misBuildLista.appendChild(card);
            });
        } catch (e) {
            console.error(e);
            misBuildLista.innerHTML = '<p style="color:red; text-align:center;">Error loading builds.</p>';
        }
    }

    if (misBuildBtn) {
        misBuildBtn.addEventListener('click', () => {
            loadMyBuilds();
            abrirModal(misBuildModal);
        });
    }

    if (closeMisBuilds) closeMisBuilds.addEventListener('click', closeMisBuildModal);

    // ─── AUTH ─────────────────────────────────────────────────────
    const loginBtn     = document.getElementById('login-btn');
    const logoutBtn    = document.getElementById('logout-btn');
    const loginSection = document.getElementById('login-section');
    const userSection  = document.getElementById('user-section');
    const userFoto     = document.getElementById('user-foto');
    const userName     = document.getElementById('user-nombre');

    onUsuarioCambia((user) => {
        if (user) {
            loginSection.style.display = 'none';
            userSection.style.display  = 'flex';
            userFoto.src               = user.photoURL;
            userName.textContent       = user.displayName;
            if (misBuildBtn) misBuildBtn.style.display = 'inline-flex';
        } else {
            loginSection.style.display = 'block';
            userSection.style.display  = 'none';
            if (misBuildBtn) misBuildBtn.style.display = 'none';
        }
    });

    if (loginBtn)  loginBtn.addEventListener('click',  loginConGoogle);
    if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);

    updateStats();
});