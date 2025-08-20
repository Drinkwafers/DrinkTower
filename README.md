# Drinktowe

Sito web per la gestione e la promozione degli eventi **Drinktower**.  
Il progetto è basato su **Node.js**, **Express** e **MySQL**.

---

## Struttura del progetto

```
Drinktower/
├── public/           # Pagine e risorse accessibili senza login
│   ├── index.html
│   ├── accesso.html
│   ├── info.html
│   ├── denied.html
│   ├── 404.html
│   ├── stile/        # CSS
│   ├── script/       # JS lato client
│   ├── immagini/     # Immagini e icone
│   ├── copertine/    # Copertine eventi (.webp)
│   └── descrizioni/  # Descrizioni eventi (.txt)
│
├── private/          # Area riservata agli utenti loggati
│   ├── private.html
│   ├── script/
│   └── admin/        # Area riservata agli admin
│       └── admin.html
│
├── server.js         # Server Express
├── package.json      # Dipendenze e script npm
├── package-lock.json # Lockfile per versioni precise
├── utenti.sql        # Schema e dati iniziali utenti
├── eventi.sql        # Schema e dati iniziali eventi
├── capodanno_carlicchiano_25.sql # Schema evento extra
└── README.md         # Questo file
```

---

## Installazione e avvio

1. **Clona la repository**
   ```bash
   git clone https://github.com/tuo-utente/Drinktower.git
   cd Drinktower
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura il database**
   - Assicurati di avere MySQL attivo.
   - Importa gli script SQL nella tua istanza:
     ```bash
     mysql -u user1 -p db_tower < utenti.sql
     mysql -u user1 -p db_tower < eventi.sql
     mysql -u user1 -p db_tower < capodanno_carlicchiano_25.sql
     ```
   - Le credenziali sono configurate in `server.js`:
     ```js
     user: "user1",
     password: "pass1",
     database: "db_tower"
     ```

4. **Avvia il server**
   ```bash
   node server.js
   ```
   Ora il sito sarà disponibile su [http://localhost:3001](http://localhost:3001).

---

## Autenticazione

- L’accesso alle aree private è gestito tramite **JWT (JSON Web Token)**.
- I cookie sono inviati in modalità `httpOnly` e `sameSite=Strict`.

---

## Account demo

Nella tabella `utenti.sql` sono presenti account di esempio:
- Admin:  
  **Email:** `drinkwater@gmail.com`  
  **Password:** `27122003`
- Utente normale:  
  **Email:** `peppe@gmail.com`  
  **Password:** `Pist4cchio`

---

## Note sul repository

- La cartella `node_modules/` è esclusa tramite `.gitignore`.  
- Dopo il clone, esegui sempre `npm install` per ricostruire le dipendenze.  
- I file `.sql` inclusi servono a ricreare lo schema del database e popolarlo con dati iniziali.

---

## Licenza

Progetto a scopo didattico.  
Autore: **Alessandro Bevilacqua**
