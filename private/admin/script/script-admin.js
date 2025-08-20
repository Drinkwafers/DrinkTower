window.onload = async function ()
{
    const resEventi = await fetch('/api/eventi');
    const eventi = await resEventi.json();

    const resUtenti = await fetch('/api/utenti');
    const utenti = await resUtenti.json();

    // Popolo i select con gli eventi
    let appEventi = '<option value="" disabled selected>Seleziona un evento...</option>';
    eventi.forEach(evento => {appEventi += `<option value="${evento.id}">${evento.nome}</option>`;});
    // Assegno tutto
    document.getElementById("select-rimuovi-evento-form").innerHTML = appEventi;


    // Popolo i select con gli utenti
    let appUtenti = '<option value="" disabled selected>Seleziona un utente...</option>';
    utenti.forEach(utente => {if (utente.id !== 1) {appUtenti += `<option value="${utente.id}">${utente.nome}</option>`;}});
    // Assegno tutto
    document.getElementById("select-aggiungi-admin-form").innerHTML = appUtenti;
    document.getElementById("select-declassa-admin-form").innerHTML = appUtenti;



    document.getElementById('rimuovi-evento-form').addEventListener('submit', async (event) => {

        const id = Number(document.getElementById('select-rimuovi-evento-form').value);

        try
        {
            event.preventDefault();
            const resp = await fetch('/admin/eventi',
            {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (!resp.ok)
            {
                const txt = await resp.text();
                console.error('Delete failed:', txt);
                alert('Errore durante la rimozione: ' + txt);
                return;
            }

            console.log('Evento rimosso con successo:', id);
            alert('Evento rimosso con successo');
            window.location.reload();

            const data = await resp.json();
        } catch (err)
        {
            console.error('Errore nella rimozione:', err);
            alert('Errore di rete durante la rimozione');
        }
    });


    document.getElementById('aggiungi-admin-form').addEventListener('submit', async (event) => {

        const id = Number(document.getElementById('select-aggiungi-admin-form').value);

        try
        {
            event.preventDefault();
            const resp = await fetch('/admin/promote', 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id})
            });

            if (!resp.ok)
            {
                const txt = await resp.text();
                console.error('Operation failed:', txt);
                alert('Errore durante il processo: ' + txt);
                return;
            }

            console.log('Admin aggiunto con successo:', id);
            alert('Admin aggiunto con successo');
            window.location.reload();

            const data = await resp.json();
        } catch (err)
        {
            console.error('Errore nella rimozione:', err);
            alert('Errore di rete durante la rimozione');
        }
    });

    document.getElementById('declassa-admin-form').addEventListener('submit', async (event) => {

        const id = Number(document.getElementById('select-declassa-admin-form').value);

        try
        {
            event.preventDefault();
            const resp = await fetch('/admin/declass', 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id})
            });

            if (!resp.ok)
            {
                const txt = await resp.text();
                console.error('Operation failed:', txt);
                alert('Errore durante il processo: ' + txt);
                return;
            }

            console.log('Admin declassato con successo:', id);
            alert('Admin declassato con successo');
            window.location.reload();

            const data = await resp.json();
        } catch (err)
        {
            console.error('Errore nella rimozione:', err);
            alert('Errore di rete durante la rimozione');
        }
    });

    // elementi UI
    const inputFile   = document.getElementById('file-copertina');
    const img         = document.getElementById('cropper-image');
    const bottoni     = document.getElementById('bottoni-crop');
    const btnReset    = document.getElementById('btn-reset-crop');
    const btnSalva    = document.getElementById('btn-salva-crop');
    const anteprima   = document.getElementById('anteprima-copertina');
    const linkDownload= document.getElementById('download-crop');
    const stage       = document.getElementById('cropper-stage');

    let cropper = null;

    // al cambio file carico l’immagine e attivo il crop bloccato 16:9
    inputFile?.addEventListener('change', (event) => {

        const file = event.target.files?.[0];   // undefined se non c’è

        if (!file) return;

        const url = URL.createObjectURL(file);
        img.src = url;
        img.style.display = 'block';
        bottoni.style.display = 'flex';
        anteprima.style.display = 'none';
        linkDownload.style.display = 'none';

        if (cropper) cropper.destroy(); // distruggo il vecchio cropper se esiste

        cropper = new Cropper(img,
        {
            aspectRatio: 16 / 9,     // BLOCCO 16:9
            viewMode: 2,             // non crea bordi
            dragMode: 'crop',        // puoi spostare il crop box ma anche selezionare l'area desisderata
            cropBoxMovable: true,    // l’utente sposta solo il box
            cropBoxResizable: true,  // e ne ridimensiona le dimensioni

            zoomable: false,         // disabilita zoom
            scalable: false,         // disabilita scale
            rotatable: false,        // disabilita rotazioni
            movable: false,          // l’immagine sotto non si muove
            guides: false,           // non mostra le guide
            center: false,           // non mostra il centro
            autoCropArea: 1,         // crop box iniziale grande
            responsive: true
        });
    });

    // reset del ritaglio
    btnReset?.addEventListener('click', () => {
        if (cropper) cropper.reset();
        anteprima.style.display = 'none';
        stage.style.display = 'block';
    });

    // esporta il ritaglio in WebP (16:9)
    btnSalva?.addEventListener('click', async () => {
        if (!cropper) return;

        // creo il canvas con le dimensioni del crop box, interpolazione attiva e qualità alta
        const canvas = cropper.getCroppedCanvas({imageSmoothingEnabled: true, imageSmoothingQuality: 'high'});

        // creo l'url per l'anteprima
        const previewUrl = canvas.toDataURL('image/webp', 0.95);

        // metto l'url nell'anteprima
        anteprima.src = previewUrl;

        stage.style.display = 'none';
        anteprima.style.display = 'block';
    });

    const EvForm = document.getElementById("aggiungi-evento-form");

    EvForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const eventData = {
            nome: document.getElementById("nome-evento").value,
            data: document.getElementById("select-data-evento").value,
            ora: document.getElementById("select-ora-evento").value,
            descrizione: document.getElementById("testo-descrizione").value,
            copertina: anteprima.src
        };

        try
        {
            console.log("Invio dati evento:", eventData);
            const response = await fetch("/add-event",
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(eventData)
            });
            console.log("Response:", response);
            const data = await response.json();

            alert(data.message);
            
            if (!data.success)
                return;

            EvForm.reset();
            window.location.reload();
        }
        catch (error)
        {
            console.error("Errore:", error);
            alert("Errore nella comunicazione con il server.");
        }
        finally
        {
            if (cropper) cropper.destroy();
        }
    });
}