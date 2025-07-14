// Funzione per caricare l'anteprima degli eventi
async function caricaAnteprimaEventi() {
    const container = document.getElementById('container-eventi-anteprima');
    
    try {
        const response = await fetch('/users');
        const eventi = await response.json();
        
        // Filtro solo eventi futuri
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        const eventiFuturi = eventi.filter(evento => {
            const dataEvento = new Date(evento.data_evento);
            dataEvento.setHours(0, 0, 0, 0);
            return dataEvento >= oggi;
        });
        
        // Prendo solo i primi 3 eventi
        const eventiAnteprima = eventiFuturi.slice(0, 3);
        
        if (eventiAnteprima.length === 0) {
            container.innerHTML = '<div class="loading-anteprima">Nessun evento in programma al momento</div>';
            return;
        }
        
        // Creo la griglia degli eventi
        let html = '<div class="eventi-anteprima-grid">';
        
        eventiAnteprima.forEach(evento => {
            const dataEvento = new Date(evento.data_evento);
            const dataFormattata = dataEvento.toLocaleDateString('it-IT', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            html += `
                <div class="evento-anteprima" onclick="window.location.href='/info?id=${evento.id}'">
                    <img src="${evento.copertina}" alt="${evento.nome}" class="evento-anteprima-img">
                    <div class="evento-anteprima-info">
                        <div class="evento-anteprima-nome">${evento.nome}</div>
                        <div class="evento-anteprima-data">${dataFormattata} alle ${evento.ora_evento}</div>
                        <div class="evento-anteprima-partecipanti">${evento.numero_iscritti} partecipanti</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Errore nel caricamento anteprima eventi:', error);
        container.innerHTML = '<div class="loading-anteprima">Errore nel caricamento eventi</div>';
    }
}

// Aggiungi event listeners per gli scatti anteprima
function inizializzaAnteprimaScatti() {
    const scattiAnteprima = document.querySelectorAll('.scatto-anteprima');
    
    scattiAnteprima.forEach(scatto => {
        scatto.addEventListener('click', () => {
            window.location.href = '/scatti.html';
        });
    });
}

// Aggiorna la funzione principale del documento
document.addEventListener('DOMContentLoaded', function() {
    function setFullHeight() {
        // Seleziona TUTTI gli elementi con la classe fullscreen-container
        const containers = document.querySelectorAll('.fullscreen-container');
        
        // Applica l'altezza a ciascuno di essi
        containers.forEach(container => {
            container.style.height = window.innerHeight + 'px';
        });
    }
    setFullHeight();
    
    // Carica le anteprime
    caricaAnteprimaEventi();
    inizializzaAnteprimaScatti();
});