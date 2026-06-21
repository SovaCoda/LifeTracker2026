// Game state model + localStorage persistence.
// Kept dependency-free so the data shape is the single source of truth that the
// whole UI renders from (this is the "data-driven" core that makes new features
// cheap to add).

var STORAGE_KEY = 'lifetracker.game.v1';

export var FORMATS = [
  { id: 'commander', name: 'Commander', life: 40 },
  { id: 'brawl', name: 'Brawl', life: 30 },
  { id: 'twohg', name: 'Two-Headed Giant', life: 30 },
  { id: 'oathbreaker', name: 'Oathbreaker', life: 20 },
  { id: 'standard', name: 'Standard / 60-card', life: 20 }
];

// Default seat colours, reused across player counts.
var PLAYER_COLORS = ['#9d2233', '#1e4fa3', '#176c3a', '#9a6311', '#5b2a8c', '#0f6f7a'];

export function defaultPlayers(count, startingLife) {
  var players = [];
  for (var i = 0; i < count; i++) {
    players.push({
      id: i + 1,
      name: 'Player ' + (i + 1),
      life: startingLife,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length]
    });
  }
  return players;
}

export function createGame(count, startingLife) {
  return {
    formatId: 'commander',
    startingLife: startingLife,
    playerCount: count,
    players: defaultPlayers(count, startingLife)
  };
}

export function loadGame() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.players && parsed.players.length) {
        return parsed;
      }
    }
  } catch (e) {
    /* corrupt or unavailable storage -> fall back to a fresh game */
  }
  return createGame(4, 40);
}

export function saveGame(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch (e) {
    /* private mode / quota -> ignore, app still works for the session */
  }
}
