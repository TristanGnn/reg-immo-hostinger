const { createClient } = supabase;
const db = createClient('https://xhldtqnttctntopqklsu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGR0cW50dGN0bnRvcHFrbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDY0NTMsImV4cCI6MjA5MjY4MjQ1M30.JDSGjKc_rxS04He_ms7r4P6zLiktk7VhiHbnO4JDmr8');

// GUARD SESSION — redirige vers login si pas de session active
db.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
        window.location.href = './login.html';
    } else {
        document.body.style.visibility = 'visible';
    }
});

// LOGOUT
document.getElementById('btn-logout').addEventListener('click', async () => {
    await db.auth.signOut();
    window.location.href = './login.html';
});

// ELEMENTS
const form = document.getElementById('bien-form');
const formTitre = document.getElementById('form-titre');
const btnSubmit = document.getElementById('btn-submit');
const btnAnnuler = document.getElementById('btn-annuler');
const listeBiens = document.getElementById('liste-biens');

// IMAGES
let imagesData = {};
let pendingFiles = {};   // fichiers locaux en attente d'upload (nouveau bien)
let activeSlot = null;
let folderKey = null;    // défini après création du bien
// FIX: évite d'écraser les images en base si l'utilisateur ne les a pas modifiées pendant une édition
let imagesModifiedByUser = false;

function slugifier(texte) {
    return texte.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
}

function construireFolderKey(titre, id) {
    return `bien-${slugifier(titre)}-${id}`;
}

function activerSlot(slot) {
    // Si clic sur croix, on ignore (géré par supprimerSlot)
    document.querySelectorAll('.img-slot').forEach(s => s.classList.remove('active'));
    activeSlot = slot;
    const slotEl = document.querySelector(`.img-slot[data-slot="${slot}"]`);
    if (slotEl) slotEl.classList.add('active');

    const hint = document.getElementById('img-hint');
    if (hint) hint.textContent = '— Ctrl+V pour coller l\'image';
}

function ouvrirExplorateur(slot) {
    activerSlot(slot);
    const input = document.getElementById('img-file-input');
    input.value = '';
    input.onchange = async function() {
        const file = input.files[0];
        if (file) await uploadEtSet(file, slot);
        input.onchange = null;
    };
    input.click();
}

function desactiverSlots() {
    document.querySelectorAll('.img-slot').forEach(s => s.classList.remove('active'));
    activeSlot = null;
    const hint = document.getElementById('img-hint');
    if (hint) hint.textContent = '— cliquer une case puis Ctrl+V';
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.img-slot') && !e.target.closest('.img-slot-del')) {
        desactiverSlots();
    }
});

document.addEventListener('paste', async function(e) {
    if (!activeSlot) return;
    e.preventDefault();

    const items = e.clipboardData.items;

    // 1. Image dans le presse-papiers (screenshot ou image copiée)
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                await uploadEtSet(file, activeSlot);
                return;
            }
        }
    }

    // 2. Texte collé → si c'est une URL d'image
    const texte = e.clipboardData.getData('text').trim();
    if (texte && texte.startsWith('http')) {
        imagesData[activeSlot] = texte;
        setSlotImage(activeSlot, texte);
        imagesModifiedByUser = true; // FIX: l'utilisateur a collé une URL d'image
        desactiverSlots();
    }
});

async function uploadEtSet(file, slot) {
    const bienId = document.getElementById('bien-id').value;

    if (!bienId) {
        // Nouveau bien : aperçu local, upload différé
        pendingFiles[slot] = file;
        const preview = URL.createObjectURL(file);
        setSlotImage(slot, preview);
        imagesModifiedByUser = true;
        desactiverSlots();
        return;
    }

    // Modification : on a l'ID, upload direct
    const slotEl = document.querySelector(`.img-slot[data-slot="${slot}"]`);
    if (slotEl) slotEl.classList.add('loading');
    const url = await uploaderFichier(file, slot, folderKey);
    if (slotEl) slotEl.classList.remove('loading');
    if (!url) return;
    imagesData[slot] = url;
    setSlotImage(slot, url);
    imagesModifiedByUser = true; // FIX: l'utilisateur a ajouté/remplacé une image
    desactiverSlots();
}

async function uploaderFichier(file, slot, folder) {
    // Vérifier que la session est toujours valide avant d'uploader
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        afficherErreur('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => { window.location.href = './login.html'; }, 1500);
        return null;
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filename = `${folder}/${slot}.${ext}`;
    const { error } = await db.storage.from('image-biens').upload(filename, file, { cacheControl: '3600', upsert: true });
    if (error) { afficherErreur('Upload échoué : ' + error.message); return null; }
    const { data } = db.storage.from('image-biens').getPublicUrl(filename);
    return data.publicUrl;
}

function setSlotImage(slot, url) {
    const slotEl = document.querySelector(`.img-slot[data-slot="${slot}"]`);
    if (!slotEl) return;
    const img = slotEl.querySelector('.img-slot-preview');
    img.src = url;
    img.style.display = 'block';
    slotEl.classList.add('has-img');
}

// Vide un slot visuellement et dans imagesData (utilisé par supprimerSlot et reinitialiserFormulaire)
function viderSlot(slot) {
    delete imagesData[slot];
    delete pendingFiles[slot];
    const slotEl = document.querySelector(`.img-slot[data-slot="${slot}"]`);
    if (!slotEl) return;
    const img = slotEl.querySelector('.img-slot-preview');
    img.src = '';
    img.style.display = 'none';
    slotEl.classList.remove('has-img', 'active');
    if (activeSlot === slot) activeSlot = null;
}

function supprimerSlot(e, slot) {
    e.preventDefault();
    e.stopPropagation();
    viderSlot(slot);
    imagesModifiedByUser = true;
}

// CHARGER LES BIENS
function chargerBiens() {
    db.from('biens').select('*').then(({ data: biens, error }) => {
        if (error) { afficherErreur('Impossible de charger les biens. ' + error.message); return; }
        listeBiens.innerHTML = '';
        biens.forEach(bien => {
            const ligne = document.createElement('div');
            ligne.className = 'bien-ligne';
            const estVendu = bien.statut === 'vendu';
            ligne.innerHTML = `
                ${bien.images?.pgm ? `<img class="bien-thumb" src="${bien.images.pgm}" alt="">` : '<div class="bien-thumb bien-thumb--vide"></div>'}
                <div class="bien-info">
                    <strong>${bien.titre}</strong>
                    <span>${Number(bien.prix).toLocaleString('fr-FR')} €</span>
                    <span>${bien.statut}</span>
                </div>
                <div class="bien-actions">
                    <button onclick="modifierBien(${bien.id})">Modifier</button>
                    ${estVendu
                        ? `<button class="btn-remettre" onclick="remettreEnVente(${bien.id})">Remettre en vente</button>
                           <button class="btn-archiver" onclick="archiverBien(${bien.id})">Archiver</button>`
                        : `<button class="btn-vendu" onclick="marquerVendu(${bien.id})">Vendu</button>
                           <button class="btn-supprimer" onclick="supprimerBien(${bien.id})">Supprimer</button>`
                    }
                </div>
            `;
            listeBiens.appendChild(ligne);
        });
    });
}

// SOUMETTRE LE FORMULAIRE (créer ou modifier)
form.addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('bien-id').value;
    const titre = document.getElementById('titre').value;
    const donnees = {
        titre,
        prix: parseInt(document.getElementById('prix').value.replace(/\s/g, '')),
        chambres: parseInt(document.getElementById('chambres').value),
        metres_carres: parseInt(document.getElementById('metres_carres').value),
        salles_de_bains: parseInt(document.getElementById('salles_de_bains').value),
        description: document.getElementById('description').value || null,
        statut: document.getElementById('statut').value,
        hauteur: document.getElementById('hauteur').value ? parseFloat(document.getElementById('hauteur').value) : null,
        pieces: getPieces()
    };

    if (id) {
        // MODIFICATION — images déjà uploadées dans folderKey
        // FIX: n'écraser images en base que si l'utilisateur les a modifiées — évite d'éffacer les photos existantes si seul le prix change
        if (imagesModifiedByUser) {
            donnees.images = Object.keys(imagesData).length ? imagesData : null;
        }
        const { error } = await db.from('biens').update(donnees).eq('id', id);
        if (error) { afficherErreur('Échec de la sauvegarde. ' + error.message); return; }
        afficherSucces('Bien modifié avec succès');
    } else {
        // CRÉATION — insérer d'abord, puis uploader les images
        const { data, error } = await db.from('biens').insert([{ ...donnees, images: null }]).select().single();
        if (error) { afficherErreur('Échec de la sauvegarde. ' + error.message); return; }

        const newId = data.id;
        folderKey = construireFolderKey(titre, newId);

        // Uploader les fichiers en attente
        if (Object.keys(pendingFiles).length > 0) {
            for (const [slot, file] of Object.entries(pendingFiles)) {
                const url = await uploaderFichier(file, slot, folderKey);
                if (url) imagesData[slot] = url;
            }
            pendingFiles = {};
            await db.from('biens').update({ images: imagesData }).eq('id', newId);
        }

        // Sauvegarder aussi les URLs collées directement
        const urlsDirectes = Object.fromEntries(
            Object.entries(imagesData).filter(([, v]) => v && v.startsWith('http'))
        );
        if (Object.keys(urlsDirectes).length > 0) {
            await db.from('biens').update({ images: { ...imagesData } }).eq('id', newId);
        }
        afficherSucces('Bien ajouté avec succès');
    }

    reinitialiserFormulaire();
    chargerBiens();
});

// PASSER EN MODE MODIFICATION
function modifierBien(id) {
    db.from('biens').select('*').eq('id', id).single().then(({ data: bien, error }) => {
        if (error) { afficherErreur('Impossible de charger le bien. ' + error.message); return; }

        document.getElementById('bien-id').value = bien.id;
        document.getElementById('titre').value = bien.titre;
        document.getElementById('prix').value = bien.prix;
        document.getElementById('chambres').value = bien.chambres;
        document.getElementById('metres_carres').value = bien.metres_carres;
        document.getElementById('salles_de_bains').value = bien.salles_de_bains;
        document.getElementById('statut').value = bien.statut;
        document.getElementById('hauteur').value = bien.hauteur || '';
        document.getElementById('description').value = bien.description || '';
        if (bien.pieces) {
            setLignes('surfaces-liste', 'cadre-surfaces', bien.pieces.surfaces);
            setLignes('hauteurs-liste', 'cadre-hauteurs', bien.pieces.hauteurs);
        }

        imagesData = bien.images ? { ...bien.images } : {};
        folderKey = construireFolderKey(bien.titre, bien.id);
        // FIX: réinitialise le flag — les images viennent d'être chargées depuis la base, non modifiées par l'utilisateur
        imagesModifiedByUser = false;
        // FIX: efface tous les slots d'abord pour éviter que des images d'une édition précédente persistent
        ['pgm','pgb1','pgb2','pgb3','pdh','pdb'].forEach(slot => {
            const slotEl = document.querySelector(`.img-slot[data-slot="${slot}"]`);
            if (!slotEl) return;
            const img = slotEl.querySelector('.img-slot-preview');
            img.src = '';
            img.style.display = 'none';
            slotEl.classList.remove('has-img', 'active');
        });
        ['pgm','pgb1','pgb2','pgb3','pdh','pdb'].forEach(slot => {
            if (imagesData[slot]) setSlotImage(slot, imagesData[slot]);
        });

        formTitre.textContent = 'Modifier le bien';
        btnSubmit.textContent = 'Enregistrer';
        btnAnnuler.style.display = 'inline-block';
    });
}

// REMETTRE EN VENTE
function remettreEnVente(id) {
    db.from('biens').update({ statut: 'à vendre' }).eq('id', id).then(({ error }) => {
        if (error) { afficherErreur('Impossible de remettre en vente. ' + error.message); return; }
        chargerBiens();
    });
}

// MARQUER VENDU
function marquerVendu(id) {
    if (!confirm('Marquer ce bien comme vendu ?')) return;
    db.from('biens').update({ statut: 'vendu' }).eq('id', id).then(({ error }) => {
        if (error) { afficherErreur('Impossible de marquer comme vendu. ' + error.message); return; }
        chargerBiens();
    });
}

// ARCHIVER
async function archiverBien(id) {
    if (!confirm('Archiver ce bien ? Il disparaîtra du site.')) return;

    const { data: bien, error: errGet } = await db.from('biens').select('*').eq('id', id).single();
    if (errGet) { afficherErreur('Impossible de récupérer le bien. ' + errGet.message); return; }

    const { error: errInsert } = await db.from('biens_archives').insert([bien]);
    if (errInsert) { afficherErreur('Impossible d\'archiver le bien. ' + errInsert.message); return; }

    const { error: errDelete } = await db.from('biens').delete().eq('id', id);
    if (errDelete) { afficherErreur('Impossible de supprimer le bien après archivage. ' + errDelete.message); return; }

    chargerBiens();
}

// SUPPRIMER
function supprimerBien(id) {
    if (!confirm('Supprimer définitivement ? Ce bien sera perdu pour toujours.')) return;
    db.from('biens').delete().eq('id', id).then(({ error }) => {
        if (error) { afficherErreur('Impossible de supprimer le bien. ' + error.message); return; }
        chargerBiens();
    });
}

// RÉINITIALISER LE FORMULAIRE
function reinitialiserFormulaire() {
    form.reset();
    document.getElementById('bien-id').value = '';
    document.getElementById('surfaces-liste').innerHTML = '';
    document.getElementById('hauteurs-liste').innerHTML = '';
    document.getElementById('cadre-surfaces').style.display = 'none';
    document.getElementById('cadre-hauteurs').style.display = 'none';
    imagesData = {};
    pendingFiles = {};
    folderKey = null;
    ['pgm','pgb1','pgb2','pgb3','pdh','pdb'].forEach(slot => viderSlot(slot));
    imagesModifiedByUser = false;
    formTitre.textContent = 'Ajouter un bien';
    btnSubmit.textContent = 'Ajouter';
    btnAnnuler.style.display = 'none';
}

// DETAILS PIECES
document.getElementById('toggle-surfaces').addEventListener('click', () => {
    const cadre = document.getElementById('cadre-surfaces');
    cadre.style.display = cadre.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('toggle-hauteurs').addEventListener('click', () => {
    const cadre = document.getElementById('cadre-hauteurs');
    cadre.style.display = cadre.style.display === 'none' ? 'block' : 'none';
});

function ajouterLigne(listeId, type, nom = '', valeur = '') {
    const liste = document.getElementById(listeId);
    const ligne = document.createElement('div');
    ligne.className = 'piece-ligne';
    ligne.innerHTML = `
        <input type="text" placeholder="Pièce (ex: Cuisine)" value="${nom}">
        <input type="text" placeholder="${type === 'surface' ? 'Surface (ex: 25m²)' : 'Hauteur (ex: 2.5m)'}" value="${valeur}">
        <button type="button" class="btn-retirer-piece" onclick="this.parentElement.remove()">✕</button>
    `;
    liste.appendChild(ligne);
}

function getLignes(listeId) {
    const lignes = document.querySelectorAll(`#${listeId} .piece-ligne`);
    const result = {};
    lignes.forEach(ligne => {
        const inputs = ligne.querySelectorAll('input');
        const nom = inputs[0].value.trim();
        const val = inputs[1].value.trim();
        if (nom) result[nom] = val;
    });
    return Object.keys(result).length ? result : null;
}

function setLignes(listeId, cadreId, data) {
    document.getElementById(listeId).innerHTML = '';
    if (!data) return;
    const type = listeId === 'surfaces-liste' ? 'surface' : 'hauteur';
    document.getElementById(cadreId).style.display = 'block';
    Object.entries(data).forEach(([nom, val]) => ajouterLigne(listeId, type, nom, val));
}

function getPieces() {
    return {
        surfaces: getLignes('surfaces-liste'),
        hauteurs: getLignes('hauteurs-liste')
    };
}

btnAnnuler.addEventListener('click', reinitialiserFormulaire);

// FORMAT PRIX
const inputPrix = document.getElementById('prix');
inputPrix.addEventListener('input', () => {
    const chiffres = inputPrix.value.replace(/\D/g, '');
    inputPrix.value = chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
});

// AFFICHER UNE ERREUR
function afficherErreur(message) {
    let banner = document.getElementById('erreur-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'erreur-banner';
        banner.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#c0392b;color:#fff;padding:12px 28px;border-radius:6px;z-index:9999;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.2);';
        document.body.appendChild(banner);
    }
    banner.textContent = message;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 5000);
}

// AFFICHER UN SUCCÈS
function afficherSucces(message) {
    let toast = document.getElementById('succes-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'succes-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a7a4a;color:#fff;padding:12px 28px;border-radius:6px;z-index:9999;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="font-size:1.1rem">✓</span> ${message}`;
    toast.style.display = 'flex';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// CHARGER LES ARCHIVES
function chargerArchives() {
    db.from('biens_archives').select('*').order('id', { ascending: false }).then(({ data: archives, error }) => {
        const liste = document.getElementById('liste-archives');
        const count = document.getElementById('archives-count');
        if (error) { liste.innerHTML = '<p class="archives-empty">Erreur de chargement.</p>'; return; }

        count.textContent = archives ? archives.length : 0;

        if (!archives || archives.length === 0) {
            liste.innerHTML = '<p class="archives-empty">Aucun bien archivé.</p>';
            return;
        }

        liste.innerHTML = '';
        archives.forEach(bien => {
            const ligne = document.createElement('div');
            ligne.className = 'archive-ligne';
            ligne.innerHTML = `
                <div class="archive-info">
                    <span class="archive-badge">${bien.statut ? bien.statut.toUpperCase() : 'VENDU'}</span>
                    <strong>${bien.titre}</strong>
                    <span>${Number(bien.prix).toLocaleString('fr-FR')} €</span>
                    <span>${bien.chambres} ch. · ${bien.metres_carres} m² · ${bien.salles_de_bains} sdb</span>
                </div>
                <div class="archive-actions">
                    <button class="btn-restaurer" onclick="restaurerBien(${bien.id})">Remettre en vente</button>
                    <button class="btn-supprimer-archive" onclick="supprimerArchive(${bien.id})">Supprimer</button>
                </div>
            `;
            liste.appendChild(ligne);
        });
    });
}

// RESTAURER UN BIEN ARCHIVÉ
async function restaurerBien(id) {
    if (!confirm('Remettre ce bien en vente ?')) return;

    const { data: bien, error: errGet } = await db.from('biens_archives').select('*').eq('id', id).single();
    if (errGet) { afficherErreur('Impossible de récupérer le bien. ' + errGet.message); return; }

    const bienRestauré = { ...bien, statut: 'à vendre' };
    delete bienRestauré.id;

    const { error: errInsert } = await db.from('biens').insert([bienRestauré]);
    if (errInsert) { afficherErreur('Impossible de restaurer le bien. ' + errInsert.message); return; }

    const { error: errDelete } = await db.from('biens_archives').delete().eq('id', id);
    if (errDelete) { afficherErreur('Bien restauré mais non supprimé des archives. ' + errDelete.message); return; }

    chargerBiens();
    chargerArchives();
}

// SUPPRIMER DÉFINITIVEMENT UNE ARCHIVE
function supprimerArchive(id) {
    if (!confirm('Supprimer définitivement ce bien des archives ? Cette action est irréversible.')) return;
    db.from('biens_archives').delete().eq('id', id).then(({ error }) => {
        if (error) { afficherErreur('Impossible de supprimer. ' + error.message); return; }
        chargerArchives();
    });
}

chargerBiens();
chargerArchives();
