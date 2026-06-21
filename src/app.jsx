import { useState, useEffect, useCallback } from 'preact/hooks';
import { loadGame, saveGame, defaultPlayers, STARTING_LIFE } from './state.js';
import { LAYOUTS } from './layouts.js';
import { PlayerTile } from './components/PlayerTile.jsx';

export function App() {
  var [game, setGame] = useState(loadGame);
  var [menuOpen, setMenuOpen] = useState(false);

  // persist on every change
  useEffect(function () { saveGame(game); }, [game]);

  var adjustLife = useCallback(function (id, amount) {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          return p.id === id ? Object.assign({}, p, { life: p.life + amount }) : p;
        })
      });
    });
  }, []);

  var rename = useCallback(function (id, name) {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          return p.id === id ? Object.assign({}, p, { name: name }) : p;
        })
      });
    });
  }, []);

  // kind: 'poison' | 'energy' | 'cmdr'. For 'cmdr', oppId is the attacker.
  var adjustCounter = useCallback(function (id, kind, amount, oppId) {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          if (p.id !== id) return p;
          if (kind === 'poison') {
            return Object.assign({}, p, { poison: Math.max(0, p.poison + amount) });
          }
          if (kind === 'energy') {
            return Object.assign({}, p, { energy: Math.max(0, p.energy + amount) });
          }
          // commander damage: clamp at 0, and mirror the real change onto life
          // (commander damage IS combat damage, so it costs life too).
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

  function setPlayerCount(count) {
    setGame(function (g) {
      // keep existing seats; add fresh ones for any new seats
      var fresh = defaultPlayers(count);
      var players = fresh.map(function (p, i) {
        var existing = g.players[i];
        return existing ? existing : p;
      });
      return Object.assign({}, g, { playerCount: count, players: players });
    });
  }

  function resetGame() {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          return Object.assign({}, p, {
            life: STARTING_LIFE,
            poison: 0,
            energy: 0,
            cmdrDmg: {}
          });
        })
      });
    });
    setMenuOpen(false);
  }

  var layout = LAYOUTS[game.playerCount];
  var boardStyle = {
    display: 'grid',
    gridTemplateColumns: layout.columns,
    gridTemplateRows: layout.rows,
    gridTemplateAreas: layout.areas,
    width: '100%',
    height: '100%'
  };

  return (
    <div class="board" style={boardStyle}>
      {game.players.map(function (p, i) {
        var area = 'p' + (i + 1);
        var opponents = game.players
          .filter(function (o) { return o.id !== p.id; })
          .map(function (o) { return { id: o.id, name: o.name, color: o.color }; });
        return (
          <div class="seat" key={p.id} style={{ gridArea: area }}>
            <PlayerTile
              player={p}
              opponents={opponents}
              rotation={layout.rotations[area]}
              onAdjust={adjustLife}
              onRename={rename}
              onCounter={adjustCounter}
            />
          </div>
        );
      })}

      <div class="center">
        <button
          class="center-btn"
          aria-label="Menu"
          onClick={function () { setMenuOpen(function (o) { return !o; }); }}
        >
          &#9776;
        </button>

        {menuOpen && (
          <div class="menu">
            <div class="menu-title">Players</div>
            <div class="menu-row">
              {[2, 3, 4, 5, 6].map(function (n) {
                return (
                  <button
                    key={n}
                    class={'pill' + (game.playerCount === n ? ' active' : '')}
                    onClick={function () { setPlayerCount(n); }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <button class="menu-item reset" onClick={resetGame}>Reset game</button>
          </div>
        )}
      </div>
    </div>
  );
}
