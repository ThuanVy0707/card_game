// Tiến Lên Miền Nam Score Calculator
// Game State
let gameState = {
    players: [],
    history: [],
    roundNumber: 0,
    nextPlayerId: 1
};

// DOM Elements
const playerNameInput = document.getElementById('playerName');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playersContainer = document.getElementById('playersContainer');
const winnerSelect = document.getElementById('winner');
const instantWinCheckbox = document.getElementById('instantWin');
const remainingCardsContainer = document.getElementById('remainingCardsContainer');
const calculateRoundBtn = document.getElementById('calculateRoundBtn');
const historyContainer = document.getElementById('historyContainer');
const resetGameBtn = document.getElementById('resetGameBtn');
const undoLastRoundBtn = document.getElementById('undoLastRoundBtn');

// Settings Inputs
const basePointsInput = document.getElementById('basePoints');
const instantWinMultiplierInput = document.getElementById('instantWinMultiplier');
const tenCardsMultiplierInput = document.getElementById('tenCardsMultiplier');
const fullCardsMultiplierInput = document.getElementById('fullCardsMultiplier');

// Initialize the game
function init() {
    loadGameState();
    renderPlayers();
    renderHistory();
    updateWinnerSelect();
    updateRemainingCardsInputs();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    calculateRoundBtn.addEventListener('click', calculateRound);
    resetGameBtn.addEventListener('click', resetGame);
    undoLastRoundBtn.addEventListener('click', undoLastRound);
    winnerSelect.addEventListener('change', updateRemainingCardsInputs);
}

// Add a new player
function addPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người chơi!');
        return;
    }
    if (gameState.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Tên người chơi đã tồn tại!');
        return;
    }
    if (gameState.players.length >= 4) {
        alert('Tối đa 4 người chơi!');
        return;
    }

    const player = {
        id: gameState.nextPlayerId++,
        name: name,
        score: 0
    };

    gameState.players.push(player);
    playerNameInput.value = '';
    
    saveGameState();
    renderPlayers();
    updateWinnerSelect();
    updateRemainingCardsInputs();
}

// Remove a player
function removePlayer(playerId) {
    if (gameState.history.length > 0) {
        if (!confirm('Xóa người chơi sẽ xóa toàn bộ lịch sử ván đấu. Bạn có chắc không?')) {
            return;
        }
        gameState.history = [];
        gameState.roundNumber = 0;
    }

    gameState.players = gameState.players.filter(p => p.id !== playerId);
    
    saveGameState();
    renderPlayers();
    renderHistory();
    updateWinnerSelect();
    updateRemainingCardsInputs();
}

// Render players to the DOM
function renderPlayers() {
    if (gameState.players.length === 0) {
        playersContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">Chưa có người chơi. Thêm người chơi để bắt đầu!</p>';
        return;
    }

    playersContainer.innerHTML = gameState.players.map(player => {
        const scoreClass = player.score > 0 ? 'positive' : player.score < 0 ? 'negative' : 'zero';
        const scorePrefix = player.score > 0 ? '+' : '';
        
        return `
            <div class="player-card" data-player-id="${player.id}">
                <div class="player-name">${escapeHtml(player.name)}</div>
                <div class="player-score ${scoreClass}">${scorePrefix}${player.score}</div>
                <div class="player-controls">
                    <button class="btn btn-primary" onclick="manualAddPoints(${player.id})">+</button>
                    <button class="btn btn-danger" onclick="manualSubtractPoints(${player.id})">-</button>
                </div>
                <button class="btn remove-player-btn" onclick="removePlayer(${player.id})">Xóa</button>
            </div>
        `;
    }).join('');
}

// Manual point adjustment
function manualAddPoints(playerId) {
    const points = parseInt(prompt('Nhập số điểm muốn cộng:', '1'));
    if (isNaN(points) || points <= 0) return;

    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.score += points;
        saveGameState();
        renderPlayers();
        animateScoreChange(playerId, 'up');
    }
}

function manualSubtractPoints(playerId) {
    const points = parseInt(prompt('Nhập số điểm muốn trừ:', '1'));
    if (isNaN(points) || points <= 0) return;

    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.score -= points;
        saveGameState();
        renderPlayers();
        animateScoreChange(playerId, 'down');
    }
}

// Animate score change
function animateScoreChange(playerId, direction) {
    const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerCard) {
        const scoreElement = playerCard.querySelector('.player-score');
        scoreElement.classList.add(direction === 'up' ? 'score-up' : 'score-down');
        setTimeout(() => {
            scoreElement.classList.remove('score-up', 'score-down');
        }, 500);
    }
}

// Update winner select dropdown
function updateWinnerSelect() {
    const currentValue = winnerSelect.value;
    
    winnerSelect.innerHTML = '<option value="">-- Chọn người thắng --</option>';
    
    gameState.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = player.name;
        winnerSelect.appendChild(option);
    });

    // Restore selection if still valid
    if (gameState.players.some(p => p.id == currentValue)) {
        winnerSelect.value = currentValue;
    }
}

// Update remaining cards inputs
function updateRemainingCardsInputs() {
    const winnerId = parseInt(winnerSelect.value);
    
    if (!winnerId || gameState.players.length < 2) {
        remainingCardsContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Chọn người thắng để nhập số lá bài còn lại của các người chơi khác.</p>';
        return;
    }

    const losers = gameState.players.filter(p => p.id !== winnerId);
    
    remainingCardsContainer.innerHTML = losers.map(player => `
        <div class="remaining-cards-item">
            <label for="cards-${player.id}">${escapeHtml(player.name)} - Số lá còn lại:</label>
            <input type="number" id="cards-${player.id}" min="1" max="13" value="1" data-player-id="${player.id}">
        </div>
    `).join('');
}

// Calculate round scores
function calculateRound() {
    const winnerId = parseInt(winnerSelect.value);
    
    if (!winnerId) {
        alert('Vui lòng chọn người thắng!');
        return;
    }

    if (gameState.players.length < 2) {
        alert('Cần ít nhất 2 người chơi!');
        return;
    }

    const basePoints = parseInt(basePointsInput.value) || 1;
    const instantWinMultiplier = parseInt(instantWinMultiplierInput.value) || 2;
    const tenCardsMultiplier = parseInt(tenCardsMultiplierInput.value) || 2;
    const fullCardsMultiplier = parseInt(fullCardsMultiplierInput.value) || 4;
    const isInstantWin = instantWinCheckbox.checked;

    const winner = gameState.players.find(p => p.id === winnerId);
    const losers = gameState.players.filter(p => p.id !== winnerId);

    const roundDetails = {
        roundNumber: ++gameState.roundNumber,
        winnerId: winnerId,
        winnerName: winner.name,
        isInstantWin: isInstantWin,
        playerResults: []
    };

    let totalWinnerPoints = 0;

    losers.forEach(loser => {
        const cardsInput = document.getElementById(`cards-${loser.id}`);
        let remainingCards = parseInt(cardsInput.value) || 1;
        
        // Validate remaining cards
        remainingCards = Math.max(1, Math.min(13, remainingCards));

        // Calculate points for this loser
        let points = remainingCards * basePoints;
        let multiplierUsed = 1;
        let reason = '';

        // Apply multipliers
        if (remainingCards === 13) {
            // Full cards (cháy) - highest multiplier
            multiplierUsed = fullCardsMultiplier;
            points *= fullCardsMultiplier;
            reason = 'Cháy (13 lá)';
        } else if (remainingCards >= 10) {
            // 10 or more cards
            multiplierUsed = tenCardsMultiplier;
            points *= tenCardsMultiplier;
            reason = `Còn ${remainingCards} lá (≥10)`;
        }

        // Apply instant win multiplier
        if (isInstantWin) {
            points *= instantWinMultiplier;
            reason = reason ? `${reason} + Tới trắng` : 'Tới trắng';
        }

        // Loser loses points
        loser.score -= points;
        totalWinnerPoints += points;

        roundDetails.playerResults.push({
            playerId: loser.id,
            playerName: loser.name,
            remainingCards: remainingCards,
            pointsChange: -points,
            reason: reason || `Còn ${remainingCards} lá`
        });
    });

    // Winner gains all points
    winner.score += totalWinnerPoints;
    roundDetails.playerResults.unshift({
        playerId: winner.id,
        playerName: winner.name,
        remainingCards: 0,
        pointsChange: totalWinnerPoints,
        reason: 'Thắng'
    });

    // Save to history
    gameState.history.push(roundDetails);

    // Save and render
    saveGameState();
    renderPlayers();
    renderHistory();

    // Reset form
    instantWinCheckbox.checked = false;
    winnerSelect.value = '';
    updateRemainingCardsInputs();

    // Animate winner
    animateScoreChange(winnerId, 'up');
}

// Render game history
function renderHistory() {
    if (gameState.history.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">Chưa có ván đấu nào.</p>';
        return;
    }

    // Show history in reverse order (newest first)
    const reversedHistory = [...gameState.history].reverse();
    
    historyContainer.innerHTML = reversedHistory.map(round => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-round">Ván ${round.roundNumber}</span>
                <span class="history-winner">🏆 ${escapeHtml(round.winnerName)}${round.isInstantWin ? ' (Tới trắng)' : ''}</span>
            </div>
            <div class="history-details">
                ${round.playerResults.map(result => {
                    const className = result.pointsChange > 0 ? 'positive' : 'negative';
                    const prefix = result.pointsChange > 0 ? '+' : '';
                    return `
                        <span class="history-detail-item ${className}">
                            ${escapeHtml(result.playerName)}: ${prefix}${result.pointsChange} (${result.reason})
                        </span>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// Undo last round
function undoLastRound() {
    if (gameState.history.length === 0) {
        alert('Không có ván đấu nào để hoàn tác!');
        return;
    }

    if (!confirm('Bạn có chắc muốn hoàn tác ván đấu cuối cùng?')) {
        return;
    }

    const lastRound = gameState.history.pop();
    gameState.roundNumber--;

    // Reverse the score changes
    lastRound.playerResults.forEach(result => {
        const player = gameState.players.find(p => p.id === result.playerId);
        if (player) {
            player.score -= result.pointsChange;
        }
    });

    saveGameState();
    renderPlayers();
    renderHistory();
}

// Reset the entire game
function resetGame() {
    if (!confirm('Bạn có chắc muốn bắt đầu lại từ đầu? Tất cả dữ liệu sẽ bị xóa!')) {
        return;
    }

    gameState = {
        players: [],
        history: [],
        roundNumber: 0,
        nextPlayerId: 1
    };

    saveGameState();
    renderPlayers();
    renderHistory();
    updateWinnerSelect();
    updateRemainingCardsInputs();
}

// Save game state to localStorage
function saveGameState() {
    try {
        localStorage.setItem('tienlenGameState', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

// Load game state from localStorage
function loadGameState() {
    try {
        const saved = localStorage.getItem('tienlenGameState');
        if (saved) {
            gameState = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load game state:', e);
        gameState = {
            players: [],
            history: [],
            roundNumber: 0
        };
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
