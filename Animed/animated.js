document.addEventListener('DOMContentLoaded', async () => {
    // Configuración de Firebase (reemplaza con tus valores reales)
    const firebaseConfig = {
        apiKey: "TU_API_KEY",
        authDomain: "TU_PROYECTO.firebaseapp.com",
        projectId: "TU_PROYECTO",
        storageBucket: "TU_PROYECTO.appspot.com",
        messagingSenderId: "123456789",
        appId: "TU_APP_ID"
    };

    // Inicializar Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const statsCard = document.getElementById('stats-card');
    const container = document.querySelector('.container');

    if (!statsCard || !container) return;

    const statColors = {
        'vigor': { dark: '#500a0a', light: '#ff4d4d' },
        'mente': { dark: '#0a1a50', light: '#4d79ff' },
        'resistencia': { dark: '#0a500a', light: '#4dff4d' },
        'fuerza': { dark: '#4b3621', light: '#d2b48c' },
        'destreza': { dark: '#50500a', light: '#ffff4d' },
        'inteligencia': { dark: '#2b0a50', light: '#a64dff' },
        'fe': { dark: '#503c0a', light: '#ffd700' },
        'arcano': { dark: '#300000', light: '#800000' }
    };

    const classStats = {
        'Vagabundo': { vigor: 12, mente: 10, resistencia: 11, fuerza: 13, destreza: 14, inteligencia: 9, fe: 9, arcano: 7 },
        'Héroe': { vigor: 14, mente: 8, resistencia: 12, fuerza: 16, destreza: 9, inteligencia: 7, fe: 8, arcano: 11 },
        'Confesor': { vigor: 10, mente: 14, resistencia: 10, fuerza: 12, destreza: 9, inteligencia: 11, fe: 16, arcano: 7 },
        'Astrólogo': { vigor: 9, mente: 15, resistencia: 9, fuerza: 8, destreza: 12, inteligencia: 16, fe: 7, arcano: 8 },
        'Samurái': { vigor: 10, mente: 12, resistencia: 11, fuerza: 12, destreza: 15, inteligencia: 9, fe: 8, arcano: 7 },
        'Bandido': { vigor: 10, mente: 11, resistencia: 10, fuerza: 9, destreza: 13, inteligencia: 10, fe: 8, arcano: 14 },
        'Prisionero': { vigor: 9, mente: 13, resistencia: 9, fuerza: 10, destreza: 14, inteligencia: 14, fe: 6, arcano: 9 }
    };

    const selectorData = {
        armas: [],
        armaduras: [],
        talismans: []
    };

    // Función para cargar datos desde Firestore
    async function loadSelectorData() {
        try {
            const armasSnapshot = await db.collection('armas').get();
            selectorData.armas = armasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const armadurasSnapshot = await db.collection('armaduras').get();
            selectorData.armaduras = armadurasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const talismansSnapshot = await db.collection('talismans').get();
            selectorData.talismans = talismansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    }

    // Cargar datos antes de continuar
    await loadSelectorData();

    const stats = ['Vigor', 'Mente', 'Resistencia', 'Fuerza', 'Destreza', 'Inteligencia', 'Fe', 'Arcano'];

    statsCard.innerHTML = '<h2>Stats</h2>';
    const statContainer = document.createElement('div');
    statContainer.className = 'stat-container';
    statsCard.appendChild(statContainer);

    const buildSummary = document.createElement('div');
    buildSummary.className = 'build-summary';
    buildSummary.style.color = 'gold';
    statsCard.appendChild(buildSummary);

    const statRanges = {};

    function updateBuildSummary() {
        const inputs = statContainer.querySelectorAll('input[type="range"]');
        let total = 0;
        inputs.forEach(input => total += Number(input.value));
        buildSummary.textContent = `NVL: ${total}`;
        const porcentajePoder = Math.min(total / 800, 1);
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
        statRanges[name.toLowerCase()] = range;

        row.appendChild(label);
        row.appendChild(range);
        row.appendChild(valSpan);
        statContainer.appendChild(row);
        update();
    });

    const classSelector = document.getElementById('class-selector');

    function applyClassStats(className) {
        const defaults = classStats[className];
        if (!defaults) return;
        Object.entries(defaults).forEach(([stat, value]) => {
            const range = statRanges[stat];
            if (!range) return;
            range.value = value;
            range.dispatchEvent(new Event('input'));
        });
    }

    if (classSelector) {
        classSelector.addEventListener('change', () => applyClassStats(classSelector.value));
        applyClassStats(classSelector.value || 'Vagabundo');
    }

    const buildNameInput = document.getElementById('build-name');
    const inputWrapper = document.querySelector('.input-wrapper');

    function updateBuildNameLabel() {
        if (!buildNameInput || !inputWrapper) return;
        const hasValue = buildNameInput.value.trim().length > 0;
        if (hasValue || document.activeElement === buildNameInput) {
            inputWrapper.classList.add('filled');
        } else {
            inputWrapper.classList.remove('filled');
        }
    }

    if (buildNameInput) {
        buildNameInput.addEventListener('input', updateBuildNameLabel);
        buildNameInput.addEventListener('focus', updateBuildNameLabel);
        buildNameInput.addEventListener('blur', updateBuildNameLabel);
        updateBuildNameLabel();
    }

    const armasBtn = document.getElementById('armas-btn');
    const armadurasBtn = document.getElementById('armaduras-btn');
    const talismansBtn = document.getElementById('talismans-btn');
    const selectorModal = document.getElementById('selector-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalOptions = document.getElementById('modal-options');
    const closeModalBtn = document.getElementById('close-modal');

    const selectedItems = {
        armas: null,
        armaduras: null,
        talismans: null
    };

    function closeSelector() {
        if (!selectorModal) return;
        if (typeof selectorModal.close === 'function') {
            selectorModal.close();
        } else {
            selectorModal.style.display = 'none';
        }
    }

    function openSelector(type, title, options) {
        if (!selectorModal || !modalTitle || !modalOptions) return;
        modalTitle.textContent = title;
        modalOptions.innerHTML = '';

        options.forEach(option => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'option-item';
            item.textContent = option.nombre;
            if (option.imagen) {
                const img = document.createElement('img');
                img.src = option.imagen;
                img.style.width = '50px';
                img.style.height = '50px';
                item.appendChild(img);
            }
            item.addEventListener('click', () => {
                selectedItems[type] = option;
                if (selectedButtons[type]) {
                    selectedButtons[type].textContent = `${title}: ${option.nombre}`;
                }
                closeSelector();
                // Aquí podrías llamar a calculateFinalStats() si ya lo tienes
            });
            modalOptions.appendChild(item);
        });

        if (typeof selectorModal.showModal === 'function') {
            selectorModal.showModal();
        } else {
            selectorModal.style.display = 'block';
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeSelector);
    }

    if (selectorModal) {
        selectorModal.addEventListener('click', event => {
            if (event.target === selectorModal) {
                closeSelector();
            }
        });
    }

    if (armasBtn) {
        armasBtn.addEventListener('click', () => openSelector('armas', 'Seleccionar arma', selectorData.armas));
    }
    if (armadurasBtn) {
        armadurasBtn.addEventListener('click', () => openSelector('armaduras', 'Seleccionar armadura', selectorData.armaduras));
    }
    if (talismansBtn) {
        talismansBtn.addEventListener('click', () => openSelector('talismans', 'Seleccionar talismán', selectorData.talismans));
    }
});