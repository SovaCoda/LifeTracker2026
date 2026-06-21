import { useState, useRef } from 'preact/hooks';
import { PLAYER_COLORS } from '../state.js';
import { Avatar } from '../components/Avatar.jsx';

var AVATAR_SIZE = 256; // output square size for stored photos

// Read a chosen image file, center-crop to a square, scale down, and hand back
// a small JPEG data URL. No user preprocessing needed.
function fileToAvatar(file, cb) {
  var url = URL.createObjectURL(file);
  var img = new Image();
  img.onload = function () {
    var side = Math.min(img.width, img.height);
    var sx = (img.width - side) / 2;
    var sy = (img.height - side) / 2;
    var canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    URL.revokeObjectURL(url);
    cb(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = function () { URL.revokeObjectURL(url); };
  img.src = url;
}

// Step 2: pick a color, then tap a profile to seat them. Camera badge sets a photo.
export function SetupPlayers(props) {
  var playerCount = props.playerCount;
  var profiles = props.profiles;

  var [seats, setSeats] = useState([]); // [{ profileId, color }]
  var [activeColor, setActiveColor] = useState(PLAYER_COLORS[0]);

  var fileInput = useRef(null);
  var targetId = useRef(null);

  var usedColors = seats.map(function (s) { return s.color; });
  var freeColors = PLAYER_COLORS.filter(function (c) { return usedColors.indexOf(c) < 0; });
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

  function pickPhoto(profileId, e) {
    e.stopPropagation(); // don't toggle the seat
    targetId.current = profileId;
    if (fileInput.current) fileInput.current.click();
  }

  function onFile(e) {
    var file = e.target.files && e.target.files[0];
    if (file && targetId.current) {
      fileToAvatar(file, function (dataUrl) {
        props.onSetAvatar(targetId.current, dataUrl);
      });
    }
    e.target.value = ''; // allow re-picking the same file later
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
        <div class="subtitle">Pick a color, then tap a player &middot; {seats.length} / {playerCount}</div>

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
              <div key={p.id} class={cls} onClick={function () { toggleProfile(p.id); }}>
                <div class="avatar-wrap">
                  <Avatar profile={p} size={84} ring={seat ? seat.color : null} />
                  <button class="cam-badge" onClick={function (e) { pickPhoto(p.id, e); }}>
                    &#128247;
                  </button>
                </div>
                <div class="pname">{p.name}</div>
              </div>
            );
          })}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onFile}
        />

        <button class="primary-btn" disabled={!full} onClick={start}>Start game</button>
        <button class="ghost-btn" onClick={props.onShowStats}>View stats</button>
        <button class="ghost-btn" onClick={props.onBack}>Back</button>
      </div>
    </div>
  );
}
