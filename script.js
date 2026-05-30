// ---------- GAME STATE & UTILS ----------
let currentGame = "reaction";
let gameIntervals = [];

function clearGameIntervals() {
    gameIntervals.forEach(interval => clearInterval(interval));
    gameIntervals = [];
}

let animationFrameId = null;
function cancelAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// ---------- REACTION GAME (click moving targets) ----------
let reactionScore = 0;
let reactionInterval = null;
let targetActive = false;
let currentTarget = null;
let reactionArena = null;

function buildReactionGame() {
    const container = document.createElement('div');
    container.className = 'game-area';
    container.innerHTML = `
        <div class="score-info">
            <div>Score: <span id="reactionScore">0</span></div>
            <div>click the moving star</div>
        </div>
        <div id="reactionArena" class="reaction-arena" style="height: 360px;"></div>
        <button id="resetReaction" class="game-btn" style="background:#ffaa66;">reset game</button>
    `;
    const arena = container.querySelector('#reactionArena');
    reactionArena = arena;
    const scoreSpan = container.querySelector('#reactionScore');
    
    function updateScoreUI() { if(scoreSpan) scoreSpan.innerText = reactionScore; }
    
    function spawnTarget() {
        if(!reactionArena) return;
        if(currentTarget) currentTarget.remove();
        const rect = reactionArena.getBoundingClientRect();
        if(rect.width === 0) return;
        const maxX = Math.max(40, rect.width - 80);
        const maxY = Math.max(40, rect.height - 80);
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;
        const target = document.createElement('div');
        target.className = 'moving-target';
        target.innerText = '★';
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        target.style.position = 'absolute';
        target.addEventListener('click', (e) => {
            e.stopPropagation();
            if(targetActive) {
                reactionScore++;
                updateScoreUI();
                target.remove();
                currentTarget = null;
                spawnTarget();
            }
        });
        reactionArena.appendChild(target);
        currentTarget = target;
        targetActive = true;
    }
    
    function clearTarget() {
        if(currentTarget) { currentTarget.remove(); currentTarget = null; }
        targetActive = false;
    }
    
    function startLoop() {
        if(reactionInterval) clearInterval(reactionInterval);
        clearTarget();
        spawnTarget();
        reactionInterval = setInterval(() => {
            if(reactionArena && currentTarget) {
                clearTarget();
                spawnTarget();
            } else if(reactionArena && !currentTarget) {
                spawnTarget();
            }
        }, 950);
        gameIntervals.push(reactionInterval);
    }
    
    const resetBtn = container.querySelector('#resetReaction');
    resetBtn.addEventListener('click', () => {
        reactionScore = 0;
        updateScoreUI();
        clearTarget();
        if(reactionInterval) clearInterval(reactionInterval);
        startLoop();
    });
    startLoop();
    return container;
}

// ---------- MEMORY PATTERN GAME ----------
let memoryScore = 0;
let patternSequence = [];
let playerTurn = false;
let currentStep = 0;
let memoryButtons = [];
let memoryActive = false;

function buildMemoryGame() {
    const colors = ['#FF6B6B', '#4CAF7A', '#5D9BEC', '#FFB347'];
    const container = document.createElement('div');
    container.className = 'game-area';
    container.innerHTML = `
        <div class="score-info">
            <div>Pattern Score: <span id="memScore">0</span></div>
            <div id="memStatus" class="mem-message">watch sequence</div>
        </div>
        <div class="pattern-grid" id="patternGrid"></div>
        <button id="resetMemory" class="game-btn">new pattern game</button>
    `;
    const grid = container.querySelector('#patternGrid');
    const scoreSpan = container.querySelector('#memScore');
    const statusSpan = container.querySelector('#memStatus');
    let buttons = [];
    
    for(let i=0;i<4;i++) {
        const btn = document.createElement('div');
        btn.className = 'pattern-btn';
        btn.style.backgroundColor = colors[i];
        btn.dataset.index = i;
        btn.addEventListener('click', () => {
            if(!playerTurn || !memoryActive) return;
            const idx = parseInt(btn.dataset.index);
            if(idx === patternSequence[currentStep]) {
                btn.classList.add('pattern-active');
                setTimeout(() => btn.classList.remove('pattern-active'), 200);
                currentStep++;
                if(currentStep === patternSequence.length) {
                    memoryScore++;
                    scoreSpan.innerText = memoryScore;
                    playerTurn = false;
                    statusSpan.innerText = 'correct! next round...';
                    setTimeout(() => playSequence(), 800);
                }
            } else {
                statusSpan.innerText = 'game over! press reset';
                playerTurn = false;
                memoryActive = false;
            }
        });
        grid.appendChild(btn);
        buttons.push(btn);
    }
    memoryButtons = buttons;
    
    async function playSequence() {
        memoryActive = false;
        playerTurn = false;
        statusSpan.innerText = 'watch...';
        const newColor = Math.floor(Math.random() * 4);
        patternSequence.push(newColor);
        for(let i=0;i<patternSequence.length;i++) {
            const idx = patternSequence[i];
            const btn = buttons[idx];
            btn.classList.add('pattern-active');
            await new Promise(r => setTimeout(r, 400));
            btn.classList.remove('pattern-active');
            await new Promise(r => setTimeout(r, 180));
        }
        playerTurn = true;
        memoryActive = true;
        currentStep = 0;
        statusSpan.innerText = 'your turn! repeat pattern';
    }
    
    function resetGame() {
        patternSequence = [];
        memoryScore = 0;
        scoreSpan.innerText = '0';
        playerTurn = false;
        memoryActive = false;
        playSequence();
    }
    container.querySelector('#resetMemory').addEventListener('click', resetGame);
    resetGame();
    return container;
}

// ---------- TIMING SKILL GAME (stop meter) ----------
let timingScore = 0;
let meterFill = 0;
let meterInterval = null;
let meterDirection = 1;

function buildTimingGame() {
    const container = document.createElement('div');
    container.className = 'game-area';
    container.innerHTML = `
        <div class="score-info">
            <div>precision points: <span id="timingScore">0</span></div>
            <div>stop in gold zone</div>
        </div>
        <div class="meter-box">
            <div class="meter-bar"><div id="meterFill" class="meter-fill"></div></div>
            <button id="stopMeterBtn" class="stop-btn">stop meter</button>
            <button id="resetTiming" class="game-btn" style="background:#ffcc88;">new round</button>
        </div>
    `;
    const fillDiv = container.querySelector('#meterFill');
    const scoreSpan = container.querySelector('#timingScore');
    const stopBtn = container.querySelector('#stopMeterBtn');
    const resetBtn = container.querySelector('#resetTiming');
    
    function startMeter() {
        if(meterInterval) clearInterval(meterInterval);
        meterFill = 0;
        fillDiv.style.width = '0%';
        meterDirection = 1;
        meterInterval = setInterval(() => {
            meterFill += meterDirection * 1.8;
            if(meterFill >= 100) { meterFill = 100; meterDirection = -1; }
            if(meterFill <= 0) { meterFill = 0; meterDirection = 1; }
            fillDiv.style.width = meterFill + '%';
        }, 35);
        gameIntervals.push(meterInterval);
    }
    
    function stopMeter() {
        if(meterInterval) clearInterval(meterInterval);
        let points = 0;
        if(meterFill >= 48 && meterFill <= 52) points = 10;
        else if(meterFill >= 44 && meterFill <= 56) points = 5;
        else if(meterFill >= 38 && meterFill <= 62) points = 2;
        else points = 0;
        if(points > 0) {
            timingScore += points;
            scoreSpan.innerText = timingScore;
            alert(`zone: ${Math.floor(meterFill)}%  +${points} pts`);
        } else {
            alert(`miss! ${Math.floor(meterFill)}% , 0 points`);
        }
        startMeter();
    }
    
    resetBtn.addEventListener('click', () => {
        timingScore = 0;
        scoreSpan.innerText = '0';
        if(meterInterval) clearInterval(meterInterval);
        startMeter();
    });
    stopBtn.addEventListener('click', stopMeter);
    startMeter();
    return container;
}

// ---------- PUZZLE: TILE SWAP (3x3) ----------
let tiles = [];
let emptyIndex = 8;

function buildPuzzleGame() {
    const container = document.createElement('div');
    container.className = 'game-area';
    container.innerHTML = `
        <div class="score-info"><div>slide puzzle</div><div id="puzzleMsg">swap with empty tile</div></div>
        <div id="puzzleGrid" class="puzzle-grid"></div>
        <button id="shufflePuzzle" class="game-btn">shuffle puzzle</button>
    `;
    const gridDiv = container.querySelector('#puzzleGrid');
    const msgSpan = container.querySelector('#puzzleMsg');
    
    function initTiles() {
        tiles = [1,2,3,4,5,6,7,8, null];
        emptyIndex = 8;
    }
    function render() {
        gridDiv.innerHTML = '';
        for(let i=0;i<9;i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            if(tiles[i] === null) {
                tile.classList.add('empty-tile');
                tile.innerText = '';
            } else {
                tile.innerText = tiles[i];
            }
            tile.addEventListener('click', (function(idx){ return function(){ trySwap(idx); }; })(i));
            gridDiv.appendChild(tile);
        }
    }
    function trySwap(clickedIdx) {
        const validMoves = [emptyIndex-3, emptyIndex+3, emptyIndex-1, emptyIndex+1];
        if(validMoves.includes(clickedIdx) && 
           !(emptyIndex%3===2 && clickedIdx%3===0) && 
           !(emptyIndex%3===0 && clickedIdx%3===2)) {
            [tiles[emptyIndex], tiles[clickedIdx]] = [tiles[clickedIdx], tiles[emptyIndex]];
            emptyIndex = clickedIdx;
            render();
            checkWin();
        }
    }
    function checkWin() {
        let win = true;
        for(let i=0;i<8;i++) if(tiles[i] !== i+1) win = false;
        if(win && tiles[8] === null) msgSpan.innerText = 'victory! puzzle solved!';
        else msgSpan.innerText = 'keep swapping';
    }
    function shuffle() {
        for(let step=0;step<200;step++) {
            const neighbors = [];
            if(emptyIndex-3>=0) neighbors.push(emptyIndex-3);
            if(emptyIndex+3<9) neighbors.push(emptyIndex+3);
            if(emptyIndex%3 !== 0) neighbors.push(emptyIndex-1);
            if(emptyIndex%3 !== 2) neighbors.push(emptyIndex+1);
            const rand = neighbors[Math.floor(Math.random()*neighbors.length)];
            [tiles[emptyIndex], tiles[rand]] = [tiles[rand], tiles[emptyIndex]];
            emptyIndex = rand;
        }
        render();
        msgSpan.innerText = 'shuffled! solve it';
    }
    initTiles();
    shuffle();
    container.querySelector('#shufflePuzzle').addEventListener('click', () => { initTiles(); shuffle(); });
    return container;
}

// ---------- CATCH FALLING OBJECTS ----------
let catchScore = 0;
let catchItems = [];
let catcherX = 50;
let catchInterval = null;

function buildCatchGame() {
    const container = document.createElement('div');
    container.className = 'game-area';
    container.innerHTML = `
        <div class="score-info"><div>caught: <span id="catchScoreValue">0</span></div><div>click on falling orbs</div></div>
        <div id="catchArena" class="catch-arena" style="position:relative;">
            <div id="catcherVisual" class="catcher"></div>
        </div>
        <button id="resetCatch" class="game-btn">reset catch game</button>
    `;
    const arena = container.querySelector('#catchArena');
    const catcherDiv = container.querySelector('#catcherVisual');
    const scoreSpan = container.querySelector('#catchScoreValue');
    catchScore = 0;
    catchItems = [];
    
    function moveCatcher(e) {
        const rect = arena.getBoundingClientRect();
        let clientX = e.clientX;
        if(clientX) {
            let relativeX = clientX - rect.left;
            let newX = Math.min(Math.max(relativeX, 20), rect.width - 20);
            catcherX = (newX / rect.width) * 100;
            catcherDiv.style.left = `calc(${catcherX}% - 50px)`;
        }
    }
    arena.addEventListener('mousemove', moveCatcher);
    arena.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if(touch) {
            const rect = arena.getBoundingClientRect();
            let relX = touch.clientX - rect.left;
            let newX = Math.min(Math.max(relX, 20), rect.width - 20);
            catcherX = (newX / rect.width) * 100;
            catcherDiv.style.left = `calc(${catcherX}% - 50px)`;
        }
    });
    
    function createFallingItem() {
        const arenaRect = arena.getBoundingClientRect();
        if(arenaRect.width === 0) return;
        const item = document.createElement('div');
        item.className = 'fall-item';
        const randX = Math.random() * (arenaRect.width - 50);
        item.style.left = randX + 'px';
        item.style.top = '0px';
        item.style.position = 'absolute';
        let yPos = 0;
        item.dataset.y = 0;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if(item.parentNode) {
                catchScore++;
                scoreSpan.innerText = catchScore;
                item.remove();
                const index = catchItems.indexOf(item);
                if(index !== -1) catchItems.splice(index,1);
            }
        });
        arena.appendChild(item);
        catchItems.push(item);
        function fall() {
            if(!item.parentNode) return;
            let currentY = parseFloat(item.style.top) || 0;
            currentY += 5;
            item.style.top = currentY + 'px';
            if(currentY > arenaRect.height - 60) {
                if(item.parentNode) item.remove();
                const idx = catchItems.indexOf(item);
                if(idx !== -1) catchItems.splice(idx,1);
            } else {
                requestAnimationFrame(fall);
            }
        }
        requestAnimationFrame(fall);
    }
    
    function startSpawner() {
        if(catchInterval) clearInterval(catchInterval);
        catchInterval = setInterval(() => {
            if(arena) createFallingItem();
        }, 700);
        gameIntervals.push(catchInterval);
    }
    function resetGame() {
        catchItems.forEach(i => i.remove());
        catchItems = [];
        catchScore = 0;
        scoreSpan.innerText = '0';
    }
    container.querySelector('#resetCatch').addEventListener('click', resetGame);
    startSpawner();
    return container;
}

// ---------- SWITCH GAMES ----------
function renderGame(gameId) {
    clearGameIntervals();
    cancelAnimation();
    const panel = document.getElementById('gamePanel');
    let gameContent = null;
    if(gameId === 'reaction') gameContent = buildReactionGame();
    else if(gameId === 'memory') gameContent = buildMemoryGame();
    else if(gameId === 'timing') gameContent = buildTimingGame();
    else if(gameId === 'puzzle') gameContent = buildPuzzleGame();
    else if(gameId === 'catch') gameContent = buildCatchGame();
    if(gameContent) {
        panel.innerHTML = '';
        panel.appendChild(gameContent);
    }
    document.querySelectorAll('.game-btn').forEach(btn => {
        if(btn.dataset.game === gameId) btn.classList.add('active-game');
        else btn.classList.remove('active-game');
    });
}

// menu listeners
document.querySelectorAll('.game-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const game = btn.dataset.game;
        if(game) {
            currentGame = game;
            renderGame(currentGame);
        }
    });
});
renderGame('reaction');
