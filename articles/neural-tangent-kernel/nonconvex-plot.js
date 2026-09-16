(function () {
    // Small dataset generated from a target tanh curve with different (true) weights.
    const DATA_X = [-2, -1, 0, 1, 2];
    const TRUE_W1 = 0.8;
    const TRUE_W2 = 0.9;
    const DATA_Y = DATA_X.map(x => TRUE_W2 * Math.tanh(TRUE_W1 * x));
    const N = DATA_X.length;

    function fOut(theta1, theta2, x) {
        return theta2 * Math.tanh(theta1 * x);
    }

    function mse(theta1, theta2) {
        let s = 0;
        for (let i = 0; i < N; i++) {
            const e = fOut(theta1, theta2, DATA_X[i]) - DATA_Y[i];
            s += e * e;
        }
        return s / N;
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

    const theta1Input = document.getElementById('nc-theta1');
    const theta2Input = document.getElementById('nc-theta2');
    const theta1Label = document.getElementById('nc-theta1-value');
    const theta2Label = document.getElementById('nc-theta2-value');
    const statusEl = document.getElementById('nc-status');

    if (!theta1Input || !theta2Input) return;

    // Precompute the theta-space cost landscape once; it does not depend on the current point.
    const range = 3;
    const step = 0.06;
    const axis = [];
    for (let v = -range; v <= range + 1e-9; v += step) axis.push(Math.round(v * 1000) / 1000);
    const zLandscape = axis.map(t2 => axis.map(t1 => mse(t1, t2)));

    function renderFSpace(c, theta1, theta2) {
        const xs = [];
        for (let v = -3; v <= 3 + 1e-9; v += 0.05) xs.push(Math.round(v * 1000) / 1000);
        const ys = xs.map(x => fOut(theta1, theta2, x));

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            xaxis: { title: 'x', color: c.muted, gridcolor: c.border, zeroline: false },
            yaxis: { title: 'f_θ(x)', color: c.muted, gridcolor: c.border, zeroline: false, range: [-1.3, 1.3] }
        };

        Plotly.react('nonconvex-f-space', [
            {
                type: 'scatter',
                mode: 'lines',
                x: xs,
                y: ys,
                line: { color: '#2563eb', width: 2.5 },
                hoverinfo: 'skip'
            },
            {
                type: 'scatter',
                mode: 'markers',
                x: DATA_X,
                y: DATA_Y,
                marker: { size: 9, color: '#dc2626' },
                hovertemplate: 'x=%{x}, y=%{y:.3f}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false });
    }

    function renderThetaSpace(c, theta1, theta2) {
        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            xaxis: { title: 'θ₁', color: c.muted, gridcolor: c.border, zeroline: false },
            yaxis: { title: 'θ₂', color: c.muted, gridcolor: c.border, zeroline: false }
        };

        Plotly.react('nonconvex-theta-space', [
            {
                type: 'heatmap',
                x: axis,
                y: axis,
                z: zLandscape,
                zmin: 0,
                zmax: 1.5,
                colorscale: [[0, '#0f172a'], [0.35, '#2563eb'], [1, c.border]],
                showscale: false,
                hovertemplate: 'θ₁=%{x:.2f}, θ₂=%{y:.2f}, koszt=%{z:.3f}<extra></extra>'
            },
            {
                type: 'scatter',
                mode: 'markers',
                x: [theta1],
                y: [theta2],
                marker: { size: 11, color: '#ffffff', line: { color: '#171717', width: 1.5 } },
                hovertemplate: 'θ=(%{x:.2f}, %{y:.2f})<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false });
    }

    function render() {
        const c = themeColors();
        const theta1 = parseFloat(theta1Input.value);
        const theta2 = parseFloat(theta2Input.value);
        theta1Label.textContent = theta1.toFixed(2);
        theta2Label.textContent = theta2.toFixed(2);

        renderFSpace(c, theta1, theta2);
        renderThetaSpace(c, theta1, theta2);

        if (statusEl) {
            statusEl.textContent = 'koszt C w tym punkcie: ' + mse(theta1, theta2).toFixed(3);
        }
    }

    theta1Input.addEventListener('input', render);
    theta2Input.addEventListener('input', render);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(render, 0));
    }

    render();
})();
