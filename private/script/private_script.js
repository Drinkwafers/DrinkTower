window.onload = async function () {

    try {
        const res = await fetch("/private/restricted.html");
        if (res.status === 401) {
            window.location.href = "/accesso.html";
            return;
        }
        const data = await res.text();
        document.body.innerHTML = data;

        // Visualizzo il nome utente
        const userRes = await fetch("/api/userinfo", {
            credentials: "include"
        });
        const userData = await userRes.json();
        if (userData.success) {
            document.getElementById("userName").textContent = userData.nome;
        }

        if (userData.admin)
        {
            // Mostro l'area admin se l'utente è admin
            const areaAdmin = document.getElementById("area-admin");
            areaAdmin.innerHTML = `
                <h2>Area Admin</h2>
                <ul>
                    <li><a href="/admin/aggiungi-eventi.html">Gestione Eventi</a></li>
                </ul>`;
        }
        // Carico le prenotazioni dell'utente
        await caricaPrenotazioniUtente();

        // Inizializzo il form per modifica password
        inizializzaModificaPassword();

    }
    catch (err) {
        console.error("Errore fetch pagina protetta:", err);
    }

    // Gestione logout
    const btn = document.getElementById("logoutBtn");
    btn.addEventListener("click", async function logout() {
        try {
            const res = await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                window.location.href = "/index.html";
            } else {
                console.error("Errore nel logout");
            }
        } catch (err) {
            console.error("Errore nella richiesta di logout:", err);
        }
    });
};

// Funzione per caricare le prenotazioni dell'utente
async function caricaPrenotazioniUtente() {
    try {
        const response = await fetch('/api/eventi-utente', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Errore nel caricamento delle prenotazioni');
        }
        
        const data = await response.json();
        
        if (data.success) {
            mostraPrenotazioniUtente(data.eventi);
        } else {
            console.error("Errore nel caricamento prenotazioni:", data.message);
        }
        
    } catch (error) {
        console.error("Errore nel caricamento prenotazioni utente:", error);
        const prenotazioniLista = document.getElementById("lista-prenotazioni-utente");
        if (prenotazioniLista) {
            prenotazioniLista.innerHTML = '<li>Errore nel caricamento delle prenotazioni.</li>';
        }
    }
}

// Funzione per mostrare le prenotazioni dell'utente nell'interfaccia
function mostraPrenotazioniUtente(eventi) {
    const prenotazioniLista = document.getElementById("lista-prenotazioni-utente");
    
    if (!prenotazioniLista) {
        console.warn("Lista prenotazioni non trovata");
        return;
    }
    
    if (eventi.length === 0) {
        prenotazioniLista.innerHTML = '<li class="nessuna-prenotazione">Non hai ancora prenotazioni.</li>';
        return;
    }
    
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    
    // Ordina eventi per data
    eventi.sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));
    
    let html = '';
    
    eventi.forEach(evento => {
        const dataEvento = new Date(evento.data_evento);
        dataEvento.setHours(0, 0, 0, 0);
        const isFuturo = dataEvento >= oggi;
        
        const dataFormattata = dataEvento.toLocaleDateString('it-IT', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        const bottoneDisiscriviti = isFuturo ? 
            `<button class="btn-disiscrivi" data-evento-id="${evento.id}" data-evento-nome="${evento.nome}">
                Annulla
            </button>` : 
            '<span class="evento-concluso">Concluso</span>';
        
        html += `
            <li class="prenotazione-item ${isFuturo ? 'futuro' : 'passato'}">
                <div class="prenotazione-info">
                    <strong>${evento.nome}</strong>
                    <span class="data-evento">${dataFormattata} - ${evento.ora_evento}</span>
                </div>
                <div class="prenotazione-azioni">
                    <a href="/info?id=${evento.id}" class="link-dettagli">Dettagli</a>
                    ${bottoneDisiscriviti}
                </div>
            </li>
        `;
    });
    
    prenotazioniLista.innerHTML = html;
    
    // Aggiungi event listeners per i bottoni di disiscrizione
    aggiungiEventListenerDisiscrizione();
}

// Funzione per aggiungere event listeners ai bottoni di disiscrizione
function aggiungiEventListenerDisiscrizione() {
    const bottoniDisiscrizione = document.querySelectorAll('.btn-disiscrivi');
    
    bottoniDisiscrizione.forEach(bottone => {
        bottone.addEventListener('click', async function() {
            const eventoId = this.dataset.eventoId;
            const eventoNome = this.dataset.eventoNome;
            
            if (confirm(`Sei sicuro di volerti disiscrivere dall'evento "${eventoNome}"?`)) {
                await disiscriviDaEvento(eventoId);
            }
        });
    });
}

// Funzione per disiscriversi da un evento
async function disiscriviDaEvento(eventoId) {
    try {
        const response = await fetch('/api/disiscrivi-evento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ eventoId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Ti sei disiscritto con successo dall\'evento!');
            // Ricarica le prenotazioni
            await caricaPrenotazioniUtente();
        } else {
            alert('Errore: ' + data.message);
        }
        
    } catch (error) {
        console.error('Errore nella disiscrizione:', error);
        alert('Si è verificato un errore durante la disiscrizione.');
    }
}

// Funzione helper per mostrare messaggi
function mostraMessaggio(testo, tipo) {
    const messaggioEl = document.getElementById("messaggio-modifica");
    messaggioEl.textContent = testo;
    messaggioEl.className = tipo; // "successo" o "errore"
}