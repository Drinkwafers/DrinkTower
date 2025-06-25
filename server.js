const express = require('express');
const cookieParser = require("cookie-parser");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());

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

// Middleware per loggare il metodo HTTP, l'URL e la durata della richiesta
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${duration}ms`);
    });
    next();
});

// Login - imposta il cookie
app.get("/login", (req, res) => {
    res.cookie("auth", "true", { maxAge: 600000, httpOnly: true, secure: true });
    res.redirect("/restricted.html");
});

// Logout - cancella il cookie
app.get("/logout", (req, res) => {
    res.clearCookie("auth");
    res.redirect("/");
});

// Accesso all'area riservata
app.get("/restricted.html", (req, res) => {
    if (req.cookies.auth === "true") {
        res.sendFile(__dirname + "/private/restricted.html");
    } else {
        res.redirect("/denied.html");
    }
});

// API per recuperare gli eventi (CORRETTO: usa tabella eventi)
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

// API per aggiungere un nuovo evento (AGGIUNTO)
app.post("/add-user", async (req, res) => {
    const { nome, data_evento, ora_evento, numero_iscritti } = req.body;
    
    // Validazione base
    if (!nome || !data_evento || !ora_evento) {
        return res.status(400).json({
            success: false,
            message: "Nome, data e ora sono obbligatori"
        });
    }

    const query = "INSERT INTO eventi (nome, data_evento, ora_evento, numero_iscritti) VALUES (?, ?, ?, ?)";
    const connection = await pool.promise().getConnection();
    
    try {
        await connection.execute(query, [nome, data_evento, ora_evento, numero_iscritti || 0]);
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

// Middleware per gestire errori 404
app.use((req, res, next) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});