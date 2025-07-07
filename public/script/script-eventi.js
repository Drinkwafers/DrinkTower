window.onload = async function ()
{
    const bottone1 = document.getElementById("bottone1");
    const lista1 = document.getElementById("lista1");
    const bottone2 = document.getElementById("bottone2");
    const lista2 = document.getElementById("lista2");

    // Funzione per caricare gli eventi
    async function caricaEventi()
    {
        try
        {
            const response = await fetch('/users');
            const eventi = await response.json();
            
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0); // Reset ore per confronto solo date

            // Separa eventi futuri e passati
            const eventiFuturi = [];
            const eventiPassati = [];

            eventi.forEach(evento => {
                const dataEvento = new Date(evento.data_evento);
                dataEvento.setHours(0, 0, 0, 0);
                
                if (dataEvento >= oggi)
                    eventiFuturi.push(evento);
                else
                    eventiPassati.push(evento);
            });

            return {eventiFuturi, eventiPassati};
        } catch (error)
        {
            console.error("Errore:", error);
            return {eventiFuturi: [], eventiPassati: []};
        }
    }

    // Funzione per stampare gli eventi
    function stampaEventi(eventi, lista)
    {
        if (eventi.length === 0)
        {
            const li = document.createElement("li");
            li.innerHTML  = "Nessun evento trovato";
            lista.appendChild(li);
            return;
        }

        eventi.forEach(evento => {
            const li = document.createElement("li");
            const data = new Date(evento.data_evento);
            li.innerHTML = `<div id="frame-wrapper"><p>${evento.nome}</p><img id="frame-film" src="script/copertine/miniatura.webp" alt="frame"></div>
                            <div id="frame-descrizione">
                                <p>${data.toLocaleDateString('it-IT')} alle ${evento.ora_evento}</p>
                                <button type="button" id="info" value="16">Info</button>
                            </div>`
            //li.innerHTML  = `${evento.nome}<br></li><div id="data"> ${data.toLocaleDateString('it-IT')} alle ${evento.ora_evento}</div>`;
            lista.appendChild(li);
        });
    }

    // Gestione click bottone eventi futuri
    bottone1.addEventListener("click", async () => {
        try
        {
            const {eventiFuturi} = await caricaEventi();
            lista1.innerHTML = ""; // Pulisce la lista
            
            stampaEventi(eventiFuturi, lista1);
            bottone1.style.display = 'none';
        } catch (error)
        {
            console.error("Errore:", error);
            lista1.innerHTML = "<li>Errore nel caricamento degli eventi</li>";
        }
    });

    // Gestione click bottone eventi passati
    bottone2.addEventListener("click", async () => {
        try
        {
            const {eventiPassati} = await caricaEventi();
            lista2.innerHTML = ""; // Pulisce la lista
            // Ordina eventi passati dal più recente al più vecchio
            eventiPassati.sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
            
            stampaEventi(eventiPassati, lista2);
            bottone2.style.display = 'none';
        } catch (error)
        {
            console.error("Errore:", error);
            lista2.innerHTML = "<li>Errore nel caricamento degli eventi</li>";
        }
    });

    // Caricamento iniziale degli eventi (primi 3 di ogni categoria)
    try
    {
        const {eventiFuturi, eventiPassati} = await caricaEventi();
        
        // Mostra i primi 3 eventi futuri
        lista1.innerHTML = "";
        const primi3EventiFuturi = eventiFuturi.slice(0, 3);
        stampaEventi(primi3EventiFuturi, lista1);
        
        // Mostra i primi 3 eventi passati (dal più recente)
        lista2.innerHTML = "";
        const eventiPassatiOrdinati = eventiPassati.sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));
        const primi3EventiPassati = eventiPassatiOrdinati.slice(0, 3);
        stampaEventi(primi3EventiPassati, lista2);

        if (eventiFuturi.length < 4)
            bottone1.style.display = 'none';
        if (eventiPassati.length < 4)
            bottone2.style.display = 'none';
        
    } catch (error)
    {
        console.error("Errore nel caricamento iniziale:", error);
        lista1.innerHTML = "<li>Errore nel caricamento degli eventi</li>";
        lista2.innerHTML = "<li>Errore nel caricamento degli eventi</li>";
    }
};