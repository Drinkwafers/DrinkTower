const express = require('express');
const cookieParser = require("cookie-parser");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // limite necessario per le copertine
app.use(express.static("public"));


const JWT_SECRET = process.env.JWT_SECRET

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Creo un pool di connessioni
const pool = mysql.createPool
({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Funzione per generare il nome della tabella dall'evento
function generaNome(nomeEvento)
{
    return nomeEvento
        .toLowerCase()
        .replace(/[àáâäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôöø]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '_')  // Sostituisce tutto ciò che non è lettera/numero con _
        .replace(/_+/g, '_')         // Rimuove _ multipli consecutivi
        .replace(/^_|_$/g, '');      // Rimuove _ all'inizio e alla fine
}

// Middleware di autenticazione JWT
function authenticateToken(req, res, next)
{
    const token = req.cookies.token;

    if (!token)
        return res.redirect(302, "/accesso.html");
    try
    {
        // Verifica il token JWT
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; //rendo accessibile il payload dell'utente (id, nome e admin)
        next();
    }
    catch (err)
    {
        return res.redirect(302, "/accesso.html");
    }
}

// Proteggo la cartella /private
app.use("/private", authenticateToken, express.static("private"));


// Middleware di autenticazione JWT per API
function authenticateAPI(req, res, next)
{
    const token = req.cookies.token;

    if (!token)
        return res.status(401).json({success: false, message: "Token mancante"});
    try
    {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (err)
    {
        return res.status(403).json({success: false, message: "Token non valido"});
    }
}

// Endpoint login con controllo nel DB
app.post("/api/login", async (req, res) => {
    const {email, password} = req.body;

    // Controlla che la post non sia manipolata
    if (!email || !password)
    {
        return res.status(400).json({success: false, message: "Email e password sono obbligatori"});
    }

    // Mail univoca quindi trova un solo utente
    const query = "SELECT id, nome, admin, password FROM utenti WHERE email = ?";

    try
    {
        // Eseguo la query per verificare le credenziali
        const [righe] = await pool.promise().execute(query, [email]);

        //Se non trovo l'utente, restituisco un errore
        if (righe.length === 0) 
        {
            return res.status(401).json({success: false, message: "Credenziali non valide"});
        }

        const user = righe[0]; // Il primo e unico risultato è l'utente autenticato

        // Controllo che la password sia corretta
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({success:false, message:"Credenziali non valide" });

        // Creo il payload per il token JWT
        const payload = {userId: user.id, userName: user.nome, isAdmin: user.admin};

        // Firmo il token JWT
        const token = jwt.sign(payload, JWT_SECRET, {algorithm: "HS256", expiresIn: "1h"});

        // Mando il token al browser come cookie
        res.cookie("token", token, {httpOnly: true, secure: true, maxAge: 3600000, sameSite: "Strict"});

        // Rispondo con successo
        return res.json({success: true, message: "Login riuscito"}); //message è un controllo ma success tornerà comodo per controlli
    }
    catch (err)
    {
        console.error("Errore query DB:", err);
        return res.status(500).json({success: false, message: "Errore interno al server"});
    }
});

// Endpoint per il logout
app.post("/api/logout", authenticateAPI, (req, res) => {
    res.clearCookie("token"); // Rimuovo il cookie contenente il token
    res.json({success: true, message: "Logout effettuato"});
});

// Endpoint per iscriversi ad un evento
app.post("/api/prenota-evento", authenticateAPI, async (req, res) => {
    const {eventoId} = req.body;
    const utenteId = req.user.userId;
    
    if (!eventoId)
        return res.status(400).json({success: false, message: "ID evento obbligatorio"});

    const connection = await pool.promise().getConnection();
    try
    {
        // Verifica che l'evento esista e ottieni i suoi dati
        const [eventoRighe] = await connection.execute("SELECT nome, data_evento FROM eventi WHERE id = ?", [eventoId]);
        
        if (eventoRighe.length === 0)
            return res.status(404).json({success: false, message: "Evento non trovato"});
        
        const evento = eventoRighe[0]; // Il primo e unico risultato è l'evento richiesto

        // Confrontiamo la data dell'evento con la data attuale per capire se è un evento passato o futuro
        const dataEvento = new Date(evento.data_evento); 
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        if (dataEvento < oggi)
        {
            return res.status(400).json({
                success: false,
                message: "Non è possibile prenotare eventi passati"
            });
        }
        
        // Il nome della tabella è identico al nome dell'evento
        const nomeTabella = generaNome(evento.nome);
        
        // Creo la query per la verifica (per il nome della tabella non posso usare un segnaposto)
        const checkQuery = `SELECT id FROM \`${nomeTabella}\` WHERE utente_id = ?`;
        // Verifica se l'utente è già iscritto alla tabella specifica
        const [prenotazioniEsistenti] = await connection.execute(checkQuery, [utenteId]);

        // Utente già iscritto, non può iscriversi di nuovo
        if (prenotazioniEsistenti.length > 0)
            return res.status(400).json({success: false,  message: "Sei già iscritto a questo evento"});
        
        // Inserisco la prenotazione nella tabella specifica
        const insertQuery = `INSERT INTO \`${nomeTabella}\` (evento_id, utente_id) VALUES (?, ?)`;
        await connection.execute(insertQuery, [eventoId, utenteId]);
        
        // Aggiorna il contatore dei partecipanti
        const updateQuery = "UPDATE eventi SET numero_iscritti = numero_iscritti + 1 WHERE id = ?";
        await connection.execute(updateQuery, [eventoId]);
        
        res.json({success: true, message: "Prenotazione effettuata con successo!", tabella: nomeTabella});
    } catch (err)
    {
        console.error("Errore nella prenotazione:", err);
        res.status(500).json({success: false, message: "Errore interno del server"});
    } finally
    { // Rilascio la connessione al database
        connection.release();
    }
});

// Endpoint per verificare se un utente è già iscritto ad un evento
app.get("/api/verifica-prenotazione/:eventoId", authenticateAPI, async (req, res) => {
    const eventoId = req.params.eventoId; // params perchè sto facendo una GET
    const utenteId = req.user.userId;
    
    const connection = await pool.promise().getConnection();
    try
    {
        // Ottieni il nome dell'evento
        const [eventoRighe] = await connection.execute("SELECT nome FROM eventi WHERE id = ?", [eventoId]);
        
        if (eventoRighe.length === 0)
            return res.status(404).json({success: false, message: "Evento non trovato"});
        
        const nomeTabella = generaNome(eventoRighe[0].nome);
        
        // Controlla se l'utente è iscritto
        const checkQuery = `SELECT id FROM \`${nomeTabella}\` WHERE utente_id = ?`;
        const [righe] = await connection.execute(checkQuery, [utenteId]);
        
        res.json({success: true, iscritto: righe.length > 0});
    } catch (err)
    {
        console.error("Errore nella verifica prenotazione:", err);
        res.status(500).json({success: false, message: "Errore interno del server"});
    } finally
    {
        connection.release();
    }
});

// Endpoint per ottenere le informazioni dell'utente autenticato
app.get("/api/userinfo", authenticateAPI, (req, res) => {
    res.json({success: true, nome: req.user.userName, admin: req.user.isAdmin});
});

// Endpoint per aggiungere un utente
app.post("/add-user", async (req, res) => {

    // Prendo i dati dal body della richiesta
    const {nome, email, password} = req.body;

    // Tutti i campi sono obbligatori
    if (!nome || !email || !password)
        return res.status(400).json({success: false, message: "Nome, email e password sono obbligatori!"});

    // Controllo se l'email è già registrata
    const checkEmailQuery = "SELECT id FROM utenti WHERE email = ?";
    const [emailRighe] = await pool.promise().execute(checkEmailQuery, [email]);
    if (emailRighe.length > 0)
        return res.status(400).json({success: false, message: "Email già registrata!"});

    // Query per inserire l'utente nel database
    const checkQuery = "INSERT INTO utenti (nome, email, password) VALUES (?, ?, ?)";

    const connection = await pool.promise().getConnection();

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    try
    {
        await connection.execute(checkQuery, [nome, email, passwordHash]);
        return res.json({success: true,  message: "Utente aggiunto con successo!"});
    }
    catch (err)
    {
        console.error("Errore nell'inserimento:", err);
        return res.status(500).json({success: false, message: "Errore nell'inserimento nel database"});
    }
    finally
    {
        connection.release();
    }
});

// Endpoint per recuperare gli eventi
app.get("/api/eventi", async (req, res) => {
    
    // Prendo tutti gli eventi ordinati per data
    const query = "SELECT * FROM eventi ORDER BY data_evento ASC";

    const connection = await pool.promise().getConnection();
    try
    {
        const [righe] = await connection.execute(query);
        res.json(righe);
    } catch (err)
    {
        console.error("Errore durante l'esecuzione della query:", err);
        res.status(500).json({
            success: false,
            message: "Errore nel recupero degli eventi"
        });
    } finally
    {
        connection.release();
    }
});


// Endpoint per recuperare gli utenti
app.get("/api/utenti", async (req, res) => {
    
    // Prendo tutti gli utenti
    const query = "SELECT * FROM utenti";

    const connection = await pool.promise().getConnection();
    try
    {
        const [righe] = await connection.execute(query);
        res.json(righe);
    } catch (err)
    {
        console.error("Errore durante l'esecuzione della query:", err);
        res.status(500).json
        ({
            success: false,
            message: "Errore nel recupero degli utenti"
        });
    } finally
    {
        connection.release();
    }
});

// Endpoint che restituisce le informazioni di un evento singolo tramite id.
app.get("/api/evento/:id", async (req, res) => {

    const fs = require('fs').promises; // Per leggere il file di descrizione
    const path = require('path'); // Per gestire i percorsi dei file

    const eventoId = req.params.id;
    
    if (!eventoId || isNaN(eventoId))
        return res.status(400).json({success: false, message: "ID evento non valido"});

    // Controllo se l'evento esiste nel database
    const query = "SELECT * FROM eventi WHERE id = ?";

    const connection = await pool.promise().getConnection();
    
    try
    {
        const [righe] = await connection.execute(query, [eventoId]);
        
        if (righe.length === 0)
            return res.status(404).json({success: false, message: "Evento non trovato"});  

        const evento = righe[0];

        let descrizioneHtml = '';
        if (evento.descrizione)
        {
            try
            {
                // Compongo il percorso con path.join
                const fullPath = path.join(__dirname, 'public', evento.descrizione);
                descrizioneHtml = await fs.readFile(fullPath, 'utf8');
            } catch (e)
            {
                console.error('Errore lettura descrizione:', e.message);
                descrizioneHtml = '<p>Descrizione non disponibile</p>';
            }
        } else

        descrizioneHtml = '<p>Descrizione assente</p>';

        res.json({success: true, evento: {...evento, descrizione: descrizioneHtml}});
    } catch (err)
    {
        console.error("Errore durante l'esecuzione della query:", err);
        res.status(500).json({success: false, message: "Errore nel recupero dell'evento"});
    } finally
    {
        connection.release();
    }
});

// Endpoint per ottenere gli eventi a cui l'utente è iscritto
app.get("/api/eventi-utente", authenticateAPI, async (req, res) => {
    const utenteId = req.user.userId;
    
    const connection = await pool.promise().getConnection();
    
    try
    {
        // Prima prendo tutti gli eventi 
        const [eventi] = await connection.execute("SELECT * FROM eventi ORDER BY data_evento ASC");
        
        const eventiUtente = [];
        
        // Per ogni evento, controllo se l'utente è iscritto
        for (const evento of eventi)
        {
            const nomeTabella = generaNome(evento.nome);
            
            try
            {
                // Controllo se la tabella esiste e se l'utente è iscritto
                const checkQuery = `SELECT id FROM \`${nomeTabella}\` WHERE utente_id = ?`;
                const [prenotazioni] = await connection.execute(checkQuery, [utenteId]);
                
                if (prenotazioni.length > 0)
                    eventiUtente.push(evento);
            } catch (err)
            {
                
            }
        }
        
        res.json({success: true, eventi: eventiUtente});

    } catch (err)
    {
        console.error("Errore nel recupero eventi utente:", err);
        res.status(500).json({success: false, message: "Errore interno del server"});
    } finally
    {
        connection.release();
    }
});

// Endpoint per disiscriversi da un evento
app.post("/api/disiscrivi-evento", authenticateAPI, async (req, res) => {
    const {eventoId} = req.body;
    const utenteId = req.user.userId;
    
    if (!eventoId)
        return res.status(400).json({success: false, message: "ID evento obbligatorio"});

    const connection = await pool.promise().getConnection();
    
    try
    {
        // Prendo i dati dell'evento
        const [eventoRighe] = await connection.execute("SELECT nome, data_evento FROM eventi WHERE id = ?", [eventoId]);
        
        // Verifico se l'evento esiste
        if (eventoRighe.length === 0)
            return res.status(404).json({success: false, message: "Evento non trovato"});

        // Non dovrebbe essere possibile, ma comunque evito che la gente si possa disiscrivere da eventi passati
        const evento = eventoRighe[0];
        const dataEvento = new Date(evento.data_evento);
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        if (dataEvento < oggi) {
            return res.status(400).json({
                success: false,
                message: "Non è possibile disiscriversi da eventi passati"
            });
        }
        
        const nomeTabella = generaNome(evento.nome);
        
        // Verifico se l'utente è iscritto
        const checkQuery = `SELECT id FROM \`${nomeTabella}\` WHERE utente_id = ?`;
        const [prenotazioniEsistenti] = await connection.execute(checkQuery, [utenteId]);
        
        if (prenotazioniEsistenti.length === 0)
            return res.status(400).json({success: false, message: "Non sei iscritto a questo evento"});
        
        // Tolgo la prenotazione dalla tabella
        const deleteQuery = `DELETE FROM \`${nomeTabella}\` WHERE utente_id = ?`;
        await connection.execute(deleteQuery, [utenteId]);
        
        // Aggiorno il contatore dei partecipanti
        await connection.execute("UPDATE eventi SET numero_iscritti = numero_iscritti - 1 WHERE id = ?", [eventoId]);
        
        res.json({success: true, message: "Disiscrizione effettuata con successo!", tabella: nomeTabella});
        
    } catch (err)
    {
        console.error("Errore nella disiscrizione:", err);
        res.status(500).json({success: false, message: "Errore interno del server"});
    } finally
    {
        connection.release();
    }
});

// Endpoint per cambiare password DA IMPLEMENTARE
app.post("/api/cambia-password", authenticateAPI, async (req, res) => {
    const {passwordAttuale, nuovaPassword} = req.body;
    const utenteId = req.user.userId;
    
    if (!passwordAttuale || !nuovaPassword)
        return res.status(400).json({success: false, message: "Password attuale e nuova password sono obbligatorie"});
    
    if (nuovaPassword.length < 6)
        return res.status(400).json({success: false, message: "La nuova password deve essere di almeno 6 caratteri"});
    
    const connection = await pool.promise().getConnection();
    
    try
    {
        // Verifica la password attuale
        const userQuery = "SELECT id FROM utenti WHERE id = ? AND password = ?";
        const [utente] = await connection.execute(userQuery, [utenteId, passwordAttuale]);
        
        if (utente.length === 0)
            return res.status(401).json({success: false, message: "Password attuale non corretta"});
        
        // Aggiorna la password
        await connection.execute("UPDATE utenti SET password = ? WHERE id = ?", [nuovaPassword, utenteId]);
        
        res.json({success: true, message: "Password modificata con successo"});
        
    } catch (err)
    {
        console.error("Errore nel cambio password:", err);
        res.status(500).json({success: false, message: "Errore interno del server"});
    } finally
    {
        connection.release();
    }
});

function requireAdmin(req, res, next)
{
    const token = req.cookies.token;

    if (!token)
        return res.status(401).json({success: false,  message: "Token mancante"});
    try
    {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload.isAdmin)
            return res.status(403).json({ success: false, message: "Accesso negato: non sei admin" });
        req.user = payload; // Rendo accessibile il payload dell'utente
        next();
    }
    catch (err)
    {
        return res.status(403).json({success: false, message: "Token non valido"});
    }
}

async function eliminaFile(nomeFile)
{
    try
    {
        const filePath = path.join(__dirname, "public", nomeFile);
        await fs.unlink(filePath);
    } catch (err)
    {
        if (err.code === 'ENOENT')
            console.error("File non trovato!");
        else
            console.error("Errore nell'eliminazione:", err);
    }
}

// Endpoint per rimuovere un evento
app.delete('/admin/eventi', async (req, res) => {
    const { id } = req.body;

    const connection = await pool.promise().getConnection();
    const deleteQuery = "DELETE FROM eventi WHERE id = ?";

    try
    {
        const query = `SELECT nome, copertina, descrizione FROM eventi WHERE id = ?`;
        const [righe] = await pool.promise().execute(query, [id]);

        nome = generaNome(righe[0].nome);

        if (righe[0].copertina)
            eliminaFile('copertine/' + nome + '.webp'); 

        if (righe[0].descrizione)
            eliminaFile('descrizioni/' + nome + '.txt'); 

        await connection.execute('DROP TABLE IF EXISTS ' + nome);

        await connection.execute(deleteQuery, [id]);

        console.log('Evento rimosso con successo:', id);
        res.json({ok: true, message: 'Evento rimosso con successo'});
    } catch (e)
    {
        console.error('Errore:', e);
        res.status(500).json({ error: 'Errore' });
    }
});

// Endpoint per aggiungere un evento
app.post("/add-event", async (req, res) => {

    // Prendo i dati dal body della richiesta
    const {nome, data, ora, descrizione, copertina} = req.body;

    // Tutti i campi sono obbligatori
    if (!nome || !data || !ora || !descrizione || !copertina)
        return res.status(400).json({success: false, message: "Tutti i campi sono obbligatori!"});

    // Controllo se c'è già un evento con lo stesso nome
    const [nomeRighe] = await pool.promise().execute("SELECT id FROM eventi WHERE nome = ?", [nome]);
    if (nomeRighe.length > 0)
        return res.status(400).json({success: false, message: "Evento con lo stesso nome già esistente!"});

    // Controllo se c'è già un evento con la stessa data
    const [dataRighe] = await pool.promise().execute("SELECT id FROM eventi WHERE data_evento = ?", [data]);
    if (dataRighe.length > 0)
        return res.status(400).json({success: false, message: "Non puoi aggiungere due eventi nella stessa data!"});


    // Salvo immagine webp da dataURL

    // Estraggo il payload dell'immagine dal dataURL
    // E controllo che sia un dataURL immagine valido
    const regex = new RegExp
    ([
        '^data:image/',     // deve iniziare con "data:image/"
        '(?:webp)', // formato accettato: webp OR png OR jpg/jpeg
        ';base64,',         // deve esserci la stringa letterale ";base64,"
        '(.+)',             // cattura TUTTA la parte dopo la virgola (i dati base64)
        '$'                 // fine stringa
        ].join(''), 'i');     // flag "i" = ignora maiuscole/minuscole

    const divzorzio = regex.exec(copertina);

    // Se non è un dataURL immagine valido, risponde con HTTP 415 (Unsupported Media Type) e termina qui la richiesta.
    if (!divzorzio) return res.status(415).json({ success:false, message:"copertina non valida" });

    // Converte la parte base64 catturata (divzorzio[1]) in un Buffer binario con la decodifica base64.
    // Questo Buffer rappresenta i byte reali dell’immagine.
    const imgBuf = Buffer.from(divzorzio[1], 'base64');

    // Scrivo il file contenente la copertina nella cartella giusta
    await fs.writeFile(path.join(__dirname, 'public', 'copertine', generaNome(nome)+'.webp'), imgBuf, 'utf8');


    // Scrivo il file contenente la descrizione nella cartella giusta
    await fs.writeFile(path.join(__dirname, 'public', 'descrizioni', generaNome(nome)+'.txt'), descrizione, 'utf8');

    const insertQuery = "INSERT INTO eventi (nome, data_evento, ora_evento, copertina, descrizione) VALUES (?, ?, ?, ?, ?)";

    const tableQuery = `CREATE TABLE \`${generaNome(nome)}\` (id INT AUTO_INCREMENT PRIMARY KEY, evento_id INT NOT NULL, utente_id INT NOT NULL, data_prenotazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (evento_id) REFERENCES eventi(id) ON DELETE CASCADE, FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE CASCADE, UNIQUE KEY unique_prenotazione (evento_id, utente_id));`;

    const connection = await pool.promise().getConnection();

    try
    {
        await connection.execute(insertQuery, [nome, data, ora, "copertine/" + generaNome(nome)+".webp", "descrizioni/" + generaNome(nome)+".txt"]);

        await connection.execute(tableQuery);

        return res.json({success: true,  message: "Evento aggiunto con successo!"});
    }
    catch (err)
    {
        console.error("Errore nell'inserimento:", err);
        return res.status(500).json({success: false, message: "Errore nell'inserimento nel database"});
    }
    finally
    {
        connection.release();
    }
});

// Endpoint per aggiungere un admin
app.post("/admin/promote", async (req, res) => {
    const {id} = req.body;

    const connection = await pool.promise().getConnection();
    try
    {
        const query = "UPDATE utenti SET admin = '1' WHERE id = ?";
        await connection.execute(query, [id]);

        console.log('Promozione avvenuta con successo:', id);
        res.json({ok: true, message: 'Promozione avvenuta con successo'});
    } catch (e)
    {
        console.error('Errore:', e);
        res.status(500).json({ error: 'Errore' });
    }
});

// Endpoint per rimuovere un admin
app.post("/admin/declass", async (req, res) => {
    const {id} = req.body;

    const connection = await pool.promise().getConnection();
    try
    {
        const query = "UPDATE utenti SET admin = '0' WHERE id = ?";
        await connection.execute(query, [id]);

        console.log('Declassamento avvenuto con successo:', id);
        res.json({ok: true, message: 'Declassamento avvenuto con successo'});
    } catch (e)
    {
        console.error('Errore:', e);
        res.status(500).json({ error: 'Errore' });
    }
});

// Middleware per proteggere le pagine admin
app.use("/private/admin", requireAdmin, express.static('private/admin'));

// Route per servire la pagina info.html
app.get("/info", (req, res) => {
    res.sendFile(__dirname + '/public/info.html');
});

// Middleware per gestire errori 404
app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});