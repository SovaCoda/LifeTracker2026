import { useState } from 'preact/hooks';
import { ordinal, ROLES } from '../state.js';
import { Avatar } from '../components/Avatar.jsx';

// End-of-game results. Rows start in the auto-tracked order; ▲/▼ let you fix
// any placements before saving.
export function Summary(props) {
  var profiles = props.profiles;

  var sorted = props.game.players.slice().sort(function (a, b) {
    return (a.place || 99) - (b.place || 99);
  });
  var [order, setOrder] = useState(sorted);

  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= order.length) return;
    var arr = order.slice();
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    setOrder(arr);
  }

  function profileFor(p) {
    var prof = profiles.filter(function (x) { return x.id === p.profileId; })[0];
    return prof || { name: p.name, avatarColor: p.color };
  }

  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">Results</h1>
        <div class="summary-list">
          {order.map(function (p, i) {
            return (
              <div class="summary-row" key={p.id}>
                <div class="summary-place">{ordinal(i + 1)}</div>
                <Avatar profile={profileFor(p)} size={46} ring={p.color} />
                <div class="summary-name">
                  {p.name}
                  {p.role && <span class="summary-role">{ROLES[p.role].name}</span>}
                </div>
                <div class="summary-moves">
                  <button class="move-btn" disabled={i === 0} onClick={function () { move(i, -1); }}>&#9650;</button>
                  <button class="move-btn" disabled={i === order.length - 1} onClick={function () { move(i, 1); }}>&#9660;</button>
                </div>
              </div>
            );
          })}
        </div>
        <button class="primary-btn" onClick={function () { props.onFinish(order); }}>Save &amp; new game</button>
      </div>
    </div>
  );
}
