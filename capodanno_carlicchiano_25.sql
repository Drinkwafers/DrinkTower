DROP TABLE IF EXISTS peppempleanno_25  CASCADE;
CREATE TABLE peppempleanno_25 
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    utente_id INT NOT NULL,
    data_prenotazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventi(id) ON DELETE CASCADE,
    FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE CASCADE,
    UNIQUE KEY unique_prenotazione (evento_id, utente_id)
);