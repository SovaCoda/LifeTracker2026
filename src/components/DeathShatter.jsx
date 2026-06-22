import { useRef, useEffect } from 'preact/hooks';

// Hearthstone-style tile destruction on a 2D canvas overlaying the tile:
//   1. cracks spread from the centre while light glows underneath
//   2. a flash, then the face fractures into shards
//   3. shards fly out + fall (screen-down) and fade, revealing what's beneath
//
// variant: 'web'    -> spider-web crack pattern (default)
//          'bricks' -> brick-wall pattern (Mark's easter egg)
//
// Calls onShatter() at the flash (parent hides content + shows the place) and
// onDone() when the shards have cleared (parent removes the canvas).

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
    // gravity points to the SCREEN bottom even inside a 180°-rotated tile.
    var gSign = props.rotation === 180 ? -1 : 1;
    var maxR = Math.sqrt(cx * cx + cy * cy) * 1.05;
    var bricks = props.variant === 'bricks';

    // Turn a polygon into a flying shard: outward velocity from impact + spin.
    function makeShard(poly) {
      var mx = 0, my = 0;
      for (var p = 0; p < poly.length; p++) { mx += poly[p].x; my += poly[p].y; }
      mx /= poly.length; my /= poly.length;
      var dx = mx - cx, dy = my - cy;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var speed = 0.05 + Math.random() * 0.12;
      return {
        poly: poly, mx: mx, my: my,
        vx: (dx / dist) * speed * (0.6 + Math.random() * 0.9),
        vy: (dy / dist) * speed * (0.6 + Math.random() * 0.9) - 0.04, // initial pop
        vr: (Math.random() - 0.5) * (bricks ? 0.009 : 0.013),        // bricks tumble less
        shade: 0.7 + Math.random() * 0.6 // <1 darker, >1 lighter
      };
    }

    var shards = [];
    var web = null; // { spokes, rings, grid } — only for the web crack drawing

    function buildWeb() {
      var spokes = 10;
      var rings = [0.34, 0.64, 1.0];
      var a0 = Math.random() * Math.PI * 2;
      var angs = [];
      for (var s = 0; s < spokes; s++) {
        angs.push(a0 + (s / spokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.2);
      }
      var grid = [];
      for (var s2 = 0; s2 < spokes; s2++) {
        var col = [{ x: cx, y: cy }];
        for (var ri = 0; ri < rings.length; ri++) {
          var r = rings[ri] * (0.8 + Math.random() * 0.35) * maxR;
          col.push({ x: cx + Math.cos(angs[s2]) * r, y: cy + Math.sin(angs[s2]) * r });
        }
        grid.push(col);
      }
      for (var s3 = 0; s3 < spokes; s3++) {
        var sn = (s3 + 1) % spokes;
        for (var band = 0; band < rings.length; band++) {
          var poly;
          if (band === 0) poly = [{ x: cx, y: cy }, grid[s3][1], grid[sn][1]];
          else poly = [grid[s3][band], grid[s3][band + 1], grid[sn][band + 1], grid[sn][band]];
          shards.push(makeShard(poly));
        }
      }
      web = { spokes: spokes, rings: rings, grid: grid };
    }

    function buildBricks() {
      var rows = 6;
      var bh = h / rows;
      var bw = w / 4.5;
      for (var r = 0; r < rows; r++) {
        var y0 = r * bh;
        var y1 = y0 + bh;
        var x = (r % 2 === 0) ? 0 : -bw / 2; // running-bond offset on odd rows
        while (x < w) {
          var x0 = Math.max(0, x);
          var x1 = Math.min(w, x + bw);
          if (x1 - x0 > 2) {
            shards.push(makeShard([
              { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }
            ]));
          }
          x += bw;
        }
      }
    }

    if (bricks) buildBricks(); else buildWeb();

    // ---- drawing ----
    function drawGlow(cp) {
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
    }

    function strokeCrack(cp) {
      // dark crack + glowing edge, sharing the current path
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,213,125,' + (0.55 * cp) + ')';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }

    function drawWebCracks(cp) {
      ctx.lineCap = 'round';
      var grid = web.grid;
      var maxRing = Math.ceil(cp * (web.rings.length + 0.4));
      for (var s = 0; s < web.spokes; s++) {
        ctx.beginPath();
        ctx.moveTo(grid[s][0].x, grid[s][0].y);
        for (var ri = 1; ri <= Math.min(web.rings.length, maxRing); ri++) {
          ctx.lineTo(grid[s][ri].x, grid[s][ri].y);
        }
        strokeCrack(cp);
      }
      for (var rg = 1; rg < web.rings.length; rg++) {
        if (cp < rg / (web.rings.length + 0.4)) continue;
        ctx.beginPath();
        for (var s4 = 0; s4 <= web.spokes; s4++) {
          var pt = grid[s4 % web.spokes][rg];
          if (s4 === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        strokeCrack(cp);
      }
    }

    function drawBrickCracks(cp) {
      // reveal the mortar grid outward from the impact point
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      var reach = cp * maxR * 1.2;
      for (var i = 0; i < shards.length; i++) {
        var sh = shards[i];
        var d = Math.sqrt((sh.mx - cx) * (sh.mx - cx) + (sh.my - cy) * (sh.my - cy));
        if (d > reach) continue;
        ctx.beginPath();
        for (var v = 0; v < sh.poly.length; v++) {
          var p = sh.poly[v];
          if (v === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        strokeCrack(cp);
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

    var start = nowMs();
    var raf = 0;
    var firedShatter = false;
    var firedDone = false;

    function frame() {
      var t = nowMs() - start;
      ctx.clearRect(0, 0, w, h);
      if (t < CRACK_MS) {
        var cp = t / CRACK_MS;
        drawGlow(cp);
        if (bricks) drawBrickCracks(cp); else drawWebCracks(cp);
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
