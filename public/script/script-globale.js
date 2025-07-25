// public/script/auth-check.js
// Script per verificare lo stato di autenticazione e aggiornare l'interfaccia

async function checkAuthStatus()
{
    try {
        const response = await fetch('/api/userinfo',
        {
            credentials: 'include'
        });
        
        if (response.ok)
        {
            const data = await response.json();
            if (data.success)
            {
                // Utente autenticato - aggiorna il bottone
                updateLoginButton(true, data.nome);
                return true;
            }
        }
        
        // Utente non autenticato
        updateLoginButton(false);
        return false;
        
    } catch (error)
    {
        console.error('Errore nel controllo autenticazione:', error);
        updateLoginButton(false);
        return false;
    }
}

function updateLoginButton(isAuthenticated, userName = '')
{
    const loginBtn = document.querySelector('.login-btn');
    
    if (!loginBtn) return;
    
    if (isAuthenticated)
    {
        // Cambia testo e destinazione per utenti autenticati
        loginBtn.textContent = 'Area Personale';
        loginBtn.href = '/private/restricted.html';
        loginBtn.title = `Benvenuto, ${userName}`;
    } else
    {
        // Ripristina stato originale per utenti non autenticati
        loginBtn.textContent = 'Login';
        loginBtn.href = '/accesso.html';
        loginBtn.title = 'Accedi al tuo account';
    }
}

// Inizializza il controllo dello stato al caricamento della pagina
document.addEventListener('DOMContentLoaded', function()
{
    checkAuthStatus();
});