document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       DONNÉES
       ---------------------------------------------------------
       Remplacez ce tableau par les données réelles récupérées
       depuis votre API/Django (fetch, JSON injecté, etc.)
       Champs attendus par produit :
       { id, name, category, price, stock, status, description, image }
    ========================================================= */
    let PRODUCTS_ = JSON.parse(
        document.getElementById('produits-data').textContent
    );
    const PRODUCTS=JSON.parse(PRODUCTS_)
   
    const PER_PAGE = 8;

    let currentPage = 1;
    let showImages = false;
    let searchTerm = '';

    /* =========================================================
       ELEMENTS DOM
    ========================================================= */
    const grid = document.getElementById('catalog-grid');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('pagination-info');
    const searchInput = document.getElementById('search-input');

    const btnToggleImages = document.getElementById('btn-toggle-images');
    const iconEyeOn = document.getElementById('icon-eye-on');
    const iconEyeOff = document.getElementById('icon-eye-off');
    const toggleLabel = document.getElementById('toggle-images-label');

    const btnAddProduit = document.getElementById('btn-add-produit');
    const btnCancelProduit = document.getElementById('btn-cancel-produit');

    const viewCatalog = document.getElementById('view-catalog');
    const viewLoader = document.getElementById('view-loader');
    const viewForm = document.getElementById('view-form');
    const loaderCircle = document.getElementById('loader-circle');
    const loaderPercent = document.getElementById('loader-percent');

    const statTotal = document.getElementById('stat-total');
    const statActive = document.getElementById('stat-active');
    const statAvgPrice = document.getElementById('stat-avg-price');
    const statCategories = document.getElementById('stat-categories');

    /* =========================================================
       UTILITAIRES
    ========================================================= */
    const formatFCFA = (n) => n.toLocaleString('fr-FR');

    function placeholderSvg(name) {
        const initial = (name || '?').trim().charAt(0).toUpperCase();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
            <rect width="100%" height="100%" fill="#fde68a"/>
            <text x="50%" y="50%" font-family="Poppins, sans-serif" font-size="70" fill="#b45309"
                  text-anchor="middle" dominant-baseline="middle">${initial}</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    function updateStats(list) {
        const active = list.filter(p => p.status === 'active').length;
        const avg = list.length ? Math.round(list.reduce((s, p) => s + p.price, 0) / list.length) : 0;
        const categories = new Set(list.map(p => p.category)).size;

        statTotal.textContent = list.length;
        statActive.textContent = active;
        statAvgPrice.textContent = formatFCFA(avg);
        statCategories.textContent = categories;
    }

    /* =========================================================
       RENDU D'UNE CARTE PRODUIT
    ========================================================= */
    function buildCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card rounded-2xl border overflow-hidden transition-colors ' +
            'bg-white/70 border-amber-200/60 backdrop-blur-xl dark:bg-[#161b24] dark:border-white/5';
        card.dataset.id = product.id;

        const statusBadge = product.status === 'active'
            ? '<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Actif</span>'
            : '<span class="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400 dark:bg-white/5 dark:text-gray-500">Inactif</span>';

        card.innerHTML = `
            <div class="product-image-zone">
                <div class="w-full h-36 overflow-hidden">
                    <img src="${product.image || placeholderSvg(product.name)}" alt="${product.name}"
                         class="w-full h-full object-cover">
                </div>
            </div>
            <div class="p-4">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <p class="text-sm font-semibold text-neutral-800 dark:text-white">${product.name}</p>
                    ${statusBadge}
                </div>
                <p class="text-xs text-neutral-400 dark:text-gray-500 mb-2">${product.category}</p>
                
                <div class="flex items-center justify-between mt-1">
                    <p class="text-base font-semibold text-neutral-800 dark:text-white">${formatFCFA(product.price)} <span class="text-xs font-normal text-neutral-400 dark:text-gray-500">FCFA</span></p>
                    <span class="text-xs text-neutral-400 dark:text-gray-500">Stock: ${product.stock}</span>
                </div>
            </div>
        `;
        return card;
    }

    /* =========================================================
       MOSAÏQUE (masonry via grid-auto-rows + span calculé)
    ========================================================= */
    function layoutMasonry() {
        const styles = window.getComputedStyle(grid);
        const rowHeight = parseInt(styles.getPropertyValue('grid-auto-rows'));
        const rowGap = parseInt(styles.getPropertyValue('gap'));

        grid.querySelectorAll('.product-card').forEach(card => {
            const contentHeight = card.getBoundingClientRect().height;
            const span = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
            card.style.gridRowEnd = 'span ' + span;
        });
    }

    /* =========================================================
       FILTRAGE + PAGINATION
    ========================================================= */
    function getFilteredProducts() {
        if (!searchTerm) return PRODUCTS;
        const term = searchTerm.toLowerCase();
        return PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
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
            btn.addEventListener('click', () => {
                currentPage = page;
                renderCatalog();
            });
            return btn;
        };

        pagination.appendChild(makeBtn('&laquo;', Math.max(1, currentPage - 1), { disabled: currentPage === 1 }));

        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(makeBtn(String(i), i, { active: i === currentPage }));
        }

        pagination.appendChild(makeBtn('&raquo;', Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages }));
    }

    function renderCatalog() {
        const filtered = getFilteredProducts();
        updateStats(filtered);

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(start, start + PER_PAGE);

        grid.innerHTML = '';
        grid.classList.toggle('catalog-show-images', showImages);

        if (!pageItems.length) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            pageItems.forEach(p => grid.appendChild(buildCard(p)));
        }

        renderPagination(filtered.length);

        const rangeStart = filtered.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + PER_PAGE, filtered.length);
        paginationInfo.textContent = `Affichage ${rangeStart}-${rangeEnd} sur ${filtered.length} produits`;

        // Laisse le temps au DOM de calculer les hauteurs avant la mosaïque
        requestAnimationFrame(layoutMasonry);
    }

    /* =========================================================
       TOGGLE AFFICHAGE DES IMAGES
    ========================================================= */
    if(btnToggleImages){
        btnToggleImages.addEventListener('click', () => {
            showImages = !showImages;
            iconEyeOn.classList.toggle('hidden', showImages);
            iconEyeOff.classList.toggle('hidden', !showImages);
            toggleLabel.textContent = showImages 
                ? 'Masquer les images' 
                : 'Afficher les images';

            renderCatalog();
        });
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
            renderCatalog();
        }, 200);
    });

    /* =========================================================
       BASCULE CATALOGUE -> LOADER -> FORMULAIRE
    ========================================================= */
    function runLoaderThenShowForm() {
        viewCatalog.classList.add('hidden');
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

    btnAddProduit.addEventListener('click', runLoaderThenShowForm);

    btnCancelProduit.addEventListener('click', () => {
        viewForm.classList.add('hidden');
        viewCatalog.classList.remove('hidden');
        renderCatalog();
    });

    /* =========================================================
       INIT
    ========================================================= */
    window.addEventListener('resize', () => requestAnimationFrame(layoutMasonry));
    renderCatalog();

    /* =========================================================
    ANIMATION AJOUT DE CATEGORIE APRES MESSAGE DJANGO
    ========================================================= */

    const categorieForm = document.getElementById('categorie-form');
    const categorieSuccess = document.getElementById('categorie-success');
    const btnNewCategory = document.getElementById('btn-new-category');
    const categorieError = document.getElementById('categorie-form-error');
    const btnSubmitCategorie = document.getElementById('btn-submit-categorie');


    if (categorieForm) {

        categorieForm.addEventListener('submit', async (e)=>{

            e.preventDefault();


            categorieError.classList.add('hidden');


            btnSubmitCategorie.disabled = true;
            btnSubmitCategorie.classList.add('opacity-60');


            const formData = new FormData(categorieForm);



            try {

                const response = await fetch(
                    categorieForm.action,
                    {
                        method:"POST",
                        body:formData,
                        headers:{
                            "X-CSRFToken":
                            document.querySelector(
                                '[name=csrfmiddlewaretoken]'
                            ).value
                        }
                    }
                );


                const data = await response.json();



                if(data.success){


                    // ajouter automatiquement dans le select produit

                    const select = document.getElementById(
                        "id_categorie"
                    );


                    if(select){

                        const option =
                        document.createElement("option");


                        option.value=data.id;
                        option.textContent=data.nom;
                        option.selected=true;


                        select.appendChild(option);

                    }



                    // afficher animation succès

                    document.getElementById(
                        "categorie-success-name"
                    ).textContent=data.nom;



                    categorieForm.classList.add("hidden");


                    categorieSuccess.classList.remove("hidden");

                    categorieSuccess.classList.add("flex");



                    btnNewCategory.classList.remove("hidden");

                    btnNewCategory.classList.add("flex");



                    categorieForm.reset();



                }else{


                    categorieError.textContent =
                    "Erreur lors de l'ajout";


                    categorieError.classList.remove("hidden");

                }



            }catch(error){


                categorieError.textContent =
                "Une erreur est survenue";


                categorieError.classList.remove("hidden");

            }



            finally{


                btnSubmitCategorie.disabled=false;

                btnSubmitCategorie.classList.remove(
                    "opacity-60"
                );


            }



        });


    }
    if(btnNewCategory){

        btnNewCategory.addEventListener(
            "click",
            ()=>{
                categorieSuccess.classList.add(
                    "hidden"
                );
                categorieSuccess.classList.remove(
                    "flex"
                );
                categorieForm.classList.remove(
                    "hidden"
                );


                btnNewCategory.classList.add(
                    "hidden"
                );


                btnNewCategory.classList.remove(
                    "flex"
                );


            }
            );

    }

    if (document.getElementById('btn-cancel-produit-inline')) {
        document.getElementById('btn-cancel-produit-inline').addEventListener('click', () => {
            btnCancelProduit.click();
        });
    }
});