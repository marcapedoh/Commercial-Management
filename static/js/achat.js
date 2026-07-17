document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       DONNEES DE L'HISTORIQUE (a remplacer par du JSON injecte
       depuis Django : {{ achats_json|safe }} par ex.)
       Champs attendus : { id, reference, fournisseur, date, nb_lignes, total, utilisateur }
    ========================================================= */
    let ACHATS_ = JSON.parse(
        document.getElementById("achats-data").textContent
    );

    const ACHATS = JSON.parse(ACHATS_)
    console.log(ACHATS);
    const PER_PAGE = 6;
    let currentPage = 1;
    let searchTerm = '';

    /* =========================================================
       ELEMENTS DOM : LISTE
    ========================================================= */
    const tbody = document.getElementById('achat-tbody');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const searchInput = document.getElementById('search-input');

    const btnAdd = document.getElementById('btn-add-achat');
    const btnCancel = document.getElementById('btn-cancel-achat');
    const btnCancelInline = document.getElementById('btn-cancel-achat-inline');

    const viewList = document.getElementById('view-list');
    const viewLoader = document.getElementById('view-loader');
    const viewForm = document.getElementById('view-form');
    const loaderCircle = document.getElementById('loader-circle');
    const loaderPercent = document.getElementById('loader-percent');

    const statTotal = document.getElementById('stat-total');
    const statMontant = document.getElementById('stat-montant');
    const statMois = document.getElementById('stat-mois');
    const statFournisseur = document.getElementById('stat-fournisseur');

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

    /* =========================================================
       STATS
    ========================================================= */
    function updateStats(list) {
        const totalMontant = list.reduce((s, a) => s + Number(a.total), 0);
        const now = new Date();
        const moisCount = list.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        const counts = {};
        list.forEach(a => { counts[a.fournisseur] = (counts[a.fournisseur] || 0) + 1; });
        const topFournisseur = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '--';

        statTotal.textContent = list.length;
        statMontant.textContent = fmt(totalMontant);
        statMois.textContent = moisCount;
        statFournisseur.textContent = topFournisseur;
    }

    /* =========================================================
       RENDU LISTE ACHATS
    ========================================================= */
    function buildRow(a) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${a.reference}</td>
            <td class="py-3 text-neutral-600 dark:text-gray-300 text-xs">${a.fournisseur}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${a.date}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${a.nb_lignes} produit${a.nb_lignes > 1 ? 's' : ''}</td>
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium text-xs">${fmt(a.total)} FCFA</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${a.utilisateur}</td>
        `;
        return tr;
    }

    function getFiltered() {
        if (!searchTerm) return ACHATS;
        const term = searchTerm.toLowerCase();
        return ACHATS.filter(a =>
            a.reference.toLowerCase().includes(term) ||
            a.fournisseur.toLowerCase().includes(term)
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
        updateStats(ACHATS);

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(start, start + PER_PAGE);

        tbody.innerHTML = '';
        if (!pageItems.length) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            pageItems.forEach(a => tbody.appendChild(buildRow(a)));
        }

        renderPagination(filtered.length);
        const rangeStart = filtered.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + PER_PAGE, filtered.length);
        paginationInfo.textContent = `Affichage ${rangeStart}-${rangeEnd} sur ${filtered.length} achats`;
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
        resetLignes();
        renderList();
    }

    btnCancel.addEventListener('click', backToList);
    if (btnCancelInline) btnCancelInline.addEventListener('click', backToList);

    /* =========================================================
       GESTION DES LIGNES DE PRODUITS (coeur de la fonctionnalite)
       - Un produit deja present voit sa quantite augmentee,
         jamais de duplication de ligne.
       - Le prix unitaire est propose automatiquement mais reste
         modifiable (ex. negociation fournisseur).
    ========================================================= */
    let lignes = []; // [{ produit_id, nom, quantite, prix_unitaire }]

    const selectProduit = document.getElementById('line-produit');
    const inputQuantite = document.getElementById('line-quantite');
    const inputPrix = document.getElementById('line-prix');
    const btnAddLine = document.getElementById('btn-add-line');
    const lignesTbody = document.getElementById('lignes-tbody');
    const lignesEmpty = document.getElementById('lignes-empty');
    const totalGeneral = document.getElementById('total-general');
    const lineInfo = document.getElementById('line-info');
    const lignesJsonInput = document.getElementById('lignes-json');

    // Pré-remplissage automatique du prix d'achat quand un produit est choisi
    selectProduit.addEventListener('change', () => {
        const option = selectProduit.selectedOptions[0];
        if (option && option.value) {
            inputPrix.value = option.dataset.prix || '';
        } else {
            inputPrix.value = '';
        }
    });

    function renderLignes() {
        lignesTbody.innerHTML = '';
        if (!lignes.length) {
            lignesEmpty.classList.remove('hidden');
        } else {
            lignesEmpty.classList.add('hidden');
            lignes.forEach((l, index) => {
                const totalLigne = l.quantite * l.prix_unitaire;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-2.5 px-3 text-neutral-700 dark:text-gray-300 font-medium">${l.nom}</td>
                    <td class="py-2.5 px-3 text-neutral-600 dark:text-gray-300">${l.quantite}</td>
                    <td class="py-2.5 px-3 text-neutral-500 dark:text-gray-400 text-xs">${fmt(l.prix_unitaire)} FCFA</td>
                    <td class="py-2.5 px-3 text-neutral-700 dark:text-gray-300 font-medium text-xs">${fmt(totalLigne)} FCFA</td>
                    <td class="py-2.5 px-3">
                        <button type="button" data-remove="${index}"
                                class="text-neutral-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m6 18 12-12M6 6l12 12" />
                            </svg>
                        </button>
                    </td>
                `;
                lignesTbody.appendChild(tr);
            });
        }

        const total = lignes.reduce((s, l) => s + (l.quantite * l.prix_unitaire), 0);
        totalGeneral.textContent = fmt(total) + ' FCFA';
        lignesJsonInput.value = JSON.stringify(lignes.map(l => ({
            produit_id: l.produit_id,
            quantite: l.quantite,
            prix_unitaire: l.prix_unitaire
        })));

        lignesTbody.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                lignes.splice(Number(btn.dataset.remove), 1);
                renderLignes();
            });
        });
    }

    function resetLignes() {
        lignes = [];
        selectProduit.value = '';
        inputQuantite.value = 1;
        inputPrix.value = '';
        lineInfo.classList.add('hidden');
        renderLignes();
    }

    btnAddLine.addEventListener('click', () => {
        const option = selectProduit.selectedOptions[0];
        const produitId = selectProduit.value;
        const quantite = parseInt(inputQuantite.value, 10);
        const prix = parseFloat(inputPrix.value);

        if (!produitId || !quantite || quantite <= 0 || isNaN(prix) || prix < 0) {
            lineInfo.textContent = "Sélectionnez un produit, une quantité et un prix valides.";
            lineInfo.classList.remove('hidden');
            return;
        }

        // Le coeur de la regle : produit deja present -> on incremente
        // la quantite existante, on ne cree jamais une seconde ligne.
        const existante = lignes.find(l => l.produit_id === produitId);
        if (existante) {
            existante.quantite += quantite;
            existante.prix_unitaire = prix; // on garde le dernier prix saisi
            lineInfo.textContent = `Quantité mise à jour pour "${option.dataset.nom}" (produit déjà présent dans cet achat).`;
            lineInfo.classList.remove('hidden');
        } else {
            lignes.push({
                produit_id: produitId,
                nom: option.dataset.nom,
                quantite: quantite,
                prix_unitaire: prix
            });
            lineInfo.classList.add('hidden');
        }

        renderLignes();
        selectProduit.value = '';
        inputQuantite.value = 1;
        inputPrix.value = '';
    });

    /* =========================================================
       SOUMISSION DU FORMULAIRE
    ========================================================= */
    document.getElementById('achat-form').addEventListener('submit', (e) => {
        const formError = document.getElementById('form-error');
        if (!lignes.length) {
            e.preventDefault();
            formError.textContent = "Ajoutez au moins un produit avant d'enregistrer l'achat.";
            formError.classList.remove('hidden');
            return;
        }
        formError.classList.add('hidden');
        // Le formulaire se soumet normalement ; lignes_json contient les lignes.
    });

    /* =========================================================
       INIT
    ========================================================= */
    renderLignes();
    renderList();
});


toggleBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
    chartInstance.destroy();
    chartInstance = renderChart();
});