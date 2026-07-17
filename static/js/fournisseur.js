document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       DONNÉES
       Remplacez ce tableau par les données réelles (fetch/JSON
       injecté depuis Django). Champs attendus par fournisseur :
       { id, nom, contact_nom, telephone, email, adresse, ville, specialite, actif }
    ========================================================= */

    let FOURNISSEURS_ = JSON.parse(
        document.getElementById("fournisseurs-data").textContent
    );

    const FOURNISSEURS = JSON.parse(FOURNISSEURS_)
    console.log(FOURNISSEURS);

    const PER_PAGE = 6;

    let currentPage = 1;
    let searchTerm = '';

    /* =========================================================
       ELEMENTS DOM
    ========================================================= */
    const tbody = document.getElementById('fournisseur-tbody');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const searchInput = document.getElementById('search-input');

    const btnAdd = document.getElementById('btn-add-fournisseur');
    const btnCancel = document.getElementById('btn-cancel-fournisseur');
    const btnCancelInline = document.getElementById('btn-cancel-fournisseur-inline');

    const viewList = document.getElementById('view-list');
    const viewLoader = document.getElementById('view-loader');
    const viewForm = document.getElementById('view-form');
    const loaderCircle = document.getElementById('loader-circle');
    const loaderPercent = document.getElementById('loader-percent');

    const statTotal = document.getElementById('stat-total');
    const statActive = document.getElementById('stat-active');
    const statInactive = document.getElementById('stat-inactive');
    const statVilles = document.getElementById('stat-villes');

    /* =========================================================
       STATS
    ========================================================= */
    function updateStats(list) {
        const active = list.filter(f => f.email).length;
        const inactive = list.length - active;
        const villes = new Set(list.map(f => f.adresse)).size;

        statTotal.textContent = list.length;
        statActive.textContent = active;
        statInactive.textContent = inactive;
        statVilles.textContent = villes;
    }

    /* =========================================================
       RENDU D'UNE LIGNE FOURNISSEUR
    ========================================================= */
    function buildRow(f) {
        const statusBadge = f.actif
            ? '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Actif</span>'
            : '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 dark:text-gray-500"><span class="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-gray-600"></span>Inactif</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3">
                <p class="text-neutral-700 dark:text-gray-300 font-medium">${f.nom}</p>
                <p class="text-xs text-neutral-400 dark:text-gray-500">${f.email}</p>
            </td>
            <td class="py-3 text-neutral-600 dark:text-gray-300">${f.raison_social}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${f.telephone}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${f.adresse}</td>
            <td class="py-3">${statusBadge}</td>
        `;
        return tr;
    }

    /* =========================================================
       FILTRAGE + PAGINATION
    ========================================================= */
    function getFiltered() {
        if (!searchTerm) return FOURNISSEURS;
        const term = searchTerm.toLowerCase();
        return FOURNISSEURS.filter(f =>
            f.nom.toLowerCase().includes(term) ||
            f.ville.toLowerCase().includes(term) ||
            f.specialite.toLowerCase().includes(term)
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
        updateStats(filtered);

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
        paginationInfo.textContent = `Affichage ${rangeStart}-${rangeEnd} sur ${filtered.length} fournisseurs`;
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
    renderList();
});

toggleBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
    chartInstance.destroy();
    chartInstance = renderChart();
});