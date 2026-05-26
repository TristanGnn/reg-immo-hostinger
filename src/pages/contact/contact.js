document.addEventListener('DOMContentLoaded', function() {
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

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // PRÉ-REMPLISSAGE DEPUIS L'ESTIMATION
    const urlParams = new URLSearchParams(window.location.search);
    const sujetParam = urlParams.get('sujet');
    const typeParam = urlParams.get('type');
    const localisationParam = urlParams.get('localisation');

    if (sujetParam) {
        const sujetSelect = document.getElementById('sujet');
        if (sujetSelect) sujetSelect.value = sujetParam;

        if (sujetParam === 'estimation') {
            const messageEl = document.getElementById('message');
            if (messageEl) {
                let msg = 'Bonjour,\n\nJe souhaite obtenir une estimation gratuite pour mon bien';
                if (typeParam) msg += ` de type "${typeParam}"`;
                if (localisationParam) msg += ` situé à ${localisationParam}`;
                msg += '.\n\nMerci de me recontacter.';
                messageEl.value = msg;
            }

            const formSection = document.querySelector('.contact-form-section') || document.getElementById('contactForm');
            if (formSection) {
                setTimeout(() => formSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
            }
        }
    }

    const EDGE_FUNCTION_URL = 'https://xhldtqnttctntopqklsu.supabase.co/functions/v1/send-contact';

    const form       = document.getElementById('contactForm');
    const successBox = document.getElementById('formSuccess');
    const submitBtn  = form ? form.querySelector('.form-submit') : null;

    function afficherErreurChamp(el, message) {
        el.style.borderColor = 'rgba(200, 60, 60, 0.7)';
        let errEl = el.parentElement.querySelector('.field-error');
        if (!errEl) {
            errEl = document.createElement('span');
            errEl.className = 'field-error';
            errEl.style.cssText = 'color:#c83c3c;font-size:0.78rem;margin-top:4px;display:block;';
            el.parentElement.appendChild(errEl);
        }
        errEl.textContent = message;
    }

    function effacerErreurChamp(el) {
        el.style.borderColor = '';
        const errEl = el.parentElement.querySelector('.field-error');
        if (errEl) errEl.remove();
    }

    function validerFormulaire() {
        const prenom    = document.getElementById('prenom');
        const nom       = document.getElementById('nom');
        const email     = document.getElementById('email');
        const telephone = document.getElementById('telephone');
        const message   = document.getElementById('message');
        let valid = true;

        if (!prenom.value.trim() || prenom.value.trim().length < 2) {
            afficherErreurChamp(prenom, 'Prénom requis (2 caractères minimum).');
            valid = false;
        } else { effacerErreurChamp(prenom); }

        if (!nom.value.trim() || nom.value.trim().length < 2) {
            afficherErreurChamp(nom, 'Nom requis (2 caractères minimum).');
            valid = false;
        } else { effacerErreurChamp(nom); }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
            afficherErreurChamp(email, 'Adresse email invalide.');
            valid = false;
        } else { effacerErreurChamp(email); }

        if (!telephone.value.trim() || telephone.value.trim().length < 6) {
            afficherErreurChamp(telephone, 'Numéro de téléphone requis.');
            valid = false;
        } else { effacerErreurChamp(telephone); }

        if (!message.value.trim() || message.value.trim().length < 10) {
            afficherErreurChamp(message, 'Message requis (10 caractères minimum).');
            valid = false;
        } else { effacerErreurChamp(message); }

        return valid;
    }

    if (form) {
        // Effacer les erreurs au fur et à mesure que l'utilisateur corrige
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(el => {
            el.addEventListener('input', function() { effacerErreurChamp(this); });
        });

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validerFormulaire()) return;

            // État de chargement
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours…';

            try {
                const res = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prenom:    document.getElementById('prenom').value.trim(),
                        nom:       document.getElementById('nom').value.trim(),
                        email:     document.getElementById('email').value.trim(),
                        telephone: document.getElementById('telephone').value.trim(),
                        sujet:     document.getElementById('sujet').value,
                        message:   document.getElementById('message').value.trim(),
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Erreur serveur.');
                }

                // Succès
                form.style.display = 'none';
                successBox.style.display = 'flex';

            } catch (err) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer le message';

                let errBanner = document.getElementById('form-error-banner');
                if (!errBanner) {
                    errBanner = document.createElement('p');
                    errBanner.id = 'form-error-banner';
                    errBanner.style.cssText = 'color:#c83c3c;font-size:0.85rem;margin-top:12px;text-align:center;';
                    submitBtn.parentElement.appendChild(errBanner);
                }
                errBanner.textContent = err.message || 'Une erreur est survenue. Veuillez réessayer.';
            }
        });
    }
});
