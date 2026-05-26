const { createClient } = supabase;
const db = createClient('https://xhldtqnttctntopqklsu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGR0cW50dGN0bnRvcHFrbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDY0NTMsImV4cCI6MjA5MjY4MjQ1M30.JDSGjKc_rxS04He_ms7r4P6zLiktk7VhiHbnO4JDmr8');

document.addEventListener('DOMContentLoaded', function() {

    // Référence partagée au modal galerie (créé après chargement DB)
    let galleryModal = null;

    function openGallery() {
        if (!galleryModal) return;
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeGallery() {
        if (!galleryModal) return;
        galleryModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // CHARGEMENT DU BIEN
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        db.from('biens').select('*').eq('id', id).single()
            .then(({ data: bien, error }) => {
            if (error || !bien) return;
                const titre = bien.titre;
                const prix = bien.prix.toLocaleString('fr-FR') + ' €';
                const statut = bien.statut.toUpperCase();

                const pgh = document.querySelector('.pgh');
                if (pgh) {
                    const spanStatut = document.createElement('span');
                    spanStatut.className = 'pgh-statut';
                    spanStatut.textContent = statut;

                    const h1 = document.createElement('h1');
                    h1.className = 'pgh-titre';
                    h1.textContent = titre;

                    const spanPrix = document.createElement('span');
                    spanPrix.className = 'pgh-prix';
                    spanPrix.textContent = prix;

                    const ligne = document.createElement('div');
                    ligne.className = 'pgh-ligne';
                    ligne.appendChild(h1);
                    ligne.appendChild(spanPrix);

                    pgh.innerHTML = '';
                    pgh.appendChild(spanStatut);
                    pgh.appendChild(ligne);
                }

                // SEO dynamique
                document.title = `${titre} — Agence Immobilière Luxembourg | Reg-Immo`;
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', `${titre} à ${prix}. Bien immobilier proposé par Reg-Immo, agence immobilière au Luxembourg. Contactez-nous au +352 671 158 484.`);
                const ogTitle = document.querySelector('meta[property="og:title"]');
                if (ogTitle) ogTitle.setAttribute('content', `${titre} — Reg-Immo Luxembourg`);
                const ogDesc = document.querySelector('meta[property="og:description"]');
                if (ogDesc) ogDesc.setAttribute('content', `${titre} à ${prix}. Bien immobilier au Luxembourg proposé par Reg-Immo.`);
                const twitterTitle = document.querySelector('meta[name="twitter:title"]');
                if (twitterTitle) twitterTitle.setAttribute('content', `${titre} — Reg-Immo Luxembourg`);
                if (bien.images?.pgm) {
                    const ogImage = document.querySelector('meta[property="og:image"]');
                    if (ogImage) ogImage.setAttribute('content', bien.images.pgm);
                    const twitterImage = document.querySelector('meta[name="twitter:image"]');
                    if (twitterImage) twitterImage.setAttribute('content', bien.images.pgm);
                }

                const descTxt = document.querySelector('.description .txt');
                if (descTxt && bien.description) descTxt.textContent = bien.description;

                // SEO : canonical et og:url dynamiques avec l'ID du bien
                const canonicalEl = document.querySelector('link[rel="canonical"]');
                if (canonicalEl) canonicalEl.setAttribute('href', `https://reg-immo.lu/bien?id=${id}`);
                const ogUrlEl = document.querySelector('meta[property="og:url"]');
                if (ogUrlEl) ogUrlEl.setAttribute('content', `https://reg-immo.lu/bien?id=${id}`);

                if (bien.images) {
                    const altBase = titre || 'Bien immobilier';
                    ['pgm','pgb1','pgb2','pgb3','pdh','pdb'].forEach((slot, i) => {
                        const el = document.querySelector(`.${slot} img`);
                        if (el && bien.images[slot]) {
                            el.src = bien.images[slot];
                            el.alt = i === 0 ? `${altBase} — photo principale` : `${altBase} — photo ${i + 1}`;
                        }
                    });
                }

                // Surfaces & hauteurs : affichés seulement si les données existent
                const surfaceSection = document.querySelector('.surface');
                const hauteurSection = document.querySelector('.hauteur');
                const dessous = document.querySelector('.dessous');

                const hasSurfaces = bien.pieces && bien.pieces.surfaces && Object.keys(bien.pieces.surfaces).length > 0;
                const hasHauteurs = bien.pieces && bien.pieces.hauteurs && Object.keys(bien.pieces.hauteurs).length > 0;
                const hasHauteurDefaut = bien.hauteur != null;
                const hasSuperficie = bien.metres_carres != null;

                // Helper : crée une ligne nom / valeur
                function creerGrp(nomTxt, valTxt, defaut = false) {
                    const grp = document.createElement('div');
                    grp.className = defaut ? 'grp grp--defaut' : 'grp';
                    const piece = document.createElement('div');
                    piece.className = 'piece';
                    piece.textContent = nomTxt + ' :';
                    const chiffre = document.createElement('div');
                    chiffre.className = 'chiffre';
                    chiffre.textContent = valTxt;
                    grp.appendChild(piece);
                    grp.appendChild(chiffre);
                    return grp;
                }

                // ── SURFACES ──
                if (hasSuperficie || hasSurfaces) {
                    const surfaceElements = surfaceSection.querySelector('.elements');
                    // Valeur globale en premier (en gras, marquée "défaut")
                    if (hasSuperficie) {
                        surfaceElements.appendChild(creerGrp('Surface totale', bien.metres_carres + ' m²', true));
                    }
                    // Détails par pièce en dessous
                    if (hasSurfaces) {
                        Object.entries(bien.pieces.surfaces).forEach(([nom, val]) => {
                            surfaceElements.appendChild(creerGrp(nom, val + ' m²'));
                        });
                    }
                } else if (surfaceSection) {
                    surfaceSection.style.display = 'none';
                }

                // ── HAUTEURS ──
                if (hasHauteurDefaut || hasHauteurs) {
                    const hauteurElements = hauteurSection.querySelector('.elements');
                    // Valeur globale en premier
                    if (hasHauteurDefaut) {
                        hauteurElements.appendChild(creerGrp('Hauteur sous plafond', bien.hauteur + ' m', true));
                    }
                    // Détails par pièce en dessous
                    if (hasHauteurs) {
                        Object.entries(bien.pieces.hauteurs).forEach(([nom, val]) => {
                            hauteurElements.appendChild(creerGrp(nom, val + ' m'));
                        });
                    }
                } else if (hauteurSection) {
                    hauteurSection.style.display = 'none';
                }

                // Masquer toute la section si vraiment rien à afficher
                if (!hasSurfaces && !hasSuperficie && !hasHauteurs && !hasHauteurDefaut && dessous) {
                    dessous.style.display = 'none';
                }

                // ── GALERIE GRILLE ──────────────────────────────────────
                const slots = ['pgm','pgb1','pgb2','pgb3','pdh','pdb'];
                const allImages = slots.map(s => bien.images?.[s]).filter(Boolean);

                if (allImages.length > 0) {
                    // Colonnes adaptées au nombre de photos
                    const cols = allImages.length <= 8 ? 2 : allImages.length <= 15 ? 3 : 4;

                    galleryModal = document.createElement('div');
                    galleryModal.className = 'gallery-modal';

                    const closeBtn = document.createElement('span');
                    closeBtn.className = 'gallery-close';
                    closeBtn.textContent = '×';

                    const grid = document.createElement('div');
                    grid.className = 'gallery-grid';
                    grid.style.setProperty('--gallery-cols', cols);

                    allImages.forEach((src, i) => {
                        const item = document.createElement('div');
                        item.className = 'gallery-item';
                        const img = document.createElement('img');
                        img.src = src;
                        img.alt = `Photo ${i + 1}`;
                        item.appendChild(img);
                        grid.appendChild(item);
                    });

                    const modalContent = document.createElement('div');
                    modalContent.className = 'gallery-modal-content';
                    modalContent.appendChild(grid);

                    galleryModal.appendChild(closeBtn);
                    galleryModal.appendChild(modalContent);
                    document.body.appendChild(galleryModal);

                    galleryModal.querySelector('.gallery-close').addEventListener('click', closeGallery);
                    galleryModal.addEventListener('click', e => {
                        if (e.target === galleryModal) closeGallery();
                    });
                    // Clic sur une photo de la grille → lightbox plein écran
                    galleryModal.addEventListener('click', e => {
                        const clickedImg = e.target.closest('.gallery-item img');
                        if (!clickedImg) return;
                        const imgs = Array.from(galleryModal.querySelectorAll('.gallery-item img'));
                        const index = imgs.indexOf(clickedImg);
                        closeGallery();
                        openLightbox(allImages, index);
                    });
                }
            });
    }

    // ── FORMULAIRE DE CONTACT DU BIEN ────────────────────────────────────────
    const EDGE_FUNCTION_URL = 'https://xhldtqnttctntopqklsu.supabase.co/functions/v1/send-contact';

    // Injection du style spinner (pas besoin de toucher bien.css)
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
        @keyframes bien-spin { to { transform: rotate(360deg); } }
        .bien-spinner {
            display: inline-block;
            width: 14px; height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: bien-spin 0.7s linear infinite;
            vertical-align: middle;
            margin-right: 6px;
        }
    `;
    document.head.appendChild(spinnerStyle);

    const sendBtn     = document.getElementById('send');
    const bienSuccess = document.getElementById('bien-success');
    const bienError   = document.getElementById('bien-error');

    if (!sendBtn) {
        console.warn('[bien.js] Bouton #send introuvable');
    } else {
        sendBtn.addEventListener('click', async function() {
            const prenom    = document.getElementById('bien-prenom');
            const nom       = document.getElementById('bien-nom');
            const telephone = document.getElementById('bien-tel');
            const email     = document.getElementById('bien-email');
            const message   = document.getElementById('bien-message');

            // Vérification que les éléments existent
            if (!prenom || !nom || !telephone || !email) {
                console.error('[bien.js] Champs du formulaire introuvables');
                return;
            }

            // Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let valid = true;

            const champs = [
                { el: prenom,    test: v => v.length >= 2 },
                { el: nom,       test: v => v.length >= 2 },
                { el: telephone, test: v => v.length >= 6 },
                { el: email,     test: v => emailRegex.test(v) },
            ];

            champs.forEach(({ el, test }) => {
                const val = el.value.trim();
                if (!val || !test(val)) {
                    el.style.borderColor = 'rgba(200, 60, 60, 0.7)';
                    valid = false;
                } else {
                    el.style.borderColor = '';
                }
            });

            if (!valid) {
                if (bienError) {
                    bienError.textContent = 'Veuillez remplir correctement tous les champs obligatoires.';
                    bienError.style.display = 'block';
                }
                return;
            }

            if (bienError) bienError.style.display = 'none';

            // Animation de chargement
            sendBtn.disabled = true;
            const spanBtn = sendBtn.querySelector('span');
            const spinner = document.createElement('span');
            spinner.className = 'bien-spinner';
            spanBtn.textContent = 'Envoi en cours…';
            sendBtn.insertBefore(spinner, spanBtn);

            // Sujet automatique depuis le statut affiché sur la page
            const statutEl  = document.querySelector('.pgh-statut');
            const statutTxt = statutEl ? statutEl.textContent.toLowerCase() : '';
            const sujet     = statutTxt.includes('location') ? 'location' : 'achat';

            // Titre du bien
            const titreEl   = document.querySelector('.pgh-titre');
            const bienTitre = titreEl ? titreEl.textContent.trim() : '';

            const payload = {
                prenom:    prenom.value.trim(),
                nom:       nom.value.trim(),
                email:     email.value.trim(),
                telephone: telephone.value.trim(),
                message:   message ? message.value.trim() : '',
                sujet,
                bien:      bienTitre,
            };


            try {
                const res = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Erreur serveur.');

                // Succès — masquer les champs, afficher confirmation
                ['.interest', '.name', '.tel', '.email', '.message', '.envoyer'].forEach(sel => {
                    const el = document.querySelector('.formulaire ' + sel);
                    if (el) el.style.display = 'none';
                });
                if (bienSuccess) bienSuccess.style.display = 'block';

            } catch (err) {
                sendBtn.disabled = false;
                if (spinner.parentNode) spinner.parentNode.removeChild(spinner);
                spanBtn.textContent = 'Envoyer';
                if (bienError) {
                    bienError.textContent = err.message || 'Une erreur est survenue. Veuillez réessayer.';
                    bienError.style.display = 'block';
                }
            }
        });

        // Effacer la bordure rouge à la saisie
        ['bien-prenom', 'bien-nom', 'bien-tel', 'bien-email'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', function() {
                this.style.borderColor = '';
                if (bienError) bienError.style.display = 'none';
            });
        });
    }

    const header = document.querySelector('header');
    const nav = document.querySelector('.nav');

    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(hamburger);

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
    });

    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });

    const langSelector = document.querySelector('.lang-selector');
    if (langSelector) {
        langSelector.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.stopPropagation();
                this.classList.toggle('active');
            }
        });
    }

    const overlay    = document.getElementById('lightbox');
    const lbImg      = document.getElementById('lightboxImg');
    const lbClose    = document.getElementById('lightboxClose');
    const lbPrev     = document.getElementById('lightboxPrev');
    const lbNext     = document.getElementById('lightboxNext');
    const lbCounter  = document.getElementById('lightboxCounter');
    const lbZoomIn   = document.getElementById('lightboxZoomIn');
    const lbZoomOut  = document.getElementById('lightboxZoomOut');
    let lbImages     = [];
    let currentIndex = 0;

    // ── ZOOM & PAN ──────────────────────────────────────────────
    const MIN_ZOOM = 1, MAX_ZOOM = 5, ZOOM_STEP = 1.35;
    let zoomLevel = 1;
    let tx = 0, ty = 0;
    let isDragging = false;
    let dragOrigin = { x: 0, y: 0 };

    function applyTransform(animated = true) {
        lbImg.style.transition = animated ? 'transform 0.15s ease' : 'none';
        lbImg.style.transform  = `translate(${tx}px, ${ty}px) scale(${zoomLevel})`;
        lbImg.style.cursor     = zoomLevel > 1 ? 'grab' : 'default';
        lbZoomIn.disabled  = zoomLevel >= MAX_ZOOM;
        lbZoomOut.disabled = zoomLevel <= MIN_ZOOM;
    }

    function resetZoom() {
        zoomLevel = 1; tx = 0; ty = 0;
        applyTransform(false);
    }

    // Zoom centré sur le point (mx, my) en coordonnées écran
    function zoomAtPoint(mx, my, factor) {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * factor));
        if (newZoom === zoomLevel) return;
        const f = newZoom / zoomLevel;
        const r = overlay.getBoundingClientRect();
        const wcx = r.left + r.width  / 2;
        const wcy = r.top  + r.height / 2;
        tx = (mx - wcx) * (1 - f) + tx * f;
        ty = (my - wcy) * (1 - f) + ty * f;
        zoomLevel = newZoom;
        if (zoomLevel === MIN_ZOOM) { tx = 0; ty = 0; }
        applyTransform(true);
    }

    function overlayCenter() {
        const r = overlay.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    // Boutons loupe → zoom depuis le centre
    lbZoomIn.addEventListener('click',  () => { const c = overlayCenter(); zoomAtPoint(c.x, c.y, ZOOM_STEP); });
    lbZoomOut.addEventListener('click', () => { const c = overlayCenter(); zoomAtPoint(c.x, c.y, 1 / ZOOM_STEP); });

    // Molette → navigation entre photos / Ctrl+molette → zoom au curseur
    overlay.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.ctrlKey) {
            zoomAtPoint(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18);
        } else {
            if (e.deltaY > 0) goTo(currentIndex + 1);
            else              goTo(currentIndex - 1);
        }
    }, { passive: false });

    // Double-clic → zoom 2.5× au curseur, ou reset si déjà zoomé
    overlay.addEventListener('dblclick', function(e) {
        if ([lbZoomIn, lbZoomOut, lbClose, lbPrev, lbNext].some(t => t && t.contains(e.target))) return;
        if (zoomLevel > 1) resetZoom();
        else zoomAtPoint(e.clientX, e.clientY, 2.5);
    });

    // Pan (glisser) quand zoomé
    lbImg.addEventListener('mousedown', function(e) {
        if (zoomLevel <= 1) return;
        isDragging = true;
        dragOrigin = { x: e.clientX - tx, y: e.clientY - ty };
        lbImg.style.cursor = 'grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        tx = e.clientX - dragOrigin.x;
        ty = e.clientY - dragOrigin.y;
        applyTransform(false);
    });
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false;
        lbImg.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    });

    // ── LIGHTBOX ────────────────────────────────────────────────
    function openLightbox(images, index) {
        lbImages     = images;
        currentIndex = index;
        resetZoom();
        updateLightbox();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function updateLightbox() {
        lbImg.src = lbImages[currentIndex];
        lbCounter.textContent = (currentIndex + 1) + ' / ' + lbImages.length;
        lbPrev.classList.toggle('hidden', currentIndex === 0);
        lbNext.classList.toggle('hidden', currentIndex === lbImages.length - 1);
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        resetZoom();
    }

    function goTo(index) {
        if (index < 0 || index >= lbImages.length) return;
        currentIndex = index;
        resetZoom();
        updateLightbox();
    }

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click',  () => goTo(currentIndex - 1));
    lbNext.addEventListener('click',  () => goTo(currentIndex + 1));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });

    // ── SWIPE TACTILE ────────────────────────────────────────────
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTx = 0;
    let touchStartTy = 0;
    let isSwiping = false;

    overlay.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        touchStartX  = e.touches[0].clientX;
        touchStartY  = e.touches[0].clientY;
        touchStartTx = tx;
        touchStartTy = ty;
        isSwiping    = false;
    }, { passive: true });

    overlay.addEventListener('touchmove', function(e) {
        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        if (zoomLevel > 1) {
            // Mode pan : déplacer l'image
            tx = touchStartTx + dx;
            ty = touchStartTy + dy;
            applyTransform(false);
            e.preventDefault();
        } else {
            // Mode swipe : bloquer le scroll vertical si le geste est horizontal
            if (Math.abs(dx) > Math.abs(dy)) {
                isSwiping = true;
                e.preventDefault();
            }
        }
    }, { passive: false });

    overlay.addEventListener('touchend', function(e) {
        if (!isSwiping || zoomLevel > 1) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const THRESHOLD = 50; // px minimum pour valider le swipe
        if (dx < -THRESHOLD)      goTo(currentIndex + 1);  // swipe gauche → suivant
        else if (dx > THRESHOLD)  goTo(currentIndex - 1);  // swipe droite → précédent
        isSwiping = false;
    }, { passive: true });
    document.addEventListener('keydown', function(e) {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
        if (e.key === 'ArrowRight') goTo(currentIndex + 1);
        if (e.key === 'Escape')     closeLightbox();
        if (e.key === '+' || e.key === '=') { const c = overlayCenter(); zoomAtPoint(c.x, c.y, ZOOM_STEP); }
        if (e.key === '-')                  { const c = overlayCenter(); zoomAtPoint(c.x, c.y, 1 / ZOOM_STEP); }
    });

    const presentationSelectors = [
        '.pgm img', '.pgb1 img', '.pgb2 img', '.pgb3 img', '.pdh img', '.pdb img'
    ];
    const presentationImages = [];
    presentationSelectors.forEach(sel => {
        const img = document.querySelector(sel);
        if (img) presentationImages.push(img.src);
    });
    // Clics sur les photos de la page → ouvre la galerie grille
    presentationSelectors.forEach((sel, i) => {
        const img = document.querySelector(sel);
        if (img) img.addEventListener('click', () => {
            if (galleryModal) openGallery();
            else openLightbox(presentationImages, i);
        });
    });

    // Lien "Voir toutes les photos" inséré après .presentation
    const presentation = document.querySelector('.presentation');
    if (presentation) {
        const galleryLink = document.createElement('button');
        galleryLink.className = 'gallery-link';
        galleryLink.textContent = 'Voir toutes les photos';
        presentation.parentNode.insertBefore(galleryLink, presentation.nextSibling);
        galleryLink.addEventListener('click', openGallery);
    }

});
