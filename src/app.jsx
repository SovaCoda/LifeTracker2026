import { useState, useEffect, useCallback } from 'preact/hooks';
import { loadGame, saveGame, defaultPlayers, FORMATS } from './state.js';
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

  function setPlayerCount(count) {
    setGame(function (g) {
      // keep existing players' names/colors/life where they exist; add fresh seats otherwise
      var fresh = defaultPlayers(count, g.startingLife);
      var players = fresh.map(function (p, i) {
        var existing = g.players[i];
        if (existing) {
          return Object.assign({}, p, {
            name: existing.name,
            color: existing.color,
            life: existing.life
          });
        }
        return p;
      });
      return Object.assign({}, g, { playerCount: count, players: players });
    });
  }

  function setFormat(formatId) {
    var fmt = FORMATS.filter(function (f) { return f.id === formatId; })[0];
    setGame(function (g) {
      return Object.assign({}, g, {
        formatId: formatId,
        startingLife: fmt.life,
        players: g.players.map(function (p) {
          return Object.assign({}, p, { life: fmt.life });
        })
      });
    });
    setMenuOpen(false);
  }

  function resetLife() {
    setGame(function (g) {
      return Object.assign({}, g, {
        players: g.players.map(function (p) {
          return Object.assign({}, p, { life: g.startingLife });
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
        return (
          <div class="seat" key={p.id} style={{ gridArea: area }}>
            <PlayerTile
              player={p}
              rotation={layout.rotations[area]}
              onAdjust={adjustLife}
              onRename={rename}
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

            <div class="menu-title">Format</div>
            <div class="menu-col">
              {FORMATS.map(function (f) {
                return (
                  <button
                    key={f.id}
                    class={'menu-item' + (game.formatId === f.id ? ' active' : '')}
                    onClick={function () { setFormat(f.id); }}
                  >
                    {f.name} &middot; {f.life}
                  </button>
                );
              })}
            </div>

            <button class="menu-item reset" onClick={resetLife}>Reset life</button>
          </div>
        )}
      </div>
    </div>
  );
}
