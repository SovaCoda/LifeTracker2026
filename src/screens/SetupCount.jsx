// Step 1 of the flow: mode + how many players.
export function SetupCount(props) {
  var mode = props.mode;
  var outlaws = mode === 'outlaws';

  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">New game</h1>

        <div class="mode-row">
          <button
            class={'mode-btn' + (mode === 'normal' ? ' active' : '')}
            onClick={function () { props.onSetMode('normal'); }}
          >
            Normal
          </button>
          <button
            class={'mode-btn' + (outlaws ? ' active' : '')}
            onClick={function () { props.onSetMode('outlaws'); }}
          >
            Outlaws
          </button>
        </div>

        <div class="count-label">How many players?</div>
        <div class="count-grid">
          {[2, 3, 4, 5, 6].map(function (n) {
            var disabled = outlaws && n < 4;
            return (
              <button
                key={n}
                class="count-btn"
                disabled={disabled}
                onClick={function () { if (!disabled) props.onPick(n); }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
