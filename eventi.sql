-- Creazione della tabella eventi
CREATE TABLE eventi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    data_evento DATE NOT NULL,
    ora_evento TIME NOT NULL,
    numero_iscritti INT DEFAULT 0
);

-- Inserimento di alcuni eventi di esempio
INSERT INTO eventi (nome, data_evento, ora_evento, numero_iscritti) VALUES
('Giornata del Grazie 2024', '2024-11-29', '19:30:00', 20),
('Capodanno 2024', '2024-12-31', '19:30:00', 30),
('Carnevale Carlicchiano 2025', '2025-03-21', '21:00:00', 15),
('Prima TV "La Partita"', '2025-04-07', '22:00:00', 12),
('Finale Champions League', '2025-05-31', '21:00:00', 15),
('Pizza Party', '2025-06-21', '19:00:00', 16),
('Poker stitico', '2025-06-25', '22:30:00', 8),
('Capodanno Carlicchiano 2025', '2025-07-17', '19:00:00', 0);