document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       DONNEES
       Remplacez par les donnees reelles (fetch/JSON injecte
       depuis Django, agregees a partir du modele Commande).
       Champs attendus par client :
       { id, nom, prenom, telephone, email, ca_total, benefice_total,
         nb_commandes, derniere_commande (jours depuis), actif }
    ========================================================= */

    let CLIENTS_ = JSON.parse(
        document.getElementById("clients-data").textContent
    );

    const CLIENTS = JSON.parse(CLIENTS_)
    console.log(CLIENTS);

    const RELANCE_SEUIL_JOURS = 30;
    const PER_PAGE = 6;

    let currentPage = 1;
    let searchTerm = '';

    /* =========================================================
       ELEMENTS DOM
    ========================================================= */
    const tbody = document.getElementById('client-tbody');
    const topTbody = document.getElementById('top-clients-tbody');
    const relanceList = document.getElementById('relance-list');
    const relanceEmpty = document.getElementById('relance-empty');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const searchInput = document.getElementById('search-input');

    const btnAdd = document.getElementById('btn-add-client');
    const btnCancel = document.getElementById('btn-cancel-client');
    const btnCancelInline = document.getElementById('btn-cancel-client-inline');

    const viewList = document.getElementById('view-list');
    const viewLoader = document.getElementById('view-loader');
    const viewForm = document.getElementById('view-form');
    const loaderCircle = document.getElementById('loader-circle');
    const loaderPercent = document.getElementById('loader-percent');

    const statTotal = document.getElementById('stat-total');
    const statCa = document.getElementById('stat-ca');
    const statPanier = document.getElementById('stat-panier');
    const statRelance = document.getElementById('stat-relance');

    /* =========================================================
       UTILITAIRES
    ========================================================= */
    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

    function panierMoyen(c) {
        return c.nb_commandes > 0 ? c.ca_total / c.nb_commandes : 0;
    }

    function frequenceLabel(c) {
        if (c.nb_commandes <= 0) return '—';
        const freq = c.nb_commandes / Math.max(1, c.derniere_commande_jours + c.nb_commandes * 7);
        if (c.derniere_commande_jours <= 10) return 'Régulier';
        if (c.derniere_commande_jours <= 30) return 'Occasionnel';
        return 'Rare';
    }

    function isARelancer(c) {
        return c.derniere_commande_jours >= RELANCE_SEUIL_JOURS;
    }

    /* =========================================================
       STATS GLOBALES
    ========================================================= */
    function updateStats(list) {
        const totalCa = list.reduce((s, c) => s + c.ca_total, 0);
        const totalCommandes = list.reduce((s, c) => s + c.nb_commandes, 0);
        const panierGlobal = totalCommandes > 0 ? totalCa / totalCommandes : 0;
        const relanceCount = list.filter(isARelancer).length;

        statTotal.textContent = list.length;
        statCa.textContent = fmt(totalCa);
        statPanier.textContent = fmt(panierGlobal);
        statRelance.textContent = relanceCount;
    }

    /* =========================================================
       TOP 10 MEILLEURS CLIENTS (par benefice)
    ========================================================= */
    function renderTopClients() {
        const top = [...CLIENTS].sort((a, b) => b.benefice_total - a.benefice_total).slice(0, 10);
        topTbody.innerHTML = '';
        top.forEach((c, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-2.5 text-neutral-700 dark:text-gray-300 font-medium">
                    <span class="text-xs text-neutral-400 dark:text-gray-500 mr-1.5">#${index + 1}</span>${c.prenom} ${c.nom}
                </td>
                <td class="py-2.5 text-neutral-600 dark:text-gray-300 text-xs">${fmt(c.ca_total)}</td>
                <td class="py-2.5 text-emerald-500 text-xs font-medium">${fmt(c.benefice_total)}</td>
                <td class="py-2.5 text-neutral-500 dark:text-gray-400 text-xs">${c.nb_commandes}</td>
                <td class="py-2.5 text-neutral-500 dark:text-gray-400 text-xs">${fmt(panierMoyen(c))}</td>
            `;
            topTbody.appendChild(tr);
        });
    }

    /* =========================================================
       CLIENTS A RELANCER
    ========================================================= */
    function renderRelanceList() {
        const relance = CLIENTS.filter(isARelancer).sort((a, b) => b.derniere_commande_jours - a.derniere_commande_jours);
        relanceList.innerHTML = '';

        if (!relance.length) {
            relanceEmpty.classList.remove('hidden');
            return;
        }
        relanceEmpty.classList.add('hidden');

        relance.forEach(c => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between rounded-lg px-3 py-2.5 border border-rose-100 bg-rose-50/50 dark:border-rose-500/10 dark:bg-rose-500/5';
            row.innerHTML = `
                <div>
                    <p class="text-sm font-medium text-neutral-700 dark:text-gray-200">${c.prenom} ${c.nom}</p>
                    <p class="text-xs text-neutral-400 dark:text-gray-500">${c.telephone}</p>
                </div>
                <span class="text-xs font-medium text-rose-500">Inactif depuis ${c.derniere_commande_jours} j</span>
            `;
            relanceList.appendChild(row);
        });
    }

    /* =========================================================
       RENDU D'UNE LIGNE CLIENT
    ========================================================= */
    function buildRow(c) {
        const relance = isARelancer(c);
        const statusBadge = relance
            ? '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>À relancer</span>'
            : '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Actif</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${c.prenom} ${c.nom}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${c.telephone}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${c.email}</td>
            <td class="py-3 text-neutral-700 dark:text-gray-300 text-xs">${fmt(c.ca_total)} FCFA</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${c.nb_commandes}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${frequenceLabel(c)}</td>
            <td class="py-3">${statusBadge}</td>
        `;
        return tr;
    }

    /* =========================================================
       FILTRAGE + PAGINATION
    ========================================================= */
    function getFiltered() {
        if (!searchTerm) return CLIENTS;
        const term = searchTerm.toLowerCase();
        return CLIENTS.filter(c =>
            c.nom.toLowerCase().includes(term) ||
            c.prenom.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term)
        );
    }

    function renderPagination(totalItems) {
        const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
        pagination.innerHTML = '';

        const makeBtn = (label, page, opts = {}) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'page-btn w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium border transition ' +
                'border-amber-200 text-neutral-500 hover:bg-amber-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5' +
                (opts.active ? ' active border-transparent' : '');
            btn.innerHTML = label;
            btn.disabled = !!opts.disabled;
            if (opts.disabled) btn.classList.add('opacity-40', 'cursor-not-allowed');
            btn.addEventListener('click', () => { currentPage = page; renderList(); });
            return btn;
        };

        pagination.appendChild(makeBtn('&laquo;', Math.max(1, currentPage - 1), { disabled: currentPage === 1 }));
        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(makeBtn(String(i), i, { active: i === currentPage }));
        }
        pagination.appendChild(makeBtn('&raquo;', Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages }));
    }

    function renderList() {
        const filtered = getFiltered();
        updateStats(CLIENTS);

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(start, start + PER_PAGE);

        tbody.innerHTML = '';
        if (!pageItems.length) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            pageItems.forEach(c => tbody.appendChild(buildRow(c)));
        }

        renderPagination(filtered.length);

        const rangeStart = filtered.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + PER_PAGE, filtered.length);
        paginationInfo.textContent = `Affichage ${rangeStart}-${rangeEnd} sur ${filtered.length} clients`;
    }

    /* =========================================================
       RECHERCHE
    ========================================================= */
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = e.target.value.trim();
            currentPage = 1;
            renderList();
        }, 200);
    });

    /* =========================================================
       BASCULE LISTE -> LOADER -> FORMULAIRE
    ========================================================= */
    function runLoaderThenShowForm() {
        viewList.classList.add('hidden');
        viewForm.classList.add('hidden');
        viewLoader.classList.remove('hidden');

        const circumference = 263.9;
        let progress = 0;
        loaderCircle.style.strokeDashoffset = circumference;
        loaderPercent.textContent = '0%';

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    viewLoader.classList.add('hidden');
                    viewForm.classList.remove('hidden');
                }, 250);
            }
            loaderCircle.style.strokeDashoffset = circumference - (circumference * progress) / 100;
            loaderPercent.textContent = progress + '%';
        }, 150);
    }

    btnAdd.addEventListener('click', runLoaderThenShowForm);

    function backToList() {
        viewForm.classList.add('hidden');
        viewList.classList.remove('hidden');
        renderList();
    }

    btnCancel.addEventListener('click', backToList);
    if (btnCancelInline) btnCancelInline.addEventListener('click', backToList);

    /* =========================================================
       INIT
    ========================================================= */
    renderTopClients();
    renderRelanceList();
    renderList();
});

toggleBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
    chartInstance.destroy();
    chartInstance = renderChart();
});