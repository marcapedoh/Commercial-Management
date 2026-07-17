document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       DONNEES HISTORIQUE VENTES (injecter du vrai JSON Django
       via {{ ventes_json|safe }} en remplacement de ce mock)
       Champs : { id, reference, client, date, total_ttc, marge_totale, has_facture }
    ========================================================= */
    let VENTES_ = JSON.parse(
        document.getElementById("ventes-data").textContent
    );

    const VENTES = JSON.parse(VENTES_)
    console.log(VENTES);

    let PRODUITS_ = JSON.parse(
        document.getElementById("produits-data").textContent
    );

    const PRODUITS = JSON.parse(PRODUITS_)
    console.log(PRODUITS);


    const PER_PAGE = 6;
    let currentPage = 1;
    let searchTerm = '';

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

    /* =========================================================
       FONCTIONNALITE 1 & 2 : RUPTURE + VALORISATION STOCK
    ========================================================= */
    function renderStockInsights() {
        let totalValue = 0;
        const risk = [];
        const rows = [...PRODUITS].sort((a, b) => (b.stock * b.price) - (a.stock * a.price)).slice(0, 10);

        PRODUITS.forEach(p => {
            totalValue += p.stock * p.price;
            if (p.stock < p.security) risk.push(p.nom);
        });

        document.getElementById('stat-stock-value').textContent = fmt(totalValue);

        const banner = document.getElementById('alert-banner');
        if (risk.length) {
            banner.classList.remove('hidden');
            document.getElementById('alert-list').textContent = risk.join(', ') + ' — sous le stock de sécurité.';
        } else {
            banner.classList.add('hidden');
        }

        const tbody = document.getElementById('top-produits-tbody');
        tbody.innerHTML = '';
        rows.forEach(p => {
            const value = p.stock * p.price;
            const days = p.stock > 0 ? Math.floor(p.stock / 3) : 0; // estimation par defaut, remplacer par la vraie moyenne de ventes/jour
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td class="py-2.5 text-neutral-700 dark:text-gray-300 font-medium">${p.nom}</td>
                <td class="py-2.5 text-neutral-500 dark:text-gray-400 text-xs">${p.stock}</td>
                <td class="py-2.5 text-neutral-500 dark:text-gray-400 text-xs">${days} j</td>
                <td class="py-2.5 text-neutral-700 dark:text-gray-300 text-xs font-medium">${fmt(value)} FCFA</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /* =========================================================
       STATS VENTES : CA, MARGE, TVA (fonctionnalite 3)
    ========================================================= */
    function updateVenteStats() {
        const totalHt = VENTES.reduce((s, v) => s + Number(v.total_ttc) / 1.18, 0);
        const totalMarge = VENTES.reduce((s, v) => s + Number(v.marge_totale), 0);
        const totalTva = VENTES.reduce((s, v) => s + (Number(v.total_ttc) - Number(v.total_ttc) / 1.18), 0);

        document.getElementById('stat-ca').textContent = fmt(totalHt);
        document.getElementById('stat-marge').textContent = fmt(totalMarge);
        document.getElementById('stat-tva').textContent = fmt(totalTva);
    }

    /* =========================================================
       LISTE DES VENTES + PAGINATION
    ========================================================= */
    const tbody = document.getElementById('vente-tbody');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const searchInput = document.getElementById('search-input');

    function buildRow(v) {
        const tr = document.createElement('tr');
        const factureCell = v.has_facture
            ? `<div class="flex items-center gap-2">
                 <a href="/ventes/${v.id}/apercu/" target="_blank"
                    class="text-xs px-2.5 py-1 rounded-full border border-amber-200 text-neutral-600 hover:bg-amber-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">Aperçu</a>
                 <a href="/ventes/${v.id}/telecharger/"
                    class="text-xs px-2.5 py-1 rounded-full text-white bg-gradient-to-r from-amber-400 to-yellow-500 dark:from-[#1ecb8b] dark:to-[#149766] dark:text-[#0d1117]">Télécharger</a>
               </div>`
            : '<span class="text-xs text-neutral-400 dark:text-gray-500">—</span>';

        tr.innerHTML = `
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium">${v.reference}</td>
            <td class="py-3 text-neutral-600 dark:text-gray-300 text-xs">${v.client || 'Client de passage'}</td>
            <td class="py-3 text-neutral-500 dark:text-gray-400 text-xs">${v.date}</td>
            <td class="py-3 text-neutral-700 dark:text-gray-300 font-medium text-xs">${fmt(v.total_ttc)} FCFA</td>
            <td class="py-3 text-emerald-500 text-xs font-medium">${fmt(v.marge_totale)} FCFA</td>
            <td class="py-3">${factureCell}</td>
        `;
        return tr;
    }

    function getFiltered() {
        if (!searchTerm) return VENTES;
        const term = searchTerm.toLowerCase();
        return VENTES.filter(v =>
            v.reference.toLowerCase().includes(term) ||
            (v.client || '').toLowerCase().includes(term)
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
        updateVenteStats();

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(start, start + PER_PAGE);

        tbody.innerHTML = '';
        if (!pageItems.length) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            pageItems.forEach(v => tbody.appendChild(buildRow(v)));
        }

        renderPagination(filtered.length);
        const rangeStart = filtered.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + PER_PAGE, filtered.length);
        paginationInfo.textContent = `Affichage ${rangeStart}-${rangeEnd} sur ${filtered.length} ventes`;
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
    const btnAdd = document.getElementById('btn-add-vente');
    const btnCancel = document.getElementById('btn-cancel-vente');
    const btnCancelInline = document.getElementById('btn-cancel-vente-inline');
    const viewList = document.getElementById('view-list');
    const viewLoader = document.getElementById('view-loader');
    const viewForm = document.getElementById('view-form');
    const loaderCircle = document.getElementById('loader-circle');
    const loaderPercent = document.getElementById('loader-percent');

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
       GESTION DES LIGNES DE VENTE : PRIX AUTO, MARGE, ANTI-DOUBLON,
       CONTROLE DE STOCK DISPONIBLE
    ========================================================= */
    let lignes = []; // [{ produit_id, nom, quantite, prix_vente, prix_achat, stock_dispo }]

    const selectProduit = document.getElementById('line-produit');
    const inputQuantite = document.getElementById('line-quantite');
    const inputPrix = document.getElementById('line-prix');
    const btnAddLine = document.getElementById('btn-add-line');
    const lignesTbody = document.getElementById('lignes-tbody');
    const lignesEmpty = document.getElementById('lignes-empty');
    const lineInfo = document.getElementById('line-info');
    const lignesJsonInput = document.getElementById('lignes-json');

    selectProduit.addEventListener('change', () => {
        const option = selectProduit.selectedOptions[0];
        inputPrix.value = option && option.value ? option.dataset.prix : '';
    });

    function renderLignes() {
        lignesTbody.innerHTML = '';
        if (!lignes.length) {
            lignesEmpty.classList.remove('hidden');
        } else {
            lignesEmpty.classList.add('hidden');
            lignes.forEach((l, index) => {
                const totalLigne = l.quantite * l.prix_vente;
                const margeLigne = (l.prix_vente - l.prix_achat) * l.quantite;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-2.5 px-3 text-neutral-700 dark:text-gray-300 font-medium">${l.nom}</td>
                    <td class="py-2.5 px-3 text-neutral-600 dark:text-gray-300">${l.quantite}</td>
                    <td class="py-2.5 px-3 text-neutral-500 dark:text-gray-400 text-xs">${fmt(l.prix_vente)} FCFA</td>
                    <td class="py-2.5 px-3 text-emerald-500 text-xs font-medium">${fmt(margeLigne)} FCFA</td>
                    <td class="py-2.5 px-3 text-neutral-700 dark:text-gray-300 font-medium text-xs">${fmt(totalLigne)} FCFA</td>
                    <td class="py-2.5 px-3">
                        <button type="button" data-remove="${index}" class="text-neutral-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m6 18 12-12M6 6l12 12" /></svg>
                        </button>
                    </td>
                `;
                lignesTbody.appendChild(tr);
            });
        }

        const totalHt = lignes.reduce((s, l) => s + (l.quantite * l.prix_vente), 0);
        const tva = totalHt * 0.18;
        const ttc = totalHt + tva;
        const margeTotale = lignes.reduce((s, l) => s + ((l.prix_vente - l.prix_achat) * l.quantite), 0);

        document.getElementById('recap-ht').textContent = fmt(totalHt) + ' FCFA';
        document.getElementById('recap-tva').textContent = fmt(tva) + ' FCFA';
        document.getElementById('recap-ttc').textContent = fmt(ttc) + ' FCFA';
        document.getElementById('recap-marge').textContent = fmt(margeTotale) + ' FCFA';

        lignesJsonInput.value = JSON.stringify(lignes.map(l => ({
            produit_id: l.produit_id,
            quantite: l.quantite,
            prix_vente_unitaire: l.prix_vente
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

    function showLineInfo(message, isError) {
        lineInfo.textContent = message;
        lineInfo.className = isError
            ? 'text-xs mt-2 text-rose-500'
            : 'text-xs mt-2 text-amber-600 dark:text-[#f2c94c]';
        lineInfo.classList.remove('hidden');
    }

    btnAddLine.addEventListener('click', () => {
        const option = selectProduit.selectedOptions[0];
        const produitId = selectProduit.value;
        const quantite = parseInt(inputQuantite.value, 10);
        const prix = parseFloat(inputPrix.value);

        if (!produitId || !quantite || quantite <= 0 || isNaN(prix) || prix < 0) {
            showLineInfo("Sélectionnez un produit, une quantité et un prix valides.", true);
            return;
        }

        const stockDispo = parseInt(option.dataset.stock, 10);
        const existante = lignes.find(l => l.produit_id === produitId);
        const quantiteTotaleDemandee = (existante ? existante.quantite : 0) + quantite;

        // Verification du stock disponible avant tout ajout
        if (quantiteTotaleDemandee > stockDispo) {
            showLineInfo(
                `Stock insuffisant pour "${option.dataset.nom}" (disponible : ${stockDispo}, demandé : ${quantiteTotaleDemandee}).`,
                true
            );
            return;
        }

        if (existante) {
            existante.quantite = quantiteTotaleDemandee;
            existante.prix_vente = prix;
            showLineInfo(`Quantité mise à jour pour "${option.dataset.nom}" (produit déjà présent dans cette vente).`, false);
        } else {
            lignes.push({
                produit_id: produitId,
                nom: option.dataset.nom,
                quantite: quantite,
                prix_vente: prix,
                prix_achat: parseFloat(option.dataset.achat),
                stock_dispo: stockDispo,
            });
            lineInfo.classList.add('hidden');
        }

        renderLignes();
        selectProduit.value = '';
        inputQuantite.value = 1;
        inputPrix.value = '';
    });

    document.getElementById('vente-form').addEventListener('submit', (e) => {
        const formError = document.getElementById('form-error');
        if (!lignes.length) {
            e.preventDefault();
            formError.textContent = "Ajoutez au moins un produit avant d'enregistrer la vente.";
            formError.classList.remove('hidden');
            return;
        }
        formError.classList.add('hidden');
    });

    /* =========================================================
       INIT
    ========================================================= */
    renderStockInsights();
    renderLignes();
    renderList();
});


toggleBtn.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('razor-theme', root.classList.contains('dark') ? 'dark' : 'light');
    chartInstance.destroy();
    chartInstance = renderChart();
});