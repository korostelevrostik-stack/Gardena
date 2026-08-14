// ========== 10 РАСТЕНИЙ ==========
const PLANTS = [
    { id: 'grass',    emoji: '🌱', cost: 30,   growTime: 8,  reward: 8,  name: 'Трава' },
    { id: 'bush',     emoji: '🌿', cost: 60,   growTime: 12, reward: 15, name: 'Куст' },
    { id: 'flower',   emoji: '🌸', cost: 120,  growTime: 16, reward: 30, name: 'Цветок' },
    { id: 'sunflower',emoji: '🌻', cost: 250,  growTime: 20, reward: 55, name: 'Подсолнух' },
    { id: 'apple',    emoji: '🌳', cost: 500,  growTime: 25, reward: 100, name: 'Яблоня' },
    { id: 'grape',    emoji: '🍇', cost: 1000, growTime: 30, reward: 200, name: 'Виноград' },
    { id: 'orange',   emoji: '🍊', cost: 2000, growTime: 35, reward: 380, name: 'Апельсин' },
    { id: 'rose',     emoji: '🌺', cost: 4000, growTime: 40, reward: 700, name: 'Роза' },
    { id: 'mushroom', emoji: '🍄', cost: 7000, growTime: 45, reward: 1200, name: 'Гриб' },
    { id: 'golden',   emoji: '🌟', cost: 10000, growTime: 50, reward: 2000, name: 'Золотое' }
];

// ========== СОСТОЯНИЕ ==========
let state = {
    coins: 0,
    cells: Array(16).fill(null),
    selectedPlant: null
};

// ========== DOM ==========
const coinDisplay = document.getElementById('coinDisplay');
const coinValue = coinDisplay.querySelector('.coin-value');
const grid = document.getElementById('gardenGrid');
const ground = document.getElementById('ground');
const floatContainer = document.getElementById('floatText');
const shop = document.getElementById('shop');
const closeBtn = document.getElementById('closeBtn');

// ========== ЗАГРУЗКА ==========
function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem('gardenGame'));
        if (saved) {
            state.coins = saved.coins || 0;
            state.cells = saved.cells || Array(16).fill(null);
            state.cells.forEach((cell, i) => {
                if (cell && cell.growing) {
                    const plant = PLANTS[cell.plantIndex];
                    const elapsed = (Date.now() - cell.plantedAt) / 1000;
                    if (elapsed >= plant.growTime) cell.growing = false;
                }
            });
        }
    } catch(e) {}
}
loadState();

function saveState() {
    localStorage.setItem('gardenGame', JSON.stringify(state));
}

// ========== ОТРИСОВКА ГРЯДКИ С КРУГОВЫМ ТАЙМЕРОМ ==========
function renderGrid() {
    grid.innerHTML = '';
    state.cells.forEach((cell, index) => {
        const div = document.createElement('div');
        div.className = 'cell' + (cell ? '' : ' empty');
        div.dataset.index = index;

        if (cell) {
            const plant = PLANTS[cell.plantIndex];
            const emoji = document.createElement('span');
            emoji.className = 'plant-emoji';
            emoji.textContent = plant.emoji;
            div.appendChild(emoji);

            if (cell.growing) {
                // Рисуем круговой прогресс
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('class', 'progress-ring');
                svg.setAttribute('viewBox', '0 0 100 100');
                
                const radius = 42;
                const circumference = 2 * Math.PI * radius;
                
                const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                bg.setAttribute('class', 'bg');
                bg.setAttribute('cx', '50');
                bg.setAttribute('cy', '50');
                bg.setAttribute('r', radius);
                
                const bar = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                bar.setAttribute('class', 'bar');
                bar.setAttribute('cx', '50');
                bar.setAttribute('cy', '50');
                bar.setAttribute('r', radius);
                bar.setAttribute('stroke-dasharray', circumference);
                
                const elapsed = (Date.now() - cell.plantedAt) / 1000;
                const progress = Math.min(1, elapsed / plant.growTime);
                const offset = circumference * (1 - progress);
                bar.setAttribute('stroke-dashoffset', offset);
                
                svg.appendChild(bg);
                svg.appendChild(bar);
                div.appendChild(svg);
            } else {
                div.classList.add('ready');
                div.style.cursor = 'pointer';
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    harvestPlant(index);
                });
            }
        } else {
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                plantSeed(index);
            });
        }
        grid.appendChild(div);
    });
    updateCoins();
    renderShop();
}

// ========== МОНЕТКИ С АНИМАЦИЕЙ ==========
function updateCoins() {
    const current = parseFloat(coinValue.textContent) || 0;
    const target = state.coins;
    
    // Анимируем изменение счёта
    if (Math.abs(current - target) > 0.01) {
        coinValue.textContent = target.toFixed(1);
    } else {
        coinValue.textContent = target.toFixed(1);
    }
    
    // Анимация монетки при изменении
    const icon = coinDisplay.querySelector('.coin-icon');
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => { icon.style.transform = 'scale(1)'; }, 150);
    
    saveState();
}

// ========== 3D КЛИК ==========
ground.addEventListener('click', (e) => {
    const earned = 0.3;
    state.coins += earned;
    updateCoins();
    showFloatingText('+0.3 🪙', e);
});

// ========== ВСПЛЫВАЮЩИЕ МОНЕТКИ ==========
function showFloatingText(text, eventOrElement) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.textContent = text;
    
    if (eventOrElement && eventOrElement.clientX) {
        const rect = floatContainer.getBoundingClientRect();
        const x = ((eventOrElement.clientX - rect.left) / rect.width) * 100;
        const y = ((eventOrElement.clientY - rect.top) / rect.height) * 100;
        el.style.left = Math.min(85, Math.max(15, x)) + '%';
        el.style.top = Math.min(80, Math.max(10, y)) + '%';
    } else {
        el.style.left = (20 + Math.random() * 60) + '%';
        el.style.top = (20 + Math.random() * 40) + '%';
    }
    
    floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// ========== ПОСАДКА ==========
function plantSeed(index) {
    if (state.selectedPlant === null) {
        showFloatingText('👆 Выбери растение!', ground);
        return;
    }
    const plant = PLANTS[state.selectedPlant];
    if (!plant) return;
    if (state.coins < plant.cost) {
        showFloatingText('❌ Нужно ' + plant.cost + '🪙', ground);
        return;
    }
    if (state.cells[index] !== null) {
        showFloatingText('❌ Занято!', grid.children[index]);
        return;
    }
    state.coins -= plant.cost;
    state.cells[index] = {
        plantIndex: state.selectedPlant,
        plantedAt: Date.now(),
        growing: true
    };
    updateCoins();
    renderGrid();
    state.selectedPlant = null;
    document.querySelectorAll('.shop-btn').forEach(b => b.classList.remove('selected'));
    showFloatingText('🌱 ' + plant.name + ' посажено!', ground);
}

// ========== СБОР ==========
function harvestPlant(index) {
    const cell = state.cells[index];
    if (!cell || cell.growing) return;
    const plant = PLANTS[cell.plantIndex];
    state.coins += plant.reward;
    state.cells[index] = null;
    updateCoins();
    renderGrid();
    showFloatingText('🎉 +' + plant.reward + '🪙', grid);
}

// ========== МАГАЗИН ==========
function renderShop() {
    shop.innerHTML = '';
    PLANTS.forEach((plant, idx) => {
        const btn = document.createElement('button');
        btn.className = 'shop-btn';
        if (state.selectedPlant === idx) btn.classList.add('selected');
        if (state.coins < plant.cost) btn.disabled = true;

        btn.innerHTML = `
            <span class="shop-left">
                <span class="shop-emoji">${plant.emoji}</span>
                <span class="shop-name">${plant.name}</span>
            </span>
            <span class="shop-cost">${plant.cost}🪙</span>
        `;

        btn.addEventListener('click', () => {
            if (state.coins < plant.cost) {
                showFloatingText('❌ Нужно ' + plant.cost + '🪙', ground);
                return;
            }
            state.selectedPlant = (state.selectedPlant === idx) ? null : idx;
            renderShop();
            renderGrid();
            if (state.selectedPlant !== null) {
                showFloatingText('✅ ' + plant.name + ' выбран!', ground);
            }
        });
        shop.appendChild(btn);
    });
}

// ========== ОБНОВЛЕНИЕ ТАЙМЕРОВ (КАЖДУЮ СЕКУНДУ) ==========
setInterval(() => {
    let needRender = false;
    state.cells.forEach((cell, index) => {
        if (cell && cell.growing) {
            const plant = PLANTS[cell.plantIndex];
            const elapsed = (Date.now() - cell.plantedAt) / 1000;
            if (elapsed >= plant.growTime) {
                cell.growing = false;
                needRender = true;
            }
        }
    });
    if (needRender) renderGrid();
    else {
        // Обновляем только прогресс-бары без перерисовки
        document.querySelectorAll('.cell .progress-ring .bar').forEach((bar, idx) => {
            const cellData = state.cells[idx];
            if (cellData && cellData.growing) {
                const plant = PLANTS[cellData.plantIndex];
                const elapsed = (Date.now() - cellData.plantedAt) / 1000;
                const progress = Math.min(1, elapsed / plant.growTime);
                const radius = 42;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference * (1 - progress);
                bar.setAttribute('stroke-dashoffset', offset);
            }
        });
    }
    saveState();
}, 300); // Обновляем каждые 300мс для плавности

// ========== ЗАКРЫТЬ ==========
closeBtn.addEventListener('click', () => {
    if (window.Telegram && Telegram.WebApp) Telegram.WebApp.close();
});

// ========== СТАРТ ==========
renderGrid();
renderShop();
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}