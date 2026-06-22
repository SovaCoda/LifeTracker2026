import { useRef, useEffect } from 'preact/hooks';

// Hearthstone-style tile destruction, drawn on a 2D canvas overlaying the tile:
//   1. cracks spread from the centre while light glows underneath
//   2. a flash, then the face fractures into shards
//   3. shards fly out + fall (screen-down) and fade, revealing what's beneath
//
// Calls onShatter() at the flash (parent hides tile content + shows the place),
// and onDone() when the shards have cleared (parent removes the canvas).

var CRACK_MS = 650;
var SHATTER_MS = 1250;
var GRAVITY = 0.0006; // px per ms^2

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

export function DeathShatter(props) {
  var canvasRef = useRef(null);

  useEffect(function () {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var parent = canvas.parentNode;
    var w = parent.clientWidth || 300;
    var h = parent.clientHeight || 200;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var cx = w / 2;
    var cy = h / 2;
    var color = props.color;
    // gravity points toward the SCREEN bottom even though the canvas may be
    // inside a 180°-rotated tile.
    var gSign = props.rotation === 180 ? -1 : 1;
    var maxR = Math.sqrt(cx * cx + cy * cy) * 1.05;

    // ---- build a spider-web fracture: spokes x rings ----
    var spokes = 10;
    var rings = [0.34, 0.64, 1.0];
    var a0 = Math.random() * Math.PI * 2;
    var angs = [];
    for (var s = 0; s < spokes; s++) {
      angs.push(a0 + (s / spokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.2);
    }
    // grid[s] = [centre, ring1, ring2, ring3] points
    var grid = [];
    for (var s2 = 0; s2 < spokes; s2++) {
      var col = [{ x: cx, y: cy }];
      for (var ri = 0; ri < rings.length; ri++) {
        var r = rings[ri] * (0.8 + Math.random() * 0.35) * maxR;
        col.push({ x: cx + Math.cos(angs[s2]) * r, y: cy + Math.sin(angs[s2]) * r });
      }
      grid.push(col);
    }

    // shards (one per spoke-pair per ring band)
    var shards = [];
    for (var s3 = 0; s3 < spokes; s3++) {
      var sn = (s3 + 1) % spokes;
      for (var band = 0; band < rings.length; band++) {
        var poly;
        if (band === 0) {
          poly = [{ x: cx, y: cy }, grid[s3][1], grid[sn][1]];
        } else {
          poly = [grid[s3][band], grid[s3][band + 1], grid[sn][band + 1], grid[sn][band]];
        }
        var mx = 0, my = 0;
        for (var p = 0; p < poly.length; p++) { mx += poly[p].x; my += poly[p].y; }
        mx /= poly.length; my /= poly.length;
        var dx = mx - cx, dy = my - cy;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var speed = 0.05 + Math.random() * 0.12;
        shards.push({
          poly: poly, mx: mx, my: my,
          vx: (dx / dist) * speed * (0.6 + Math.random() * 0.9),
          vy: (dy / dist) * speed * (0.6 + Math.random() * 0.9) - 0.04, // initial pop
          vr: (Math.random() - 0.5) * 0.013,
          shade: 0.7 + Math.random() * 0.6 // <1 darker, >1 lighter
        });
      }
    }

    var start = nowMs();
    var raf = 0;
    var firedShatter = false;
    var firedDone = false;

    function drawCracks(cp) {
      // glow building underneath
      var glowR = maxR * (0.2 + cp * 0.95);
      var a = 0.12 + cp * 0.55;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      g.addColorStop(0, 'rgba(255,244,210,' + a + ')');
      g.addColorStop(0.45, 'rgba(255,170,60,' + (a * 0.55) + ')');
      g.addColorStop(1, 'rgba(255,120,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      ctx.lineCap = 'round';
      var maxRing = Math.ceil(cp * (rings.length + 0.4));
      for (var s = 0; s < spokes; s++) {
        ctx.beginPath();
        ctx.moveTo(grid[s][0].x, grid[s][0].y);
        for (var ri = 1; ri <= Math.min(rings.length, maxRing); ri++) {
          ctx.lineTo(grid[s][ri].x, grid[s][ri].y);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,215,130,' + (0.55 * cp) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      for (var rg = 1; rg < rings.length; rg++) {
        if (cp < rg / (rings.length + 0.4)) continue;
        ctx.beginPath();
        for (var s4 = 0; s4 <= spokes; s4++) {
          var pt = grid[s4 % spokes][rg];
          if (s4 === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,215,130,' + (0.4 * cp) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawShards(st) {
      if (st < 130) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,245,215,' + (0.65 * (1 - st / 130)) + ')';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      var prog = st / SHATTER_MS;
      var alpha = prog < 0.65 ? 1 : Math.max(0, 1 - (prog - 0.65) / 0.35);
      for (var i = 0; i < shards.length; i++) {
        var sh = shards[i];
        var nx = sh.mx + sh.vx * st;
        var ny = sh.my + sh.vy * st + 0.5 * GRAVITY * gSign * st * st;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(nx, ny);
        ctx.rotate(sh.vr * st);
        ctx.beginPath();
        for (var v = 0; v < sh.poly.length; v++) {
          var px = sh.poly[v].x - sh.mx;
          var py = sh.poly[v].y - sh.my;
          if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = sh.shade < 1
          ? 'rgba(0,0,0,' + ((1 - sh.shade) * 0.55) + ')'
          : 'rgba(255,255,255,' + ((sh.shade - 1) * 0.45) + ')';
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      var t = nowMs() - start;
      ctx.clearRect(0, 0, w, h);
      if (t < CRACK_MS) {
        drawCracks(t / CRACK_MS);
      } else {
        if (!firedShatter) { firedShatter = true; if (props.onShatter) props.onShatter(); }
        var st = t - CRACK_MS;
        drawShards(st);
        if (st >= SHATTER_MS) {
          if (!firedDone) { firedDone = true; if (props.onDone) props.onDone(); }
          return;
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return function () { if (raf) cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} class="shatter-canvas" />;
}
