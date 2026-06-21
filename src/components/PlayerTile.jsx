import { useState, useRef, useEffect } from 'preact/hooks';

// How long the running "+N / -N" change indicator stays before fading out.
var DELTA_TIMEOUT = 2500;
// Press-and-hold: wait this long, then repeat at this interval.
var HOLD_DELAY = 450;
var HOLD_RATE = 130;

export function PlayerTile(props) {
  var player = props.player;
  var rotation = props.rotation;
  var onAdjust = props.onAdjust; // (id, amount)
  var onRename = props.onRename; // (id, name)

  var [delta, setDelta] = useState(0);
  var [showDelta, setShowDelta] = useState(false);
  var [editing, setEditing] = useState(false);

  // refs so press-and-hold timers and the running total survive re-renders
  // without stale-closure bugs.
  var deltaValue = useRef(0);
  var deltaActive = useRef(false);
  var deltaTimer = useRef(null);
  var holdDelay = useRef(null);
  var holdRepeat = useRef(null);

  function bump(amount) {
    onAdjust(player.id, amount);

    if (!deltaActive.current) {
      deltaValue.current = 0;
      deltaActive.current = true;
    }
    deltaValue.current += amount;
    setDelta(deltaValue.current);
    setShowDelta(true);

    if (deltaTimer.current) clearTimeout(deltaTimer.current);
    deltaTimer.current = setTimeout(function () {
      setShowDelta(false);
      deltaActive.current = false;
    }, DELTA_TIMEOUT);
  }

  function startHold(amount) {
    bump(amount);
    holdDelay.current = setTimeout(function () {
      holdRepeat.current = setInterval(function () {
        bump(amount);
      }, HOLD_RATE);
    }, HOLD_DELAY);
  }

  function endHold() {
    if (holdDelay.current) {
      clearTimeout(holdDelay.current);
      holdDelay.current = null;
    }
    if (holdRepeat.current) {
      clearInterval(holdRepeat.current);
      holdRepeat.current = null;
    }
  }

  // clean up timers if the tile unmounts mid-press (e.g. player count changes)
  useEffect(function () {
    return function () {
      endHold();
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
    };
  }, []);

  // iOS 12 Safari has no Pointer Events, so we wire touch + mouse separately.
  // preventDefault on touchstart suppresses the synthesized mouse/click events
  // so a tap doesn't fire twice on the iPad.
  function press(amount) {
    return function (e) {
      if (e.type === 'touchstart') e.preventDefault();
      startHold(amount);
    };
  }

  var deltaText = delta > 0 ? '+' + delta : String(delta);

  return (
    <div class="tile" style={{ transform: 'rotate(' + rotation + 'deg)', background: player.color }}>
      <div class="tile-top">
        {editing ? (
          <input
            class="name-input"
            value={player.name}
            autofocus
            onInput={function (e) { onRename(player.id, e.target.value); }}
            onBlur={function () { setEditing(false); }}
            onKeyDown={function (e) { if (e.key === 'Enter') setEditing(false); }}
          />
        ) : (
          <button class="name" onClick={function () { setEditing(true); }}>
            {player.name}
          </button>
        )}
      </div>

      <div class="tile-mid">
        <button
          class="adjust minus"
          onTouchStart={press(-1)}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
          onMouseDown={press(-1)}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onContextMenu={function (e) { e.preventDefault(); }}
        >
          &minus;
        </button>

        <div class="life-wrap">
          <div class="life">{player.life}</div>
          <div class={'delta' + (showDelta ? ' show' : '')}>{deltaText}</div>
        </div>

        <button
          class="adjust plus"
          onTouchStart={press(1)}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
          onMouseDown={press(1)}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onContextMenu={function (e) { e.preventDefault(); }}
        >
          +
        </button>
      </div>
    </div>
  );
}
