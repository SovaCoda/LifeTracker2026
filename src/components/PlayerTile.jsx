import { useState, useRef, useEffect } from 'preact/hooks';
import { POISON_LETHAL, CMDR_LETHAL, DINO_GREEN, ROLES, ordinal } from '../state.js';

// Easter egg: random dinosaur roar.
function playRoar() {
  var n = 1 + Math.floor(Math.random() * 3);
  try {
    var audio = new Audio(import.meta.env.BASE_URL + 'audio/roar' + n + '.mp3');
    audio.play().catch(function () { /* ignore autoplay blocks */ });
  } catch (e) { /* ignore */ }
}

// How long the running "+N / -N" change indicator stays before fading out.
var DELTA_TIMEOUT = 2500;
// Press-and-hold: wait this long, then repeat at this interval.
var HOLD_DELAY = 450;
var HOLD_RATE = 130;

export function PlayerTile(props) {
  var player = props.player;
  var opponents = props.opponents;
  var rotation = props.rotation;
  var place = props.place; // null = still in; otherwise final placement
  var onAdjust = props.onAdjust; // (id, amount)
  var onCounter = props.onCounter; // (id, kind, amount, oppId)

  var [delta, setDelta] = useState(0);
  var [showDelta, setShowDelta] = useState(false);
  var [open, setOpen] = useState(null); // open counter stepper: { kind, oppId, name, color }
  var [roleOpen, setRoleOpen] = useState(false);

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
      holdRepeat.current = setInterval(function () { bump(amount); }, HOLD_RATE);
    }, HOLD_DELAY);
  }

  function endHold() {
    if (holdDelay.current) { clearTimeout(holdDelay.current); holdDelay.current = null; }
    if (holdRepeat.current) { clearInterval(holdRepeat.current); holdRepeat.current = null; }
  }

  useEffect(function () {
    return function () {
      endHold();
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
    };
  }, []);

  // iOS 12 Safari has no Pointer Events -> wire touch + mouse separately.
  function press(amount) {
    return function (e) {
      if (e.type === 'touchstart') e.preventDefault();
      startHold(amount);
    };
  }

  // ---- counters ----
  function counterValue(c) {
    if (!c) return 0;
    if (c.kind === 'poison') return player.poison;
    if (c.kind === 'energy') return player.energy;
    return player.cmdrDmg[c.oppId] || 0;
  }
  function isLethal(c, value) {
    if (!c) return false;
    if (c.kind === 'poison') return value >= POISON_LETHAL;
    if (c.kind === 'cmdr') return value >= CMDR_LETHAL;
    return false;
  }
  function step(amount) {
    onCounter(player.id, open.kind, amount, open.oppId);
  }

  var poisonLethal = player.poison >= POISON_LETHAL;
  var eliminated = place != null;
  var dinoEgg = player.profileId === 'houston' && player.color === DINO_GREEN;
  var roleInfo = player.role ? ROLES[player.role] : null;

  var deltaText = delta > 0 ? '+' + delta : String(delta);
  var openValue = counterValue(open);

  return (
    <div
      class={'tile' + (eliminated ? ' dead' : '')}
      style={{ transform: 'rotate(' + rotation + 'deg)', background: player.color }}
    >
      <div class="tile-top">
        <div class="name">{player.name}</div>
        {roleInfo && roleInfo.public && (
          <button class="role-badge sheriff" onClick={function () { setRoleOpen(true); }}>
            &#9733; Sheriff
          </button>
        )}
        {roleInfo && !roleInfo.public && (
          <button class="role-badge" onClick={function () { setRoleOpen(true); }}>Role</button>
        )}
        {dinoEgg && (
          <button class="dino-btn" onClick={playRoar} aria-label="Roar">&#129430;</button>
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

      <div class="counters">
        <div class="crow utility">
          <button
            class={'counter' + (poisonLethal ? ' lethal' : (player.poison ? '' : ' dim'))}
            onClick={function () { setOpen({ kind: 'poison' }); }}
          >
            <span class="ico">&#9760;</span>{player.poison}
          </button>

          <button
            class={'counter' + (player.energy ? '' : ' dim')}
            onClick={function () { setOpen({ kind: 'energy' }); }}
          >
            <span class="ico">&#9889;</span>{player.energy}
          </button>
        </div>

        <div class="crow cmdr-row">
          {opponents.map(function (o) {
            var dmg = player.cmdrDmg[o.id] || 0;
            var lethal = dmg >= CMDR_LETHAL;
            return (
              <button
                key={o.id}
                class={'cmdr-pip' + (lethal ? ' lethal' : '')}
                style={{ background: o.color }}
                onClick={function () { setOpen({ kind: 'cmdr', oppId: o.id, name: o.name, color: o.color }); }}
              >
                {dmg}
              </button>
            );
          })}
        </div>
      </div>

      {eliminated && <div class="place-badge">{ordinal(place)}</div>}

      {roleOpen && roleInfo && (
        <div class="role-backdrop" onClick={function () { setRoleOpen(false); }}>
          <div class="role-card" onClick={function (e) { e.stopPropagation(); }}>
            <div class="role-eyebrow">You are</div>
            <div class="role-name">{roleInfo.name}</div>
            <div class="role-goal">{roleInfo.goal}</div>
            <button class="role-hide" onClick={function () { setRoleOpen(false); }}>Hide</button>
          </div>
        </div>
      )}

      {open && (
        <div class="stepper-backdrop" onClick={function () { setOpen(null); }}>
          <div class="stepper" onClick={function (e) { e.stopPropagation(); }}>
            <div class="stepper-label">
              {open.kind === 'poison' ? 'Poison ☠' : null}
              {open.kind === 'energy' ? 'Energy ⚡' : null}
              {open.kind === 'cmdr' ? open.name + "'s commander" : null}
            </div>
            <div class="stepper-row">
              <button class="sbtn" onClick={function () { step(-1); }}>&minus;</button>
              <div class={'stepper-val' + (isLethal(open, openValue) ? ' lethal' : '')}>{openValue}</div>
              <button class="sbtn" onClick={function () { step(1); }}>+</button>
            </div>
            <button class="stepper-close" onClick={function () { setOpen(null); }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
