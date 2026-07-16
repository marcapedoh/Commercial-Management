
        function renderChart() {
            const isDark = root.classList.contains('dark');
            const profitColor = isDark ? '#1ecb8b' : '#f59e0b';
            const lossColor = isDark ? '#f2c94c' : '#1c1917';
            const textColor = isDark ? '#9ca3af' : '#78716c';

            const options = {
                chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
                series: [
                    { name: 'Profit', data: [22, 28, 20, 32, 38, 45, 40, 25] },
                    { name: 'Loss', data: [10, 14, 9, 16, 12, 18, 15, 8] }
                ],
                xaxis: {
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
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

        let chartInstance = renderChart();

        toggleBtn.addEventListener('click', () => {
            root.classList.toggle('dark');
            localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
            chartInstance.destroy();
            chartInstance = renderChart();
        });