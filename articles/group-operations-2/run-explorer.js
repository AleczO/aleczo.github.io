(function () {
    const aColor = '#2563eb';
    const bColor = '#dc2626';
    const pColors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];

    const manifest = window.GO2_MANIFEST || [];
    let run = null;
    let sortByFreq = true;
    let sumDiff = false;
    let spectraCache = null;

    function themeColors() {
        const styles = getComputedStyle(document.documentElement);
        return {
            text: styles.getPropertyValue('--text-main').trim() || '#171717',
            muted: styles.getPropertyValue('--text-muted').trim() || '#5c5c5c',
            border: styles.getPropertyValue('--border-color').trim() || '#e5e5e5'
        };
    }

    function fontFamily() {
        return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    }

    function baseAxisLayout(c) {
        return { color: c.muted, gridcolor: c.border, zeroline: false, fixedrange: true };
    }

    function baseLayout(c, extra) {
        return Object.assign({
            margin: { l: 50, r: 10, t: 10, b: 45 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false
        }, extra);
    }

    const plotConfig = { responsive: true, displaylogo: false, displayModeBar: false };

    // ---------- run loading ----------

    // Run files are plain scripts (not fetched JSON) so the page also works from file://.
    const loading = {};
    function loadRun(id) {
        if (window.GO2_RUNS && window.GO2_RUNS[id]) return Promise.resolve(window.GO2_RUNS[id]);
        if (!loading[id]) {
            loading[id] = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'runs/' + id + '.js';
                s.onload = () => resolve(window.GO2_RUNS[id]);
                s.onerror = () => { delete loading[id]; reject(new Error('load failed: ' + id)); };
                document.head.appendChild(s);
            });
        }
        return loading[id];
    }

    // ---------- model helpers ----------

    function fn0Row(n) {
        const p2 = 2 * run.p;
        return run['FN.0.weight'].data.slice(n * p2, (n + 1) * p2);
    }

    // The checkpoint stores raw weights. Mean-field runs (LinearN) scale the FN.0 output by
    // 1/sqrt(2p) in forward(); runs with scaling "none" used plain bias-free linear layers.
    function neuronActivation(n, a, b) {
        const w = run['FN.0.weight'].data;
        const p2 = 2 * run.p;
        const scale = run.scaling === 'mean-field' ? 1 / Math.sqrt(p2) : 1;
        const s = (w[n * p2 + a] + w[n * p2 + run.p + b]) * scale;
        return s * s;
    }

    function dftPower(vec, p) {
        const half = Math.floor(p / 2);
        const out = new Array(half + 1);
        for (let m = 0; m <= half; m++) {
            let re = 0, im = 0;
            for (let k = 0; k < p; k++) {
                const angle = (2 * Math.PI * m * k) / p;
                re += vec[k] * Math.cos(angle);
                im -= vec[k] * Math.sin(angle);
            }
            out[m] = re * re + im * im;
        }
        return out;
    }

    function neuronSpectra() {
        if (spectraCache) return spectraCache;
        const p = run.p;
        const half = Math.floor(p / 2);
        const perNeuron = [];
        const aggregate = new Array(half + 1).fill(0);
        for (let n = 0; n < run.hidden; n++) {
            const row = fn0Row(n);
            const pa = dftPower(row.slice(0, p), p);
            const pb = dftPower(row.slice(p, 2 * p), p);
            const power = pa.map((v, m) => v + pb[m]);
            let dominant = 1;
            for (let m = 2; m <= half; m++) if (power[m] > power[dominant]) dominant = m;
            perNeuron.push({ neuron: n, dominant });
            for (let m = 1; m <= half; m++) aggregate[m] += power[m];
        }
        spectraCache = { perNeuron, aggregate, half };
        return spectraCache;
    }

    // ---------- summary across all runs ----------

    function renderSummary() {
        const c = themeColors();
        const ps = [...new Set(manifest.map(r => r.p))].sort((x, y) => x - y);
        const traces = [];
        ps.forEach((p, i) => {
            const color = pColors[i % pColors.length];
            const forP = manifest.filter(r => r.p === p);
            const ratios = [...new Set(forP.map(r => r.hidden / p))].sort((x, y) => x - y);
            const means = ratios.map(q => {
                const accs = forP.filter(r => r.hidden / p === q).map(r => r.finalAcc);
                return accs.reduce((s, v) => s + v, 0) / accs.length;
            });
            traces.push({
                type: 'scatter', mode: 'lines', x: ratios, y: means, name: 'p = ' + p,
                line: { color: color, width: 2 }, hoverinfo: 'skip'
            });
            traces.push({
                type: 'scatter', mode: 'markers', x: forP.map(r => r.hidden / p), y: forP.map(r => r.finalAcc),
                marker: { color: color, size: 7, opacity: 0.7 }, showlegend: false,
                text: forP.map(r => 'p=' + r.p + ', h=' + r.hidden + ', seed=' + r.seed),
                hovertemplate: '%{text}<br>acc=%{y:.4f}<extra></extra>'
            });
        });

        Plotly.react('go2-summary-plot', traces, baseLayout(c, {
            showlegend: true,
            legend: { orientation: 'h', y: 1.12, font: { color: c.muted } },
            xaxis: Object.assign(baseAxisLayout(c), { title: 'szerokość h / p', type: 'log', tickvals: [0.25, 0.5, 1, 2], ticktext: ['1/4', '1/2', '1', '2'] }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'końcowa dokładność' })
        }), plotConfig);
    }

    // ---------- per-run plots ----------

    function renderCurves() {
        const c = themeColors();
        const m = run.metrics;
        Plotly.react('go2-loss-plot', [
            { type: 'scatter', mode: 'lines', x: m.epoch, y: m.loss, line: { color: aColor, width: 2 }, hovertemplate: 'epoka %{x}<br>strata=%{y:.4f}<extra></extra>' }
        ], baseLayout(c, {
            xaxis: Object.assign(baseAxisLayout(c), { title: 'epoka' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'strata (entropia krzyżowa)', type: 'log' })
        }), plotConfig);

        Plotly.react('go2-acc-plot', [
            { type: 'scatter', mode: 'lines', x: m.epoch, y: m.acc, line: { color: aColor, width: 2 }, hovertemplate: 'epoka %{x}<br>dokładność=%{y:.4f}<extra></extra>' }
        ], baseLayout(c, {
            xaxis: Object.assign(baseAxisLayout(c), { title: 'epoka' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'dokładność', range: [0, 1.02] })
        }), plotConfig);
    }

    function renderSpectrum() {
        const c = themeColors();
        const spectra = neuronSpectra();
        const ms = Array.from({ length: spectra.half }, (_, i) => i + 1);
        Plotly.react('go2-spectrum-plot', [
            { type: 'bar', x: ms, y: ms.map(m => spectra.aggregate[m]), marker: { color: aColor } }
        ], baseLayout(c, {
            xaxis: Object.assign(baseAxisLayout(c), { title: 'częstotliwość m', tickmode: 'linear', tick0: 0, dtick: 5 }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'moc widmowa' })
        }), plotConfig);
    }

    function renderWeightHeatmap() {
        const c = themeColors();
        const p = run.p;
        const spectra = neuronSpectra();
        const order = sortByFreq
            ? spectra.perNeuron.slice().sort((x, y) => x.dominant - y.dominant || x.neuron - y.neuron).map(s => s.neuron)
            : spectra.perNeuron.map(s => s.neuron);
        // Row position on the y-axis, real neuron index in customdata (see part I for why).
        const z = order.map(n => fn0Row(n));
        const customdata = order.map(n => Array(2 * p).fill(n));

        Plotly.react('go2-weight-heatmap-plot', [
            {
                type: 'heatmap', z: z, customdata: customdata, colorscale: 'RdBu', reversescale: true, zmid: 0,
                showscale: true, colorbar: { thickness: 12, tickfont: { color: c.muted } },
                hovertemplate: 'neuron=%{customdata}, k=%{x}<br>waga=%{z:.3f}<extra></extra>'
            }
        ], baseLayout(c, {
            xaxis: Object.assign(baseAxisLayout(c), { title: 'wejście k' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: sortByFreq ? 'neuron (posort. wg m)' : 'neuron', showticklabels: false }),
            shapes: [
                { type: 'line', x0: p - 0.5, x1: p - 0.5, y0: -0.5, y1: order.length - 0.5, line: { color: c.text, width: 1 } }
            ]
        }), plotConfig);
    }

    function renderNeuronProfile(n) {
        const c = themeColors();
        const p = run.p;
        const row = fn0Row(n);
        const ks = Array.from({ length: p }, (_, i) => i);
        Plotly.react('go2-neuron-weight-plot', [
            { type: 'scatter', mode: 'lines+markers', x: ks, y: row.slice(0, p), name: 'w_a', line: { color: aColor, width: 2 }, marker: { size: 5, color: aColor } },
            { type: 'scatter', mode: 'lines+markers', x: ks, y: row.slice(p, 2 * p), name: 'w_b', line: { color: bColor, width: 2 }, marker: { size: 5, color: bColor } }
        ], baseLayout(c, {
            showlegend: true,
            legend: { orientation: 'h', y: 1.15, font: { color: c.muted } },
            xaxis: Object.assign(baseAxisLayout(c), { title: 'k' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'waga', zeroline: true, zerolinecolor: c.border })
        }), plotConfig);
    }

    // Sum/difference coordinates: a = (s+d)/2, b = (s-d)/2 mod p, with 1/2 = (p+1)/2 in Z_p (p odd).
    function renderActivation(n) {
        const c = themeColors();
        const p = run.p;
        const half = (p + 1) / 2;
        const z = [];
        for (let y = 0; y < p; y++) {
            const row = [];
            for (let x = 0; x < p; x++) {
                const a = sumDiff ? ((x + y) * half) % p : x;
                const b = sumDiff ? ((x - y + p) * half) % p : y;
                row.push(neuronActivation(n, a, b));
            }
            z.push(row);
        }
        const xTitle = sumDiff ? '(a+b) mod p' : 'a';
        const yTitle = sumDiff ? '(a−b) mod p' : 'b';
        Plotly.react('go2-activation-plot', [
            {
                type: 'heatmap', z: z, colorscale: 'Viridis', showscale: false,
                hovertemplate: xTitle + '=%{x}, ' + yTitle + '=%{y}<br>aktywacja=%{z:.3f}<extra></extra>'
            }
        ], baseLayout(c, {
            xaxis: Object.assign(baseAxisLayout(c), { title: xTitle }),
            yaxis: Object.assign(baseAxisLayout(c), { title: yTitle })
        }), plotConfig);
    }

    // ---------- controls ----------

    function currentNeuron() {
        return parseInt(document.getElementById('go2-neuron').value, 10);
    }

    function renderNeuron() {
        if (!run) return;
        const n = currentNeuron();
        renderNeuronProfile(n);
        renderActivation(n);
    }

    function renderRun() {
        if (!run) return;
        renderCurves();
        renderSpectrum();
        renderWeightHeatmap();
        renderNeuron();
    }

    function renderAll() {
        renderSummary();
        renderRun();
    }

    function uniqueSorted(values) {
        return [...new Set(values)].sort((x, y) => x - y);
    }

    // Refills a select, keeping its previous value when that option still exists.
    function fillSelect(id, values) {
        const sel = document.getElementById(id);
        const prev = sel.value;
        sel.innerHTML = '';
        for (const v of values) {
            const opt = document.createElement('option');
            opt.value = opt.textContent = String(v);
            sel.appendChild(opt);
        }
        if (values.map(String).includes(prev)) sel.value = prev;
    }

    // Cascading selects p -> h -> seed -> wd, each filtered to combinations that exist.
    function syncSelects() {
        const val = id => parseFloat(document.getElementById(id).value);
        const byP = manifest.filter(r => r.p === val('go2-p'));
        fillSelect('go2-h', uniqueSorted(byP.map(r => r.hidden)));
        const byH = byP.filter(r => r.hidden === val('go2-h'));
        fillSelect('go2-seed', uniqueSorted(byH.map(r => r.seed)));
        const bySeed = byH.filter(r => r.seed === val('go2-seed'));
        fillSelect('go2-wd', uniqueSorted(bySeed.map(r => r.wd)));
        return bySeed.find(r => r.wd === val('go2-wd'));
    }

    function selectRun() {
        const entry = syncSelects();
        const statusEl = document.getElementById('go2-run-status');
        if (!entry) return;
        statusEl.textContent = 'Ładowanie ' + entry.id + '…';
        loadRun(entry.id).then(data => {
            run = data;
            spectraCache = null;
            const slider = document.getElementById('go2-neuron');
            const number = document.getElementById('go2-neuron-num');
            slider.max = number.max = String(run.hidden - 1);
            if (currentNeuron() > run.hidden - 1) slider.value = number.value = '0';
            statusEl.textContent = 'p = ' + run.p + ', h = ' + run.hidden + ', seed = ' + run.seed + ', wd = ' + run.wd +
                ', ' + (run.scaling === 'mean-field' ? 'parametryzacja mean-field' : 'bez skalowania warstw') +
                ', ' + run.epochs + ' epok, końcowa dokładność ' + (100 * entry.finalAcc).toFixed(2) + '%.';
            renderRun();
        }).catch(() => {
            statusEl.textContent = 'Nie udało się wczytać przebiegu ' + entry.id + '.';
        });
    }

    function linkSliderAndNumber(sliderId, numberId, onChange) {
        const slider = document.getElementById(sliderId);
        const number = document.getElementById(numberId);
        slider.addEventListener('input', () => { number.value = slider.value; onChange(); });
        number.addEventListener('input', () => {
            const v = parseInt(number.value, 10);
            if (!isFinite(v)) return;
            slider.value = Math.min(parseInt(slider.max, 10), Math.max(0, v));
            onChange();
        });
    }

    function init() {
        if (!manifest.length || !document.getElementById('go2-p')) return;

        fillSelect('go2-p', uniqueSorted(manifest.map(r => r.p)));
        document.getElementById('go2-p').value = '71';
        syncSelects();
        document.getElementById('go2-h').value = '140';
        for (const id of ['go2-p', 'go2-h', 'go2-seed', 'go2-wd']) {
            document.getElementById(id).addEventListener('change', selectRun);
        }

        linkSliderAndNumber('go2-neuron', 'go2-neuron-num', renderNeuron);

        const sortBtn = document.getElementById('go2-sort');
        sortBtn.addEventListener('click', () => {
            sortByFreq = !sortByFreq;
            sortBtn.textContent = sortByFreq ? 'Kolejność oryginalna' : 'Sortuj wg częstotliwości';
            if (run) renderWeightHeatmap();
        });

        const coordsBtn = document.getElementById('go2-coords');
        coordsBtn.addEventListener('click', () => {
            sumDiff = !sumDiff;
            coordsBtn.textContent = sumDiff ? 'Współrzędne (a, b)' : 'Współrzędne (a+b, a−b)';
            if (run) renderActivation(currentNeuron());
        });

        renderSummary();
        selectRun();
    }

    document.addEventListener('DOMContentLoaded', init);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(renderAll, 0));
    }
})();
