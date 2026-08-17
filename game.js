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

// ========== ЗВУКИ ==========
const SoundFX = {
    ctx: null,
    
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.log('Web Audio не поддерживается');
        }
    },
    
    playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.value = volume;
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    },
    
    click() {
        this.playTone(800, 0.08, 'sine', 0.25);
        setTimeout(() => this.playTone(1000, 0.06, 'sine', 0.15), 50);
    },
    
    plant() {
        this.playTone(600, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(400, 0.15, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(200, 0.2, 'sine', 0.15), 200);
    },
    
    harvest() {
        this.playTone(500, 0.1, 'sine', 0.25);
        setTimeout(() => this.playTone(700, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(900, 0.15, 'sine', 0.2), 200);
        setTimeout(() => this.playTone(1100, 0.2, 'sine', 0.25), 300);
    },
    
    victory() {
        [0, 100, 200, 300, 400].forEach((delay, i) => {
            setTimeout(() => {
                this.playTone(600 + i * 80, 0.15, 'square', 0.15);
            }, delay);
        });
        setTimeout(() => {
            [0, 100, 200].forEach((delay, i) => {
                setTimeout(() => {
                    this.playTone(900 + i * 100, 0.2, 'square', 0.15);
                }, delay);
            });
        }, 500);
    },
    
    dailyBonus() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 200);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.25), 300);
        setTimeout(() => this.playTone(1000, 0.2, 'sine', 0.3), 400);
    },
    
    error() {
        this.playTone(300, 0.2, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(250, 0.2, 'sawtooth', 0.12), 150);
    }
};

let soundInitialized = false;
function initSound() {
    if (!soundInitialized) {
        SoundFX.init();
        soundInitialized = true;
    }
}

// ========== ЕЖЕДНЕВНЫЙ БОНУС ==========
const DAILY_BONUS = {
    min: 5,
    max: 25,
    lastClaim: null,
    streak: 0
};

function loadDailyBonus() {
    try {
        const saved = JSON.parse(localStorage.getItem('gardenDailyBonus'));
        if (saved) {
            DAILY_BONUS.lastClaim = saved.lastClaim;
            DAILY_BONUS.streak = saved.streak || 0;
        }
    } catch(e) {}
}
loadDailyBonus();

function saveDailyBonus() {
    try {
        localStorage.setItem('gardenDailyBonus', JSON.stringify({
            lastClaim: DAILY_BONUS.lastClaim,
            streak: DAILY_BONUS.streak
        }));
    } catch(e) {}
}

function canClaimDailyBonus() {
    if (!DAILY_BONUS.lastClaim) return true;
    const now = Date.now();
    const last = new Date(DAILY_BONUS.lastClaim);
    const today = new Date(now);
    return last.getDate() !== today.getDate() || 
           last.getMonth() !== today.getMonth() || 
           last.getFullYear() !== today.getFullYear();
}

function getDailyBonusAmount() {
    const base = 5 + DAILY_BONUS.streak * 2;
    return Math.min(base, 50);
}

function claimDailyBonus() {
    if (!canClaimDailyBonus()) {
        showFloatingText('⏳ Уже получено! Завтра будет новый бонус.', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
        return;
    }
    
    const amount = getDailyBonusAmount();
    state.coins += amount;
    DAILY_BONUS.lastClaim = Date.now();
    DAILY_BONUS.streak++;
    saveDailyBonus();
    updateCoins();
    SoundFX.dailyBonus();
    showFloatingText('🎁 +' + amount + ' 🪙 (Стрик: ' + DAILY_BONUS.streak + ')', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    updateDailyBonusUI();
}

function updateDailyBonusUI() {
    const btn = document.getElementById('dailyBonusBtn');
    if (!btn) return;
    if (canClaimDailyBonus()) {
        btn.innerHTML = `🎁 Ежедневный бонус (+${getDailyBonusAmount()}🪙)`;
        btn.disabled = false;
        btn.style.opacity = '1';
    } else {
        btn.innerHTML = `⏳ Бонус уже получен`;
        btn.disabled = true;
        btn.style.opacity = '0.5';
    }
}

// ========== СОСТОЯНИЕ ==========
let state = {
    coins: 0,
    plants: [],
    selectedPlant: null,
    lang: 'ru'
};

// ========== DOM ==========
const coinDisplay = document.getElementById('coinDisplay');
const coinValue = coinDisplay.querySelector('.coin-value');
const gardenArea = document.getElementById('gardenArea');
const ground = document.getElementById('ground');
const floatContainer = document.getElementById('floatText');
const shop = document.getElementById('shop');
const shopOverlay = document.getElementById('shopOverlay');
const miniGame = document.getElementById('miniGame');
const levelDisplay = document.getElementById('levelDisplay');
const langBtn = document.getElementById('langBtn');
const miniGameBtn = document.getElementById('miniGameBtn');
const shopBtn = document.getElementById('shopBtn');
const closeGame = document.getElementById('closeGame');
const closeShop = document.getElementById('closeShop');

// ========== ЗАГРУЗКА ==========
function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem('gardenGame'));
        if (saved) {
            state.coins = saved.coins || 0;
            state.plants = saved.plants || [];
            state.lang = saved.lang || 'ru';
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
    checkAutoPurchase();
}

// ===== АВТОПОКУПКА =====
function checkAutoPurchase() {
    if (state.selectedPlant !== null) {
        const plant = PLANTS[state.selectedPlant];
        if (plant && state.coins >= plant.cost) {
            buyPlant();
        }
    }
}

// ===== ФОРМАТ ВРЕМЕНИ =====
function formatTime(seconds) {
    if (seconds < 60) return Math.ceil(seconds) + 's';
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return mins + 'm ' + secs + 's';
}

// ===== КЛИК =====
ground.addEventListener('click', (e) => {
    initSound();
    SoundFX.click();
    
    const earned = 0.3;
    state.coins += earned;
    updateCoins();
    showFloatingText('+' + earned.toFixed(1) + ' 🪙', e);
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

// ===== ПОКУПКА =====
function buyPlant() {
    if (state.selectedPlant === null) return;
    const plant = PLANTS[state.selectedPlant];
    if (!plant || state.coins < plant.cost) {
        SoundFX.error();
        return;
    }

    state.coins -= plant.cost;
    state.plants.push({
        plantIndex: state.selectedPlant,
        plantedAt: Date.now(),
        growing: true
    });

    SoundFX.plant();
    state.selectedPlant = null;
    updateCoins();
    render();
    showFloatingText('🌱 ' + (state.lang === 'ru' ? 'Посажено!' : 'Planted!'), { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    if (navigator.vibrate) navigator.vibrate(20);
    closeShopPanel();
}

// ===== СБОР =====
function harvestPlant(index) {
    const p = state.plants[index];
    if (!p || p.growing) return;
    const plant = PLANTS[p.plantIndex];
    state.coins += plant.reward;
    state.plants.splice(index, 1);
    SoundFX.harvest();
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
                SoundFX.error();
                showFloatingText('❌ Нужно ' + plant.cost + '🪙', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
                return;
            }
            if (state.selectedPlant === idx) {
                state.selectedPlant = null;
            } else {
                state.selectedPlant = idx;
                buyPlant();
            }
            renderShop();
            render();
        });
        shop.appendChild(btn);
    });
}

// ===== МАГАЗИН (ОТКРЫТЬ/ЗАКРЫТЬ) =====
shopBtn.addEventListener('click', () => {
    shopOverlay.style.display = 'flex';
    renderShop();
});

function closeShopPanel() {
    shopOverlay.style.display = 'none';
}
closeShop.addEventListener('click', closeShopPanel);
shopOverlay.addEventListener('click', (e) => {
    if (e.target === shopOverlay) closeShopPanel();
});

// ===== МИНИ-ИГРА (ОТКРЫТЬ/ЗАКРЫТЬ) =====
miniGameBtn.addEventListener('click', () => {
    miniGame.style.display = 'block';
    levelDisplay.textContent = match3.level || 1;
    initMatch3(match3.level || 1, (reward) => {
        state.coins += reward;
        updateCoins();
        showFloatingText('+' + reward + ' 🪙', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    });
});

closeGame.addEventListener('click', closeMatch3);

// ===== ЯЗЫК =====
function updateLangBtn() {
    langBtn.textContent = state.lang === 'ru' ? '🇬🇧 EN' : '🇷🇺 RU';
}

langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'en' : 'ru';
    saveState();
    render();
});

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

// ===== ЕЖЕДНЕВНЫЙ БОНУС (ИНИЦИАЛИЗАЦИЯ) =====
document.getElementById('dailyBonusBtn').addEventListener('click', claimDailyBonus);
updateDailyBonusUI();

// ===== ЗАПУСК =====
render();
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}