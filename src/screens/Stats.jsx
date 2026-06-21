import { useState } from 'preact/hooks';
import { computeStats, clearGames } from '../state.js';
import { Avatar } from '../components/Avatar.jsx';

export function Stats(props) {
  var [stats, setStats] = useState(function () { return computeStats(props.profiles); });
  var [confirmClear, setConfirmClear] = useState(false);

  function profileFor(s) {
    var p = props.profiles.filter(function (x) { return x.id === s.profileId; })[0];
    return p || { name: s.name, avatarColor: '#444' };
  }

  function doClear() {
    clearGames();
    setStats(computeStats(props.profiles));
    setConfirmClear(false);
  }

  var anyGames = stats.some(function (s) { return s.games > 0; });

  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">Stats</h1>

        {!anyGames && <div class="subtitle">No games recorded yet.</div>}

        {anyGames && (
          <div class="stats-list">
            <div class="stats-head">
              <div class="stats-name">Player</div>
              <div class="stats-cell">Games</div>
              <div class="stats-cell">Wins</div>
              <div class="stats-cell">Win %</div>
              <div class="stats-cell">Avg</div>
            </div>
            {stats.map(function (s) {
              return (
                <div class="stats-row" key={s.profileId}>
                  <div class="stats-name">
                    <Avatar profile={profileFor(s)} size={38} />
                    <span class="stats-pname">{s.name}</span>
                  </div>
                  <div class="stats-cell">{s.games}</div>
                  <div class="stats-cell">{s.wins}</div>
                  <div class="stats-cell">{s.games ? Math.round(s.winRate * 100) + '%' : '—'}</div>
                  <div class="stats-cell">{s.games ? s.avgPlace.toFixed(1) : '—'}</div>
                </div>
              );
            })}
          </div>
        )}

        {anyGames && (
          <button class="ghost-btn" onClick={props.onShowHistory}>View / edit games</button>
        )}
        <button class="primary-btn" onClick={props.onClose}>Back</button>

        {anyGames && !confirmClear && (
          <button class="ghost-btn" onClick={function () { setConfirmClear(true); }}>Clear history</button>
        )}

        {confirmClear && (
          <div class="confirm-row">
            <span>Clear all recorded games?</span>
            <button class="link danger" onClick={doClear}>Yes, clear</button>
            <button class="link" onClick={function () { setConfirmClear(false); }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
