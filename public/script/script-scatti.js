let modalAttivo = false;
let indiceModale = 0;
let scattiVisibili = [];

window.onload = function() {
    inizializzaGalleria();
    configuraFiltri();
    configuraModal();
};

function inizializzaGalleria() {
    // Ottieni tutti gli scatti dalla pagina
    aggiornaScattiVisibili();
    
    // Aggiungi event listeners per aprire il modal
    const scatti = document.querySelectorAll('.scatto-item');
    scatti.forEach((scatto, index) => {
        scatto.addEventListener('click', () => {
            const indiceGlobale = parseInt(scatto.dataset.indice);
            apriModal(indiceGlobale);
        });
    });
}

function aggiornaScattiVisibili() {
    scattiVisibili = Array.from(document.querySelectorAll('.scatto-item:not(.nascosto)'));
}

function configuraFiltri() {
    const bottoniFiltro = document.querySelectorAll('.filtro-btn');
    
    bottoniFiltro.forEach(bottone => {
        bottone.addEventListener('click', () => {
            // Rimuovi classe active da tutti i bottoni
            bottoniFiltro.forEach(btn => btn.classList.remove('active'));
            
            // Aggiungi classe active al bottone cliccato
            bottone.classList.add('active');
            
            // Ottieni categoria selezionata
            const categoriaSelezionata = bottone.dataset.categoria;
            
            // Filtra gli scatti
            filtraScatti(categoriaSelezionata);
        });
    });
}

function filtraScatti(categoria) {
    const tuttiGliScatti = document.querySelectorAll('.scatto-item');
    
    tuttiGliScatti.forEach(scatto => {
        if (categoria === 'tutti' || scatto.dataset.categoria === categoria) {
            scatto.classList.remove('nascosto');
            scatto.style.display = 'block';
        } else {
            scatto.classList.add('nascosto');
            scatto.style.display = 'none';
        }
    });
    
    // Aggiorna la lista degli scatti visibili
    aggiornaScattiVisibili();
}

function configuraModal() {
    const modal = document.getElementById('modal-immagine');
    const chiudiModal = document.querySelector('.modal-close');
    const btnPrev = document.getElementById('modal-prev');
    const btnNext = document.getElementById('modal-next');
    
    // Chiudi modal
    chiudiModal.addEventListener('click', chiudiModale);
    
    // Chiudi modal cliccando fuori dall'immagine
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            chiudiModale();
        }
    });
    
    // Navigazione con i bottoni
    btnPrev.addEventListener('click', () => mostraScattoPrecedente());
    btnNext.addEventListener('click', () => mostraScattoSuccessivo());
    
    // Navigazione con tastiera
    document.addEventListener('keydown', (e) => {
        if (!modalAttivo) return;
        
        switch(e.key) {
            case 'Escape':
                chiudiModale();
                break;
            case 'ArrowLeft':
                mostraScattoPrecedente();
                break;
            case 'ArrowRight':
                mostraScattoSuccessivo();
                break;
        }
    });
}

function apriModal(indiceGlobale) {
    // Trova lo scatto con l'indice globale specificato
    const scattoElemento = document.querySelector(`[data-indice="${indiceGlobale}"]`);
    if (!scattoElemento) return;
    
    modalAttivo = true;
    indiceModale = indiceGlobale;
    
    const modal = document.getElementById('modal-immagine');
    
    // Ottieni i dati dallo scatto
    const img = scattoElemento.querySelector('.scatto-img');
    const titolo = scattoElemento.querySelector('.scatto-titolo').textContent;
    const data = scattoElemento.querySelector('.scatto-data').textContent;
    const descrizione = scattoElemento.querySelector('.scatto-descrizione').textContent;
    
    // Popola il modal
    document.getElementById('modal-img').src = img.src;
    document.getElementById('modal-img').alt = img.alt;
    document.getElementById('modal-titolo').textContent = titolo;
    document.getElementById('modal-descrizione').textContent = descrizione;
    document.getElementById('modal-data').textContent = data;
    
    // Gestisci i bottoni di navigazione basandosi sugli scatti visibili
    aggiornaNavigazioneModal();
    
    // Mostra il modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function aggiornaNavigazioneModal() {
    const btnPrev = document.getElementById('modal-prev');
    const btnNext = document.getElementById('modal-next');
    
    // Trova la posizione corrente negli scatti visibili
    const scattiVisibiliIndici = scattiVisibili.map(scatto => parseInt(scatto.dataset.indice));
    const posizioneCorrente = scattiVisibiliIndici.indexOf(indiceModale);
    
    btnPrev.disabled = posizioneCorrente <= 0;
    btnNext.disabled = posizioneCorrente >= scattiVisibiliIndici.length - 1;
}

function chiudiModale() {
    modalAttivo = false;
    const modal = document.getElementById('modal-immagine');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function mostraScattoPrecedente() {
    const scattiVisibiliIndici = scattiVisibili.map(scatto => parseInt(scatto.dataset.indice));
    const posizioneCorrente = scattiVisibiliIndici.indexOf(indiceModale);
    
    if (posizioneCorrente > 0) {
        const nuovoIndice = scattiVisibiliIndici[posizioneCorrente - 1];
        apriModal(nuovoIndice);
    }
}

function mostraScattoSuccessivo() {
    const scattiVisibiliIndici = scattiVisibili.map(scatto => parseInt(scatto.dataset.indice));
    const posizioneCorrente = scattiVisibiliIndici.indexOf(indiceModale);
    
    if (posizioneCorrente < scattiVisibiliIndici.length - 1) {
        const nuovoIndice = scattiVisibiliIndici[posizioneCorrente + 1];
        apriModal(nuovoIndice);
    }
}