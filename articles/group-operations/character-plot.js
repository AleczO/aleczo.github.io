(function () {
    const PLOT_ID = 'character-plot';

    const orbitColor = '#2563eb';
    const highlightColor = '#dc2626';
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

    function chi(m, k, p) {
        const angle = (2 * Math.PI * m * k) / p;
        return { x: Math.cos(angle), y: Math.sin(angle), angle };
    }

    function baseAxisLayout(c) {
        return {
            range: [-1.35, 1.35],
            color: c.muted,
            gridcolor: c.border,
            zeroline: true,
            zerolinecolor: c.border,
            fixedrange: true,
            showline: false,
            mirror: false
        };
    }

    function render(p, m, k) {
        const c = themeColors();
        const circ = unitCircle();

        const orbitX = [], orbitY = [], orbitText = [];
        for (let j = 0; j <= p; j++) {
            const jj = j % p;
            const pt = chi(m, jj, p);
            orbitX.push(pt.x);
            orbitY.push(pt.y);
            orbitText.push('k=' + jj);
        }

        const sel = chi(m, k, p);
        const zeroPt = chi(m, 0, p);

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'Re' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'Im', scaleanchor: 'x' }),
            annotations: [
                {
                    x: sel.x, y: sel.y, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                    showarrow: true, arrowhead: 3, arrowsize: 1.3, arrowwidth: 3, arrowcolor: highlightColor, text: ''
                }
            ]
        };

        Plotly.react(PLOT_ID, [
            {
                type: 'scatter', mode: 'lines', x: circ.x, y: circ.y,
                line: { color: c.border, width: 1, dash: 'dot' }, hoverinfo: 'skip'
            },
            {
                type: 'scatter', mode: 'lines+markers', x: orbitX, y: orbitY,
                text: orbitText, hovertemplate: '%{text}<extra></extra>',
                line: { color: orbitColor, width: 1.5 },
                marker: { size: 6, color: orbitColor }
            },
            {
                type: 'scatter', mode: 'markers', x: [zeroPt.x], y: [zeroPt.y],
                marker: { size: 8, color: zeroColor }, text: ['k=0'], hovertemplate: '%{text}<extra></extra>'
            },
            {
                type: 'scatter', mode: 'markers', x: [sel.x], y: [sel.y],
                marker: { size: 11, color: highlightColor, line: { color: c.text, width: 1 } },
                text: ['χ_' + m + '(' + k + ')'], hovertemplate: '%{text}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, staticPlot: false, displayModeBar: false });
    }

    function setStatus(p, m, k) {
        const el = document.getElementById('char-status');
        if (!el) return;
        const pt = chi(m, k, p);
        const degRaw = (pt.angle * 180) / Math.PI;
        const deg = (((degRaw % 360) + 360) % 360).toFixed(1);
        el.textContent = 'χ_' + m + '(' + k + ') = e^{2πi·' + m + '·' + k + '/' + p + '} ≈ ' +
            pt.x.toFixed(3) + ' + ' + pt.y.toFixed(3) + 'i  (kąt ' + deg + '°)';
    }

    function currentParams() {
        const p = parseInt(document.getElementById('char-p').value, 10);
        const m = parseInt(document.getElementById('char-m').value, 10);
        const k = parseInt(document.getElementById('char-k').value, 10);
        return { p, m, k };
    }

    function renderAll() {
        const { p, m, k } = currentParams();
        render(p, m, k);
        setStatus(p, m, k);
    }

    function updateRangesForP() {
        const p = parseInt(document.getElementById('char-p').value, 10);
        const max = p - 1;
        ['char-m', 'char-m-num', 'char-k', 'char-k-num'].forEach((id) => {
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

        const pSelect = document.getElementById('char-p');
        if (pSelect) {
            pSelect.addEventListener('change', () => {
                updateRangesForP();
                renderAll();
            });
        }

        linkSliderAndNumber('char-m', 'char-m-num');
        linkSliderAndNumber('char-k', 'char-k-num');
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setTimeout(renderAll, 0);
        });
    }
})();
