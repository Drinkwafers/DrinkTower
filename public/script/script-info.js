let eventoId;

window.onload = async function()
{
    // Prendo l'ID dell'evento dalla URL
    const urlParams = new URLSearchParams(window.location.search); //window.location.search ha la parte di url dopo il ?
    eventoId = urlParams.get('id'); // grazie alla classe URLSearchParams java sa che ho un oggetto id con un valore, e così lo estraggo
    
    try
    {
        // Carico i dati dell'evento
        const response = await fetch(`/api/evento/${eventoId}`);
        const data = await response.json(); 
        
        if (!data.success)
        {
            alert('L\'evento richiesto non esiste.');
            window.location.href = '#sec-eventi';
            return;
        }
        
        const evento = data.evento; // Rimuovo il campo success
        
        // Popolo i singoli elementi
        popolaEvento(evento);

        await gestisciBottonePrenotazione(evento.data_evento);

    } catch (error)
    {
        console.error('Errore nel caricamento dell\'evento:', error);
        alert('Si è verificato un errore nel caricamento dell\'evento.');
        window.location.href = '#sec-eventi';
    }
};

function popolaEvento(evento)
{
    // Aggiorno il titolo della pagina
    document.title = `DrinkTower - ${evento.nome}`;
    
    // Popolo nome evento
    document.getElementById('evento-nome').textContent = evento.nome;
    
    // Formatto e popolo la data
    const dataEvento = new Date(evento.data_evento);
    const dataFormattata = dataEvento.toLocaleDateString('it-IT', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
    document.getElementById('evento-data-formattata').textContent = dataFormattata;
    
    // Popolo l'ora
    document.getElementById('evento-ora').textContent = evento.ora_evento;
    
    // Popolo numero partecipanti
    document.getElementById('evento-partecipanti').textContent = evento.numero_iscritti;
    
    // Popolo immagine copertina
    const immagineCopertina = document.getElementById('evento-copertina');
    immagineCopertina.src = evento.copertina;
    immagineCopertina.alt = evento.nome;

    // Popolo descrizione
    document.getElementById('evento-descrizione').innerHTML = evento.descrizione;  
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
        
        // Controlla se l'utente è autenticato e già iscritto
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
            // Se la risposta non è ok (401 - non autenticato), non faccio nulla
            // Il bottone rimane normale e il redirect avverrà solo al click
        } catch (error)
        {
            console.log('Utente non autenticato o errore nella verifica', error);
            // Non faccio nulla, il bottone rimane normale
        }
        
        // Aggiungi event listener per prenotazione
        bottonePrenotazione.addEventListener('click', async function()
        {
            await prenotaEvento();
        });
    } else
    {
        bottonePrenotazione.style.display = 'none';
    }
}

async function prenotaEvento()
{
    console.log('entrato nella funzione per gestione click prenotazione');
    try
    {
        // Controllo se l'utente è autenticato al momento del click
        const authResponse = await fetch('/api/userinfo',{credentials: 'include'});

        console.log('authResponse:', authResponse);
        
        if (!authResponse.ok)
        {
            // Utente non loggato, reindirizza al login
            alert('Devi essere loggato per prenotare un evento.');
            window.location.href = '/accesso.html';
            return;
        }
        
        // Effettuo la prenotazione
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
            
            // Aggiorno il contatore dei partecipanti
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

function mostraStatoPrenotato()
{
    // Funzione per mostrare l'interfaccia quando l'utente è già prenotato
    const bottone = document.getElementById('iscriviti-btn');
    bottone.textContent = 'PRENOTATO ✓';
    bottone.disabled = true;
    bottone.style.backgroundColor = '#28a745';
    bottone.style.cursor = 'default';
    
    // Rimuovo eventuali event listener esistenti clonando il bottone
    const nuovoBottone = bottone.cloneNode(true);
    bottone.parentNode.replaceChild(nuovoBottone, bottone);
}