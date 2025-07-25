let eventoId; // Definisco la variabile nel contesto globale

window.onload = async function() {
    // Ottieni l'ID dell'evento dalla URL
    const urlParams = new URLSearchParams(window.location.search);
    eventoId = urlParams.get('id'); // Assegno alla variabile globale
    
    try
    {
        // Carica i dati dell'evento
        const response = await fetch(`/api/evento/${eventoId}`);
        const data = await response.json();
        
        if (!data.success)
        {
            mostraErrore('L\'evento richiesto non esiste.');
            return;
        }
        
        const evento = data.evento;
        
        // Popola i singoli elementi
        popolaEvento(evento);

        await gestisciBottonePrenotazione(evento.data_evento);

        caricaDescrizione(evento.descrizione);
        
    } catch (error)
    {
        console.error('Errore nel caricamento dell\'evento:', error);
        mostraErrore('Si è verificato un errore nel caricamento dell\'evento.');
    }
};

function popolaEvento(evento)
{
    // Aggiorna il titolo della pagina
    document.title = `DrinkTower - ${evento.nome}`;
    
    // Popola nome evento
    document.getElementById('evento-nome').textContent = evento.nome;
    
    // Formatta e popola la data
    const dataEvento = new Date(evento.data_evento);
    const dataFormattata = dataEvento.toLocaleDateString('it-IT',
    {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('evento-data-formattata').textContent = dataFormattata;
    
    // Popola l'ora
    document.getElementById('evento-ora').textContent = evento.ora_evento;
    
    // Popola numero partecipanti
    document.getElementById('evento-partecipanti').textContent = evento.numero_iscritti;
    
    // Popola immagine copertina
    const immagineCopertina = document.getElementById('evento-copertina');
    immagineCopertina.src = evento.copertina;
    immagineCopertina.alt = evento.nome;
}

async function caricaDescrizione(percorsoDescrizione)
{
    const response = await fetch(percorsoDescrizione);
    const descrizioneHtml = await response.text();
    const containerDescrizione = document.getElementById('evento-descrizione');
    containerDescrizione.innerHTML = descrizioneHtml;
    containerDescrizione.style.display = 'block';
}

async function gestisciBottonePrenotazione(dataEvento)
{
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0); // Reset ore per confronto solo date
    
    const dataEventoObj = new Date(dataEvento);
    dataEventoObj.setHours(0, 0, 0, 0);
    
    const bottonePrenotazione = document.getElementById('iscriviti-btn');
    
    // Mostra il bottone solo se l'evento è futuro
    if (dataEventoObj >= oggi)
    {
        bottonePrenotazione.style.display = 'block';
        
        // Controlla se l'utente è autenticato e già iscritto (SENZA REDIRECT)
        try
        {
            const response = await fetch(`/api/verifica-prenotazione/${eventoId}`, {
                credentials: 'include'
            });
            
            if (response.ok)
            {
                const data = await response.json();
                if (data.success && data.iscritto)
                {
                    // Utente già iscritto - mostra stato prenotato
                    mostraStatoPrenotato();
                    return;
                }
            }
            // Se la risposta non è ok (401 - non autenticato), non facciamo nulla
            // Il bottone rimane normale e il redirect avverrà solo al click
        } catch (error)
        {
            console.log('Utente non autenticato o errore nella verifica', error);
            // Non facciamo nulla, il bottone rimane normale
        }
        
        // Aggiungi event listener per prenotazione
        bottonePrenotazione.addEventListener('click', async function()
        {
            await prenotaEvento(eventoId);
        });
    } else
    {
        bottonePrenotazione.style.display = 'none';
    }
}

async function prenotaEvento(eventoId)
{
    console.log('entrato nella funzione per gestione click prenotazione');
    try
    {
        // Controlla se l'utente è autenticato SOLO al momento del click
        const authResponse = await fetch('/api/userinfo',
        {
            credentials: 'include'
        });

        console.log('authResponse:', authResponse);
        
        if (!authResponse.ok)
        {
            // Utente non loggato, reindirizza al login SOLO ADESSO
            window.location.href = '/accesso.html';
            return;
        }
        
        // Effettua la prenotazione
        const response = await fetch('/api/prenota-evento',
        {
            method: 'POST',
            headers:{'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({ eventoId: eventoId })
        });
        
        const data = await response.json();
        
        if (data.success)
        {
            // Successo - aggiorna l'interfaccia
            mostraStatoPrenotato();
            
            // Aggiorna il contatore dei partecipanti
            const contatore = document.getElementById('evento-partecipanti');
            const numeroAttuale = parseInt(contatore.textContent);
            contatore.textContent = numeroAttuale + 1;
            
            alert(data.message);
        } else
        {
            alert('Errore: ' + data.message);
        }
        
    } catch (error)
    {
        console.error('Errore nella prenotazione:', error);
        alert('Si è verificato un errore durante la prenotazione.');
    }
}

function mostraErrore(messaggio)
{
    // Funzione per mostrare errori 
    alert(messaggio);
    window.location.href = '/eventi.html';
}

function mostraStatoPrenotato()
{
    // Funzione per mostrare l'interfaccia quando l'utente è già prenotato
    const bottone = document.getElementById('iscriviti-btn');
    bottone.textContent = 'PRENOTATO ✓';
    bottone.disabled = true;
    bottone.style.backgroundColor = '#28a745';
    bottone.style.cursor = 'default';
    
    // Rimuovi eventuali event listener esistenti clonando il bottone
    const nuovoBottone = bottone.cloneNode(true);
    bottone.parentNode.replaceChild(nuovoBottone, bottone);
}