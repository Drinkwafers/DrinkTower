window.onload = async function ()
{
    const response = await fetch('/users');
    const eventi = await response.json();

    const select = document.getElementById("select-rimuovi-evento-form");

    eventi.forEach(evento => {
        select.innerHTML = 
            `<option value="${evento.id}">${evento.nome}</option>`;
    });
}