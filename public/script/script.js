document.addEventListener('DOMContentLoaded', function ()
{
    function setFullHeight()
    {
        const container = document.querySelector('.fullscreen-container');
        container.style.height = window.innerHeight + 'px';
    }
    setFullHeight();
});
