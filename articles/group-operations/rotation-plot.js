(function () {
    const VEC_ID = 'rotation-vector-plot';
    const EIGEN_ID = 'rotation-eigen-plot';

    const vecColor = '#2563eb';
    const rotColor = '#dc2626';
    const eigenPlusColor = '#2563eb';
    const eigenMinusColor = '#dc2626';
    const realHighlight = '#16a34a';

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

    function toRad(deg) {
        return (deg * Math.PI) / 180;
    }

    function isReal(thetaDeg) {
        const m = ((thetaDeg % 360) + 360) % 360;
        return Math.abs(m) < 0.5 || Math.abs(m - 180) < 0.5 || Math.abs(m - 360) < 0.5;
    }

    function baseAxisLayout(c) {
        return {
            range: [-1.35, 1.35],
            color: c.muted,
            gridcolor: c.border,
            zeroline: true,
            zerolinecolor: c.border,
            scaleratio: 1,
            fixedrange: true,
            showline: false,
            mirror: false
        };
    }

    function renderVectorPlot(thetaDeg, phiDeg) {
        const c = themeColors();
        const circ = unitCircle();
        const phi = toRad(phiDeg);
        const theta = toRad(thetaDeg);
        const vx = Math.cos(phi), vy = Math.sin(phi);
        const rx = Math.cos(phi + theta), ry = Math.sin(phi + theta);

        const arcN = 40;
        const arcX = [], arcY = [];
        for (let i = 0; i <= arcN; i++) {
            const a = phi + (theta * i) / arcN;
            arcX.push(0.35 * Math.cos(a));
            arcY.push(0.35 * Math.sin(a));
        }

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
                    x: vx, y: vy, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                    showarrow: true, arrowhead: 3, arrowsize: 1.3, arrowwidth: 3, arrowcolor: vecColor, text: ''
                },
                {
                    x: rx, y: ry, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                    showarrow: true, arrowhead: 3, arrowsize: 1.3, arrowwidth: 3, arrowcolor: rotColor, text: ''
                }
            ]
        };

        Plotly.react(VEC_ID, [
            {
                type: 'scatter', mode: 'lines', x: circ.x, y: circ.y,
                line: { color: c.border, width: 1, dash: 'dot' }, hoverinfo: 'skip'
            },
            {
                type: 'scatter', mode: 'lines', x: arcX, y: arcY,
                line: { color: c.muted, width: 1.5 }, hoverinfo: 'skip'
            },
            {
                type: 'scatter', mode: 'markers', x: [vx], y: [vy],
                marker: { size: 8, color: vecColor }, name: 'v',
                text: ['v = (cos φ, sin φ)'], hovertemplate: '%{text}<extra></extra>'
            },
            {
                type: 'scatter', mode: 'markers', x: [rx], y: [ry],
                marker: { size: 8, color: rotColor }, name: 'R(θ)v',
                text: ['R(θ)v'], hovertemplate: '%{text}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, staticPlot: false, displayModeBar: false });
    }

    function renderEigenPlot(thetaDeg) {
        const c = themeColors();
        const circ = unitCircle();
        const theta = toRad(thetaDeg);
        const real = isReal(thetaDeg);
        const lpx = Math.cos(theta), lpy = Math.sin(theta);
        const lmx = Math.cos(theta), lmy = -Math.sin(theta);
        const markerColorPlus = real ? realHighlight : eigenPlusColor;
        const markerColorMinus = real ? realHighlight : eigenMinusColor;

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'Re' }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'Im', scaleanchor: 'x' })
        };

        Plotly.react(EIGEN_ID, [
            {
                type: 'scatter', mode: 'lines', x: circ.x, y: circ.y,
                line: { color: c.border, width: 1, dash: 'dot' }, hoverinfo: 'skip'
            },
            {
                type: 'scatter', mode: 'lines', x: [lpx, lmx], y: [lpy, lmy],
                line: { color: c.muted, width: 1.5, dash: 'dash' }, hoverinfo: 'skip'
            },
            {
                type: 'scatter', mode: 'markers+text', x: [lpx], y: [lpy],
                marker: { size: 10, color: markerColorPlus },
                text: ['λ₊'], textposition: 'top center', textfont: { color: c.text },
                hovertemplate: 'λ₊ = e^{iθ}<extra></extra>'
            },
            {
                type: 'scatter', mode: 'markers+text', x: [lmx], y: [lmy],
                marker: { size: 10, color: markerColorMinus },
                text: ['λ₋'], textposition: 'bottom center', textfont: { color: c.text },
                hovertemplate: 'λ₋ = e^{-iθ}<extra></extra>'
            }
        ], layout, { responsive: true, displaylogo: false, staticPlot: false, displayModeBar: false });
    }

    function currentTheta() {
        return parseFloat(document.getElementById('rot-theta').value);
    }

    function currentPhi() {
        return parseFloat(document.getElementById('rot-phi').value);
    }

    function setStatus(thetaDeg) {
        const el = document.getElementById('rot-status');
        if (!el) return;
        if (isReal(thetaDeg)) {
            el.textContent = 'θ = ' + thetaDeg.toFixed(0) + '° — wektory są współliniowe: rzeczywisty wektor własny istnieje, λ = ' + (Math.abs(((thetaDeg % 360) + 360) % 360 - 180) < 0.5 ? '-1' : '1') + '.';
        } else {
            el.textContent = 'θ = ' + thetaDeg.toFixed(0) + '° — wektory nie są współliniowe: wartości własne tworzą parę zespoloną sprzężoną λ± = e^{±iθ}.';
        }
    }

    function renderAll() {
        const theta = currentTheta();
        const phi = currentPhi();
        renderVectorPlot(theta, phi);
        renderEigenPlot(theta);
        setStatus(theta);
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
            const v = parseFloat(number.value);
            if (!isFinite(v)) return;
            const clamped = Math.min(180, Math.max(-180, v));
            slider.value = clamped;
            renderAll();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderAll();
        linkSliderAndNumber('rot-theta', 'rot-theta-num');
        linkSliderAndNumber('rot-phi', 'rot-phi-num');
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setTimeout(renderAll, 0);
        });
    }
})();
