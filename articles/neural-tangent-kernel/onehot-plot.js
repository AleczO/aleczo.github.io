(function () {
    const P = 7;

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

    function baseLayout(c) {
        return {
            margin: { l: 45, r: 10, t: 10, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: true,
            legend: { orientation: 'h', x: 0, y: 1.15, font: { color: c.muted, size: 11 } }
        };
    }

    // Represents a set of Dirac spikes as thin stems with a dot at each tip.
    function diracStemTraces(points, color, name) {
        const stemX = [];
        const stemY = [];
        points.forEach(([x, h]) => {
            stemX.push(x, x, null);
            stemY.push(0, h, null);
        });
        return [
            {
                type: 'scatter',
                mode: 'lines',
                name: name,
                x: stemX,
                y: stemY,
                line: { color: color, width: 1.5 },
                showlegend: false,
                hoverinfo: 'skip'
            },
            {
                type: 'scatter',
                mode: 'markers',
                name: name,
                x: points.map(p => p[0]),
                y: points.map(p => p[1]),
                marker: { size: 6, color: color },
                hovertemplate: 'indeks=%{x}<extra>' + name + '</extra>'
            }
        ];
    }

    function render() {
        const c = themeColors();

        // All P one-hot positions for block a ([0, P)) and block b, shifted to [P, 2P).
        const blockA = Array.from({ length: P }, (_, i) => [i, 1]);
        const blockB = Array.from({ length: P }, (_, i) => [P + i, 1]);

        const encodingLayout = baseLayout(c);
        encodingLayout.xaxis = { title: 'indeks', color: c.muted, gridcolor: c.border, zeroline: false, range: [-1, 2 * P] };
        encodingLayout.yaxis = { title: 'wartość', color: c.muted, gridcolor: c.border, zeroline: false, range: [0, 1.15] };
        Plotly.react('onehot-example', [
            ...diracStemTraces(blockA, '#2563eb', 'blok a'),
            ...diracStemTraces(blockB, '#dc2626', 'blok b')
        ], encodingLayout, { responsive: true, displaylogo: false });

        // Full training set = all pairs (a, b) in Z_p x Z_p, N = P*P, each with mass 1/P^2.
        const uniformMass = 1 / (P * P);
        const z = Array.from({ length: P }, () => Array.from({ length: P }, () => uniformMass));
        const distLayout = baseLayout(c);
        distLayout.showlegend = false;
        distLayout.xaxis = { title: 'a', color: c.muted, gridcolor: c.border, zeroline: false, dtick: 1 };
        distLayout.yaxis = { title: 'b', color: c.muted, gridcolor: c.border, zeroline: false, dtick: 1 };
        Plotly.react('onehot-distribution', [{
            type: 'heatmap',
            x: Array.from({ length: P }, (_, i) => i),
            y: Array.from({ length: P }, (_, i) => i),
            z: z,
            zmin: 0,
            zmax: uniformMass,
            colorscale: [[0, c.border], [1, '#2563eb']],
            xgap: 3,
            ygap: 3,
            showscale: false,
            hovertemplate: 'a=%{x}, b=%{y}, p^in=%{z:.5f}<extra></extra>'
        }], distLayout, { responsive: true, displaylogo: false });
    }

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(render, 0));
    }

    render();
})();
