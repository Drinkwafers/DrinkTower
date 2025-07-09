DROP TABLE IF EXISTS utenti;
-- Creazione della tabella
CREATE TABLE utenti (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- Inserimento dei dati
INSERT INTO utenti (nome, email, password) VALUES
('Alessandro Bevilacqua', 'drinkwater@gmail.com', '27122003'),
('Peppe Lentini', 'peppe@gmail.com', 'Pist4cchio');