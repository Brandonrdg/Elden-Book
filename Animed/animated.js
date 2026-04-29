document.addEventListener('DOMContentLoaded', () => {
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



    const stats = ['Vigor', 'Mente', 'Resistencia', 'Fuerza', 'Destreza', 'Inteligencia', 'Fe', 'Arcano'];

    statsCard.innerHTML = '<h2>Stats</h2>';
    const statContainer = document.createElement('div');
    statContainer.className = 'stat-container';
    statsCard.appendChild(statContainer);

    const buildSummary = document.createElement('div');
    buildSummary.className = 'build-summary';
    buildSummary.style.color = 'gold';
    statsCard.appendChild(buildSummary);

    // Actualiza el nivel total y el brillo del contenedor
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
            
            // Color de la barra
            range.style.background = `linear-gradient(90deg, ${colors.dark} 0%, ${colors.light} ${pct}%, #111 ${pct}%)`;
            
            // Actualizar número y su variable de brillo
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

    // Lógica de selección de equipamiento
    const armasBtn = document.getElementById('armas-btn');
    const armadurasBtn = document.getElementById('armaduras-btn');
    const talismansBtn = document.getElementById('talismans-btn');
    const selectorModal = document.getElementById('selector-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalOptions = document.getElementById('modal-options');
    const closeModalBtn = document.getElementById('close-modal');

    const selectorData = {
        armas: ['Espada Larga', 'Martillo de Guerra', 'Arco Largo', 'Daga', 'Lanza'],
        armaduras: ['Armadura de Hierro', 'Manto de Seda', 'Coraza del Caballero', 'Cota Ligera', 'Peto Antiguo'],
        talismans: ['Talisman de Fuerza', 'Talisman de Resistencia', 'Talisman de Mente', 'Talisman del Dragón', 'Talisman del Espíritu']
    };

    const selectedButtons = {
        armas: armasBtn,
        armaduras: armadurasBtn,
        talismans: talismansBtn
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

        options.forEach(optionText => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'option-item';
            item.textContent = optionText;
            item.addEventListener('click', () => {
                if (selectedButtons[type]) {
                    selectedButtons[type].textContent = `${title}: ${optionText}`;
                }
                closeSelector();
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