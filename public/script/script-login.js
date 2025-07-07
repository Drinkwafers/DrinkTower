window.onload = function () {

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function(e)
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
                window.location.href = "/private/restricted.html";
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

};
