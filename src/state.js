// Data model + localStorage persistence. Three stores:
//   - session : the in-progress flow (phase + current game) so a reload resumes
//   - profiles: the roster of friends (decks + win-rate will attach here later)
//   - games   : completed game results (for the future win-rate feature)

export var STARTING_LIFE = 40;
export var POISON_LETHAL = 10;
export var CMDR_LETHAL = 21;

// Seat colours offered when choosing who's playing (one per player, up to 6).
export var PLAYER_COLORS = ['#9d2233', '#1e4fa3', '#176c3a', '#9a6311', '#5b2a8c', '#0f6f7a'];

// The green seat — used for the Houston dino easter egg.
export var DINO_GREEN = PLAYER_COLORS[2];

// ---- ordinals: 1 -> "1st", 4 -> "4th" ----
export function ordinal(n) {
  var s = ['th', 'st', 'nd', 'rd'];
  var v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---- a player is dead by any commander rule ----
export function isPlayerDead(p) {
  if (p.life <= 0) return true;
  if (p.poison >= POISON_LETHAL) return true;
  for (var k in p.cmdrDmg) {
    if (p.cmdrDmg[k] >= CMDR_LETHAL) return true;
  }
  return false;
}

// ---- build the playing game from chosen seats ----
// seats: [{ profileId, name, color }]
export function createGameFromSeats(seats) {
  return {
    players: seats.map(function (s, i) {
      return {
        id: i + 1,
        profileId: s.profileId,
        name: s.name,
        color: s.color,
        life: STARTING_LIFE,
        poison: 0,
        energy: 0,
        cmdrDmg: {}, // { opponentSeatId: damage }
        place: null  // null = still in; otherwise final placement
      };
    })
  };
}

// ---- session (phase + current game) ----
var SESSION_KEY = 'lifetracker.session.v1';

export function loadSession() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.phase) return s;
    }
  } catch (e) { /* ignore */ }
  return { phase: 'setup-count', playerCount: 4, game: null };
}

export function saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

// ---- profiles ----
var PROFILES_KEY = 'lifetracker.profiles.v1';

var DEFAULT_PROFILES = [
  { id: 'anna', name: 'Anna', avatar: null, avatarColor: '#db2777' },
  { id: 'conner', name: 'Conner', avatar: null, avatarColor: '#2563eb' },
  { id: 'mark', name: 'Mark', avatar: null, avatarColor: '#16a34a' },
  { id: 'houston', name: 'Houston', avatar: null, avatarColor: '#ea580c' },
  { id: 'jake', name: 'Jake', avatar: null, avatarColor: '#7c3aed' },
  { id: 'steve', name: 'Steve', avatar: null, avatarColor: '#0891b2' },
  { id: 'gavin', name: 'Gavin', avatar: null, avatarColor: '#ca8a04' }
];

export function loadProfiles() {
  var stored = null;
  try {
    var raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && p.length) stored = p;
    }
  } catch (e) { /* ignore */ }

  if (!stored) {
    saveProfiles(DEFAULT_PROFILES);
    return DEFAULT_PROFILES.slice();
  }

  // Merge in any new default profiles a device's saved roster doesn't have yet
  // (so adding a default like Gavin shows up without wiping saved photos).
  var ids = stored.map(function (s) { return s.id; });
  var added = false;
  DEFAULT_PROFILES.forEach(function (d) {
    if (ids.indexOf(d.id) < 0) { stored.push(d); added = true; }
  });
  if (added) saveProfiles(stored);
  return stored;
}

export function saveProfiles(list) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
}

// ---- completed games (win-rate source, used later) ----
var GAMES_KEY = 'lifetracker.games.v1';

export function loadGames() {
  try {
    var raw = localStorage.getItem(GAMES_KEY);
    if (raw) {
      var g = JSON.parse(raw);
      if (g && g.length) return g;
    }
  } catch (e) { /* ignore */ }
  return [];
}

export function saveGameResult(result) {
  var games = loadGames();
  games.push(result);
  try { localStorage.setItem(GAMES_KEY, JSON.stringify(games)); } catch (e) { /* ignore */ }
  return games;
}

export function clearGames() {
  try { localStorage.removeItem(GAMES_KEY); } catch (e) { /* ignore */ }
}

// Aggregate recorded games into per-profile stats. Profiles with no games sort
// to the bottom; otherwise rank by win rate, then by average placing.
export function computeStats(profiles) {
  var games = loadGames();
  var map = {};

  profiles.forEach(function (p) {
    map[p.id] = { profileId: p.id, name: p.name, games: 0, wins: 0, placeSum: 0 };
  });

  games.forEach(function (g) {
    g.results.forEach(function (r) {
      var s = map[r.profileId];
      if (!s) {
        // a profile that was since removed -> still show its history
        s = map[r.profileId] = { profileId: r.profileId, name: r.name, games: 0, wins: 0, placeSum: 0 };
      }
      s.games += 1;
      s.placeSum += r.place;
      if (r.place === 1) s.wins += 1;
    });
  });

  var arr = Object.keys(map).map(function (k) {
    var s = map[k];
    s.winRate = s.games ? s.wins / s.games : 0;
    s.avgPlace = s.games ? s.placeSum / s.games : 0;
    return s;
  });

  arr.sort(function (a, b) {
    if (a.games === 0 && b.games === 0) return 0;
    if (a.games === 0) return 1;
    if (b.games === 0) return -1;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return a.avgPlace - b.avgPlace;
  });

  return arr;
}
