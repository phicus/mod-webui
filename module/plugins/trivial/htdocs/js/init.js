// Esto debería hacerse con CSS
$('#load-position').hide();
$('#save-position').hide();
$('#work-mode').hide();
$('#center').hide();
$('#save-position-backup').hide();
$('#load-position-backup').hide();

$('#work-mode').on('click', function () {
    workMode();
});

$('#view-mode').on('click', function () {
    viewMode();
});

$("#center").on("click", () => { cy.center() });

$('#save-position').on('click', function () {
    console.log("savePosition []");
    savePosition();
});

$('#load-position').on('click', function () {
    console.log("loadPosition []")
    loadPosition(true);
});

$('#mini-map').on('click', function () {
    console.log("mini map button was clicked! :D");
    $(".cytoscape-navigator").toggle();
});

$(window).on('popstate', function (event) {
    // Al pulsar el botón atrás se activa el modo view,
    // y se muestra el loader.
    viewMode();
    $('#loader').show();
    // Como "side-effect" trivial_search oculta el
    // loader y también cambia la URL del navegador.
    trivial_search($('#txtSearch').val());
});

// TRICK
// Esto hace que el formulario se envíe al propio
// documento, haciendo así que no se recarge la página
// Idealmente esto se haría con un preventDefault
// pero parece que no funciona.
$("#nav-filters > form").attr("action", "#")

// FIXME
$("#nav-filters > form").submit(e => {
    // TRICK (?)
    // Al hacer una búsqueda se captura el evento
    // y se hace una nueva búsqueda de trivial sin
    // recargar la página
    var txt = $("#search").val();
    console.log(`SEARCH: ${txt}`);
    viewMode();
    $('#loader').show();
    // trivial_search tiene el "side-effect" de ocultar el
    // loader cuando el grafo carga (técnicamente esto es de herejes
    // y debe evitarse y blah blah).
    trivial_search(txt)
    console.log(`SEARCH: ${txt}`);
});



$("#clearPaths").click(function () {
    // TRICK
    // En algún sitio muy, muy lejano se cambia el estilo de
    // algunos edges, y para guardar su estilo original, se
    // guarda en el propio objeto, en un nuevo atributo llamado
    // originalStyle.
    // Esta función limpia los estilos de los edges, poniendo su
    // estilo por defecto.


    // Explicación:
    // true || false se evalúa a true
    // false || true se evalúa a true
    // false || "some text" se evalúa a "some text", NO a true
    // así que e.prop || e.prop2 devuelve e.prop si e.prop no es false
    // (si accedes a un atributo inexistente te devuelve undefined)
    // y si e.prop es false (o undefined, etc...) entonces se devuelve e.prop2
    // Básicamente al nodo se le pone el estilo original si existe el atributo
    // y sino, se le pone el estilo actual xD
    cy.edges().forEach(e => e._private.style = e.originalStyle || e._private.style);
    cy.forceRender();
});

$(function () {
    disable_refresh();
});

// This should be the lastest being executed.
$(function () {
    trivial_search($('#txtSearch').val());
});