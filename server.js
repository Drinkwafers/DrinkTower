const express = require('express');
const cookieParser = require("cookie-parser");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());


// Creo un pool di connessioni
const pool = mysql.createPool(
{
    host: "localhost",
    user: "user1",
    password: "pass1",
    database: "mio_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware per loggare il metodo HTTP, l'URL e la durata della richiesta
app.use((req, res, next) => {
    const start = Date.now(); // Tempo di inizio
    res.on('finish', () => {  // Eseguito quando la risposta viene inviata
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${duration}ms`);
    });
    next();
});

// Login - imposta il cookie
app.get("/login", (req, res) => {
    res.cookie("auth", "true", { maxAge: 600000, httpOnly: true, secure: true });
    res.redirect("/restricted.html"); // reindirizza all'area riservata
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
    }
    else {
        res.redirect("/denied.html");
    }
});

app.use (express.static("public"));
app.get('/eventi', (req, res) => res.sendFile(__dirname + '/eventi.html'));

// Middleware per gestire errori 404 (pagina non trovata)
app.use((req, res, next) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

// API per recuperare la lista utenti
app.get("/users", async (req, res) => {
    const query = "SELECT * FROM utenti";
    const connection = await pool.promise().getConnection();
    try {
        const [righe, colonne] = await connection.execute(query);
        res.json(righe);
    }
    catch (err) {
        console.error("Errore durante l'esecuzione della query:", err);
        res.status(500).json({
            success: false,
            message: "Errore"
        });
    }
    finally {
        connection.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});