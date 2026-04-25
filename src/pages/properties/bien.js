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

    const overlay   = document.getElementById('lightbox');
    const lbImg     = document.getElementById('lightboxImg');
    const lbClose   = document.getElementById('lightboxClose');
    const lbPrev    = document.getElementById('lightboxPrev');
    const lbNext    = document.getElementById('lightboxNext');
    const lbCounter = document.getElementById('lightboxCounter');
    let lbImages    = [];
    let currentIndex = 0;

    function openLightbox(images, index) {
        lbImages     = images;
        currentIndex = index;
        lbImg.src    = lbImages[currentIndex];
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
    }

    function goTo(index) {
        if (index < 0 || index >= lbImages.length) return;
        currentIndex = index;
        updateLightbox();
    }

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => goTo(currentIndex - 1));
    lbNext.addEventListener('click', () => goTo(currentIndex + 1));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', function(e) {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
        if (e.key === 'ArrowRight') goTo(currentIndex + 1);
        if (e.key === 'Escape')     closeLightbox();
    });

    const presentationSelectors = [
        '.pgm img', '.pgb1 img', '.pgb2 img', '.pgb3 img', '.pdh img', '.pdb img'
    ];
    const presentationImages = [];
    presentationSelectors.forEach(sel => {
        const img = document.querySelector(sel);
        if (img) presentationImages.push(img.src);
    });
    presentationSelectors.forEach((sel, i) => {
        const img = document.querySelector(sel);
        if (img) img.addEventListener('click', () => openLightbox(presentationImages, i));
    });

    const pgh = document.querySelector('.pgh');
    if (pgh) {
        const container = document.createElement('div');
        container.className = 'pgh-container';
        pgh.parentNode.insertBefore(container, pgh);
        container.appendChild(pgh);

        const galleryBtn = document.createElement('button');
        galleryBtn.className = 'gallery-btn';
        galleryBtn.innerHTML = '<span>Galerie<br>Photos</span>';
        container.appendChild(galleryBtn);

        const modal = document.createElement('div');
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <span class="gallery-close">&times;</span>
            <div class="gallery-modal-content">
                <div class="gallery-grid">
                    <div class="gallery-item"><img src="../../../assets/images/g (7).png" alt="Photo 1"></div>
                    <div class="gallery-item"><img src="../../../assets/images/g (1).png" alt="Photo 2"></div>
                    <div class="gallery-item"><img src="../../../assets/images/g (2).png" alt="Photo 3"></div>
                    <div class="gallery-item"><img src="../../../assets/images/g (3).png" alt="Photo 4"></div>
                    <div class="gallery-item"><img src="../../../assets/images/g (4).png" alt="Photo 5"></div>
                    <div class="gallery-item"><img src="../../../assets/images/g (5).png" alt="Photo 6"></div>
                    <div class="gallery-item"><img src="../../../assets/images/g (6).png" alt="Photo 6"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        galleryBtn.addEventListener('click', function() {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        modal.querySelector('.gallery-close').addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        modal.addEventListener('click', function(e) {
            const clickedImg = e.target.closest('.gallery-item img');
            if (!clickedImg) return;

            const allImgs   = Array.from(modal.querySelectorAll('.gallery-item img'));
            const galImages = allImgs.map(img => img.src);
            const index     = allImgs.indexOf(clickedImg);

            modal.classList.remove('active');
            openLightbox(galImages, index);
        });

        modal.querySelectorAll('.gallery-item img').forEach(img => {
            img.style.cursor = 'pointer';
        });
    }

});
