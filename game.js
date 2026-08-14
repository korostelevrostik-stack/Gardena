// ========== 10 РАСТЕНИЙ ОТ 30 ДО 10000 ==========
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
    cells: Array(16).fill(null), // null или { plantIndex, plantedAt, growing }
    selectedPlant: null // индекс в PLANTS
};

// ========== DOM ==========
const coinDisplay = document.getElementById('coinDisplay');
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
            // Пересчёт для растущих
            state.cells.forEach((cell, i) => {
                if (cell && cell.growing) {
                    const plant = PLANTS[cell.plantIndex];
                    const elapsed = (Date.now() - cell.plantedAt) / 1000;
                    if (elapsed >= plant.growTime) {
                        cell.growing = false;
                    }
                }
            });
        }
    } catch(e) {}
}
loadState();

function saveState() {
    localStorage.setItem('gardenGame', JSON.stringify(state));
}

// ========== ОТРИСОВКА ==========
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
                const elapsed = (Date.now() - cell.plantedAt) / 1000;
                const remaining = Math.max(0, plant.growTime - elapsed);
                const timer = document.createElement('span');
                timer.className = 'grow-timer';
                timer.textContent = Math.ceil(remaining) + 's';
                div.appendChild(timer);
            } else {
                // Созревший — кликаем для сбора
                div.style.cursor = 'pointer';
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    harvestPlant(index);
                });
                // Добавим блеск
                div.style.boxShadow = 'inset 0 0 20px rgba(255,215,0,0.2)';
            }
        } else {
            // Пустая ячейка — посадка
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

// ========== МОНЕТКИ ==========
function updateCoins() {
    coinDisplay.textContent = state.coins.toFixed(1);
    saveState();
}

// ========== КЛИК ПО ЗЕМЛЕ ==========
ground.addEventListener('click', (e) => {
    const earned = 0.3;
    state.coins += earned;
    updateCoins();
    showFloatingText('+' + earned.toFixed(1), e);
});

// ========== ВСПЛЫВАЮЩИЙ ТЕКСТ ==========
function showFloatingText(text, eventOrElement) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.textContent = text;

    let rect;
    if (eventOrElement && eventOrElement.clientX) {
        // Это событие мыши
        const containerRect = floatContainer.getBoundingClientRect();
        const x = ((eventOrElement.clientX - containerRect.left) / containerRect.width) * 100;
        const y = ((eventOrElement.clientY - containerRect.top) / containerRect.height) * 100;
        el.style.left = Math.min(85, Math.max(15, x)) + '%';
        el.style.top = Math.min(80, Math.max(10, y)) + '%';
    } else {
        el.style.left = (20 + Math.random() * 60) + '%';
        el.style.top = (20 + Math.random() * 40) + '%';
    }

    floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// ========== ПОСАДКА ==========
function plantSeed(index) {
    if (state.selectedPlant === null) {
        showFloatingText('👆 Выбери растение в магазине!', ground);
        return;
    }

    const plant = PLANTS[state.selectedPlant];
    if (!plant) return;

    if (state.coins < plant.cost) {
        showFloatingText('❌ Не хватает! Нужно ' + plant.cost + '🪙', ground);
        return;
    }

    if (state.cells[index] !== null) {
        showFloatingText('❌ Ячейка занята!', grid.children[index]);
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
    // Снимаем выделение после посадки
    state.selectedPlant = null;
    document.querySelectorAll('.shop-btn').forEach(b => b.classList.remove('selected'));
    showFloatingText('🌱 ' + plant.name + ' посажено!', ground);
}

// ========== СБОР УРОЖАЯ ==========
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
            <span class="plant-emoji">${plant.emoji}</span>
            <span class="plant-name">${plant.name}</span>
            <span class="cost">${plant.cost}🪙</span>
        `;

        btn.addEventListener('click', () => {
            if (state.coins < plant.cost) {
                showFloatingText('❌ Нужно ' + plant.cost + '🪙', ground);
                return;
            }
            // Выбираем/снимаем выбор
            if (state.selectedPlant === idx) {
                state.selectedPlant = null;
            } else {
                state.selectedPlant = idx;
            }
            renderShop();
            renderGrid();
            if (state.selectedPlant !== null) {
                showFloatingText('✅ ' + plant.name + ' выбран! Тапни по грядке.', ground);
            }
        });

        shop.appendChild(btn);
    });
}

// ========== ОБНОВЛЕНИЕ ТАЙМЕРОВ ==========
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
        document.querySelectorAll('.cell .grow-timer').forEach((timerEl, idx) => {
            const cellData = state.cells[idx];
            if (cellData && cellData.growing) {
                const plant = PLANTS[cellData.plantIndex];
                const elapsed = (Date.now() - cellData.plantedAt) / 1000;
                const remaining = Math.max(0, plant.growTime - elapsed);
                timerEl.textContent = Math.ceil(remaining) + 's';
            }
        });
    }
    saveState();
}, 1000);

// ========== ЗАКРЫТЬ ==========
closeBtn.addEventListener('click', () => {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.close();
    }
});

// ========== ЗАПУСК ==========
renderGrid();
renderShop();

if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
                                 }
