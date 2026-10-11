(function () {
    const R = 3.5;               // visible range of the domain [-R, R]
    const G = 2;                 // grid lines at x = k, y = k for k in [-G, G]
    const FAR = 60;              // half-length of the kernel line (clipped by the axes)
    const EPS = 1e-9;            // tolerance for det = 0 and for T(x) = 0

    const ids = ['a11', 'a12', 'a21', 'a22', 'x1', 'x2'];

    const PRESETS = {
        rank2: [1, 0.5, -0.5, 1],
        rank1: [1, 2, 0.5, 1],
        zero:  [0, 0, 0, 0]
    };

    function themeColors() {
        const s = getComputedStyle(document.documentElement);
        return {
            text: s.getPropertyValue('--text-main').trim() || '#171717',
            muted: s.getPropertyValue('--text-muted').trim() || '#5c5c5c',
            border: s.getPropertyValue('--border-color').trim() || '#e5e5e5'
        };
    }

    const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const KER_COLOR = '#dc2626';
    const X_COLOR = '#2563eb';
    const GRID_COLOR = '#9ca3af';
    const CONFIG = { responsive: true, displaylogo: false };

    function num(id) {
        return parseFloat(document.getElementById('kr-' + id).value);
    }

    function fmt(a) {
        const s = a.toFixed(2);
        return s === '-0.00' ? '0.00' : s;
    }

    function arrow(to, color, name) {
        return {
            type: 'scatter', mode: 'lines+markers',
            x: [0, to[0]], y: [0, to[1]],
            name: name, hoverinfo: 'skip',
            line: { color: color, width: 3 },
            marker: { symbol: 'arrow', angleref: 'previous', size: [0, 14], color: color }
        };
    }

    // grid lines x = k and y = k (k = -G..G), pushed through `map`, as one trace
    function gridTrace(map) {
        const x = [], y = [];
        for (let k = -G; k <= G; k++) {
            [[[k, -G], [k, G]], [[-G, k], [G, k]]].forEach(seg => {
                const p = map(seg[0]), q = map(seg[1]);
                x.push(p[0], q[0], null);
                y.push(p[1], q[1], null);
            });
        }
        return {
            type: 'scatter', mode: 'lines', x: x, y: y, hoverinfo: 'skip', showlegend: false,
            line: { color: GRID_COLOR, width: 1 }, opacity: 0.6
        };
    }

    function point(p, color, name, size) {
        return {
            type: 'scatter', mode: 'markers', x: [p[0]], y: [p[1]], name: name,
            showlegend: !!name, hoverinfo: 'skip',
            marker: { color: color, size: size || 11 }
        };
    }

    function axisLayout(c, range) {
        const common = { color: c.muted, gridcolor: c.border, zerolinecolor: c.muted, range: [-range, range] };
        return {
            margin: { l: 40, r: 15, t: 15, b: 35 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: FONT },
            legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom' },
            xaxis: common,
            yaxis: Object.assign({ scaleanchor: 'x', scaleratio: 1 }, common)
        };
    }

    function render() {
        const c = themeColors();
        const v = {};
        ids.forEach(id => {
            v[id] = num(id);
            document.getElementById('kr-' + id + '-val').textContent = fmt(v[id]);
        });

        const T = p => [v.a11 * p[0] + v.a12 * p[1], v.a21 * p[0] + v.a22 * p[1]];
        const x = [v.x1, v.x2];
        const Tx = T(x);
        const det = v.a11 * v.a22 - v.a12 * v.a21;
        const isZero = [v.a11, v.a12, v.a21, v.a22].every(a => Math.abs(a) < EPS);

        // ---- domain V = R^2 ----
        const dom = [gridTrace(p => p)];
        let kerText;

        if (isZero) {
            dom.push({
                type: 'scatter', mode: 'lines', x: [-FAR, FAR, FAR, -FAR, -FAR], y: [-FAR, -FAR, FAR, FAR, -FAR],
                fill: 'toself', fillcolor: 'rgba(220, 38, 38, 0.15)', line: { width: 0 },
                name: 'ker T', hoverinfo: 'skip'
            });
            kerText = 'ker T = ℝ²';
        } else if (Math.abs(det) < EPS) {
            // null vector of a rank-1 matrix: perpendicular to a nonzero row
            const d = (Math.abs(v.a11) + Math.abs(v.a12) > EPS) ? [-v.a12, v.a11] : [-v.a22, v.a21];
            const n = Math.hypot(d[0], d[1]);
            const u = [d[0] / n, d[1] / n];
            dom.push({
                type: 'scatter', mode: 'lines', x: [-FAR * u[0], FAR * u[0]], y: [-FAR * u[1], FAR * u[1]],
                name: 'ker T', hoverinfo: 'skip', line: { color: KER_COLOR, width: 4 }
            });
            kerText = 'ker T = span{(' + fmt(u[0]) + ', ' + fmt(u[1]) + ')}';
        } else {
            dom.push(point([0, 0], KER_COLOR, 'ker T = {0}'));
            kerText = 'ker T = {0}';
        }
        dom.push(arrow(x, X_COLOR, 'x'));

        // ---- codomain W = R^2 ----
        const cod = [gridTrace(T)];
        cod.push(point([0, 0], KER_COLOR, 'T(ker T) = {0}'));
        cod.push(arrow(Tx, X_COLOR, 'T(x)'));

        // codomain range: fit the image of the grid and T(x)
        const corners = [[G, G], [G, -G], [-G, G], [-G, -G]].map(T).concat([Tx]);
        const span = Math.max(R, ...corners.map(p => Math.max(Math.abs(p[0]), Math.abs(p[1])) * 1.1));

        Plotly.react('kr-domain', dom, axisLayout(c, R), CONFIG);
        Plotly.react('kr-codomain', cod, axisLayout(c, Math.ceil(span)), CONFIG);

        const inKer = Math.hypot(Tx[0], Tx[1]) < 1e-6;
        document.getElementById('kr-readout').textContent =
            'det A = ' + fmt(det) + '   ' + kerText +
            '   T(x) = (' + fmt(Tx[0]) + ', ' + fmt(Tx[1]) + ')   ' +
            (inKer ? 'x ∈ ker T' : 'x ∉ ker T');
    }

    function setPreset(name) {
        const p = PRESETS[name];
        ['a11', 'a12', 'a21', 'a22'].forEach((id, i) => {
            document.getElementById('kr-' + id).value = p[i];
        });
        render();
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.kr-input').forEach(el => el.addEventListener('input', render));
        document.querySelectorAll('[data-kr-preset]').forEach(btn => {
            btn.addEventListener('click', () => setPreset(btn.dataset.krPreset));
        });
        render();
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => setTimeout(render, 0));
})();
