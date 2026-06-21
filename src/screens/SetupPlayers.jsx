import { useState } from 'preact/hooks';
import { PLAYER_COLORS } from '../state.js';
import { Avatar } from '../components/Avatar.jsx';

// Step 2: pick a colour, then tap a profile to seat that player.
export function SetupPlayers(props) {
  var playerCount = props.playerCount;
  var profiles = props.profiles;

  var [seats, setSeats] = useState([]); // [{ profileId, color }]
  var [activeColor, setActiveColor] = useState(PLAYER_COLORS[0]);

  var usedColors = seats.map(function (s) { return s.color; });
  var freeColors = PLAYER_COLORS.filter(function (c) { return usedColors.indexOf(c) < 0; });
  // the colour we'll actually assign next (chosen one if still free, else first free)
  var nextColor = usedColors.indexOf(activeColor) < 0 ? activeColor : freeColors[0];
  var full = seats.length >= playerCount;

  function seatOf(profileId) {
    return seats.filter(function (s) { return s.profileId === profileId; })[0];
  }

  function toggleProfile(profileId) {
    if (seatOf(profileId)) {
      setSeats(seats.filter(function (s) { return s.profileId !== profileId; }));
      return;
    }
    if (full || !nextColor) return;
    var next = seats.concat([{ profileId: profileId, color: nextColor }]);
    setSeats(next);
    var nowUsed = next.map(function (s) { return s.color; });
    var stillFree = PLAYER_COLORS.filter(function (c) { return nowUsed.indexOf(c) < 0; });
    setActiveColor(stillFree.length ? stillFree[0] : nextColor);
  }

  function start() {
    if (seats.length !== playerCount) return;
    var withNames = seats.map(function (s) {
      var prof = profiles.filter(function (p) { return p.id === s.profileId; })[0];
      return { profileId: s.profileId, name: prof ? prof.name : 'Player', color: s.color };
    });
    props.onStart(withNames);
  }

  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">Who's playing?</h1>
        <div class="subtitle">Pick a colour, then tap a player &middot; {seats.length} / {playerCount}</div>

        <div class="color-row">
          {PLAYER_COLORS.map(function (c) {
            var used = usedColors.indexOf(c) >= 0;
            var cls = 'swatch-btn' + (used ? ' used' : (c === nextColor ? ' active' : ''));
            return (
              <button
                key={c}
                class={cls}
                style={{ background: c }}
                onClick={function () { if (!used) setActiveColor(c); }}
              />
            );
          })}
        </div>

        <div class="profile-grid">
          {profiles.map(function (p) {
            var seat = seatOf(p.id);
            var disabled = !seat && full;
            var cls = 'profile-cell' + (seat ? ' seated' : '') + (disabled ? ' disabled' : '');
            return (
              <button key={p.id} class={cls} onClick={function () { toggleProfile(p.id); }}>
                <Avatar profile={p} size={84} ring={seat ? seat.color : null} />
                <div class="pname">{p.name}</div>
              </button>
            );
          })}
        </div>

        <button class="primary-btn" disabled={!full} onClick={start}>Start game</button>
        <button class="ghost-btn" onClick={props.onBack}>Back</button>
      </div>
    </div>
  );
}
