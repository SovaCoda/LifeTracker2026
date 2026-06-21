// Step 1 of the flow: how many players?
export function SetupCount(props) {
  return (
    <div class="setup">
      <div class="setup-inner">
        <h1 class="setup-title">How many players?</h1>
        <div class="count-grid">
          {[2, 3, 4, 5, 6].map(function (n) {
            return (
              <button key={n} class="count-btn" onClick={function () { props.onPick(n); }}>
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
