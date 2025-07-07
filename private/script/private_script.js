window.onload = async function () {

    try {
        const res = await fetch("/private/restricted.html");
        if (res.status === 401) {
            window.location.href = "/accesso.html";
            return;
        }
        const data = await res.text();
        document.body.innerHTML = data;

        // Vislualizzo il nome utente
        const userRes = await fetch("/api/userinfo", {
            credentials: "include"
        });
        const userData = await userRes.json();
        if (userData.success) {
            document.getElementById("userName").textContent = userData.nome;
        }

    }
    catch (err) {
        console.error("Errore fetch pagina protetta:", err);
    }

    const btn = document.getElementById("logoutBtn");
    btn.addEventListener("click", async function logout() {
        try {
            const res = await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                window.location.href = "/index.html";
            } else {
                console.error("Errore nel logout");
            }
        } catch (err) {
            console.error("Errore nella richiesta di logout:", err);
        }
    });

};
