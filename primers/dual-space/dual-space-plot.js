(function () {
    const R = 4;                 // visible range [-R, R] on both axes
    const FAR = 60;              // half-length of level lines (clipped by the axes)
    const DET_MIN = 0.03;        // below this the basis is treated as degenerate

    const ids = ['a1', 'l1', 'a2', 'l2', 'vx', 'vy'];

    const TEXT = {
        en: { degenerate: 'e₁ and e₂ are (almost) parallel, so they are not a basis and the dual basis does not exist.' },
        pl: { degenerate: 'e₁ i e₂ są (prawie) równoległe, więc nie tworzą bazy i baza dualna nie istnieje.' }
    };

    function tr() {
        return TEXT[document.documentElement.lang] || TEXT.en;
    }

    // ---- shared plotting helpers ----

    function themeColors() {
        const s = getComputedStyle(document.documentElement);
        return {
            text: s.getPropertyValue('--text-main').trim() || '#171717',
            muted: s.getPropertyValue('--text-muted').trim() || '#5c5c5c',
            border: s.getPropertyValue('--border-color').trim() || '#e5e5e5'
        };
    }

    const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const E1_COLOR = '#2563eb';
    const E2_COLOR = '#dc2626';
    const CONFIG = { responsive: true, displaylogo: false };

    function num(id) {
        return parseFloat(document.getElementById('ds-' + id).value);
    }

    function fromPolar(deg, len) {
        const t = deg * Math.PI / 180;
        return [len * Math.cos(t), len * Math.sin(t)];
    }

    // arrow from origin (or `from`) to `to`, drawn as a line with an arrowhead marker at the tip
    function arrow(to, color, name, opts) {
        const o = opts || {};
        const from = o.from || [0, 0];
        return {
            type: 'scatter', mode: 'lines+markers',
            x: [from[0], to[0]], y: [from[1], to[1]],
            name: name, showlegend: !!name, hoverinfo: 'skip',
            line: { color: color, width: o.width || 3, dash: o.dash || 'solid' },
            marker: { symbol: 'arrow', angleref: 'previous', size: [0, o.head || 14], color: color }
        };
    }

    // family of lines {base + k * step + t * dir : t in R} for integer k, as one trace
    function levelLines(step, dir, kMax, color, name) {
        const x = [], y = [];
        for (let k = -kMax; k <= kMax; k++) {
            const bx = k * step[0], by = k * step[1];
            x.push(bx - FAR * dir[0], bx + FAR * dir[0], null);
            y.push(by - FAR * dir[1], by + FAR * dir[1], null);
        }
        return {
            type: 'scatter', mode: 'lines', x: x, y: y, name: name, hoverinfo: 'skip',
            line: { color: color, width: 1 }, opacity: 0.45
        };
    }

    // ---- render ----

    function render() {
        const c = themeColors();
        const v = {};
        ids.forEach(id => { v[id] = num(id); });

        document.getElementById('ds-a1-val').textContent = v.a1.toFixed(0) + '°';
        document.getElementById('ds-a2-val').textContent = v.a2.toFixed(0) + '°';
        ['l1', 'l2', 'vx', 'vy'].forEach(id => {
            document.getElementById('ds-' + id + '-val').textContent = v[id].toFixed(2);
        });

        const e1 = fromPolar(v.a1, v.l1);
        const e2 = fromPolar(v.a2, v.l2);
        const vec = [v.vx, v.vy];
        const det = e1[0] * e2[1] - e2[0] * e1[1];

        const traces = [];
        const readout = document.getElementById('ds-readout');

        if (Math.abs(det) < DET_MIN) {
            readout.textContent = 'det A = ' + det.toFixed(3) + '  — ' + tr().degenerate;
        } else {
            // rows of A^{-1}: the dual covectors as vectors (gradients)
            const d1 = [e2[1] / det, -e2[0] / det];
            const d2 = [-e1[1] / det, e1[0] / det];
            const c1 = d1[0] * vec[0] + d1[1] * vec[1];
            const c2 = d2[0] * vec[0] + d2[1] * vec[1];

            // enough integer levels to cover the visible square
            const corners = [[R, R], [R, -R], [-R, R], [-R, -R]];
            const kMax1 = Math.ceil(Math.max(...corners.map(p => Math.abs(d1[0] * p[0] + d1[1] * p[1])))) + 1;
            const kMax2 = Math.ceil(Math.max(...corners.map(p => Math.abs(d2[0] * p[0] + d2[1] * p[1])))) + 1;

            traces.push(levelLines(e1, e2, Math.min(kMax1, 200), E1_COLOR, 'e¹ = k'));
            traces.push(levelLines(e2, e1, Math.min(kMax2, 200), E2_COLOR, 'e² = k'));

            // parallelogram decomposition v = c1 e1 + c2 e2
            const p1 = [c1 * e1[0], c1 * e1[1]];
            traces.push({
                type: 'scatter', mode: 'lines', hoverinfo: 'skip', showlegend: false,
                x: [0, p1[0], vec[0]], y: [0, p1[1], vec[1]],
                line: { color: c.muted, width: 1.5, dash: 'dot' }
            });

            traces.push(arrow(d1, E1_COLOR, '∇e¹', { dash: 'dash', width: 2, head: 11 }));
            traces.push(arrow(d2, E2_COLOR, '∇e²', { dash: 'dash', width: 2, head: 11 }));

            readout.textContent =
                'e¹(v) = ' + c1.toFixed(2) + '   e²(v) = ' + c2.toFixed(2) +
                '   ⇒  v = ' + c1.toFixed(2) + '·e₁ ' + (c2 < 0 ? '− ' : '+ ') + Math.abs(c2).toFixed(2) + '·e₂' +
                '   (det A = ' + det.toFixed(2) + ')';
        }

        traces.push(arrow(e1, E1_COLOR, 'e₁'));
        traces.push(arrow(e2, E2_COLOR, 'e₂'));
        traces.push(arrow(vec, c.text, 'v'));

        Plotly.react('ds-plane', traces, {
            margin: { l: 40, r: 15, t: 15, b: 35 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: FONT },
            legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom' },
            xaxis: { range: [-R, R], color: c.muted, gridcolor: c.border, zerolinecolor: c.muted, dtick: 1 },
            yaxis: { range: [-R, R], color: c.muted, gridcolor: c.border, zerolinecolor: c.muted, dtick: 1,
                     scaleanchor: 'x', scaleratio: 1 }
        }, CONFIG);
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.ds-input').forEach(el => {
            el.addEventListener('input', render);
        });
        render();
    });

    document.addEventListener('langchange', () => {
        if (document.getElementById('ds-plane').data) render();
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => setTimeout(render, 0));
})();
