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
        
        // Carica la descrizione se presente
        if (evento.descrizione)
        {
            await caricaDescrizione(evento.descrizione);
        }
        
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

    document.getElementById('evento-descrizione').textContent = evento.descrizione;
    
    // Popola immagine copertina
    const immagineCopertina = document.getElementById('evento-copertina');
    immagineCopertina.src = evento.copertina;
    immagineCopertina.alt = evento.nome;
}