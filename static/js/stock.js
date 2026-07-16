
        let products = [
            { name: 'Clavier HP', stock: 18, alert: 15, security: 20, min: 25, price: 12000, avgSales: 3 },
            { name: 'Ordinateur portable Dell', stock: 8, alert: 6, security: 5, min: 10, price: 350000, avgSales: 1 },
            { name: 'Ecran 24"', stock: 22, alert: 10, security: 8, min: 15, price: 95000, avgSales: 2 },
            { name: 'Imprimante laser', stock: 5, alert: 8, security: 6, min: 10, price: 145000, avgSales: 0.5 },
            { name: 'Souris sans fil', stock: 60, alert: 20, security: 15, min: 25, price: 6500, avgSales: 6 },
            { name: 'Disque SSD 512Go', stock: 14, alert: 12, security: 10, min: 18, price: 42000, avgSales: 2.5 },
            { name: 'Onduleur 1000VA', stock: 3, alert: 5, security: 4, min: 8, price: 78000, avgSales: 0.3 },
        ];

        function fmt(n) {
            return new Intl.NumberFormat('fr-FR').format(Math.round(n));
        }

        function computeStatus(p) {
            if (p.stock < p.security) return { key: 'risk', label: 'Risque de rupture', cls: 'text-rose-500', dot: 'bg-rose-500' };
            if (p.stock <= p.alert) return { key: 'alert', label: 'Alerte seuil', cls: 'text-amber-500', dot: 'bg-amber-500' };
            return { key: 'ok', label: 'OK', cls: 'text-emerald-500', dot: 'bg-emerald-500' };
        }

        function computeDays(p) {
            if (!p.avgSales || p.avgSales <= 0) return '—';
            const days = Math.floor(p.stock / p.avgSales);
            return days + ' j';
        }

        function renderTable() {
            const tbody = document.getElementById('stock-tbody');
            tbody.innerHTML = '';
            let totalValue = 0, riskCount = 0, alertCount = 0, okCount = 0;
            const riskNames = [];

            products.forEach(p => {
                const status = computeStatus(p);
                const value = p.stock * p.price;
                totalValue += value;
                if (status.key === 'risk') { riskCount++; riskNames.push(p.name); }
                else if (status.key === 'alert') { alertCount++; }
                else { okCount++; }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${p.name}</td>
                    <td class="py-3 text-neutral-700 dark:text-gray-300">${p.stock}</td>
                    <td class="py-3 text-neutral-400 dark:text-gray-500 text-xs">${p.alert} / ${p.security}</td>
                    <td class="py-3">
                        <span class="inline-flex items-center gap-1.5 text-xs font-medium ${status.cls}">
                            <span class="w-1.5 h-1.5 rounded-full ${status.dot}"></span>${status.label}
                        </span>
                    </td>
                    <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${computeDays(p)}</td>
                    <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${fmt(value)} FCFA</td>
                `;
                tbody.appendChild(tr);
            });

            document.getElementById('stat-total-value').textContent = fmt(totalValue);
            document.getElementById('stat-risk').textContent = riskCount;
            document.getElementById('stat-alert').textContent = alertCount;
            document.getElementById('stat-count').textContent = products.length;
            document.getElementById('count-ok').textContent = okCount;
            document.getElementById('count-alert').textContent = alertCount;
            document.getElementById('count-risk').textContent = riskCount;

            const banner = document.getElementById('alert-banner');
            if (riskCount > 0) {
                banner.classList.remove('hidden');
                document.getElementById('alert-list').textContent = riskNames.join(', ') + ' — sous le stock de sécurité.';
            } else {
                banner.classList.add('hidden');
            }

            renderValueChart();
        }

        let valueChartInstance = null;
        function renderValueChart() {
            const isDark = root.classList.contains('dark');
            const barColor = isDark ? '#1ecb8b' : '#f59e0b';
            const textColor = isDark ? '#9ca3af' : '#78716c';

            const sorted = [...products].sort((a, b) => (b.stock * b.price) - (a.stock * a.price)).slice(0, 10);

            const options = {
                chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
                series: [{ name: 'Valeur stock', data: sorted.map(p => Math.round(p.stock * p.price)) }],
                xaxis: {
                    categories: sorted.map(p => p.name),
                    labels: { style: { colors: textColor, fontSize: '10px' }, formatter: (v) => (v >= 1000 ? (v/1000) + 'k' : v) },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: { labels: { style: { colors: textColor, fontSize: '11px' } } },
                grid: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
                colors: [barColor],
                plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '55%' } },
                dataLabels: { enabled: false },
                legend: { show: false },
                tooltip: { theme: isDark ? 'dark' : 'light' }
            };

            const el = document.querySelector('#value-chart');
            el.innerHTML = '';
            valueChartInstance = new ApexCharts(el, options);
            valueChartInstance.render();
        }

        renderTable();

        toggleBtn.addEventListener('click', () => {
            root.classList.toggle('dark');
            localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
            renderValueChart();
        });

        // GESTION AJOUT DE STOCK : affichage conditionnel, pas de modal
        const viewList = document.getElementById('view-list');
        const viewLoader = document.getElementById('view-loader');
        const viewForm = document.getElementById('view-form');
        const loaderCircle = document.getElementById('loader-circle');
        const loaderPercent = document.getElementById('loader-percent');
        const CIRCUMFERENCE = 263.9;

        function showLoaderThenForm() {
            viewList.classList.add('hidden');
            viewLoader.classList.remove('hidden');

            let progress = 0;
            loaderCircle.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
            loaderPercent.textContent = '0%';

            const interval = setInterval(() => {
                progress += Math.random() * 12 + 4;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        viewLoader.classList.add('hidden');
                        viewForm.classList.remove('hidden');
                    }, 250);
                }
                const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
                loaderCircle.setAttribute('stroke-dashoffset', offset);
                loaderPercent.textContent = Math.round(progress) + '%';
            }, 120);
        }

        document.getElementById('btn-add').addEventListener('click', showLoaderThenForm);

        document.getElementById('btn-cancel').addEventListener('click', () => {
            viewForm.classList.add('hidden');
            viewList.classList.remove('hidden');
            document.getElementById('add-stock-form').reset();
        });

        document.getElementById('add-stock-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const newProduct = {
                name: document.getElementById('f-name').value,
                price: parseFloat(document.getElementById('f-price').value) || 0,
                stock: parseFloat(document.getElementById('f-stock').value) || 0,
                avgSales: parseFloat(document.getElementById('f-sales').value) || 0,
                alert: parseFloat(document.getElementById('f-alert').value) || 0,
                security: parseFloat(document.getElementById('f-security').value) || 0,
                min: parseFloat(document.getElementById('f-min').value) || 0,
            };
            products.push(newProduct);
            renderTable();
            e.target.reset();
            viewForm.classList.add('hidden');
            viewList.classList.remove('hidden');
        });