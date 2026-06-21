// Game state model + localStorage persistence.
// The data shape here is the single source of truth the whole UI renders from.

var STORAGE_KEY = 'lifetracker.game.v1';

// Commander only: everyone starts at 40.
export var STARTING_LIFE = 40;
export var POISON_LETHAL = 10;
export var CMDR_LETHAL = 21;

// Default seat colours, reused across player counts.
var PLAYER_COLORS = ['#9d2233', '#1e4fa3', '#176c3a', '#9a6311', '#5b2a8c', '#0f6f7a'];

function colorFor(id) {
  return PLAYER_COLORS[(id - 1) % PLAYER_COLORS.length];
}

function newPlayer(id) {
  return {
    id: id,
    name: 'Player ' + id,
    life: STARTING_LIFE,
    color: colorFor(id),
    poison: 0,
    energy: 0,
    cmdrDmg: {} // { opponentId: damageTaken }
  };
}

export function defaultPlayers(count) {
  var players = [];
  for (var i = 0; i < count; i++) {
    players.push(newPlayer(i + 1));
  }
  return players;
}

export function createGame(count) {
  return { playerCount: count, players: defaultPlayers(count) };
}

// Fill in any fields a stored (older) player object might be missing.
function normalizePlayer(p, index) {
  var id = p && p.id ? p.id : index + 1;
  return {
    id: id,
    name: p && p.name ? p.name : 'Player ' + id,
    life: p && typeof p.life === 'number' ? p.life : STARTING_LIFE,
    color: p && p.color ? p.color : colorFor(id),
    poison: p && p.poison ? p.poison : 0,
    energy: p && p.energy ? p.energy : 0,
    cmdrDmg: p && p.cmdrDmg ? p.cmdrDmg : {}
  };
}

export function loadGame() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.players && parsed.players.length) {
        var players = parsed.players.map(normalizePlayer);
        return { playerCount: players.length, players: players };
      }
    }
  } catch (e) {
    /* corrupt or unavailable storage -> fresh game */
  }
  return createGame(4);
}

export function saveGame(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch (e) {
    /* private mode / quota -> ignore */
  }
}
