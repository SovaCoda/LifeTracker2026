import { useState } from 'preact/hooks';
import { LAYOUTS } from '../layouts.js';
import { ordinal } from '../state.js';
import { PlayerTile } from './PlayerTile.jsx';

export function Board(props) {
  var game = props.game;
  var [menuOpen, setMenuOpen] = useState(false);

  var layout = LAYOUTS[game.players.length];
  var boardStyle = {
    display: 'grid',
    gridTemplateColumns: layout.columns,
    gridTemplateRows: layout.rows,
    gridTemplateAreas: layout.areas,
    width: '100%',
    height: '100%'
  };

  var dying = props.pendingDeath != null
    ? game.players.filter(function (p) { return p.id === props.pendingDeath; })[0]
    : null;
  var pendingPlace = dying
    ? game.players.filter(function (p) { return p.place == null; }).length
    : 0;

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
              place={p.place}
              onAdjust={props.onAdjust}
              onCounter={props.onCounter}
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
            <button
              class="menu-item"
              onClick={function () { setMenuOpen(false); props.onShowStats(); }}
            >
              Stats
            </button>
            <button
              class="menu-item"
              onClick={function () { setMenuOpen(false); props.onResetLife(); }}
            >
              Reset life
            </button>
            <button
              class="menu-item"
              onClick={function () { setMenuOpen(false); props.onEndGame(); }}
            >
              End game
            </button>
            <button
              class="menu-item danger"
              onClick={function () { setMenuOpen(false); props.onNewGame(); }}
            >
              New game
            </button>
          </div>
        )}
      </div>

      {dying && (
        <div class="death-backdrop">
          <div class="death-modal">
            <div class="death-title">{dying.name} is out?</div>
            <div class="death-sub">Records as {ordinal(pendingPlace)} place</div>
            <div class="death-actions">
              <button class="death-no" onClick={props.onDismissDeath}>Not yet</button>
              <button class="death-yes" onClick={props.onConfirmDeath}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
