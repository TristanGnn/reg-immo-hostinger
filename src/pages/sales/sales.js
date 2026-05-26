const { createClient } = supabase;
const db = createClient('https://xhldtqnttctntopqklsu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGR0cW50dGN0bnRvcHFrbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDY0NTMsImV4cCI6MjA5MjY4MjQ1M30.JDSGjKc_rxS04He_ms7r4P6zLiktk7VhiHbnO4JDmr8');

document.addEventListener('DOMContentLoaded', function() {

    // HEADER / NAV
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

    // SCROLL REVEAL
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // BIENS
    const template = document.getElementById('card-template');
    const tableau = document.getElementById('tableau');
    const aucunBien = document.getElementById('aucun-bien');
    let tousLesBiens = [];

    db.from('biens').select('*').then(({ data: biens, error }) => {
        if (error) { console.error(error); return; }
        tousLesBiens = biens || [];
        afficherBiens(tousLesBiens);
    });

    function afficherBiens(biens) {
        tableau.innerHTML = '';

        if (!biens || biens.length === 0) {
            aucunBien.style.display = 'block';
            return;
        }

        aucunBien.style.display = 'none';
        biens.forEach((bien, i) => {
            const card = template.content.cloneNode(true);
            const a = card.querySelector('a');
            a.href = `../properties/bien.html?id=${bien.id}`;
            a.style.transitionDelay = `${0.1 + i * 0.15}s`;
            card.querySelector('.vitrine-badge').textContent = bien.statut.toUpperCase();
            card.querySelector('.description').textContent = bien.titre;
            card.querySelector('.prix').textContent = Number(bien.prix).toLocaleString('fr-FR') + ' €';
            card.querySelector('.nbre-chambres').textContent = bien.chambres;
            card.querySelector('.nbre-m2').textContent = bien.metres_carres;
            card.querySelector('.nbre-sdb').textContent = bien.salles_de_bains;
            const imgEl = card.querySelector('img');
            if (imgEl && bien.images?.pgm) {
                imgEl.src = bien.images.pgm;
                imgEl.alt = bien.titre;
            }
            tableau.appendChild(card);
        });

        tableau.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    // FILTRES
    document.querySelector('.search-btn').addEventListener('click', function() {
        const budgetMin = parseFloat(document.querySelectorAll('.search-input')[0].value) || 0;
        const budgetMax = parseFloat(document.querySelectorAll('.search-input')[1].value) || Infinity;
        const typeBien  = document.querySelector('.search-select').value.toLowerCase();
        const secteur   = document.querySelectorAll('.search-input')[2].value.trim().toLowerCase();

        const filtres = tousLesBiens.filter(bien => {
            const prix        = Number(bien.prix);
            const titreLower  = bien.titre.toLowerCase();
            const matchBudget = prix >= budgetMin && prix <= budgetMax;
            const matchType   = !typeBien || titreLower.includes(typeBien);
            const matchSecteur = !secteur || titreLower.includes(secteur);
            return matchBudget && matchType && matchSecteur;
        });

        afficherBiens(filtres);
    });
});
