(function () {
    const WEIGHT_ID = 'net-weight-plot';
    const HEATMAP_ID = 'net-heatmap-plot';
    const OUTPUT_ID = 'net-output-plot';

    const aColor = '#2563eb';
    const bColor = '#dc2626';
    const correctColor = '#16a34a';
    const predictedColor = '#dc2626';
    const otherColor = '#5c5c5c';

    let model = null;

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

    function relu(x) {
        return x > 0 ? x : 0;
    }

    function fc1Row(n) {
        const p2 = 2 * model.p;
        return model['fc1.weight'].data.slice(n * p2, (n + 1) * p2);
    }

    function hiddenActivations(a, b) {
        const p = model.p;
        const x = new Array(2 * p).fill(0);
        x[a] = 1;
        x[p + b] = 1;
        const h = new Array(model.hidden);
        for (let i = 0; i < model.hidden; i++) {
            const row = fc1Row(i);
            let s = model['fc1.bias'].data[i];
            for (let k = 0; k < 2 * p; k++) s += row[k] * x[k];
            h[i] = relu(s);
        }
        return h;
    }

    function logits(a, b) {
        const h = hiddenActivations(a, b);
        const p = model.p;
        const out = new Array(p);
        for (let i = 0; i < p; i++) {
            const row = model['fc2.weight'].data.slice(i * model.hidden, (i + 1) * model.hidden);
            let s = model['fc2.bias'].data[i];
            for (let k = 0; k < model.hidden; k++) s += row[k] * h[k];
            out[i] = s;
        }
        return out;
    }

    function softmax(arr) {
        const m = Math.max(...arr);
        const exps = arr.map(v => Math.exp(v - m));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(v => v / sum);
    }

    function baseAxisLayout(c) {
        return { color: c.muted, gridcolor: c.border, zeroline: true, zerolinecolor: c.border, fixedrange: true };
    }

    // Classic cyclic Jacobi eigenvalue algorithm for a small symmetric matrix.
    // Returns all eigenvalues/eigenvectors; good enough for the <=58x58 covariance
    // matrices here, no external linear-algebra library needed.
    function jacobiEigen(matrix, n) {
        const a = matrix.map(row => row.slice());
        const v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
        for (let sweep = 0; sweep < 100; sweep++) {
            let off = 0;
            for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
            if (off < 1e-10) break;
            for (let p = 0; p < n; p++) {
                for (let q = p + 1; q < n; q++) {
                    if (Math.abs(a[p][q]) < 1e-14) continue;
                    const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
                    const sign = theta >= 0 ? 1 : -1;
                    const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
                    const c = 1 / Math.sqrt(t * t + 1);
                    const s = t * c;
                    const app = a[p][p], aqq = a[q][q], apq = a[p][q];
                    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
                    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
                    a[p][q] = 0;
                    a[q][p] = 0;
                    for (let i = 0; i < n; i++) {
                        if (i !== p && i !== q) {
                            const aip = a[i][p], aiq = a[i][q];
                            a[i][p] = c * aip - s * aiq; a[p][i] = a[i][p];
                            a[i][q] = s * aip + c * aiq; a[q][i] = a[i][q];
                        }
                    }
                    for (let i = 0; i < n; i++) {
                        const vip = v[i][p], viq = v[i][q];
                        v[i][p] = c * vip - s * viq;
                        v[i][q] = s * vip + c * viq;
                    }
                }
            }
        }
        const eigenvalues = Array.from({ length: n }, (_, i) => a[i][i]);
        const eigenvectors = Array.from({ length: n }, (_, i) => v.map(row => row[i]));
        return { eigenvalues, eigenvectors };
    }

    function dot(a, b) {
        let s = 0;
        for (let i = 0; i < a.length; i++) s += a[i] * b[i];
        return s;
    }

    // Projects each row of dataMatrix onto its top-2 principal components.
    function pca2D(dataMatrix) {
        const n = dataMatrix.length;
        const d = dataMatrix[0].length;
        const mean = new Array(d).fill(0);
        for (const row of dataMatrix) for (let j = 0; j < d; j++) mean[j] += row[j];
        for (let j = 0; j < d; j++) mean[j] /= n;
        const centered = dataMatrix.map(row => row.map((v, j) => v - mean[j]));

        const cov = Array.from({ length: d }, () => new Array(d).fill(0));
        for (const row of centered) {
            for (let i = 0; i < d; i++) {
                for (let j = i; j < d; j++) cov[i][j] += row[i] * row[j];
            }
        }
        for (let i = 0; i < d; i++) {
            for (let j = i; j < d; j++) {
                cov[i][j] /= (n - 1);
                cov[j][i] = cov[i][j];
            }
        }

        const { eigenvalues, eigenvectors } = jacobiEigen(cov, d);
        const order = eigenvalues.map((_, i) => i).sort((x, y) => eigenvalues[y] - eigenvalues[x]);
        const pc1 = eigenvectors[order[0]];
        const pc2 = eigenvectors[order[1]];
        const totalVar = eigenvalues.reduce((a, b) => a + b, 0);
        const scores = centered.map(row => [dot(row, pc1), dot(row, pc2)]);
        return {
            scores,
            explained: [eigenvalues[order[0]] / totalVar, eigenvalues[order[1]] / totalVar]
        };
    }

    function hueColor(k, p) {
        return 'hsl(' + Math.round((360 * k) / p) + ', 70%, 50%)';
    }

    let pcaCache = null;

    function computePCA() {
        if (pcaCache) return pcaCache;
        const p = model.p;
        const hidden = model.hidden;
        const w1 = model['fc1.weight'].data;
        const w2 = model['fc2.weight'].data;

        // fc1 columns: one 58-dim (per-neuron) direction for each input unit k = 0..2p-1.
        const fc1Cols = [];
        for (let k = 0; k < 2 * p; k++) {
            const col = new Array(hidden);
            for (let n = 0; n < hidden; n++) col[n] = w1[n * 2 * p + k];
            fc1Cols.push(col);
        }
        const fc1Pca = pca2D(fc1Cols);

        // fc2 rows: one 58-dim direction for each output result r = 0..p-1.
        const fc2Rows = [];
        for (let r = 0; r < p; r++) fc2Rows.push(w2.slice(r * hidden, (r + 1) * hidden));
        const fc2Pca = pca2D(fc2Rows);

        pcaCache = { fc1Pca, fc2Pca };
        return pcaCache;
    }

    function closedLoopTrace(scores, color) {
        const xs = scores.map(s => s[0]).concat([scores[0][0]]);
        const ys = scores.map(s => s[1]).concat([scores[0][1]]);
        return { type: 'scatter', mode: 'lines', x: xs, y: ys, line: { color: color, width: 1 }, hoverinfo: 'skip' };
    }

    function renderPcaFc1() {
        const c = themeColors();
        const p = model.p;
        const { fc1Pca } = computePCA();
        const aScores = fc1Pca.scores.slice(0, p);
        const bScores = fc1Pca.scores.slice(p, 2 * p);
        const aColors = Array.from({ length: p }, (_, k) => hueColor(k, p));
        const bColors = aColors;

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 45 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'PC1', zeroline: true }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'PC2', zeroline: true })
        };

        Plotly.react('net-pca-fc1-plot', [
            closedLoopTrace(aScores, c.border),
            closedLoopTrace(bScores, c.border),
            {
                type: 'scatter', mode: 'markers', x: aScores.map(s => s[0]), y: aScores.map(s => s[1]),
                marker: { size: 9, symbol: 'circle', color: aColors, line: { color: c.text, width: 0.5 } },
                text: Array.from({ length: p }, (_, k) => 'a = ' + k), hovertemplate: '%{text}<extra></extra>'
            },
            {
                type: 'scatter', mode: 'markers', x: bScores.map(s => s[0]), y: bScores.map(s => s[1]),
                marker: { size: 9, symbol: 'diamond', color: bColors, line: { color: c.text, width: 0.5 } },
                text: Array.from({ length: p }, (_, k) => 'b = ' + k), hovertemplate: '%{text}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });
    }

    function renderPcaFc2() {
        const c = themeColors();
        const p = model.p;
        const { fc2Pca } = computePCA();
        const colors = Array.from({ length: p }, (_, r) => hueColor(r, p));

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 45 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'PC1', zeroline: true }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'PC2', zeroline: true })
        };

        Plotly.react('net-pca-fc2-plot', [
            closedLoopTrace(fc2Pca.scores, c.border),
            {
                type: 'scatter', mode: 'markers', x: fc2Pca.scores.map(s => s[0]), y: fc2Pca.scores.map(s => s[1]),
                marker: { size: 9, symbol: 'circle', color: colors, line: { color: c.text, width: 0.5 } },
                text: Array.from({ length: p }, (_, r) => 'r = ' + r), hovertemplate: '%{text}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });
    }

    function renderPca() {
        renderPcaFc1();
        renderPcaFc2();
        const { fc1Pca, fc2Pca } = computePCA();
        const statusEl = document.getElementById('net-pca-status');
        if (statusEl) {
            statusEl.textContent = 'PC1+PC2: fc1 wyjaśnia ' + (100 * (fc1Pca.explained[0] + fc1Pca.explained[1])).toFixed(1) +
                '% wariancji, fc2 wyjaśnia ' + (100 * (fc2Pca.explained[0] + fc2Pca.explained[1])).toFixed(1) + '%.';
        }
    }

    // Magnitude of the DFT of a length-p real vector, for frequencies m = 0 .. floor(p/2).
    // For a real signal, X[p-m] is the conjugate of X[m], so these frequencies carry all the information.
    function dftMagnitudes(vec, p) {
        const half = Math.floor(p / 2);
        const mags = new Array(half + 1);
        for (let m = 0; m <= half; m++) {
            let re = 0, im = 0;
            for (let k = 0; k < p; k++) {
                const angle = (2 * Math.PI * m * k) / p;
                re += vec[k] * Math.cos(angle);
                im -= vec[k] * Math.sin(angle);
            }
            mags[m] = Math.sqrt(re * re + im * im);
        }
        return mags;
    }

    let spectraCache = null;

    function neuronSpectra() {
        if (spectraCache) return spectraCache;
        const p = model.p;
        const half = Math.floor(p / 2);
        const perNeuron = [];
        const aggregate = new Array(half + 1).fill(0);
        for (let n = 0; n < model.hidden; n++) {
            const row = fc1Row(n);
            const wa = row.slice(0, p);
            const wb = row.slice(p, 2 * p);
            const magA = dftMagnitudes(wa, p);
            const magB = dftMagnitudes(wb, p);
            const power = new Array(half + 1);
            for (let m = 0; m <= half; m++) {
                power[m] = magA[m] * magA[m] + magB[m] * magB[m];
            }
            let dominant = 1;
            for (let m = 2; m <= half; m++) if (power[m] > power[dominant]) dominant = m;
            perNeuron.push({ neuron: n, power, dominant });
            for (let m = 1; m <= half; m++) aggregate[m] += power[m];
        }
        spectraCache = { perNeuron, aggregate, half };
        return spectraCache;
    }

    function renderFc1Heatmap(sortByFreq) {
        const c = themeColors();
        const p = model.p;
        const spectra = neuronSpectra();
        const order = sortByFreq
            ? spectra.perNeuron.slice().sort((x, y) => x.dominant - y.dominant || x.neuron - y.neuron).map(s => s.neuron)
            : spectra.perNeuron.map(s => s.neuron);

        const z = order.map(n => fc1Row(n));
        // customdata carries the real neuron index per row, since the y-axis below is just
        // the row position (0..rows-1) — passing neuron numbers as y would make Plotly treat
        // them as a *numeric* axis and silently re-sort rows back into numeric order.
        const customdata = order.map(n => Array(2 * p).fill(n));

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 55 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'wejście k', zeroline: false }),
            yaxis: Object.assign(baseAxisLayout(c), { title: sortByFreq ? 'neuron (posort. wg m)' : 'neuron', zeroline: false, showticklabels: false }),
            shapes: [
                { type: 'line', x0: p - 0.5, x1: p - 0.5, y0: -0.5, y1: order.length - 0.5, line: { color: c.text, width: 1 } }
            ]
        };

        Plotly.react('net-fc1-heatmap-plot', [
            {
                type: 'heatmap', z: z, customdata: customdata, colorscale: 'RdBu', reversescale: true, zmid: 0,
                showscale: true, colorbar: { thickness: 12, tickfont: { color: c.muted } },
                hovertemplate: 'neuron=%{customdata}, k=%{x}<br>waga=%{z:.3f}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });
    }

    function renderSpectrum() {
        const c = themeColors();
        const spectra = neuronSpectra();
        const ms = Array.from({ length: spectra.half }, (_, i) => i + 1);
        const powers = ms.map(m => spectra.aggregate[m]);
        const totalPower = powers.reduce((a, b) => a + b, 0);

        // Smallest set of frequencies (by descending power) whose energy already covers
        // most of the spectrum — a simple, threshold-free way to say "how many" and "which".
        const order = ms.map((m, i) => i).sort((i, j) => powers[j] - powers[i]);
        const active = new Set();
        let cumulative = 0;
        for (const i of order) {
            active.add(ms[i]);
            cumulative += powers[i];
            if (cumulative >= 0.6 * totalPower) break;
        }
        const activeSorted = ms.filter(m => active.has(m));
        const colors = ms.map(m => active.has(m) ? aColor : otherColor);

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 45 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'częstotliwość m', tickmode: 'linear', dtick: 1, zeroline: false }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'moc widmowa', zeroline: false })
        };

        Plotly.react('net-spectrum-plot', [
            { type: 'bar', x: ms, y: powers, marker: { color: colors } }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });

        const statusEl = document.getElementById('net-spectrum-status');
        if (statusEl) {
            statusEl.textContent = activeSorted.length + ' z ' + spectra.half +
                ' możliwych częstotliwości odpowiada za 60% mocy widma: m = {' + activeSorted.join(', ') + '}.';
        }
    }

    function renderWeightProfile(n) {
        const c = themeColors();
        const row = fc1Row(n);
        const p = model.p;
        const wa = row.slice(0, p);
        const wb = row.slice(p, 2 * p);
        const ks = Array.from({ length: p }, (_, i) => i);

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: true,
            legend: { orientation: 'h', y: 1.15, font: { color: c.muted } },
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'k' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'waga' })
        };

        Plotly.react(WEIGHT_ID, [
            {
                type: 'scatter', mode: 'lines+markers', x: ks, y: wa,
                name: 'w_a', line: { color: aColor, width: 2 }, marker: { size: 5, color: aColor }
            },
            {
                type: 'scatter', mode: 'lines+markers', x: ks, y: wb,
                name: 'w_b', line: { color: bColor, width: 2 }, marker: { size: 5, color: bColor }
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });
    }

    function renderHeatmap(n) {
        const c = themeColors();
        const p = model.p;
        const z = [];
        for (let b = 0; b < p; b++) {
            const row = [];
            for (let a = 0; a < p; a++) {
                row.push(hiddenActivations(a, b)[n]);
            }
            z.push(row);
        }

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'a', zeroline: false }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'b', zeroline: false })
        };

        Plotly.react(HEATMAP_ID, [
            {
                type: 'heatmap', z: z, colorscale: 'Viridis', showscale: false,
                hovertemplate: 'a=%{x}, b=%{y}<br>aktywacja=%{z:.3f}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });
    }

    function renderOutput(a, b) {
        const c = themeColors();
        const p = model.p;
        const probs = softmax(logits(a, b));
        const trueAns = (a + b) % p;
        let predicted = 0;
        for (let i = 1; i < p; i++) if (probs[i] > probs[predicted]) predicted = i;

        const xs = Array.from({ length: p }, (_, i) => i);
        const colors = xs.map(i => i === trueAns ? correctColor : (i === predicted ? predictedColor : otherColor));

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'wynik', tickmode: 'linear', dtick: 2 }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'P(wynik)', range: [0, 1] })
        };

        Plotly.react(OUTPUT_ID, [
            { type: 'bar', x: xs, y: probs, marker: { color: colors } }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });

        const statusEl = document.getElementById('net-predict-status');
        if (statusEl) {
            const ok = predicted === trueAns;
            statusEl.textContent = 'a + b = ' + a + ' + ' + b + ' = ' + trueAns + ' (mod ' + p + ') — sieć przewiduje ' +
                predicted + (ok ? ' — poprawnie.' : ' — błędnie.');
        }
    }

    function currentNeuron() {
        return parseInt(document.getElementById('net-neuron').value, 10);
    }

    function currentAB() {
        return {
            a: parseInt(document.getElementById('net-a').value, 10),
            b: parseInt(document.getElementById('net-b').value, 10)
        };
    }

    let sortFc1ByFreq = true;

    function renderAll() {
        if (!model) return;
        const n = currentNeuron();
        renderWeightProfile(n);
        renderHeatmap(n);
        const { a, b } = currentAB();
        renderOutput(a, b);
        renderFc1Heatmap(sortFc1ByFreq);
        renderSpectrum();
        renderPca();
    }

    function linkSliderAndNumber(sliderId, numberId, onChange) {
        const slider = document.getElementById(sliderId);
        const number = document.getElementById(numberId);
        if (!slider || !number) return;
        slider.addEventListener('input', () => { number.value = slider.value; onChange(); });
        number.addEventListener('input', () => {
            const v = parseInt(number.value, 10);
            if (!isFinite(v)) return;
            const max = parseInt(slider.max, 10);
            slider.value = Math.min(max, Math.max(0, v));
            onChange();
        });
    }

    function init() {
        linkSliderAndNumber('net-neuron', 'net-neuron-num', renderAll);
        linkSliderAndNumber('net-a', 'net-a-num', renderAll);
        linkSliderAndNumber('net-b', 'net-b-num', renderAll);

        const sortBtn = document.getElementById('net-fc1-sort');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                sortFc1ByFreq = !sortFc1ByFreq;
                sortBtn.textContent = sortFc1ByFreq ? 'Kolejność oryginalna' : 'Sortuj wg częstotliwości';
                renderFc1Heatmap(sortFc1ByFreq);
            });
        }

        try {
            const dataEl = document.getElementById('model-weights-data');
            model = JSON.parse(dataEl.textContent);
            const statusEl = document.getElementById('net-status');
            if (statusEl) {
                statusEl.textContent = 'p = ' + model.p + ', warstwa ukryta = ' + model.hidden + ' neuronów, aktywacja ReLU.';
            }
            renderAll();
        } catch (e) {
            const statusEl = document.getElementById('net-status');
            if (statusEl) statusEl.textContent = 'Nie udało się wczytać wag modelu.';
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(renderAll, 0));
    }
})();
