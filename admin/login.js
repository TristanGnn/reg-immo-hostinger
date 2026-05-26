const { createClient } = supabase;
const db = createClient(
    'https://xhldtqnttctntopqklsu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGR0cW50dGN0bnRvcHFrbHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMDY0NTMsImV4cCI6MjA5MjY4MjQ1M30.JDSGjKc_rxS04He_ms7r4P6zLiktk7VhiHbnO4JDmr8'
);

// Si déjà connecté → redirect direct vers admin
db.auth.getSession().then(({ data: { session } }) => {
    if (session) window.location.href = './admin.html';
});

// ÉLÉMENTS
const form        = document.getElementById('form-login');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const msg         = document.getElementById('msg-login');
const btn         = document.getElementById('btn-connexion');

// CONNEXION
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passInput.value;

    btn.disabled     = true;
    btn.textContent  = 'Connexion…';
    msg.textContent  = '';
    msg.className    = 'message';

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        // Message générique volontaire — ne pas indiquer si c'est l'email ou le mdp qui est faux
        afficherMsg('Email ou mot de passe incorrect.', 'erreur');
        btn.disabled    = false;
        btn.textContent = 'Se connecter';
        passInput.value = '';
        passInput.focus();
        return;
    }

    afficherMsg('Connexion réussie, redirection…', 'succes');
    setTimeout(() => { window.location.href = './admin.html'; }, 800);
});

function afficherMsg(texte, type) {
    msg.textContent = texte;
    msg.className   = 'message ' + type;
}

// TOGGLE AFFICHAGE MOT DE PASSE
document.getElementById('toggle-password').addEventListener('click', () => {
    const isHidden = passInput.type === 'password';
    passInput.type = isHidden ? 'text' : 'password';
    document.getElementById('icon-eye').style.display     = isHidden ? 'none'  : 'block';
    document.getElementById('icon-eye-off').style.display = isHidden ? 'block' : 'none';
});
