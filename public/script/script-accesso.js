window.onload = function () {

    const logform = document.getElementById("loginForm");

    logform.addEventListener("submit", async function(e)
    {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try
        {
            const response = await fetch("/api/login",
            {
                method: "POST",
                headers:
                {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            const message = document.getElementById("message");
            if (data.success)
            {
                message.textContent = "Login effettuato con successo!";
                window.location.href = "/private/private.html";
            }
            else
            {
                message.textContent = "Errore: " + data.message;
            }
        }
        catch (error)
        {
            document.getElementById("message").textContent = "Errore di rete.";
        }
    });

    const regform = document.getElementById("registerForm");

    regform.addEventListener("submit", async (event) => {

        event.preventDefault();

        const userData = {
            nome: document.getElementById("nome-register").value,
            email: document.getElementById("email-register").value,
            password: document.getElementById("password-register").value
        };

        try
        {
            console.log("Invio dati utente:", userData);
            const response = await fetch("/add-user",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            console.log("Response:", response);
            const data = await response.json();
            if (data.success)
            {
                alert(data.message);
                regform.reset();

                // Riempio i campi di login con le credenziali appena registrate
                document.getElementById("email").value = userData.email;
                document.getElementById("password").value = userData.password;
                
                // Simulo il submit del form di login per riutilizzare la funzione esistente
                document.getElementById("loginForm").dispatchEvent(new Event('submit'));
            }
            else
            {
                alert(data.message);
            }
        }
        catch (error)
        {
            console.error("Errore:", error);
            alert("Errore nella comunicazione con il server.");
        }
    });
};
