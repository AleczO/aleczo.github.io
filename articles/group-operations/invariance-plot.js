(function () {
    const SIGNAL_ID = 'invariance-signal-plot';
    const COEFF_ID = 'invariance-coeff-plot';

    const barColor = '#2563eb';
    const refColor = '#5c5c5c';
    const coeffColor = '#dc2626';
    const zeroColor = '#16a34a';

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

    function unitCircle(n) {
        n = n || 200;
        const x = [], y = [];
        for (let i = 0; i <= n; i++) {
            const a = (2 * Math.PI * i) / n;
            x.push(Math.cos(a));
            y.push(Math.sin(a));
        }
        return { x, y };
    }

    function shiftedCos(m, h, p, k) {
        return Math.cos((2 * Math.PI * m * (k - h)) / p);
    }

    function pureCos(m, p, k) {
        return Math.cos((2 * Math.PI * m * k) / p);
    }

    function coeffs(m, h, p) {
        const angle = (2 * Math.PI * m * h) / p;
        return { a: Math.cos(angle), b: Math.sin(angle), angle };
    }

    function isPureCosine(h, p) {
        return ((h % p) + p) % p === 0;
    }

    function renderSignalPlot(p, m, h) {
        const c = themeColors();
        const ks = [];
        const barVals = [];
        const refVals = [];
        for (let k = 0; k < p; k++) {
            ks.push(k);
            barVals.push(shiftedCos(m, h, p, k));
            refVals.push(pureCos(m, p, k));
        }

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: { title: 'k', color: c.muted, gridcolor: c.border, tickmode: 'linear', dtick: 1, fixedrange: true, showline: false, mirror: false },
            yaxis: { title: '(S_h cos)(k)', range: [-1.3, 1.3], color: c.muted, gridcolor: c.border, zeroline: true, zerolinecolor: c.border, fixedrange: true, showline: false, mirror: false }
        };

        Plotly.react(SIGNAL_ID, [
            {
                type: 'scatter', mode: 'lines+markers', x: ks, y: refVals,
                line: { color: refColor, width: 1.5, dash: 'dash' },
                marker: { size: 5, color: refColor },
                hovertemplate: 'cos: %{y:.3f}<extra></extra>'
            },
            {
                type: 'bar', x: ks, y: barVals,
                marker: { color: barColor },
                hovertemplate: 'S_h cos: %{y:.3f}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, staticPlot: false, displayModeBar: false });
    }

    function renderCoeffPlot(p, m, h) {
        const c = themeColors();
        const circ = unitCircle();
        const pt = coeffs(m, h, p);
        const pure = isPureCosine(h, p);
        const markerColor = pure ? zeroColor : coeffColor;

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: { title: 'współczynnik cos', range: [-1.35, 1.35], color: c.muted, gridcolor: c.border, zeroline: true, zerolinecolor: c.border, fixedrange: true, showline: false, mirror: false },
            yaxis: { title: 'współczynnik sin', range: [-1.35, 1.35], color: c.muted, gridcolor: c.border, zeroline: true, zerolinecolor: c.border, scaleanchor: 'x', fixedrange: true, showline: false, mirror: false },
            annotations: [
                {
                    x: pt.a, y: pt.b, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                    showarrow: true, arrowhead: 3, arrowsize: 1.3, arrowwidth: 3, arrowcolor: markerColor, text: ''
                }
            ]
        };

        Plotly.react(COEFF_ID, [
            {
                type: 'scatter', mode: 'lines', x: circ.x, y: circ.y,
                line: { color: c.border, width: 1, dash: 'dot' }, hoverinfo: 'skip'
            },
            {
                type: 'scatter', mode: 'markers', x: [pt.a], y: [pt.b],
                marker: { size: 10, color: markerColor },
                text: ['(' + pt.a.toFixed(2) + ', ' + pt.b.toFixed(2) + ')'],
                hovertemplate: '%{text}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, staticPlot: false, displayModeBar: false });
    }

    function setStatus(p, m, h) {
        const el = document.getElementById('inv-status');
        if (!el) return;
        const pt = coeffs(m, h, p);
        if (isPureCosine(h, p)) {
            el.textContent = 'h = ' + h + ' — (S_h cos)(k) = ' + pt.a.toFixed(2) + '·cos(2πmk/p) + ' + pt.b.toFixed(2) + '·sin(2πmk/p): wynik pozostaje czystym cosinusem.';
        } else {
            el.textContent = 'h = ' + h + ' — (S_h cos)(k) = ' + pt.a.toFixed(2) + '·cos(2πmk/p) + ' + pt.b.toFixed(2) + '·sin(2πmk/p): potrzebny jest udział sinusa, sam cos nie wystarcza.';
        }
    }

    function currentParams() {
        const p = parseInt(document.getElementById('inv-p').value, 10);
        const m = parseInt(document.getElementById('inv-m').value, 10);
        const h = parseInt(document.getElementById('inv-h').value, 10);
        return { p, m, h };
    }

    function renderAll() {
        const { p, m, h } = currentParams();
        renderSignalPlot(p, m, h);
        renderCoeffPlot(p, m, h);
        setStatus(p, m, h);
    }

    function updateRangesForP() {
        const p = parseInt(document.getElementById('inv-p').value, 10);
        const max = p - 1;
        ['inv-m', 'inv-m-num', 'inv-h', 'inv-h-num'].forEach((id) => {
            const el = document.getElementById(id);
            el.max = max;
            if (parseInt(el.value, 10) > max) el.value = max;
        });
    }

    function linkSliderAndNumber(sliderId, numberId) {
        const slider = document.getElementById(sliderId);
        const number = document.getElementById(numberId);
        if (!slider || !number) return;
        slider.addEventListener('input', () => {
            number.value = slider.value;
            renderAll();
        });
        number.addEventListener('input', () => {
            const v = parseInt(number.value, 10);
            if (!isFinite(v)) return;
            const max = parseInt(slider.max, 10);
            const clamped = Math.min(max, Math.max(0, v));
            slider.value = clamped;
            renderAll();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderAll();

        const pSelect = document.getElementById('inv-p');
        if (pSelect) {
            pSelect.addEventListener('change', () => {
                updateRangesForP();
                renderAll();
            });
        }

        linkSliderAndNumber('inv-m', 'inv-m-num');
        linkSliderAndNumber('inv-h', 'inv-h-num');
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setTimeout(renderAll, 0);
        });
    }
})();
