import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import {
  loadSession, saveSession, loadProfiles, saveGameResult,
  createGameFromSeats, isPlayerDead, STARTING_LIFE
} from './state.js';
import { SetupCount } from './screens/SetupCount.jsx';
import { SetupPlayers } from './screens/SetupPlayers.jsx';
import { Summary } from './screens/Summary.jsx';
import { Board } from './components/Board.jsx';

export function App() {
  var initial = loadSession();
  var [phase, setPhase] = useState(initial.phase);
  var [playerCount, setPlayerCount] = useState(initial.playerCount || 4);
  var [game, setGame] = useState(initial.game);
  var [pendingDeath, setPendingDeath] = useState(null);
  var [profiles] = useState(loadProfiles);
  var dismissed = useRef({}); // seat ids whose death prompt was waved off (until they recover)

  // persist the whole flow so a reload resumes exactly where we were
  useEffect(function () {
    saveSession({ phase: phase, playerCount: playerCount, game: game });
  }, [phase, playerCount, game]);

  // ---- in-game life / counter edits ----
  var adjustLife = useCallback(function (id, amount) {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          return p.id === id ? Object.assign({}, p, { life: p.life + amount }) : p;
        })
      });
    });
  }, []);

  var adjustCounter = useCallback(function (id, kind, amount, oppId) {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          if (p.id !== id) return p;
          if (kind === 'poison') return Object.assign({}, p, { poison: Math.max(0, p.poison + amount) });
          if (kind === 'energy') return Object.assign({}, p, { energy: Math.max(0, p.energy + amount) });
          // commander damage is combat damage -> mirror the real change onto life
          var cur = p.cmdrDmg[oppId] || 0;
          var next = Math.max(0, cur + amount);
          var applied = next - cur;
          var cmdrDmg = Object.assign({}, p.cmdrDmg);
          cmdrDmg[oppId] = next;
          return Object.assign({}, p, { cmdrDmg: cmdrDmg, life: p.life - applied });
        })
      });
    });
  }, []);

  // ---- death detection: prompt once per player when they cross into lethal ----
  useEffect(function () {
    if (phase !== 'playing' || !game) return;
    // forget dismissals for anyone who has recovered
    game.players.forEach(function (p) {
      if (dismissed.current[p.id] && !isPlayerDead(p)) delete dismissed.current[p.id];
    });
    if (pendingDeath != null) return;
    for (var i = 0; i < game.players.length; i++) {
      var p = game.players[i];
      if (p.place == null && !dismissed.current[p.id] && isPlayerDead(p)) {
        setPendingDeath(p.id);
        return;
      }
    }
  }, [game, phase, pendingDeath]);

  // ---- game over -> summary ----
  useEffect(function () {
    if (phase === 'playing' && game && game.players.length &&
        game.players.every(function (p) { return p.place != null; })) {
      setPhase('summary');
    }
  }, [game, phase]);

  function confirmDeath() {
    var id = pendingDeath;
    setGame(function (g) {
      var stillIn = g.players.filter(function (p) { return p.place == null; }).length;
      var place = stillIn; // the player going out takes the lowest open place
      var players = g.players.map(function (p) {
        return p.id === id ? Object.assign({}, p, { place: place }) : p;
      });
      var remaining = players.filter(function (p) { return p.place == null; });
      if (remaining.length === 1) {
        players = players.map(function (p) {
          return p.place == null ? Object.assign({}, p, { place: 1 }) : p;
        });
      }
      return Object.assign({}, g, { players: players });
    });
    setPendingDeath(null);
  }

  function dismissDeath() {
    if (pendingDeath != null) dismissed.current[pendingDeath] = true;
    setPendingDeath(null);
  }

  // ---- flow transitions ----
  function pickCount(n) { setPlayerCount(n); setPhase('setup-players'); }
  function startGame(seats) { setGame(createGameFromSeats(seats)); setPhase('playing'); }
  function backToCount() { setPhase('setup-count'); }

  function resetLife() {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          return Object.assign({}, p, {
            life: STARTING_LIFE, poison: 0, energy: 0, cmdrDmg: {}, place: null
          });
        })
      });
    });
    dismissed.current = {};
    setPendingDeath(null);
  }

  function abandonGame() {
    setGame(null);
    setPendingDeath(null);
    dismissed.current = {};
    setPhase('setup-count');
  }

  function finishGame(ordered) {
    var result = {
      date: new Date().toISOString(),
      results: ordered.map(function (p, i) {
        return { profileId: p.profileId, name: p.name, place: i + 1 };
      })
    };
    saveGameResult(result);
    setGame(null);
    dismissed.current = {};
    setPhase('setup-count');
  }

  // ---- render by phase ----
  if (phase === 'setup-count') {
    return <SetupCount onPick={pickCount} />;
  }
  if (phase === 'setup-players') {
    return <SetupPlayers playerCount={playerCount} profiles={profiles} onBack={backToCount} onStart={startGame} />;
  }
  if (phase === 'summary' && game) {
    return <Summary game={game} profiles={profiles} onFinish={finishGame} />;
  }
  if (game) {
    return (
      <Board
        game={game}
        onAdjust={adjustLife}
        onCounter={adjustCounter}
        onResetLife={resetLife}
        onNewGame={abandonGame}
        pendingDeath={pendingDeath}
        onConfirmDeath={confirmDeath}
        onDismissDeath={dismissDeath}
      />
    );
  }
  // fallback (e.g. corrupt session)
  return <SetupCount onPick={pickCount} />;
}
