document.addEventListener('DOMContentLoaded', () => {

    const root = document.documentElement;
    const toggleBtn = document.getElementById('theme-toggle');

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

    /* =========================================================
       DONNEES INJECTEES DEPUIS DJANGO
    ========================================================= */
    const CHART_MENSUEL = JSON.parse(document.getElementById('chart-mensuel-data')?.textContent || '{"labels":[],"ca":[],"marge":[]}');
    const TOP10_STOCK = JSON.parse(document.getElementById('top10-stock-data')?.textContent || '[]');
    const RELEVE = JSON.parse(document.getElementById('releve-data')?.textContent || '[]');

    /* =========================================================
       GRAPHIQUE CA / MARGE (remplace les données statiques Jan-Aug)
    ========================================================= */
    function renderChart() {
        const isDark = root.classList.contains('dark');
        const profitColor = isDark ? '#1ecb8b' : '#f59e0b';
        const lossColor = isDark ? '#f2c94c' : '#1c1917';
        const textColor = isDark ? '#9ca3af' : '#78716c';

        const options = {
            chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
            series: [
                { name: 'Chiffre d\'affaires', data: CHART_MENSUEL.ca },
                { name: 'Marge', data: CHART_MENSUEL.marge }
            ],
            xaxis: {
                categories: CHART_MENSUEL.labels,
                labels: { style: { colors: textColor, fontSize: '11px' } },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                labels: {
                    style: { colors: textColor, fontSize: '11px' },
                    formatter: (val) => (val >= 1000 ? (val / 1000) + 'k' : val)
                }
            },
            grid: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
            colors: [profitColor, lossColor],
            plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
            dataLabels: { enabled: false },
            legend: { position: 'top', horizontalAlign: 'right', labels: { colors: textColor }, markers: { radius: 12 } },
            tooltip: { theme: isDark ? 'dark' : 'light' }
        };

        const el = document.querySelector('#income-chart');
        el.innerHTML = '';
        const chart = new ApexCharts(el, options);
        chart.render();
        return chart;
    }

    /* =========================================================
       GRAPHIQUE VALORISATION DU STOCK (Fonctionnalité 2)
    ========================================================= */
    function renderStockValueChart() {
        const el = document.querySelector('#stock-value-chart');
        if (!el) return null;

        const isDark = root.classList.contains('dark');
        const barColor = isDark ? '#1ecb8b' : '#f59e0b';
        const textColor = isDark ? '#9ca3af' : '#78716c';

        const options = {
            chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
            series: [{ name: 'Valeur stock', data: TOP10_STOCK.map(p => Math.round(p.valeur)) }],
            xaxis: {
                categories: TOP10_STOCK.map(p => p.nom),
                labels: { style: { colors: textColor, fontSize: '10px' }, formatter: (v) => (v >= 1000 ? (v / 1000) + 'k' : v) },
                axisBorder: { show: false }, axisTicks: { show: false }
            },
            yaxis: { labels: { style: { colors: textColor, fontSize: '11px' } } },
            grid: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
            colors: [barColor],
            plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '55%' } },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: { theme: isDark ? 'dark' : 'light' }
        };

        el.innerHTML = '';
        const chart = new ApexCharts(el, options);
        chart.render();
        return chart;
    }

    let chartInstance = renderChart();
    let stockChartInstance = renderStockValueChart();

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            root.classList.toggle('dark');
            localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
            chartInstance.destroy();
            chartInstance = renderChart();
            if (stockChartInstance) {
                stockChartInstance.destroy();
                stockChartInstance = renderStockValueChart();
            }
        });
    }

    /* =========================================================
       BILAN FINANCIER : bouton "Voir le relevé" -> loader -> tableau
    ========================================================= */
    const btnReleve = document.getElementById('btn-releve');
    const releveModal = document.getElementById('releve-modal');
    const releveModalClose = document.getElementById('releve-modal-close');
    const releveLoader = document.getElementById('releve-loader');
    const releveTableWrap = document.getElementById('releve-table-wrap');
    const releveLoaderCircle = document.getElementById('releve-loader-circle');
    const releveLoaderPercent = document.getElementById('releve-loader-percent');
    const releveTbody = document.getElementById('releve-tbody');

    function buildReleveRow(m) {
        const tr = document.createElement('tr');
        const isCredit = m.type === 'credit';
        tr.innerHTML = `
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${m.date}</td>
            <td class="py-3 text-neutral-700 dark:text-gray-300">${m.libelle}</td>
            <td class="py-3">
                <span class="inline-flex items-center gap-1 text-xs ${isCredit ? 'text-emerald-500' : 'text-rose-500'}">
                    <span class="w-1.5 h-1.5 rounded-full ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                    ${isCredit ? 'Crédit (vente)' : 'Débit (achat)'}
                </span>
            </td>
            <td class="py-3 font-medium ${isCredit ? 'text-emerald-500' : 'text-rose-500'}">
                ${isCredit ? '+' : '-'}${fmt(m.montant)} FCFA
            </td>
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${fmt(m.solde)} FCFA</td>
        `;
        return tr;
    }

    function runReleveLoader() {
        releveTableWrap.classList.add('hidden');
        releveLoader.classList.remove('hidden');

        const circumference = 263.9;
        let progress = 0;
        releveLoaderCircle.style.strokeDashoffset = circumference;
        releveLoaderPercent.textContent = '0%';

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 20) + 12;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    releveLoader.classList.add('hidden');
                    releveTbody.innerHTML = '';
                    if (!RELEVE.length) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td colspan="5" class="py-6 text-center text-neutral-400 dark:text-gray-500">Aucun mouvement enregistré pour le moment.</td>`;
                        releveTbody.appendChild(tr);
                    } else {
                        RELEVE.forEach(m => releveTbody.appendChild(buildReleveRow(m)));
                    }
                    releveTableWrap.classList.remove('hidden');
                }, 250);
            }
            releveLoaderCircle.style.strokeDashoffset = circumference - (circumference * progress) / 100;
            releveLoaderPercent.textContent = progress + '%';
        }, 130);
    }

    if (btnReleve) {
        btnReleve.addEventListener('click', () => {
            releveModal.classList.remove('hidden');
            runReleveLoader();
        });
    }

    function closeReleveModal() {
        releveModal.classList.add('hidden');
    }

    if (releveModalClose) releveModalClose.addEventListener('click', closeReleveModal);
    if (releveModal) {
        releveModal.addEventListener('click', (e) => {
            if (e.target === releveModal) closeReleveModal();
        });
    }
});

toggleBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
    chartInstance.destroy();
    chartInstance = renderChart();
});