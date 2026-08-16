// ========== МИНИ-ИГРА ТРИ В РЯД ==========

const MATCH3_EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑', '🍒', '🫐'];
const MATCH3_OBSTACLES = ['🧱', '🪨', '🗿'];

let match3 = {
    board: [],
    selected: null,
    active: false,
    level: 1,
    size: 6,
    onWin: null,
    processing: false,
    obstaclesDestroyed: 0,
    totalObstacles: 0,
    matchCount: 0,
    levelCompleted: false // флаг, чтобы не давать деньги дважды
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initMatch3(level, callback) {
    match3.level = level || 1;
    match3.onWin = callback || null;
    match3.active = true;
    match3.selected = null;
    match3.processing = false;
    match3.obstaclesDestroyed = 0;
    match3.matchCount = 0;
    match3.levelCompleted = false;
    
    const size = match3.size;
    const numObstacles = Math.min(level + 2, 10);
    match3.totalObstacles = numObstacles;
    let board = [];
    const emojiPool = [...MATCH3_EMOJIS];
    
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
    
    let attempts = 0;
    do {
        shuffleBoard(board);
        attempts++;
    } while (findMatch3Matches(board).length > 0 && attempts < 30);
    
    if (findMatch3Matches(board).length > 0) {
        const matches = findMatch3Matches(board);
        matches.forEach(idx => {
            board[idx] = { emoji: '✨', isObstacle: false };
        });
        fillMatch3Empty(board);
    }
    
    match3.board = board;
    renderMatch3();
    updateMatch3Status(`🧱 Осталось: ${numObstacles} препятствий`);
}

// ===== ПЕРЕМЕШИВАНИЕ =====
function shuffleBoard(board) {
    for (let i = board.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [board[i], board[j]] = [board[j], board[i]];
    }
}

// ===== ПОИСК КОМБИНАЦИЙ =====
function findMatch3Matches(board) {
    const size = match3.size;
    const matches = new Set();
    board = board || match3.board;
    
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

// ===== ПОИСК ПРЕПЯТСТВИЙ РЯДОМ =====
function findAdjacentObstacles(matchIndices) {
    const size = match3.size;
    const obstacles = new Set();
    const directions = [-1, 1, -size, size];
    
    matchIndices.forEach(idx => {
        const row = Math.floor(idx / size);
        const col = idx % size;
        
        directions.forEach(delta => {
            const newIdx = idx + delta;
            if (newIdx >= 0 && newIdx < size * size) {
                const newRow = Math.floor(newIdx / size);
                const newCol = newIdx % size;
                if (Math.abs(row - newRow) + Math.abs(col - newCol) === 1) {
                    const cell = match3.board[newIdx];
                    if (cell && cell.isObstacle) {
                        obstacles.add(newIdx);
                    }
                }
            }
        });
    });
    
    return Array.from(obstacles);
}

// ===== ПРОВЕРКА НАЛИЧИЯ ДОСТУПНЫХ ХОДОВ =====
function hasAvailableMoves() {
    const board = match3.board;
    const size = match3.size;
    
    for (let i = 0; i < board.length; i++) {
        if (board[i].isObstacle) continue;
        const row = Math.floor(i / size);
        const col = i % size;
        
        if (col < size - 1) {
            const j = i + 1;
            if (!board[j].isObstacle) {
                [board[i], board[j]] = [board[j], board[i]];
                const matches = findMatch3Matches(board);
                [board[i], board[j]] = [board[j], board[i]];
                if (matches.length > 0) return true;
            }
        }
        
        if (row < size - 1) {
            const j = i + size;
            if (!board[j].isObstacle) {
                [board[i], board[j]] = [board[j], board[i]];
                const matches = findMatch3Matches(board);
                [board[i], board[j]] = [board[j], board[i]];
                if (matches.length > 0) return true;
            }
        }
    }
    return false;
}

// ===== ПЕРЕМЕШИВАНИЕ БЕЗ КОМБИНАЦИЙ =====
function reshuffleBoard() {
    const board = match3.board;
    const nonObstacles = board.filter(cell => !cell.isObstacle);
    const emojis = nonObstacles.map(cell => cell.emoji);
    
    for (let i = emojis.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
    }
    
    let emojiIndex = 0;
    board.forEach((cell, idx) => {
        if (!cell.isObstacle) {
            board[idx] = { emoji: emojis[emojiIndex++], isObstacle: false };
        }
    });
    
    let attempts = 0;
    while (findMatch3Matches(board).length > 0 && attempts < 30) {
        for (let i = emojis.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
        }
        emojiIndex = 0;
        board.forEach((cell, idx) => {
            if (!cell.isObstacle) {
                board[idx] = { emoji: emojis[emojiIndex++], isObstacle: false };
            }
        });
        attempts++;
    }
    
    renderMatch3();
    updateMatch3Status(`🔄 Доска перемешана! Осталось: ${match3.totalObstacles - match3.obstaclesDestroyed} препятствий`);
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
    if (!match3.active || match3.processing || match3.levelCompleted) return;
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

    const firstIndex = match3.selected;
    const first = match3.board[firstIndex];
    const second = match3.board[index];

    if (first.isObstacle || second.isObstacle) {
        match3.selected = null;
        renderMatch3();
        return;
    }

    [match3.board[firstIndex], match3.board[index]] = [match3.board[index], match3.board[firstIndex]];

    const matches = findMatch3Matches(match3.board);
    if (matches.length > 0) {
        match3.selected = null;
        match3.processing = true;
        match3.matchCount++;
        
        // Находим препятствия рядом с комбинацией
        const adjacentObstacles = findAdjacentObstacles(matches);
        
        // Разрушаем препятствия
        if (adjacentObstacles.length > 0) {
            adjacentObstacles.forEach(idx => {
                match3.board[idx] = { emoji: '✨', isObstacle: false };
                match3.obstaclesDestroyed++;
            });
            const remaining = match3.totalObstacles - match3.obstaclesDestroyed;
            updateMatch3Status(`💥 Разрушено ${adjacentObstacles.length} препятствий! 🧱 Осталось: ${remaining}`);
        } else {
            updateMatch3Status(`🎉 Комбинация!`);
        }
        
        processMatches(matches, 0);
    } else {
        [match3.board[firstIndex], match3.board[index]] = [match3.board[index], match3.board[firstIndex]];
        match3.selected = null;
        renderMatch3();
        updateMatch3Status('❌ Нет совпадений!');
        setTimeout(() => {
            const remaining = match3.totalObstacles - match3.obstaclesDestroyed;
            updateMatch3Status(`🧱 Осталось: ${remaining} препятствий`);
        }, 800);
    }
}

// ===== ОБРАБОТКА КОМБИНАЦИЙ =====
function processMatches(matches, depth) {
    if (matches.length === 0) {
        const newMatches = findMatch3Matches(match3.board);
        if (newMatches.length > 0) {
            const adjacentObstacles = findAdjacentObstacles(newMatches);
            if (adjacentObstacles.length > 0) {
                adjacentObstacles.forEach(idx => {
                    match3.board[idx] = { emoji: '✨', isObstacle: false };
                    match3.obstaclesDestroyed++;
                });
                const remaining = match3.totalObstacles - match3.obstaclesDestroyed;
                updateMatch3Status(`💥 Разрушено ${adjacentObstacles.length} препятствий! 🧱 Осталось: ${remaining}`);
            }
            setTimeout(() => {
                processMatches(newMatches, depth + 1);
            }, 400);
        } else {
            match3.processing = false;
            // Проверяем, есть ли доступные ходы
            if (!hasAvailableMoves()) {
                updateMatch3Status('🔄 Нет ходов! Перемешиваю...');
                setTimeout(() => {
                    reshuffleBoard();
                }, 500);
            } else {
                const remaining = match3.totalObstacles - match3.obstaclesDestroyed;
                updateMatch3Status(`🧱 Осталось: ${remaining} препятствий`);
            }
            checkMatch3Win();
        }
        return;
    }

    // Убираем совпадения
    matches.forEach(idx => {
        match3.board[idx] = { emoji: '✨', isObstacle: false };
    });
    renderMatch3();
    
    // НЕ ДАЁМ ДЕНЬГИ ЗА КОМБИНАЦИИ
    
    setTimeout(() => {
        fillMatch3Empty();
        const newMatches = findMatch3Matches(match3.board);
        if (newMatches.length > 0) {
            const adjacentObstacles = findAdjacentObstacles(newMatches);
            if (adjacentObstacles.length > 0) {
                adjacentObstacles.forEach(idx => {
                    match3.board[idx] = { emoji: '✨', isObstacle: false };
                    match3.obstaclesDestroyed++;
                });
                const remaining = match3.totalObstacles - match3.obstaclesDestroyed;
                updateMatch3Status(`💥 Разрушено ${adjacentObstacles.length} препятствий! 🧱 Осталось: ${remaining}`);
            }
            setTimeout(() => {
                processMatches(newMatches, depth + 1);
            }, 300);
        } else {
            match3.processing = false;
            if (!hasAvailableMoves()) {
                updateMatch3Status('🔄 Нет ходов! Перемешиваю...');
                setTimeout(() => {
                    reshuffleBoard();
                }, 500);
            } else {
                const remaining = match3.totalObstacles - match3.obstaclesDestroyed;
                updateMatch3Status(`🧱 Осталось: ${remaining} препятствий`);
            }
            checkMatch3Win();
        }
    }, 400);
}

// ===== ЗАПОЛНЕНИЕ ПУСТЫХ КЛЕТОК =====
function fillMatch3Empty(board) {
    const size = match3.size;
    board = board || match3.board;
    
    for (let col = 0; col < size; col++) {
        for (let row = size - 1; row >= 0; row--) {
            const idx = row * size + col;
            if (board[idx].emoji === '✨' || board[idx].emoji === undefined) {
                let found = false;
                for (let r = row - 1; r >= 0; r--) {
                    const aboveIdx = r * size + col;
                    if (board[aboveIdx].emoji !== '✨' && !board[aboveIdx].isObstacle) {
                        board[idx] = { ...board[aboveIdx] };
                        board[aboveIdx] = { emoji: '✨', isObstacle: false };
                        found = true;
                        break;
                    }
                }
                if (!found) {
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
    if (match3.processing || match3.levelCompleted) return;
    
    const board = match3.board;
    const hasObstacles = board.some(cell => cell.isObstacle);
    const hasEmpty = board.some(cell => cell.emoji === '✨' || cell.emoji === undefined);
    const hasMatches = findMatch3Matches(board).length > 0;
    
    // Если есть комбинации, но игра не в процессе — обрабатываем их
    if (hasMatches && !match3.processing) {
        const matches = findMatch3Matches(board);
        match3.processing = true;
        processMatches(matches, 0);
        return;
    }
    
    // Если все препятствия разрушены — УРОВЕНЬ ПРОЙДЕН!
    if (!hasObstacles && !hasEmpty && !hasMatches) {
        match3.levelCompleted = true;
        match3.active = false;
        
        // ✅ ДАЁМ ДЕНЬГИ ЗА ПРОХОЖДЕНИЕ УРОВНЯ
        const reward = 10 + match3.level * 2; // 12, 14, 16...
        if (match3.onWin) {
            match3.onWin(reward);
        }
        
        updateMatch3Status(`🎉 Уровень ${match3.level} пройден! +${reward}🪙`);
        
        // ПОКАЗЫВАЕМ КРАСИВОЕ ОКНО ПЕРЕХОДА
        setTimeout(() => {
            showLevelCompleteModal(match3.level, reward);
        }, 500);
    }
}

// ===== КРАСИВОЕ ОКНО ПЕРЕХОДА =====
function showLevelCompleteModal(level, reward) {
    // Удаляем старое окно, если есть
    const oldModal = document.querySelector('.level-modal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'level-modal';
    modal.innerHTML = `
        <div class="level-modal-content">
            <div class="level-modal-icon">🎉</div>
            <div class="level-modal-title">Уровень ${level} пройден!</div>
            <div class="level-modal-reward">+${reward} 🪙</div>
            <div class="level-modal-stats">
                <span>🧱 Препятствий разрушено: ${match3.totalObstacles}</span>
                <span>🔥 Комбо: ${match3.matchCount}</span>
            </div>
            <button class="level-modal-btn" id="nextLevelBtn">▶ Следующий уровень</button>
        </div>
    `;
    
    // Стили для модального окна (встроенные)
    const style = document.createElement('style');
    style.textContent = `
        .level-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: modalFadeIn 0.4s ease;
        }
        @keyframes modalFadeIn {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
        }
        .level-modal-content {
            background: #f5f0e8;
            border-radius: 28px;
            padding: 32px 28px;
            max-width: 340px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: modalBounce 0.5s cubic-bezier(0.2, 0.8, 0.4, 1);
        }
        @keyframes modalBounce {
            0% { transform: scale(0.5) rotate(-3deg); opacity: 0; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .level-modal-icon { font-size: 56px; margin-bottom: 8px; }
        .level-modal-title { 
            font-size: 24px; 
            font-weight: 800; 
            color: #2d5a2d; 
            margin-bottom: 4px;
        }
        .level-modal-reward { 
            font-size: 32px; 
            font-weight: 700; 
            color: #e6a800;
            margin-bottom: 12px;
            text-shadow: 0 2px 10px rgba(230, 168, 0, 0.2);
        }
        .level-modal-stats {
            display: flex;
            justify-content: center;
            gap: 16px;
            font-size: 13px;
            color: #5a6a50;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        .level-modal-stats span {
            background: rgba(200, 220, 180, 0.3);
            padding: 4px 12px;
            border-radius: 20px;
        }
        .level-modal-btn {
            background: linear-gradient(145deg, #4d8a4d, #2d5a2d);
            border: none;
            color: #fff;
            font-size: 18px;
            font-weight: 700;
            padding: 14px 32px;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 4px 0 #1a331a;
            transition: 0.1s;
            width: 100%;
        }
        .level-modal-btn:active {
            transform: translateY(3px);
            box-shadow: 0 1px 0 #1a331a;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    // Кнопка "Следующий уровень"
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        modal.remove();
        match3.level++;
        document.getElementById('levelDisplay').textContent = match3.level;
        try {
            localStorage.setItem('match3Level', JSON.stringify(match3.level));
        } catch(e) {}
        initMatch3(match3.level, match3.onWin);
    });
}

// ===== СТАТУС =====
function updateMatch3Status(text) {
    const statusEl = document.getElementById('gameStatus');
    if (statusEl) statusEl.textContent = text;
}

// ===== ЗАКРЫТЬ =====
function closeMatch3() {
    match3.active = false;
    match3.processing = false;
    match3.levelCompleted = false;
    document.getElementById('miniGame').style.display = 'none';
    // Удаляем модальное окно, если есть
    const modal = document.querySelector('.level-modal');
    if (modal) modal.remove();
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