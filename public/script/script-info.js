window.onload = async function() {
    // Ottieni l'ID dell'evento dalla URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');
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

        gestisciBottonePrenotazione(evento.data_evento);

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

function gestisciBottonePrenotazione(dataEvento)
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
    try
    {
        // Controlla se l'utente è autenticato
        const authResponse = await fetch('/api/userinfo',
        {
            credentials: 'include'
        });
        
        if (!authResponse.ok)
        {
            // Utente non loggato, reindirizza al login
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
            const bottone = document.getElementById('iscriviti-btn');
            bottone.textContent = 'PRENOTATO ✓';
            bottone.disabled = true;
            bottone.style.backgroundColor = '#28a745';
            
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