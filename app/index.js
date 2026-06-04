        const { createClient } = supabase;
        const db = createClient('https://xhldtqnttctntopqklsu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGR0cW50dGN0bnRvcHFrbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDY0NTMsImV4cCI6MjA5MjY4MjQ1M30.JDSGjKc_rxS04He_ms7r4P6zLiktk7VhiHbnO4JDmr8');

        document.addEventListener('DOMContentLoaded', function() {
            // HAMBURGER
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

            // HEADER SCROLL
            function updateHeader() {
                header.classList.toggle('scrolled', window.scrollY > 60);
            }
            window.addEventListener('scroll', updateHeader, { passive: true });
            updateHeader();

            // SCROLL REVEAL
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('visible');
                });
            }, { threshold: 0.12 });

            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

            // ESTIMATION WIDGET
            const estimBtn = document.querySelector('.estim-btn');
            if (estimBtn) {
                estimBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const type = document.querySelector('.estim-input[type="text"]')
                        ? '' : '';
                    const selectType = document.querySelector('select.estim-input');
                    const inputLoc = document.querySelector('input.estim-input');
                    const typeBien = selectType ? selectType.value : '';
                    const localisation = inputLoc ? inputLoc.value.trim() : '';

                    const params = new URLSearchParams();
                    params.set('sujet', 'estimation');
                    if (typeBien) params.set('type', typeBien);
                    if (localisation) params.set('localisation', localisation);

                    window.location.href = `/contact?${params.toString()}`;
                });
            }

            // BLOG TABS
            const tabs     = document.querySelectorAll('.blog-tab');
            const articles = document.querySelectorAll('.blog-article');

            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const i = +this.dataset.tab;
                    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                    articles.forEach(a => a.classList.remove('active'));
                    this.classList.add('active');
                    this.setAttribute('aria-selected', 'true');
                    articles[i].classList.add('active');
                });
            });

            // BIENS
            const template = document.getElementById('card-template');
            const container = document.querySelector('.biens');
            const biensSection = document.getElementById('biens-section');

            db.from('biens').select('*').then(({ data: biens, error }) => {
                    if (error || !biens || biens.length === 0) return;

                    container.innerHTML = '';
                    biens.forEach((bien, i) => {
                        const card = template.content.cloneNode(true);

                        card.querySelector('.proposition').textContent = bien.titre;
                        card.querySelector('.cout').textContent = Number(bien.prix).toLocaleString('fr-FR') + ' €';
                        card.querySelector('.card-badge').textContent = bien.statut.toUpperCase();
                        card.querySelector('.nbre-chambres').textContent = bien.chambres;
                        card.querySelector('.nbre-m2').textContent = bien.metres_carres;
                        card.querySelector('.nbre-sdb').textContent = bien.salles_de_bains;
                        card.querySelector('a').style.transitionDelay = `${0.1 + i * 0.15}s`;
                        card.querySelector('a').href = `/bien?id=${bien.id}`;
                        const imgEl = card.querySelector('.card-img-wrap img');
                        if (imgEl && bien.images?.pgm) {
                            imgEl.src = bien.images.pgm;
                            imgEl.alt = bien.titre;
                        }

                        container.appendChild(card);
                    });

                    biensSection.style.display = '';

                    // Quand les biens sont visibles : fond beige + carte blanche pour Ilhame
                    const agentSection = document.querySelector('.agent-section');
                    const agentInner = document.querySelector('.agent-inner');
                    if (agentSection) agentSection.style.background = '#f2ede4';
                    if (agentInner) agentInner.style.background = '#faf7f2';

                    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
                });
        });
