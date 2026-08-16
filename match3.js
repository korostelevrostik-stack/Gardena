// ========== МИНИ-ИГРА ТРИ В РЯД ==========

const MATCH3_EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑', '🍒', '🫐'];
const MATCH3_OBSTACLES = ['🧱', '🪨', '🗿'];

let match3 = {
    board: [],
    selected: null,
    active: false,
    level: 1,
    size: 6,
    onWin: null // колбэк при выигрыше
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initMatch3(level, callback) {
    match3.level = level || 1;
    match3.onWin = callback || null;
    match3.active = true;
    match3.selected = null;
    
    const size = match3.size;
    const numObstacles = Math.min(level, 8);
    const board = [];
    const emojiPool = [...MATCH3_EMOJIS];
    
    // Создаём доску
    for (let i = 0; i < size * size; i++) {
        const isObstacle = i < numObstacles;
        if (isObstacle) {
            board.push({ 
                emoji: MATCH3_OBSTACLES[i % MATCH3_OBSTACLES.length], 
                isObstacle: true 
            });
        } else {
            const randomEmoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
            board.push({ emoji: randomEmoji, isObstacle: false });
        }
    }
    
    // Перемешиваем
    for (let i = board.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [board[i], board[j]] = [board[j], board[i]];
    }
    
    match3.board = board;
    renderMatch3();
    updateMatch3Status('Собери 3 одинаковых!');
}

// ===== ОТРИСОВКА =====
function renderMatch3() {
    const boardEl = document.getElementById('gameBoard');
    if (!boardEl) return;
    
    boardEl.innerHTML = '';
    match3.board.forEach((cell, index) => {
        const div = document.createElement('div');
        div.className = 'game-cell';
        if (cell.isObstacle) {
            div.classList.add('obstacle');
            div.textContent = cell.emoji;
        } else {
            div.textContent = cell.emoji;
            div.addEventListener('click', () => onMatch3Click(index));
        }
        if (match3.selected === index && !cell.isObstacle) {
            div.classList.add('selected');
        }
        boardEl.appendChild(div);
    });
}

// ===== КЛИК =====
function onMatch3Click(index) {
    if (!match3.active) return;
    const cell = match3.board[index];
    if (cell.isObstacle) return;

    if (match3.selected === null) {
        match3.selected = index;
        renderMatch3();
        return;
    }

    if (match3.selected === index) {
        match3.selected = null;
        renderMatch3();
        return;
    }

    // Пробуем поменять местами
    const firstIndex = match3.selected;
    const first = match3.board[firstIndex];
    const second = match3.board[index];

    if (first.isObstacle || second.isObstacle) {
        match3.selected = null;
        renderMatch3();
        return;
    }

    // Меняем местами
    [match3.board[firstIndex], match3.board[index]] = [match3.board[index], match3.board[firstIndex]];

    // Проверяем совпадения
    const matches = findMatch3Matches();
    if (matches.length > 0) {
        // Убираем совпадения
        matches.forEach(idx => {
            match3.board[idx] = { emoji: '✨', isObstacle: false };
        });
        match3.selected = null;
        renderMatch3();
        updateMatch3Status('🎉 Совпадение!');
        
        // Даём награду
        if (match3.onWin) {
            match3.onWin(10);
        }
        
        // Заполняем пустые клетки
        setTimeout(() => {
            fillMatch3Empty();
            const newMatches = findMatch3Matches();
            if (newMatches.length > 0) {
                newMatches.forEach(idx => {
                    match3.board[idx] = { emoji: '✨', isObstacle: false };
                });
                renderMatch3();
                if (match3.onWin) {
                    match3.onWin(5);
                }
                setTimeout(() => fillMatch3Empty(), 300);
            }
            checkMatch3Win();
        }, 400);
    } else {
        // Меняем обратно
        [match3.board[firstIndex], match3.board[index]] = [match3.board[index], match3.board[firstIndex]];
        match3.selected = null;
        renderMatch3();
        updateMatch3Status('❌ Нет совпадений!');
        setTimeout(() => {
            updateMatch3Status('Собери 3 одинаковых!');
        }, 1000);
    }
}

// ===== ПОИСК СОВПАДЕНИЙ =====
function findMatch3Matches() {
    const size = match3.size;
    const matches = new Set();
    const board = match3.board;
    
    // Горизонтальные
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size - 2; col++) {
            const idx1 = row * size + col;
            const idx2 = row * size + col + 1;
            const idx3 = row * size + col + 2;
            const c1 = board[idx1];
            const c2 = board[idx2];
            const c3 = board[idx3];
            if (!c1.isObstacle && !c2.isObstacle && !c3.isObstacle &&
                c1.emoji === c2.emoji && c2.emoji === c3.emoji &&
                c1.emoji !== '✨') {
                matches.add(idx1);
                matches.add(idx2);
                matches.add(idx3);
            }
        }
    }
    
    // Вертикальные
    for (let row = 0; row < size - 2; row++) {
        for (let col = 0; col < size; col++) {
            const idx1 = row * size + col;
            const idx2 = (row + 1) * size + col;
            const idx3 = (row + 2) * size + col;
            const c1 = board[idx1];
            const c2 = board[idx2];
            const c3 = board[idx3];
            if (!c1.isObstacle && !c2.isObstacle && !c3.isObstacle &&
                c1.emoji === c2.emoji && c2.emoji === c3.emoji &&
                c1.emoji !== '✨') {
                matches.add(idx1);
                matches.add(idx2);
                matches.add(idx3);
            }
        }
    }
    
    return Array.from(matches);
}

// ===== ЗАПОЛНЕНИЕ ПУСТЫХ КЛЕТОК =====
function fillMatch3Empty() {
    const size = match3.size;
    const board = match3.board;
    
    for (let col = 0; col < size; col++) {
        for (let row = size - 1; row >= 0; row--) {
            const idx = row * size + col;
            if (board[idx].emoji === '✨' || board[idx].emoji === undefined) {
                // Находим сверху
                for (let r = row - 1; r >= 0; r--) {
                    const aboveIdx = r * size + col;
                    if (board[aboveIdx].emoji !== '✨' && !board[aboveIdx].isObstacle) {
                        board[idx] = { ...board[aboveIdx] };
                        board[aboveIdx] = { emoji: '✨', isObstacle: false };
                        break;
                    }
                }
                // Если всё ещё пусто — генерируем новое
                if (board[idx].emoji === '✨' || board[idx].emoji === undefined) {
                    const emoji = MATCH3_EMOJIS[Math.floor(Math.random() * MATCH3_EMOJIS.length)];
                    board[idx] = { emoji: emoji, isObstacle: false };
                }
            }
        }
    }
    renderMatch3();
}

// ===== ПРОВЕРКА ПОБЕДЫ =====
function checkMatch3Win() {
    const board = match3.board;
    const hasObstacles = board.some(cell => cell.isObstacle);
    const hasEmpty = board.some(cell => cell.emoji === '✨' || cell.emoji === undefined);
    
    if (!hasObstacles && !hasEmpty) {
        match3.active = false;
        updateMatch3Status('🎉 Уровень пройден!');
        match3.level++;
        document.getElementById('levelDisplay').textContent = match3.level;
        
        // Сохраняем прогресс
        try {
            localStorage.setItem('match3Level', JSON.stringify(match3.level));
        } catch(e) {}
        
        setTimeout(() => {
            if (confirm('Следующий уровень?')) {
                initMatch3(match3.level, match3.onWin);
            } else {
                closeMatch3();
            }
        }, 1000);
    }
}

// ===== СТАТУС =====
function updateMatch3Status(text) {
    const statusEl = document.getElementById('gameStatus');
    if (statusEl) statusEl.textContent = text;
}

// ===== ЗАКРЫТЬ =====
function closeMatch3() {
    match3.active = false;
    document.getElementById('miniGame').style.display = 'none';
}

// ===== ЗАГРУЗКА УРОВНЯ =====
function loadMatch3Level() {
    try {
        const saved = localStorage.getItem('match3Level');
        if (saved) {
            match3.level = JSON.parse(saved) || 1;
        }
    } catch(e) {}
}

loadMatch3Level();