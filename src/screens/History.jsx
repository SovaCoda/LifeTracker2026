import { useState } from 'preact/hooks';
import { loadGames, saveGames, ordinal, ROLES } from '../state.js';
import { Avatar } from '../components/Avatar.jsx';

function formatDate(iso) {
  try {
    var d = new Date(iso);
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso || '';
  }
}

function modeLabel(m) {
  return m === 'outlaws' ? 'Outlaws' : 'Normal';
}

function roleName(role) {
  return ROLES[role] ? ROLES[role].name : role;
}

// Editing one stored game: reorder placements + fix the mode.
function EditGame(props) {
  var [mode, setMode] = useState(props.game.mode || 'normal');
  var [order, setOrder] = useState(function () {
    return props.game.results.slice().sort(function (a, b) { return a.place - b.place; });
  });

  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= order.length) return;
    var arr = order.slice();
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    setOrder(arr);
  }

  function profileFor(r) {
    var p = props.profiles.filter(function (x) { return x.id === r.profileId; })[0];
    return p || { name: r.name, avatarColor: '#444' };
  }

  function save() {
    var results = order.map(function (r, i) {
      return { profileId: r.profileId, name: r.name, place: i + 1, role: r.role || null };
    });
    props.onSave(Object.assign({}, props.game, { mode: mode, results: results }));
  }

  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">Edit game</h1>
        <div class="subtitle">{formatDate(props.game.date)}</div>

        <div class="mode-row">
          <button class={'mode-btn' + (mode === 'normal' ? ' active' : '')} onClick={function () { setMode('normal'); }}>Normal</button>
          <button class={'mode-btn' + (mode === 'outlaws' ? ' active' : '')} onClick={function () { setMode('outlaws'); }}>Outlaws</button>
        </div>

        <div class="summary-list">
          {order.map(function (r, i) {
            return (
              <div class="summary-row" key={r.profileId}>
                <div class="summary-place">{ordinal(i + 1)}</div>
                <Avatar profile={profileFor(r)} size={42} />
                <div class="summary-name">
                  {r.name}
                  {r.role && <span class="summary-role">{roleName(r.role)}</span>}
                </div>
                <div class="summary-moves">
                  <button class="move-btn" disabled={i === 0} onClick={function () { move(i, -1); }}>&#9650;</button>
                  <button class="move-btn" disabled={i === order.length - 1} onClick={function () { move(i, 1); }}>&#9660;</button>
                </div>
              </div>
            );
          })}
        </div>

        <button class="primary-btn" onClick={save}>Save changes</button>
        <button class="ghost-btn" onClick={props.onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export function History(props) {
  var [games, setGames] = useState(loadGames);
  var [editId, setEditId] = useState(null);
  var [confirmId, setConfirmId] = useState(null);

  function profileFor(r) {
    var p = props.profiles.filter(function (x) { return x.id === r.profileId; })[0];
    return p || { name: r.name, avatarColor: '#444' };
  }

  function persist(next) {
    setGames(next);
    saveGames(next);
  }

  function deleteGame(id) {
    persist(games.filter(function (g) { return g.id !== id; }));
    setConfirmId(null);
  }

  var editing = editId ? games.filter(function (g) { return g.id === editId; })[0] : null;
  if (editing) {
    return (
      <EditGame
        game={editing}
        profiles={props.profiles}
        onCancel={function () { setEditId(null); }}
        onSave={function (updated) {
          persist(games.map(function (g) { return g.id === updated.id ? updated : g; }));
          setEditId(null);
        }}
      />
    );
  }

  var list = games.slice().reverse(); // newest first

  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">Game history</h1>

        {list.length === 0 && <div class="subtitle">No games recorded yet.</div>}

        <div class="history-list">
          {list.map(function (g) {
            var rows = g.results.slice().sort(function (a, b) { return a.place - b.place; });
            return (
              <div class="history-card" key={g.id}>
                <div class="history-meta">
                  <span class="history-date">{formatDate(g.date)}</span>
                  <span class={'history-mode' + (g.mode === 'outlaws' ? ' outlaws' : '')}>{modeLabel(g.mode)}</span>
                </div>

                <div class="history-rows">
                  {rows.map(function (r) {
                    return (
                      <div class="history-row" key={r.profileId}>
                        <span class="history-place">{ordinal(r.place)}</span>
                        <Avatar profile={profileFor(r)} size={30} />
                        <span class="history-name">{r.name}</span>
                        {r.role && <span class="history-role">{roleName(r.role)}</span>}
                      </div>
                    );
                  })}
                </div>

                <div class="history-actions">
                  <button class="link" onClick={function () { setEditId(g.id); }}>Edit</button>
                  {confirmId === g.id ? (
                    <span>
                      <button class="link danger" onClick={function () { deleteGame(g.id); }}>Delete?</button>
                      <button class="link" onClick={function () { setConfirmId(null); }}>Cancel</button>
                    </span>
                  ) : (
                    <button class="link danger" onClick={function () { setConfirmId(g.id); }}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button class="primary-btn" onClick={props.onClose}>Back</button>
      </div>
    </div>
  );
}
