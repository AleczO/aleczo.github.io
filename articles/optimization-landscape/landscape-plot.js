(function () {
    const LANDSCAPES = {
        himmelblau: {
            label: "Himmelblau's function",
            range: 5,
            step: 0.12,
            fn: function (x, y) {
                return Math.pow(x * x + y - 11, 2) + Math.pow(x + y * y - 7, 2);
            },
            grad: function (x, y) {
                const dEdx = 4 * x * (x * x + y - 11) + 2 * (x + y * y - 7);
                const dEdy = 2 * (x * x + y - 11) + 4 * y * (x + y * y - 7);
                return [dEdx, dEdy];
            },
            // All four are global minima of E(x, y) = 0.
            optima: [
                { x: 3.0, y: 2.0, label: 'global min' },
                { x: -2.805118, y: 3.131312, label: 'global min' },
                { x: -3.779310, y: -3.283186, label: 'global min' },
                { x: 3.584428, y: -1.848126, label: 'global min' }
            ],
            defaults: { x0: -4, y0: 4, eta: 0.01, etaAdaptive: 0.15, iters: 80, itersAdaptive: 150, noise: 8 }
        },
        rastrigin: {
            label: 'Rastrigin function',
            range: 5.12,
            step: 0.09,
            fn: function (x, y) {
                return 20 + (x * x - 10 * Math.cos(2 * Math.PI * x)) + (y * y - 10 * Math.cos(2 * Math.PI * y));
            },
            grad: function (x, y) {
                const dEdx = 2 * x + 20 * Math.PI * Math.sin(2 * Math.PI * x);
                const dEdy = 2 * y + 20 * Math.PI * Math.sin(2 * Math.PI * y);
                return [dEdx, dEdy];
            },
            // The only global minimum; the surrounding dips are local minima.
            optima: [
                { x: 0, y: 0, label: 'global min' }
            ],
            defaults: { x0: -4, y0: 3.5, eta: 0.004, etaAdaptive: 0.08, iters: 120, itersAdaptive: 200, noise: 12 }
        },
        doublewell: {
            label: 'Double Well (asymmetric)',
            range: 2.6,
            step: 0.05,
            // E(x, y) = x^4 - 4x^2 - x + 0.5 y^2 : a shallow local well near x=-1.35,
            // a barrier near x=-0.13, and a much deeper global well near x=1.47.
            fn: function (x, y) {
                return Math.pow(x, 4) - 4 * x * x - x + 0.5 * y * y;
            },
            grad: function (x, y) {
                const dEdx = 4 * Math.pow(x, 3) - 8 * x - 1;
                const dEdy = y;
                return [dEdx, dEdy];
            },
            // Only the deep global well is marked; the shallow one is left for the
            // reader to discover by running the simulation.
            optima: [
                { x: 1.4722, y: 0, label: 'global min' }
            ],
            defaults: { x0: -2.2, y0: 1.0, eta: 0.02, etaAdaptive: 0.12, iters: 150, itersAdaptive: 280, noise: 0.6 }
        }
    };

    const ADAM_BETA1 = 0.9;
    const ADAM_BETA2 = 0.999;
    const ADAM_EPS = 1e-8;
    const MOMENTUM_BETA = 0.9;
    const RMSPROP_BETA = 0.9;
    const RMSPROP_EPS = 1e-8;
    const MEMORYLESS_METHODS = ['gd', 'rmsprop'];

    function gaussianNoise() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    let currentPoint = null;
    let gradientVisible = false;

    function refreshGradientArrow() {
        if (!gradientVisible || !currentPoint) {
            Plotly.relayout('landscape-2d', { annotations: [] });
            return;
        }
        const ls = landscape();
        const [gx, gy] = ls.grad(currentPoint.x, currentPoint.y);
        const norm = Math.sqrt(gx * gx + gy * gy) || 1;
        const len = ls.range * 0.18;
        const hx = currentPoint.x + (gx / norm) * len;
        const hy = currentPoint.y + (gy / norm) * len;
        Plotly.relayout('landscape-2d', {
            annotations: [{
                x: hx, y: hy, ax: currentPoint.x, ay: currentPoint.y,
                xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 3, arrowsize: 1.2, arrowwidth: 2.5, arrowcolor: '#2563eb', text: ''
            }]
        });
    }

    let currentKey = 'himmelblau';
    let grid = null;

    function landscape() {
        return LANDSCAPES[currentKey];
    }

    function buildGrid(ls) {
        const axis = [];
        for (let v = -ls.range; v <= ls.range + 1e-9; v += ls.step) {
            axis.push(Math.round(v * 1000) / 1000);
        }
        const z = [];
        for (let i = 0; i < axis.length; i++) {
            const row = [];
            for (let j = 0; j < axis.length; j++) {
                row.push(ls.fn(axis[j], axis[i]));
            }
            z.push(row);
        }
        return { axis, z };
    }

    const colorscale = 'Burgyl';
    const pathColor = '#171717';
    const pathOutline = '#ffffff';

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

    function optimaArrays(ls) {
        return {
            x: ls.optima.map(p => p.x),
            y: ls.optima.map(p => p.y),
            z: ls.optima.map(p => ls.fn(p.x, p.y)),
            labels: ls.optima.map(p => p.label)
        };
    }

    function renderSurface() {
        const ls = landscape();
        const c = themeColors();
        const opt = optimaArrays(ls);
        const layout = {
            margin: { l: 0, r: 0, t: 0, b: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            scene: {
                xaxis: { title: 'x', color: c.muted, gridcolor: c.border, zerolinecolor: c.border, showbackground: false },
                yaxis: { title: 'y', color: c.muted, gridcolor: c.border, zerolinecolor: c.border, showbackground: false },
                zaxis: { title: 'E(x, y)', color: c.muted, gridcolor: c.border, zerolinecolor: c.border, showbackground: false },
                camera: { eye: { x: 1.5, y: -1.5, z: 0.9 } }
            }
        };
        Plotly.newPlot('landscape-3d', [
            {
                type: 'surface',
                x: grid.axis,
                y: grid.axis,
                z: grid.z,
                colorscale: colorscale,
                showscale: false,
                opacity: 0.96,
                contours: { z: { show: true, usecolormap: true, project: { z: true } } }
            },
            {
                type: 'scatter3d',
                mode: 'lines+markers',
                x: [], y: [], z: [],
                line: { color: pathColor, width: 5 },
                marker: { size: 3, color: pathColor, line: { color: pathOutline, width: 1 } }
            },
            {
                type: 'scatter3d',
                mode: 'markers',
                x: opt.x, y: opt.y, z: opt.z,
                text: opt.labels,
                marker: { size: 5, color: '#2563eb', symbol: 'circle', line: { color: '#ffffff', width: 1 } },
                hovertemplate: '%{text}<br>x=%{x:.3f}, y=%{y:.3f}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false });
    }

    function renderContour() {
        const ls = landscape();
        const c = themeColors();
        const opt = optimaArrays(ls);
        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: 'zoom',
            xaxis: { title: 'x', color: c.muted, gridcolor: c.border, zeroline: false },
            yaxis: { title: 'y', color: c.muted, gridcolor: c.border, zeroline: false }
        };
        Plotly.newPlot('landscape-2d', [
            {
                type: 'contour',
                x: grid.axis,
                y: grid.axis,
                z: grid.z,
                colorscale: colorscale,
                ncontours: 28,
                showscale: false,
                contours: { coloring: 'fill', showlines: true },
                line: { width: 0.5, color: 'rgba(0,0,0,0.35)' }
            },
            {
                type: 'scatter',
                mode: 'lines+markers',
                x: [], y: [],
                line: { color: pathColor, width: 2.5 },
                marker: { size: 5, color: pathColor, line: { color: pathOutline, width: 1 } }
            },
            {
                type: 'scatter',
                mode: 'markers',
                x: opt.x, y: opt.y,
                text: opt.labels,
                marker: { size: 9, color: '#2563eb', symbol: 'circle', line: { color: '#ffffff', width: 1 } },
                hovertemplate: '%{text}<br>x=%{x:.3f}, y=%{y:.3f}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false });
    }

    function renderPlots() {
        grid = buildGrid(landscape());
        renderSurface();
        renderContour();
    }

    const PREVIEW_IDS = {
        himmelblau: 'preview-himmelblau',
        rastrigin: 'preview-rastrigin',
        doublewell: 'preview-doublewell'
    };

    function renderPreviews() {
        const c = themeColors();
        Object.keys(PREVIEW_IDS).forEach((key) => {
            const el = document.getElementById(PREVIEW_IDS[key]);
            if (!el) return;
            const ls = LANDSCAPES[key];
            const g = buildGrid(ls);
            const opt = optimaArrays(ls);
            const layout = {
                margin: { l: 5, r: 5, t: 5, b: 5 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: c.muted, family: fontFamily() },
                showlegend: false,
                xaxis: { showticklabels: false, showgrid: false, zeroline: false },
                yaxis: { showticklabels: false, showgrid: false, zeroline: false }
            };
            Plotly.newPlot(PREVIEW_IDS[key], [
                {
                    type: 'contour',
                    x: g.axis,
                    y: g.axis,
                    z: g.z,
                    colorscale: colorscale,
                    ncontours: 22,
                    showscale: false,
                    contours: { coloring: 'fill', showlines: true },
                    line: { width: 0.4, color: 'rgba(0,0,0,0.3)' }
                },
                {
                    type: 'scatter',
                    mode: 'markers',
                    x: opt.x, y: opt.y,
                    text: opt.labels,
                    marker: { size: 7, color: '#2563eb', symbol: 'circle', line: { color: '#ffffff', width: 1 } },
                    hovertemplate: '%{text}<br>x=%{x:.3f}, y=%{y:.3f}<extra></extra>'
                }
            ], layout, { responsive: true, displaylogo: false, staticPlot: false });
        });
    }

    function runOptimizer(method, x0, y0, eta, maxIters, sigma) {
        const ls = landscape();
        const bound = ls.range;
        const points = [{ x: x0, y: y0, z: ls.fn(x0, y0) }];
        let x = x0, y = y0;
        let converged = false;
        let clamped = false;
        let steps = 0;
        let mx = 0, my = 0, vx = 0, vy = 0; // Adam
        let momVx = 0, momVy = 0;           // Momentum
        let sqX = 0, sqY = 0;               // RMSProp
        for (let i = 0; i < maxIters; i++) {
            const [gx, gy] = ls.grad(x, y);
            if (MEMORYLESS_METHODS.includes(method)) {
                const gradNorm = Math.sqrt(gx * gx + gy * gy);
                if (gradNorm < 1e-3) { converged = true; break; }
            }

            let nextX, nextY;
            if (method === 'adam') {
                const t = i + 1;
                mx = ADAM_BETA1 * mx + (1 - ADAM_BETA1) * gx;
                my = ADAM_BETA1 * my + (1 - ADAM_BETA1) * gy;
                vx = ADAM_BETA2 * vx + (1 - ADAM_BETA2) * gx * gx;
                vy = ADAM_BETA2 * vy + (1 - ADAM_BETA2) * gy * gy;
                const mxHat = mx / (1 - Math.pow(ADAM_BETA1, t));
                const myHat = my / (1 - Math.pow(ADAM_BETA1, t));
                const vxHat = vx / (1 - Math.pow(ADAM_BETA2, t));
                const vyHat = vy / (1 - Math.pow(ADAM_BETA2, t));
                nextX = x - eta * mxHat / (Math.sqrt(vxHat) + ADAM_EPS);
                nextY = y - eta * myHat / (Math.sqrt(vyHat) + ADAM_EPS);
            } else if (method === 'rmsprop') {
                sqX = RMSPROP_BETA * sqX + (1 - RMSPROP_BETA) * gx * gx;
                sqY = RMSPROP_BETA * sqY + (1 - RMSPROP_BETA) * gy * gy;
                nextX = x - eta * gx / (Math.sqrt(sqX) + RMSPROP_EPS);
                nextY = y - eta * gy / (Math.sqrt(sqY) + RMSPROP_EPS);
            } else if (method === 'momentum') {
                momVx = MOMENTUM_BETA * momVx + eta * (gx + sigma * gaussianNoise());
                momVy = MOMENTUM_BETA * momVy + eta * (gy + sigma * gaussianNoise());
                nextX = x - momVx;
                nextY = y - momVy;
            } else if (method === 'sgd') {
                nextX = x - eta * (gx + sigma * gaussianNoise());
                nextY = y - eta * (gy + sigma * gaussianNoise());
            } else {
                nextX = x - eta * gx;
                nextY = y - eta * gy;
            }

            if (!isFinite(nextX) || !isFinite(nextY)) {
                return { points, status: 'diverged', steps };
            }
            // Keep the animated point on the surface that is actually plotted, rather
            // than letting a noisy step fly off into unrendered territory.
            if (Math.abs(nextX) > bound || Math.abs(nextY) > bound) {
                clamped = true;
                nextX = Math.max(-bound, Math.min(bound, nextX));
                nextY = Math.max(-bound, Math.min(bound, nextY));
            }
            x = nextX;
            y = nextY;
            steps++;
            points.push({ x: x, y: y, z: ls.fn(x, y) });
        }
        return { points, status: converged ? 'converged' : 'stopped', steps, clamped };
    }

    let animTimer = null;

    function setRunningState(isRunning) {
        const runBtn = document.getElementById('gd-run');
        const randomBtn = document.getElementById('gd-randomize');
        const stopBtn = document.getElementById('gd-stop');
        if (runBtn) runBtn.disabled = isRunning;
        if (randomBtn) randomBtn.disabled = isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning;
    }

    function animatePath(points, onTick, onDone) {
        if (animTimer) { clearInterval(animTimer); animTimer = null; }
        Plotly.restyle('landscape-3d', { x: [[]], y: [[]], z: [[]] }, [1]);
        Plotly.restyle('landscape-2d', { x: [[]], y: [[]] }, [1]);

        let i = 0;
        const speedInput = document.getElementById('gd-speed');
        const frameDelay = speedInput ? parseInt(speedInput.value, 10) : 120;

        setRunningState(true);

        animTimer = setInterval(() => {
            if (i >= points.length) {
                clearInterval(animTimer);
                animTimer = null;
                setRunningState(false);
                if (onDone) onDone();
                return;
            }
            const p = points[i];
            Plotly.extendTraces('landscape-3d', { x: [[p.x]], y: [[p.y]], z: [[p.z]] }, [1]);
            Plotly.extendTraces('landscape-2d', { x: [[p.x]], y: [[p.y]] }, [1]);
            currentPoint = { x: p.x, y: p.y };
            if (gradientVisible) refreshGradientArrow();
            if (onTick) onTick(p, i + 1, points.length);
            i++;
        }, frameDelay);
    }

    function stopAnimation() {
        if (!animTimer) return;
        clearInterval(animTimer);
        animTimer = null;
        setRunningState(false);
        if (currentPoint) {
            setStatus('Stopped at x = ' + currentPoint.x.toFixed(3) + ', y = ' + currentPoint.y.toFixed(3) +
                ', E = ' + landscape().fn(currentPoint.x, currentPoint.y).toFixed(4) + '.');
        }
    }

    function setStatus(text) {
        const el = document.getElementById('gd-status');
        if (el) el.textContent = text;
    }

    function runFromInputs() {
        const x0 = parseFloat(document.getElementById('gd-x0').value);
        const y0 = parseFloat(document.getElementById('gd-y0').value);
        const eta = parseFloat(document.getElementById('gd-eta').value);
        const iters = parseInt(document.getElementById('gd-iters').value, 10);
        const method = document.getElementById('gd-method').value;
        const sigma = parseFloat(document.getElementById('gd-noise').value);

        const noisyMethod = method === 'sgd' || method === 'momentum';

        if (!isFinite(x0) || !isFinite(y0) || !isFinite(iters) || iters <= 0) {
            setStatus('Please enter valid numbers for all fields.');
            return;
        }
        if (!isFinite(eta) || eta <= 0) {
            setStatus('Please enter a valid learning rate.');
            return;
        }
        if (noisyMethod && (!isFinite(sigma) || sigma < 0)) {
            setStatus('Please enter a valid noise level.');
            return;
        }

        setStatus('Running …');
        const result = runOptimizer(method, x0, y0, eta, iters, sigma);

        animatePath(result.points, (p, step, total) => {
            setStatus('Step ' + step + ' / ' + total + ' — x = ' + p.x.toFixed(3) + ', y = ' + p.y.toFixed(3) + ', E = ' + p.z.toFixed(4));
        }, () => {
            const last = result.points[result.points.length - 1];
            const coords = 'x = ' + last.x.toFixed(3) + ', y = ' + last.y.toFixed(3) + ', E = ' + last.z.toFixed(4);
            const clampNote = result.clamped ? ' (path was kept within the plotted range at least once)' : '';
            if (result.status === 'diverged') {
                setStatus('Diverged after ' + result.steps + ' steps — try a smaller learning rate' + (noisyMethod ? ' or noise level' : '') + '.');
            } else if (result.status === 'converged') {
                setStatus('Converged after ' + result.steps + ' steps at ' + coords + '.');
            } else if (noisyMethod) {
                setStatus('Ran ' + result.steps + ' noisy steps, ending near ' + coords + clampNote + '.');
            } else {
                setStatus('Reached the iteration limit at ' + coords + clampNote + '.');
            }
        });
    }

    function randomizeStart() {
        const ls = landscape();
        const x0 = (Math.random() * 2 * ls.range - ls.range).toFixed(2);
        const y0 = (Math.random() * 2 * ls.range - ls.range).toFixed(2);
        document.getElementById('gd-x0').value = x0;
        document.getElementById('gd-y0').value = y0;
        currentPoint = { x: parseFloat(x0), y: parseFloat(y0) };
        refreshGradientArrow();
        setStatus('Randomized initial state. Press Run to start.');
    }

    function applyStartDefaults() {
        const d = landscape().defaults;
        document.getElementById('gd-x0').value = d.x0;
        document.getElementById('gd-y0').value = d.y0;
        currentPoint = { x: d.x0, y: d.y0 };
    }

    function usesAdaptiveScale(method) {
        return method === 'rmsprop' || method === 'adam';
    }

    function applyMethodDefaults() {
        const d = landscape().defaults;
        const method = document.getElementById('gd-method').value;
        const adaptive = usesAdaptiveScale(method);
        document.getElementById('gd-eta').value = adaptive ? d.etaAdaptive : d.eta;
        document.getElementById('gd-iters').value = adaptive ? d.itersAdaptive : d.iters;
        document.getElementById('gd-noise').value = d.noise;
    }

    function updateControlRowVisibility() {
        const method = document.getElementById('gd-method').value;
        const noiseRow = document.getElementById('gd-noise-row');
        if (noiseRow) noiseRow.style.display = (method === 'sgd' || method === 'momentum') ? '' : 'none';
    }

    function switchLandscape(key) {
        if (!LANDSCAPES[key]) return;
        currentKey = key;
        if (animTimer) { clearInterval(animTimer); animTimer = null; setRunningState(false); }
        applyStartDefaults();
        applyMethodDefaults();
        renderPlots();
        refreshGradientArrow();
        setStatus('Set a starting point and press Run.');
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyStartDefaults();
        applyMethodDefaults();
        updateControlRowVisibility();
        renderPlots();
        renderPreviews();

        const runBtn = document.getElementById('gd-run');
        const randomBtn = document.getElementById('gd-randomize');
        const speedInput = document.getElementById('gd-speed');
        const speedLabel = document.getElementById('gd-speed-label');
        const landscapeSelect = document.getElementById('gd-landscape');
        const methodSelect = document.getElementById('gd-method');
        const gradientBtn = document.getElementById('gd-show-gradient');
        const x0Input = document.getElementById('gd-x0');
        const y0Input = document.getElementById('gd-y0');
        const stopBtn = document.getElementById('gd-stop');

        if (runBtn) runBtn.addEventListener('click', runFromInputs);
        if (randomBtn) randomBtn.addEventListener('click', randomizeStart);
        if (stopBtn) stopBtn.addEventListener('click', stopAnimation);
        if (speedInput && speedLabel) {
            speedInput.addEventListener('input', () => {
                speedLabel.textContent = speedInput.value + ' ms/step';
            });
        }
        if (landscapeSelect) {
            landscapeSelect.addEventListener('change', (e) => switchLandscape(e.target.value));
        }
        if (methodSelect) {
            methodSelect.addEventListener('change', () => {
                applyMethodDefaults();
                updateControlRowVisibility();
            });
        }
        if (gradientBtn) {
            gradientBtn.addEventListener('click', () => {
                gradientVisible = !gradientVisible;
                gradientBtn.textContent = gradientVisible ? 'Hide gradient' : 'Show gradient';
                refreshGradientArrow();
            });
        }
        if (x0Input && y0Input) {
            const syncCurrentPoint = () => {
                const x = parseFloat(x0Input.value);
                const y = parseFloat(y0Input.value);
                if (isFinite(x) && isFinite(y)) {
                    currentPoint = { x, y };
                    refreshGradientArrow();
                }
            };
            x0Input.addEventListener('input', syncCurrentPoint);
            y0Input.addEventListener('input', syncCurrentPoint);
        }
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // script.js already flipped data-theme by the time this listener runs
            setTimeout(() => {
                if (animTimer) { clearInterval(animTimer); animTimer = null; setRunningState(false); }
                renderPlots();
                renderPreviews();
                refreshGradientArrow();
                setStatus('Set a starting point and press Run.');
            }, 0);
        });
    }
})();
