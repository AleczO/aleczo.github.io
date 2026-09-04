(function () {
    const WALK_ID = 'rp-walk-plot';
    const SCALING_ID = 'rp-scaling-plot';
    const MAX_N = 500;

    const randomColor = '#dc2626';
    const coherentColor = '#2563eb';
    const refColor = '#5c5c5c';

    let phases = [];

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
        return { color: c.muted, gridcolor: c.border, zeroline: true, zerolinecolor: c.border, fixedrange: true };
    }

    function resamplePhases() {
        phases = Array.from({ length: MAX_N }, () => Math.random() * 2 * Math.PI);
    }

    function randomWalkPoints(N) {
        const pts = [{ x: 0, y: 0 }];
        let x = 0, y = 0;
        for (let k = 0; k < N; k++) {
            x += Math.cos(phases[k]);
            y += Math.sin(phases[k]);
            pts.push({ x, y });
        }
        return pts;
    }

    function currentN() {
        return parseInt(document.getElementById('rp-N').value, 10);
    }

    function renderWalk(N) {
        const c = themeColors();
        const pts = randomWalkPoints(N);
        const finalPt = pts[pts.length - 1];
        const mag = Math.sqrt(finalPt.x * finalPt.x + finalPt.y * finalPt.y);
        const range = Math.max(N * 0.15, mag * 1.2, 5);

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'x', range: [-range, N + range * 0.3] }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'y', range: [-range, range], scaleanchor: 'x' })
        };

        Plotly.react(WALK_ID, [
            {
                type: 'scatter', mode: 'lines', x: [0, N], y: [0, 0],
                line: { color: coherentColor, width: 2, dash: 'dash' }, hoverinfo: 'skip', name: 'spójna suma'
            },
            {
                type: 'scatter', mode: 'markers', x: [N], y: [0],
                marker: { size: 9, color: coherentColor }, text: ['spójna suma: ' + N], hovertemplate: '%{text}<extra></extra>'
            },
            {
                type: 'scatter', mode: 'lines', x: pts.map(p => p.x), y: pts.map(p => p.y),
                line: { color: randomColor, width: 1.3 }, hoverinfo: 'skip', name: 'losowa suma'
            },
            {
                type: 'scatter', mode: 'markers', x: [finalPt.x], y: [finalPt.y],
                marker: { size: 9, color: randomColor },
                text: ['losowa suma: |·| ≈ ' + mag.toFixed(2)], hovertemplate: '%{text}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });

        return mag;
    }

    function renderScaling(N) {
        const c = themeColors();
        const pts = randomWalkPoints(N);
        const ns = [];
        const ratios = [];
        const refRatios = [];
        for (let n = 1; n <= N; n++) {
            const p = pts[n];
            const mag = Math.sqrt(p.x * p.x + p.y * p.y);
            ns.push(n);
            ratios.push(mag / n);
            refRatios.push(1 / Math.sqrt(n));
        }

        const layout = {
            margin: { l: 45, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: true,
            legend: { orientation: 'h', y: 1.15, font: { color: c.muted } },
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'N', zeroline: false }),
            yaxis: Object.assign(baseAxisLayout(c), { title: '|suma| / N', range: [0, 1.05], zeroline: false })
        };

        Plotly.react(SCALING_ID, [
            {
                type: 'scatter', mode: 'lines', x: [1, N], y: [1, 1],
                name: 'spójna (sygnał)', line: { color: coherentColor, width: 2 }
            },
            {
                type: 'scatter', mode: 'lines', x: ns, y: ratios,
                name: 'losowa (szum)', line: { color: randomColor, width: 1.5 }
            },
            {
                type: 'scatter', mode: 'lines', x: ns, y: refRatios,
                name: '1/√N', line: { color: refColor, width: 1, dash: 'dot' }
            }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });
    }

    function renderAll() {
        const N = currentN();
        const mag = renderWalk(N);
        renderScaling(N);
        const statusEl = document.getElementById('rp-status');
        if (statusEl) {
            statusEl.textContent = 'N = ' + N + ': suma spójna = ' + N + ', suma losowa ≈ ' + mag.toFixed(2) +
                ' (√N ≈ ' + Math.sqrt(N).toFixed(2) + ') — stosunek szum/sygnał ≈ ' + (mag / N).toFixed(3) + '.';
        }
    }

    function linkSliderAndNumber(sliderId, numberId) {
        const slider = document.getElementById(sliderId);
        const number = document.getElementById(numberId);
        if (!slider || !number) return;
        slider.addEventListener('input', () => { number.value = slider.value; renderAll(); });
        number.addEventListener('input', () => {
            const v = parseInt(number.value, 10);
            if (!isFinite(v)) return;
            const max = parseInt(slider.max, 10);
            const min = parseInt(slider.min, 10);
            slider.value = Math.min(max, Math.max(min, v));
            renderAll();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById(WALK_ID)) return;
        resamplePhases();
        linkSliderAndNumber('rp-N', 'rp-N-num');
        const resampleBtn = document.getElementById('rp-resample');
        if (resampleBtn) {
            resampleBtn.addEventListener('click', () => {
                resamplePhases();
                renderAll();
            });
        }
        renderAll();
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(renderAll, 0));
    }
})();
