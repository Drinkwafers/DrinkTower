-- Creazione della tabella eventi
DROP TABLE IF EXISTS capodanno_carlicchiano_25 CASCADE;
CREATE TABLE capodanno_carlicchiano_25
(
    num_prenotazione INT AUTO_INCREMENT PRIMARY KEY,
    nome INT,
    email VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (nome) REFERENCES utenti(nome) ON DELETE CASCADE,
    FOREIGN KEY (email) REFERENCES utenti(email) ON DELETE CASCADE
);