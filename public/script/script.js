document.addEventListener('DOMContentLoaded', function ()
{
    function setFullHeight()
    {
        // Seleziona TUTTI gli elementi con la classe fullscreen-container
        const containers = document.querySelectorAll('.fullscreen-container');
        
        // Applica l'altezza a ciascuno di essi
        containers.forEach(container => {
            container.style.height = window.innerHeight + 'px';
        });
    }
    setFullHeight();
});
