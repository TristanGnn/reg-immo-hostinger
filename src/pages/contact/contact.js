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

    const form = document.getElementById('contactForm');
    const successBox = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const fields = [
                { el: document.getElementById('prenom') },
                { el: document.getElementById('nom') },
                { el: document.getElementById('email') },
                { el: document.getElementById('telephone') },
                { el: document.getElementById('message') }
            ];

            let valid = true;
            fields.forEach(({ el }) => {
                if (!el.value.trim()) {
                    el.style.borderColor = 'rgba(200, 60, 60, 0.7)';
                    valid = false;
                } else {
                    el.style.borderColor = '';
                }
            });

            if (!valid) return;

            form.style.display = 'none';
            successBox.classList.add('visible');
        });

        document.querySelectorAll('.form-group input, .form-group textarea').forEach(el => {
            el.addEventListener('input', function() {
                this.style.borderColor = '';
            });
        });
    }
});
