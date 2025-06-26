window.onload = function ()
{
    const bottone1 = document.getElementById("bottone1");
    const lista1 = document.getElementById("lista1");
    const bottone2 = document.getElementById("bottone2");
    const lista2 = document.getElementById("lista2");

    // Funzione per formattare la data
    function formatDate(dateString)
    {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT');
    }

    bottone1.addEventListener("click", async () => {
        try
        {
            const response = await fetch('/users');
            if (!response.ok)
            {
                throw new Error('Errore nel recupero degli utenti');
            }
            const data = await response.json();
            lista1.textContent = "";
            data.forEach(user => {
                const li = document.createElement("li");
                li.textContent = user.nome + " - " + user.email;
                lista1.appendChild(li);
            });
        }
        catch (error)
        {
            console.error("Errore:", error);
        }
    });

    // Funzione per caricare gli eventi
    async function caricaEventi()
    {
        try
        {
            const response = await fetch('/users');
            if (!response.ok)
                throw new Error('Errore nel recupero degli eventi');
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
            return { eventiFuturi: [], eventiPassati: [] };
        }
    }

    // Gestione click bottone eventi futuri
    bottone1.addEventListener("click", async () => {
        try
        {
            const {eventiFuturi} = await caricaEventi();
            lista1.innerHTML = ""; // Pulisce la lista
            
            if (eventiFuturi.length === 0)
            {
                const li = document.createElement("li");
                li.textContent = "Nessun evento futuro al momento";
                lista1.appendChild(li);
                return;
            }

            eventiFuturi.forEach(evento => {
                const li = document.createElement("li");
                li.textContent = `${evento.nome} - ${formatDate(evento.data_evento)} alle ${evento.ora_evento} - Iscritti: ${evento.numero_iscritti}`;
                lista1.appendChild(li);
            });
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
            
            if (eventiPassati.length === 0)
            {
                const li = document.createElement("li");
                li.textContent = "Nessun evento passato trovato";
                lista2.appendChild(li);
                return;
            }

            // Ordina eventi passati dal più recente al più vecchio
            eventiPassati.sort((a, b) => new Date(b.data_evento) - new Date(a.data_evento));

            eventiPassati.forEach(evento => {
                const li = document.createElement("li");
                li.textContent = `${evento.nome} - ${formatDate(evento.data_evento)} alle ${evento.ora_evento} - Iscritti: ${evento.numero_iscritti}`;
                lista2.appendChild(li);
            });
        } catch (error)
        {
            console.error("Errore:", error);
            lista2.innerHTML = "<li>Errore nel caricamento degli eventi</li>";
        }
    });

    // Carica automaticamente gli eventi futuri all'avvio
    bottone1.click();
};