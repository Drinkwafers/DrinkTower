window.onload = function () {

    const form = document.getElementById("user-form");
    const bottone1 = document.getElementById("bottone1");
    const lista1 = document.getElementById("lista1");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const userData = {
            nome: document.getElementById("nome").value,
            data_evento: document.getElementById("data_evento").value,
            ora_evento: document.getElementById("ora_evento").value,
            numero_iscritti: document.getElementById("numero_iscritti").value
        };

        try
        {
            const response = await fetch("/add-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (data.success)
            {
                alert(data.message);
                form.reset();
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

    bottone1.addEventListener("click", async () => {
        try
        {
            const response = await fetch('/users');
            if (!response.ok)
            {
                throw new Error('Errore nel recupero degli utenti');
            }
            const data = await response.json();
            lista1.textContent = "";
            data.forEach(user => {
                const li = document.createElement("li");
                li.textContent = user.nome + " - " + user.data_evento + " " + user.ora_evento + " - Iscritti: " + user.numero_iscritti;
                lista1.appendChild(li);
            });
        }
        catch (error)
        {
            console.error("Errore:", error);
        }
    });
};
