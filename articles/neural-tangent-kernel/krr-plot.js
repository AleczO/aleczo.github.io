(function () {
    // Seeded PRNG (mulberry32) so the dataset is identical on every reload.
    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    const rng = mulberry32(42);

    function gaussianNoise(std) {
        let u = 0, v = 0;
        while (u === 0) u = rng();
        while (v === 0) v = rng();
        return std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    const N = 22;
    const trainX = [];
    const trainY = [];
    for (let i = 0; i < N; i++) {
        const x = -3 + (6 * i) / (N - 1);
        trainX.push(x);
        trainY.push(Math.sin(2 * x) + gaussianNoise(0.25));
    }

    function rbfKernel(a, b, sigma) {
        const d = a - b;
        return Math.exp(-(d * d) / (2 * sigma * sigma));
    }

    // Solves (A) alpha = y for a small dense symmetric matrix via Gaussian elimination.
    function solveLinearSystem(A, y) {
        const n = y.length;
        const M = A.map((row, i) => row.concat([y[i]]));
        for (let col = 0; col < n; col++) {
            let pivot = col;
            for (let r = col + 1; r < n; r++) {
                if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
            }
            [M[col], M[pivot]] = [M[pivot], M[col]];
            const pivotVal = M[col][col];
            for (let c = col; c <= n; c++) M[col][c] /= pivotVal;
            for (let r = 0; r < n; r++) {
                if (r === col) continue;
                const factor = M[r][col];
                if (factor === 0) continue;
                for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
            }
        }
        return M.map(row => row[n]);
    }

    function fitAndPredict(sigma, lambda) {
        const K = trainX.map(xi => trainX.map(xj => rbfKernel(xi, xj, sigma)));
        for (let i = 0; i < N; i++) K[i][i] += lambda;
        const alpha = solveLinearSystem(K, trainY);

        const gridX = [];
        const gridY = [];
        const steps = 240;
        for (let i = 0; i <= steps; i++) {
            const x = -4 + (8 * i) / steps;
            let pred = 0;
            for (let j = 0; j < N; j++) pred += alpha[j] * rbfKernel(trainX[j], x, sigma);
            gridX.push(x);
            gridY.push(pred);
        }
        return { gridX, gridY };
    }

    // Closed-form ridge regression on the raw input (no kernel/feature map):
    // minimize sum (w*x_i + b - y_i)^2 + lambda*w^2, bias left unregularized.
    function linearRidgeFit(lambda) {
        const n = N;
        let sx = 0, sxx = 0, sy = 0, sxy = 0;
        for (let i = 0; i < n; i++) {
            sx += trainX[i];
            sxx += trainX[i] * trainX[i];
            sy += trainY[i];
            sxy += trainX[i] * trainY[i];
        }
        const w = (sxy - (sx * sy) / n) / (sxx - (sx * sx) / n + lambda);
        const b = (sy - w * sx) / n;

        const gridX = [];
        const gridY = [];
        const steps = 240;
        for (let i = 0; i <= steps; i++) {
            const x = -4 + (8 * i) / steps;
            gridX.push(x);
            gridY.push(w * x + b);
        }
        return { gridX, gridY };
    }

    function trueFunction() {
        const gridX = [];
        const gridY = [];
        const steps = 240;
        for (let i = 0; i <= steps; i++) {
            const x = -4 + (8 * i) / steps;
            gridX.push(x);
            gridY.push(Math.sin(2 * x));
        }
        return { gridX, gridY };
    }

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

    const sigmaInput = document.getElementById('krr-sigma');
    const lambdaInput = document.getElementById('krr-lambda');
    const sigmaLabel = document.getElementById('krr-sigma-value');
    const lambdaLabel = document.getElementById('krr-lambda-value');
    const resetBtn = document.getElementById('krr-reset');

    if (!sigmaInput || !lambdaInput) return;

    const DEFAULT_SIGMA = 0.4;
    const DEFAULT_LAMBDA = 0.05;

    function render() {
        const sigma = parseFloat(sigmaInput.value);
        const lambda = parseFloat(lambdaInput.value);
        sigmaLabel.textContent = sigma.toFixed(2);
        lambdaLabel.textContent = lambda.toFixed(3);

        const c = themeColors();
        const fit = fitAndPredict(sigma, lambda);
        const linearFit = linearRidgeFit(lambda);
        const truth = trueFunction();

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: true,
            legend: { orientation: 'h', x: 0, y: 1.12, font: { color: c.muted, size: 11 } },
            xaxis: { title: 'x', color: c.muted, gridcolor: c.border, zeroline: false, range: [-4, 4] },
            yaxis: { title: 'y', color: c.muted, gridcolor: c.border, zeroline: false }
        };

        Plotly.react('krr-plot', [
            {
                type: 'scatter',
                mode: 'lines',
                name: 'sin(2x)',
                x: truth.gridX,
                y: truth.gridY,
                line: { color: c.border, width: 2, dash: 'dot' },
                hoverinfo: 'skip'
            },
            {
                type: 'scatter',
                mode: 'markers',
                name: 'dane treningowe',
                x: trainX,
                y: trainY,
                marker: { size: 7, color: c.text, line: { color: c.border, width: 1 } }
            },
            {
                type: 'scatter',
                mode: 'lines',
                name: 'dopasowanie KRR',
                x: fit.gridX,
                y: fit.gridY,
                line: { color: '#2563eb', width: 2.5 }
            },
            {
                type: 'scatter',
                mode: 'lines',
                name: 'regresja liniowa (bez jądra)',
                x: linearFit.gridX,
                y: linearFit.gridY,
                line: { color: '#dc2626', width: 2.5, dash: 'dash' }
            }
        ], layout, { responsive: true, displaylogo: false });
    }

    sigmaInput.addEventListener('input', render);
    lambdaInput.addEventListener('input', render);

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            sigmaInput.value = DEFAULT_SIGMA;
            lambdaInput.value = DEFAULT_LAMBDA;
            render();
        });
    }

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(render, 0));
    }

    render();
})();
