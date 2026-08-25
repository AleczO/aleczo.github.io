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
