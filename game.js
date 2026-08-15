// ========== ДАННЫЕ ==========
const PLANTS = [
    { id: 'grass',    emoji: '🌱', cost: 30,   growTime: 10, reward: 8,  name: 'Трава', nameEn: 'Grass' },
    { id: 'bush',     emoji: '🌿', cost: 60,   growTime: 15, reward: 15, name: 'Куст', nameEn: 'Bush' },
    { id: 'flower',   emoji: '🌸', cost: 120,  growTime: 20, reward: 30, name: 'Цветок', nameEn: 'Flower' },
    { id: 'sunflower',emoji: '🌻', cost: 250,  growTime: 25, reward: 55, name: 'Подсолнух', nameEn: 'Sunflower' },
    { id: 'apple',    emoji: '🌳', cost: 500,  growTime: 30, reward: 100, name: 'Яблоня', nameEn: 'Apple Tree' },
    { id: 'grape',    emoji: '🍇', cost: 1000, growTime: 35, reward: 200, name: 'Виноград', nameEn: 'Grape' },
    { id: 'orange',   emoji: '🍊', cost: 2000, growTime: 40, reward: 380, name: 'Апельсин', nameEn: 'Orange' },
    { id: 'rose',     emoji: '🌺', cost: 4000, growTime: 45, reward: 700, name: 'Роза', nameEn: 'Rose' },
    { id: 'mushroom', emoji: '🍄', cost: 7000, growTime: 50, reward: 1200, name: 'Гриб', nameEn: 'Mushroom' },
    { id: 'golden',   emoji: '🌟', cost: 10000, growTime: 55, reward: 2000, name: 'Золотое', nameEn: 'Golden' }
];

// ========== СОСТОЯНИЕ ==========
let state = {
    coins: 0,
    plants: [], // { plantId, plantedAt, growing, plantIndex }
    selectedPlant: null,
    lang: 'ru' // 'ru' или 'en'
};

// ========== DOM ==========
const coinDisplay = document.getElementById('coinDisplay');
const coinValue = coinDisplay.querySelector('.coin-value');
const gardenArea = document.getElementById('gardenArea');
const ground = document.getElementById('ground');
const floatContainer = document.getElementById('floatText');
const shop = document.getElementById('shop');
const langBtn = document.getElementById('langBtn');

// ========== ЗАГРУЗКА ==========
function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem('gardenGame'));
        if (saved) {
            state.coins = saved.coins || 0;
            state.plants = saved.plants || [];
            state.lang = saved.lang || 'ru';
            // Пересчёт времени
            state.plants.forEach(p => {
                if (p.growing) {
                    const plant = PLANTS[p.plantIndex];
                    const elapsed = (Date.now() - p.plantedAt) / 1000;
                    if (elapsed >= plant.growTime) p.growing = false;
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
function render() {
    renderGarden();
    renderShop();
    updateCoins();
    updateLangBtn();
}

// ===== ГРЯДКА =====
function renderGarden() {
    if (state.plants.length === 0) {
        gardenArea.innerHTML = `<div class="garden-area-empty">🌱 Посади своё первое растение!</div>`;
        return;
    }

    gardenArea.innerHTML = '';
    state.plants.forEach((p, index) => {
        const plant = PLANTS[p.plantIndex];
        const div = document.createElement('div');
        div.className = 'garden-plant';

        const emoji = document.createElement('span');
        emoji.className = 'plant-emoji';
        emoji.textContent = plant.emoji;
        div.appendChild(emoji);

        // Таймер или кнопка сбора
        if (p.growing) {
            const elapsed = (Date.now() - p.plantedAt) / 1000;
            const remaining = Math.max(0, plant.growTime - elapsed);
            const timer = document.createElement('span');
            timer.className = 'plant-timer';
            timer.textContent = formatTime(remaining);
            timer.dataset.index = index;
            div.appendChild(timer);
        } else {
            const ready = document.createElement('span');
            ready.className = 'plant-ready';
            ready.textContent = state.lang === 'ru' ? '✅ Собрать!' : '✅ Harvest!';
            div.appendChild(ready);
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => harvestPlant(index));
        }

        // Название
        const name = document.createElement('span');
        name.className = 'plant-name-label';
        name.textContent = state.lang === 'ru' ? plant.name : plant.nameEn;
        div.appendChild(name);

        gardenArea.appendChild(div);
    });
}

// ===== МОНЕТКИ =====
function updateCoins() {
    coinValue.textContent = state.coins.toFixed(1);
    saveState();
}

// ===== ФОРМАТ ВРЕМЕНИ =====
function formatTime(seconds) {
    if (seconds < 60) return Math.ceil(seconds) + 's';
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return mins + 'm ' + secs + 's';
}

// ===== КЛИК ПО КНОПКЕ =====
ground.addEventListener('click', (e) => {
    const earned = 0.3;
    state.coins += earned;
    updateCoins();
    showFloatingText('+' + earned.toFixed(1) + ' 🪙', e);
    // Вибрация
    if (navigator.vibrate) navigator.vibrate(10);
});

// ===== ВСПЛЫВАЮЩИЙ ТЕКСТ =====
function showFloatingText(text, event) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.textContent = text;
    const rect = floatContainer.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    el.style.left = Math.min(85, Math.max(15, x)) + '%';
    el.style.top = Math.min(80, Math.max(10, y)) + '%';
    floatContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// ===== ПОСАДКА =====
function plantSeed() {
    if (state.selectedPlant === null) {
        showFloatingText('👆 Выбери семечко!', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
        return;
    }
    const plant = PLANTS[state.selectedPlant];
    if (!plant) return;
    if (state.coins < plant.cost) {
        showFloatingText('❌ Нужно ' + plant.cost + '🪙', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
        return;
    }

    state.coins -= plant.cost;
    state.plants.push({
        plantIndex: state.selectedPlant,
        plantedAt: Date.now(),
        growing: true
    });

    state.selectedPlant = null;
    updateCoins();
    render();
    showFloatingText('🌱 ' + (state.lang === 'ru' ? 'Посажено!' : 'Planted!'), { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    if (navigator.vibrate) navigator.vibrate(20);
}

// ===== СБОР =====
function harvestPlant(index) {
    const p = state.plants[index];
    if (!p || p.growing) return;
    const plant = PLANTS[p.plantIndex];
    state.coins += plant.reward;
    state.plants.splice(index, 1);
    updateCoins();
    render();
    showFloatingText('🎉 +' + plant.reward + '🪙', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    if (navigator.vibrate) navigator.vibrate(30);
}

// ===== МАГАЗИН =====
function renderShop() {
    shop.innerHTML = '';
    PLANTS.forEach((plant, idx) => {
        const btn = document.createElement('button');
        btn.className = 'shop-btn';
        if (state.selectedPlant === idx) btn.classList.add('selected');
        if (state.coins < plant.cost) btn.disabled = true;

        const nameDisplay = state.lang === 'ru' ? plant.name : plant.nameEn;
        const nameEnDisplay = state.lang === 'ru' ? plant.nameEn : '';

        btn.innerHTML = `
            <span class="shop-left">
                <span class="shop-emoji">${plant.emoji}</span>
                <span>
                    <span class="shop-name">${nameDisplay}</span>
                    ${nameEnDisplay ? `<span class="shop-name-en">${nameEnDisplay}</span>` : ''}
                </span>
            </span>
            <span class="shop-cost">${plant.cost}🪙</span>
        `;

        btn.addEventListener('click', () => {
            if (state.coins < plant.cost) {
                showFloatingText('❌ Нужно ' + plant.cost + '🪙', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
                return;
            }
            if (state.selectedPlant === idx) {
                state.selectedPlant = null;
            } else {
                state.selectedPlant = idx;
                // Автоматически сажаем
                plantSeed();
                return;
            }
            render();
        });

        shop.appendChild(btn);
    });
}

// ===== ОБНОВЛЕНИЕ ТАЙМЕРОВ =====
setInterval(() => {
    let needRender = false;
    state.plants.forEach((p, index) => {
        if (p.growing) {
            const plant = PLANTS[p.plantIndex];
            const elapsed = (Date.now() - p.plantedAt) / 1000;
            if (elapsed >= plant.growTime) {
                p.growing = false;
                needRender = true;
            }
        }
    });
    if (needRender) render();
    else {
        // Обновляем таймеры на лету
        document.querySelectorAll('.plant-timer').forEach(el => {
            const index = parseInt(el.dataset.index);
            const p = state.plants[index];
            if (p && p.growing) {
                const plant = PLANTS[p.plantIndex];
                const elapsed = (Date.now() - p.plantedAt) / 1000;
                const remaining = Math.max(0, plant.growTime - elapsed);
                el.textContent = formatTime(remaining);
            }
        });
    }
    saveState();
}, 500);

// ===== ЯЗЫК =====
function updateLangBtn() {
    langBtn.textContent = state.lang === 'ru' ? '🇬🇧 EN' : '🇷🇺 RU';
}

langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'en' : 'ru';
    saveState();
    render();
});

// ===== ЗАПУСК =====
render();
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}