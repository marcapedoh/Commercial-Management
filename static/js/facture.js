document.addEventListener('DOMContentLoaded', () => {

    let FACTURES_ = JSON.parse(
        document.getElementById("factures-data").textContent
    );

    const FACTURES = JSON.parse(FACTURES_)
    console.log(FACTURES);

    const PER_PAGE = 8;
    const TVA_TAUX = 0.18;

    let currentPage = 1;
    let searchTerm = '';

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

    /* =========================================================
       ELEMENTS DOM : LISTE
    ========================================================= */
    const tbody = document.getElementById('facture-tbody');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const searchInput = document.getElementById('search-input');

    const btnAdd = document.getElementById('btn-add-facture');
    const btnCancel = document.getElementById('btn-cancel-facture');
    const btnCancelInline = document.getElementById('btn-cancel-facture-inline');

    const viewList = document.getElementById('view-list');
    const viewLoader = document.getElementById('view-loader');
    const viewForm = document.getElementById('view-form');
    const loaderCircle = document.getElementById('loader-circle');
    const loaderPercent = document.getElementById('loader-percent');

    /* =========================================================
       RENDU D'UNE LIGNE FACTURE
    ========================================================= */
    function buildRow(f) {
        const statusBadge = f.soldee
            ? '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Soldée</span>'
            : '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Non soldée</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${f.numero}</td>
            <td class="py-3 text-neutral-600 dark:text-gray-300 text-xs">${f.fournisseur}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${f.date}</td>
            <td class="py-3 text-neutral-600 dark:text-gray-300 text-xs">${fmt(f.montant_ht)} FCFA</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${fmt(f.tva)} FCFA</td>
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium text-xs">${fmt(f.montant_ttc)} FCFA</td>
            <td class="py-3">${statusBadge}</td>
        `;
        return tr;
    }

    /* =========================================================
       FILTRAGE + PAGINATION
    ========================================================= */
    function getFiltered() {
        if (!searchTerm) return FACTURES;
        const term = searchTerm.toLowerCase();
        return FACTURES.filter(f =>
            f.numero.toLowerCase().includes(term) ||
            f.fournisseur.toLowerCase().includes(term)
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
        for (let i = 1; i <= totalPages; i++) pagination.appendChild(makeBtn(String(i), i, { active: i === currentPage }));
        pagination.appendChild(makeBtn('&raquo;', Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages }));
    }

    function renderList() {
        const filtered = getFiltered();

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(start, start + PER_PAGE);

        tbody.innerHTML = '';
        if (!pageItems.length) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            pageItems.forEach(f => tbody.appendChild(buildRow(f)));
        }

        renderPagination(filtered.length);
        const rangeStart = filtered.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + PER_PAGE, filtered.length);
        paginationInfo.textContent = `Affichage ${rangeStart}-${rangeEnd} sur ${filtered.length} factures`;
    }

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
       CALCUL AUTOMATIQUE TVA (18%) ET TTC A PARTIR DU MONTANT HT
    ========================================================= */
    const inputHt = document.getElementById('id_montant_ht');
    const inputTva = document.getElementById('id_tva');
    const inputTtc = document.getElementById('id_montant_ttc');

    function recalculerMontants() {
        const ht = parseFloat(inputHt.value) || 0;
        const tva = ht * TVA_TAUX;
        const ttc = ht + tva;
        inputTva.value = tva.toFixed(2);
        inputTtc.value = ttc.toFixed(2);
    }

    if (inputHt) {
        inputHt.addEventListener('input', recalculerMontants);
    }

    /* =========================================================
       INIT
    ========================================================= */
    renderList();
});

toggleBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
    chartInstance.destroy();
    chartInstance = renderChart();
});