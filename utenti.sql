DROP TABLE IF EXISTS utenti CASCADE;
-- Creazione della tabella
CREATE TABLE utenti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  admin BOOLEAN DEFAULT FALSE
);

-- Inserimento dei dati
INSERT INTO utenti (nome, email, password, admin) VALUES
('Alessandro Bevilacqua', 'drinkwater@gmail.com', 'Bricc0Br?', TRUE);