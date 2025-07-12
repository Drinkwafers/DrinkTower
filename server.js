const express = require('express');
const cookieParser = require("cookie-parser");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3001;

app.use(cookieParser());
app.use(express.json());

app.use(express.static("public"));

const JWT_SECRET = "mia_chiave_super_segreta";

// Creo un pool di connessioni
const pool = mysql.createPool({
    host: "localhost",
    user: "user1",
    password: "pass1",
    database: "db_tower",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Funzione per generare il nome della tabella dall'evento
function generaNomeTabella(nomeEvento) {
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
function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect(302, "/accesso.html");
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (err) {
        return res.redirect(302, "/accesso.html");
    }
}

// Proteggo la cartella /private
app.use("/private", authenticateToken, express.static("private"));

// Endpoint login con controllo nel DB
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email e password sono obbligatori"
        });
    }

    const query = "SELECT id, nome FROM utenti WHERE email = ? AND password = ?";

    try {
        const [righe, colonne] = await pool.promise().execute(query, [email, password]);

        if (righe.length == 0) {
            return res.status(401).json({
                success: false,
                message: "Credenziali non valide"
            });
        }

        const user = righe[0];

        const payload = {
            userId: user.id,
            userName: user.nome,
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h"
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 3600000,
            sameSite: "Strict"
        });

        return res.json({
            success: true,
            message: "Login riuscito"
        });

    }
    catch (err) {
        console.error("Errore query DB:", err);
        return res.status(500).json({
            success: false,
            message: "Errore interno al server"
        });
    }
});

// Endpoint per il logout
app.post("/api/logout", authenticateToken, (req, res) => {
    res.clearCookie("token");
    res.json({
        success: true,
        message: "Logout effettuato"
    });
});

// Endpoint per iscriversi ad un evento con tabella dinamica
app.post("/api/prenota-evento", authenticateToken, async (req, res) => {
    const { eventoId } = req.body;
    const utenteId = req.user.userId;
    const userName = req.user.userName;
    
    if (!eventoId) {
        return res.status(400).json({
            success: false,
            message: "ID evento obbligatorio"
        });
    }

    const connection = await pool.promise().getConnection();
    
    try {
        // Verifica che l'evento esista e ottieni i suoi dati
        const [eventoRighe] = await connection.execute(
            "SELECT nome, data_evento FROM eventi WHERE id = ?", 
            [eventoId]
        );
        
        if (eventoRighe.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Evento non trovato"
            });
        }
        
        const evento = eventoRighe[0];
        const dataEvento = new Date(evento.data_evento);
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        if (dataEvento < oggi) {
            return res.status(400).json({
                success: false,
                message: "Non è possibile prenotare eventi passati"
            });
        }
        
        // Genera il nome della tabella dinamicamente
        const nomeTabella = generaNomeTabella(evento.nome);
        
        // Ottieni email dell'utente
        const [utenteRighe] = await connection.execute(
            "SELECT email FROM utenti WHERE id = ?",
            [utenteId]
        );
        
        if (utenteRighe.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utente non trovato"
            });
        }
        
        const userEmail = utenteRighe[0].email;
        
        // Verifica se l'utente è già iscritto alla tabella specifica
        const checkQuery = `SELECT num_prenotazione FROM \`${nomeTabella}\` WHERE utente_id = ?`;
        const [prenotazioniEsistenti] = await connection.execute(checkQuery, [utenteId]);
        
        if (prenotazioniEsistenti.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Sei già iscritto a questo evento"
            });
        }
        
        // Inserisci la prenotazione nella tabella specifica
        const insertQuery = `INSERT INTO \`${nomeTabella}\` (utente_id, nome, email) VALUES (?, ?, ?)`;
        await connection.execute(insertQuery, [utenteId, userName, userEmail]);
        
        // Aggiorna il contatore dei partecipanti
        await connection.execute(
            "UPDATE eventi SET numero_iscritti = numero_iscritti + 1 WHERE id = ?",
            [eventoId]
        );
        
        res.json({
            success: true,
            message: "Prenotazione effettuata con successo!",
            tabella: nomeTabella
        });
        
    } catch (err) {
        console.error("Errore nella prenotazione:", err);
        res.status(500).json({
            success: false,
            message: "Errore interno del server"
        });
    } finally {
        connection.release();
    }
});

// Endpoint per verificare se un utente è già iscritto ad un evento
app.get("/api/verifica-prenotazione/:eventoId", authenticateToken, async (req, res) => {
    const eventoId = req.params.eventoId;
    const utenteId = req.user.userId;
    
    const connection = await pool.promise().getConnection();
    
    try {
        // Ottieni il nome dell'evento
        const [eventoRighe] = await connection.execute(
            "SELECT nome FROM eventi WHERE id = ?",
            [eventoId]
        );
        
        if (eventoRighe.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Evento non trovato"
            });
        }
        
        const nomeTabella = generaNomeTabella(eventoRighe[0].nome);
        
        // Controlla se l'utente è iscritto
        const checkQuery = `SELECT num_prenotazione FROM \`${nomeTabella}\` WHERE utente_id = ?`;
        const [righe] = await connection.execute(checkQuery, [utenteId]);
        
        res.json({
            success: true,
            iscritto: righe.length > 0
        });
        
    } catch (err) {
        console.error("Errore nella verifica prenotazione:", err);
        res.status(500).json({
            success: false,
            message: "Errore interno del server"
        });
    } finally {
        connection.release();
    }
});

app.get("/api/userinfo", authenticateToken, (req, res) => {
    res.json({
        success: true,
        nome: req.user.userName
    });
});

// API per aggiungere un utente
app.post("/add-user", async (req, res) => {
    const { nome, email, password } = req.body;
     if (!nome || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Nome, email e password sono obbligatori!"
        });
    }
    const query = "INSERT INTO utenti (nome, email, password) VALUES (?, ?, ?)";
    const connection = await pool.promise().getConnection();
    try {
        await connection.execute(query, [nome, email, password]);
        return res.json({
            success: true,
            message: "Utente aggiunto con successo!"
        });
    }
    catch (err) {
        console.error("Errore nell'inserimento:", err);
        return res.status(500).json({
            success: false,
            message: "Errore nell'inserimento nel database"
        });
    }
    finally {
        connection.release();
    }
});

// API per recuperare gli eventi
app.get("/users", async (req, res) => {
    const query = "SELECT * FROM eventi ORDER BY data_evento ASC";
    const connection = await pool.promise().getConnection();
    try {
        const [righe, colonne] = await connection.execute(query);
        res.json(righe);
    } catch (err) {
        console.error("Errore durante l'esecuzione della query:", err);
        res.status(500).json({
            success: false,
            message: "Errore nel recupero degli eventi"
        });
    } finally {
        connection.release();
    }
});

app.get("/api/evento/:id", async (req, res) => {
    const eventoId = req.params.id;
    
    if (!eventoId || isNaN(eventoId)) {
        return res.status(400).json({
            success: false,
            message: "ID evento non valido"
        });
    }

    const query = "SELECT * FROM eventi WHERE id = ?";
    const connection = await pool.promise().getConnection();
    
    try {
        const [righe, colonne] = await connection.execute(query, [eventoId]);
        
        if (righe.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Evento non trovato"
            });
        }
        
        res.json({
            success: true,
            evento: righe[0]
        });
    } catch (err) {
        console.error("Errore durante l'esecuzione della query:", err);
        res.status(500).json({
            success: false,
            message: "Errore nel recupero dell'evento"
        });
    } finally {
        connection.release();
    }
});

// API per aggiungere un nuovo evento
app.post("/add-evento", async (req, res) => {
    const {nome, data_evento, ora_evento, numero_iscritti} = req.body;
    
    if (!nome || !data_evento || !ora_evento) {
        return res.status(400).json({
            success: false,
            message: "Nome, data e ora sono obbligatori"
        });
    }

    const query = "INSERT INTO eventi (nome, data_evento, ora_evento, numero_iscritti) VALUES (?, ?, ?, ?)";
    const connection = await pool.promise().getConnection();
    
    try {
        await connection.execute(query, [nome, data_evento, ora_evento, 0]);
        res.json({
            success: true,
            message: "Evento aggiunto con successo!"
        });
    } catch (err) {
        console.error("Errore durante l'inserimento:", err);
        res.status(500).json({
            success: false,
            message: "Errore nell'aggiunta dell'evento"
        });
    } finally {
        connection.release();
    }
});

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