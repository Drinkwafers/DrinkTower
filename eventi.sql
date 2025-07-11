-- Creazione della tabella eventi
drop table if exists eventi CASCADE;
CREATE TABLE eventi
(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL UNIQUE,
    data_evento DATE NOT NULL,
    ora_evento TIME NOT NULL,
    numero_iscritti INT DEFAULT 0,
    copertina VARCHAR(50) DEFAULT NULL,
    descrizione VARCHAR(45) DEFAULT NULL
);

-- Inserimento di alcuni eventi di esempio
-- ...existing code...
INSERT INTO eventi (nome, data_evento, ora_evento, numero_iscritti, copertina, descrizione) VALUES
('Giornata del Grazie 24', '2024-11-29', '19:30:00', 20, 'copertine/giornata_del_grazie_24.webp', 'descrizioni/giornata_del_grazie_24.txt'),
('Capodanno 24', '2024-12-31', '19:30:00', 30, 'copertine/capodanno_24.webp', 'descrizioni/capodanno_24.txt'),
('Carnevale Carlicchiano 25', '2025-03-21', '21:00:00', 15, 'copertine/carnevale_carlicchiano_25.webp', 'descrizioni/carnevale_carlicchiano_25.txt'),
('Prima TV "La Partita"', '2025-04-07', '22:00:00', 12, 'copertine/prima_tv_la_partita.webp', 'descrizioni/prima_tv_la_partita.txt'),
('Finale Champions League 25', '2025-05-31', '21:00:00', 15, 'copertine/finale_champions_league_25.webp', 'descrizioni/finale_champions_league_25.txt'),
('Pizza Party', '2025-06-21', '19:00:00', 16, 'copertine/pizza_party.webp', 'descrizioni/pizza_party.txt'),
('Poker stitico', '2025-06-25', '22:30:00', 8, 'copertine/poker_stitico.webp', 'descrizioni/poker_stitico.txt'),
('Capodanno Carlicchiano 25', '2025-07-24', '19:00:00', 12, 'copertine/capodanno_carlicchiano_25.webp', 'descrizioni/capodanno_carlicchiano_25.txt');