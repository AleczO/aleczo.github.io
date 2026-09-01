(function () {
    const PLOT_ID = 'ideal-freq-plot';
    const barColor = '#2563eb';
    const correctColor = '#16a34a';

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

    function idealResponse(a, b, M, p) {
        const out = new Array(p);
        for (let q = 0; q < p; q++) {
            let s = 0;
            for (let m = 1; m <= M; m++) s += Math.cos((2 * Math.PI * m * (a + b - q)) / p);
            out[q] = s / M;
        }
        return out;
    }

    function render() {
        const c = themeColors();
        const p = parseInt(document.getElementById('ideal-p').value, 10);
        const a = parseInt(document.getElementById('ideal-a').value, 10);
        const b = parseInt(document.getElementById('ideal-b').value, 10);
        const M = parseInt(document.getElementById('ideal-M').value, 10);

        const vals = idealResponse(a, b, M, p);
        const trueQ = (a + b) % p;
        const xs = Array.from({ length: p }, (_, q) => q);
        const colors = xs.map(q => (q === trueQ ? correctColor : barColor));

        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: c.muted, family: fontFamily() },
            showlegend: false,
            dragmode: false,
            xaxis: Object.assign(baseAxisLayout(c), { title: 'q', tickmode: 'linear', dtick: 1 }),
            yaxis: Object.assign(baseAxisLayout(c), { title: 'odpowiedź (znormalizowana)', range: [-1.1, 1.1] })
        };

        Plotly.react(PLOT_ID, [
            { type: 'bar', x: xs, y: vals, marker: { color: colors } }
        ], layout, { responsive: true, displaylogo: false, displayModeBar: false });

        const statusEl = document.getElementById('ideal-status');
        if (statusEl) {
            statusEl.textContent = 'a + b = ' + a + ' + ' + b + ' = ' + trueQ + ' (mod ' + p + '); M = ' + M +
                ' aktywnych częstotliwości — pik przy q = ' + trueQ + '.';
        }
    }

    function updateRangesForP() {
        const p = parseInt(document.getElementById('ideal-p').value, 10);
        const maxAB = p - 1;
        const maxM = Math.floor(p / 2);
        ['ideal-a', 'ideal-a-num', 'ideal-b', 'ideal-b-num'].forEach((id) => {
            const el = document.getElementById(id);
            el.max = maxAB;
            if (parseInt(el.value, 10) > maxAB) el.value = maxAB;
        });
        ['ideal-M', 'ideal-M-num'].forEach((id) => {
            const el = document.getElementById(id);
            el.max = maxM;
            if (parseInt(el.value, 10) > maxM) el.value = maxM;
        });
    }

    function linkSliderAndNumber(sliderId, numberId) {
        const slider = document.getElementById(sliderId);
        const number = document.getElementById(numberId);
        if (!slider || !number) return;
        slider.addEventListener('input', () => { number.value = slider.value; render(); });
        number.addEventListener('input', () => {
            const v = parseInt(number.value, 10);
            if (!isFinite(v)) return;
            const max = parseInt(slider.max, 10);
            const min = parseInt(slider.min, 10);
            slider.value = Math.min(max, Math.max(min, v));
            render();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const pSelect = document.getElementById('ideal-p');
        if (!pSelect) return;

        pSelect.addEventListener('change', () => {
            updateRangesForP();
            render();
        });

        linkSliderAndNumber('ideal-a', 'ideal-a-num');
        linkSliderAndNumber('ideal-b', 'ideal-b-num');
        linkSliderAndNumber('ideal-M', 'ideal-M-num');

        updateRangesForP();
        render();
    });

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setTimeout(render, 0));
    }
})();
