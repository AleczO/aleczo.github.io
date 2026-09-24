(function () {
    const K = 41;
    const EPS = 1e-12;
    const xs = Array.from({ length: K }, (_, i) => i + 1);

    const ids = ['mu-p', 'sigma-p', 'mu-q', 'sigma-q'];

    // ---- distribution families on {1, ..., K} ----

    function normalize(w) {
        const s = w.reduce((a, b) => a + b, 0);
        return w.map(v => v / s);
    }

    function gauss(x, mu, s) {
        return Math.exp(-0.5 * Math.pow((x - mu) / s, 2));
    }

    function pmf(family, mu, sigma) {
        switch (family) {
            case 'uniform':
                return xs.map(() => 1 / K);
            case 'laplace':
                return normalize(xs.map(x => Math.exp(-Math.abs(x - mu) / sigma)));
            case 'bimodal':
                return normalize(xs.map(x => gauss(x, mu - 2 * sigma, sigma) + gauss(x, mu + 2 * sigma, sigma)));
            case 'spike': {
                const k = Math.min(K, Math.max(1, Math.round(mu)));
                return xs.map(x => (x === k ? 1 : 0));
            }
            default:
                return normalize(xs.map(x => gauss(x, mu, sigma)));
        }
    }

    function crossEntropy(p, q) {
        let h = 0;
        for (let i = 0; i < p.length; i++) if (p[i] > 0) h -= p[i] * Math.log(Math.max(q[i], EPS));
        return h;
    }

    function entropy(p) {
        return crossEntropy(p, p);
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
    const P_COLOR = '#2563eb';
    const Q_COLOR = '#dc2626';
    const KL_COLOR = '#f59e0b';
    const CONFIG = { responsive: true, displaylogo: false };

    function baseLayout(c, extra) {
        return Object.assign({
            margin: { l: 55, r: 15, t: 15, b: 45 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: FONT },
            legend: { orientation: 'h', y: 1.15, x: 0 }
        }, extra);
    }

    function num(id) {
        return parseFloat(document.getElementById(id).value);
    }

    function marker(c) {
        return { size: 10, color: c.text, line: { color: '#fff', width: 1.5 } };
    }

    // ---- part 1: two distributions ----

    function renderDistributions() {
        const c = themeColors();
        const v = {};
        ids.forEach(id => { v[id] = num('ce-' + id); });
        const famP = document.getElementById('ce-family-p').value;
        const famQ = document.getElementById('ce-family-q').value;
        const p = pmf(famP, v['mu-p'], v['sigma-p']);
        const q = pmf(famQ, v['mu-q'], v['sigma-q']);
        const Hp = entropy(p);
        const Hpq = crossEntropy(p, q);
        const kl = Hpq - Hp;

        ids.forEach(id => {
            document.getElementById('ce-' + id + '-val').textContent = v[id].toFixed(1);
        });
        const inf = Hpq > 20;
        document.getElementById('ce-readout').textContent =
            'H(p) = ' + Hp.toFixed(3) + '   D_KL(p‖q) = ' + (inf ? '≈ ∞' : kl.toFixed(3)) +
            '   H(p,q) = ' + (inf ? '≈ ∞' : Hpq.toFixed(3)) + '  (nats)' +
            (inf ? '  — q ≈ 0 tam, gdzie p > 0 (złamane założenie o absolutnej ciągłości)' : '');

        Plotly.react('ce-dist', [
            { type: 'bar', x: xs, y: p, name: 'p', marker: { color: P_COLOR, opacity: 0.6 } },
            { type: 'bar', x: xs, y: q, name: 'q', marker: { color: Q_COLOR, opacity: 0.6 } }
        ], baseLayout(c, {
            barmode: 'overlay',
            xaxis: { title: 'x', color: c.muted, gridcolor: c.border },
            yaxis: { title: 'masa prawdopodobieństwa', color: c.muted, gridcolor: c.border, rangemode: 'tozero' }
        }), CONFIG);

        Plotly.react('ce-decomp', [
            { type: 'bar', x: ['H(p,q)'], y: [Hp], name: 'H(p)', marker: { color: P_COLOR } },
            { type: 'bar', x: ['H(p,q)'], y: [Math.min(kl, 25)], name: 'D_KL(p‖q)', marker: { color: KL_COLOR } }
        ], baseLayout(c, {
            barmode: 'stack',
            margin: { l: 55, r: 15, t: 15, b: 30 },
            xaxis: { color: c.muted },
            yaxis: { title: 'nats', color: c.muted, gridcolor: c.border, rangemode: 'tozero' },
            annotations: [{
                x: 'H(p,q)', y: Math.min(Hpq, 25 + Hp), text: inf ? '≈ ∞' : Hpq.toFixed(3),
                showarrow: false, yshift: 12, font: { color: c.text }
            }]
        }), CONFIG);

        const mus = [], hMu = [];
        for (let mu = -10; mu <= K + 10; mu += 0.5) {
            mus.push(mu);
            hMu.push(Math.min(crossEntropy(p, pmf(famQ, mu, v['sigma-q'])), 25));
        }
        Plotly.react('ce-shift', [
            { type: 'scatter', mode: 'lines', x: mus, y: hMu, name: 'H(p,q)', line: { color: Q_COLOR, width: 2.5 } },
            {
                type: 'scatter', mode: 'lines', x: [mus[0], mus[mus.length - 1]], y: [Hp, Hp],
                name: 'H(p)', line: { color: P_COLOR, width: 1.5, dash: 'dash' }
            },
            { type: 'scatter', mode: 'markers', x: [v['mu-q']], y: [Math.min(Hpq, 25)], name: 'bieżące q', marker: marker(c) }
        ], baseLayout(c, {
            xaxis: { title: 'przesunięcie q (μ_q)', color: c.muted, gridcolor: c.border },
            yaxis: { title: 'H(p,q) [nats, obcięte do 25]', color: c.muted, gridcolor: c.border }
        }), CONFIG);

        const ss = [], hS = [];
        for (let s = 0.5; s <= 15; s += 0.25) {
            ss.push(s);
            hS.push(Math.min(crossEntropy(p, pmf(famQ, v['mu-q'], s)), 25));
        }
        Plotly.react('ce-sigma', [
            { type: 'scatter', mode: 'lines', x: ss, y: hS, name: 'H(p,q)', line: { color: Q_COLOR, width: 2.5 } },
            {
                type: 'scatter', mode: 'lines', x: [ss[0], ss[ss.length - 1]], y: [Hp, Hp],
                name: 'H(p)', line: { color: P_COLOR, width: 1.5, dash: 'dash' }
            },
            { type: 'scatter', mode: 'markers', x: [v['sigma-q']], y: [Math.min(Hpq, 25)], name: 'bieżące q', marker: marker(c) }
        ], baseLayout(c, {
            xaxis: { title: 'szerokość q (σ_q)', color: c.muted, gridcolor: c.border },
            yaxis: { title: 'H(p,q) [nats, obcięte do 25]', color: c.muted, gridcolor: c.border }
        }), CONFIG);
    }

    // ---- part 2: classifier on modular addition ----
    // Task: (a + b) mod 10. Correct class y = 3 (e.g. 7 + 6). Typical model errors are
    // off-by-one, so the neighbouring classes y±1 (mod 10) get an extra logit.

    const C = 10;
    const CLASSES = Array.from({ length: C }, (_, i) => i);
    const Y = 3;

    function softmax(z, T) {
        const m = Math.max.apply(null, z);
        const e = z.map(v => Math.exp((v - m) / T));
        const s = e.reduce((a, b) => a + b, 0);
        return e.map(v => v / s);
    }

    function logits(margin, bonus) {
        return CLASSES.map(i => {
            if (i === Y) return margin;
            const d = Math.min((i - Y + C) % C, (Y - i + C) % C);
            return d === 1 ? bonus : 0;
        });
    }

    function target(eps) {
        return CLASSES.map(i => (1 - eps) * (i === Y ? 1 : 0) + eps / C);
    }

    function renderClassifier() {
        const c = themeColors();
        const margin = num('ce-margin');
        const bonus = num('ce-bonus');
        const T = num('ce-temp');
        const eps = num('ce-eps');
        ['margin', 'bonus', 'temp', 'eps'].forEach(k => {
            document.getElementById('ce-' + k + '-val').textContent = num('ce-' + k).toFixed(2);
        });

        const z = logits(margin, bonus);
        const q = softmax(z, T);
        const p = target(eps);
        const Hp = entropy(p);
        const loss = crossEntropy(p, q);

        document.getElementById('ce-clf-readout').textContent =
            'q(y) = ' + q[Y].toFixed(3) + '   H(p,q) = ' + loss.toFixed(3) +
            ' = H(p) ' + Hp.toFixed(3) + ' + D_KL ' + (loss - Hp).toFixed(3) + '  (nats)' +
            (eps === 0 ? '   [cel one-hot: strata = −log q(y) = ' + (-Math.log(q[Y])).toFixed(3) + ']' : '');

        const colors = CLASSES.map(i => (i === Y ? P_COLOR : c.muted));
        Plotly.react('ce-logits', [
            { type: 'bar', x: CLASSES, y: z, marker: { color: colors }, name: 'logit' }
        ], baseLayout(c, {
            showlegend: false,
            xaxis: { title: 'klasa (wynik a + b mod 10)', color: c.muted, dtick: 1 },
            yaxis: { title: 'logit z', color: c.muted, gridcolor: c.border, zeroline: true, zerolinecolor: c.border }
        }), CONFIG);

        Plotly.react('ce-clf', [
            { type: 'bar', x: CLASSES, y: p, name: 'cel p', marker: { color: P_COLOR, opacity: 0.6 } },
            { type: 'bar', x: CLASSES, y: q, name: 'softmax q', marker: { color: Q_COLOR, opacity: 0.6 } }
        ], baseLayout(c, {
            barmode: 'overlay',
            xaxis: { title: 'klasa', color: c.muted, dtick: 1 },
            yaxis: { title: 'prawdopodobieństwo', color: c.muted, gridcolor: c.border, range: [0, 1.02] }
        }), CONFIG);

        const ms = [], lossCur = [], lossHard = [];
        for (let m = -2; m <= 12; m += 0.25) {
            const qm = softmax(logits(m, bonus), T);
            ms.push(m);
            lossCur.push(crossEntropy(p, qm));
            lossHard.push(crossEntropy(target(0), qm));
        }
        Plotly.react('ce-loss', [
            { type: 'scatter', mode: 'lines', x: ms, y: lossHard, name: 'ε = 0 (one-hot)', line: { color: c.muted, width: 1.5, dash: 'dot' } },
            { type: 'scatter', mode: 'lines', x: ms, y: lossCur, name: 'bieżące ε', line: { color: Q_COLOR, width: 2.5 } },
            { type: 'scatter', mode: 'markers', x: [margin], y: [loss], name: 'bieżący model', marker: marker(c) }
        ], baseLayout(c, {
            xaxis: { title: 'logit poprawnej klasy', color: c.muted, gridcolor: c.border },
            yaxis: { title: 'strata H(p,q) [nats]', color: c.muted, gridcolor: c.border, rangemode: 'tozero' }
        }), CONFIG);
    }

    function renderAll() {
        renderDistributions();
        renderClassifier();
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.ce-input').forEach(el => {
            el.addEventListener('input', renderAll);
            el.addEventListener('change', renderAll);
        });
        renderAll();
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => setTimeout(renderAll, 0));
})();
