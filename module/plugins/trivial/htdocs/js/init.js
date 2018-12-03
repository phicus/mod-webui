$(function () {
    trivial_search(txtSearch.val());
});

const navButton = $(".cytoscape-navigator");
const loadPositionButton = $('#load-position');
const loadPositionServerButton = $("#load-position-server")
const savePositionButton = $('#save-position');
const workModeButton = $('#work-mode');
const viewModeButton = $('#view-mode');
const centerButton = $('#center');
const miniMap = $('#mini-map');
const form = $("#nav-filters > form");
const txtSearch = $('#txtSearch');
const crearPathsButton = $("#clearPaths");

const searchs = [];
$(() => searchs.push(txtSearch.val()))

// TODO: Esto debería hacerse con CSS.
loadPositionButton.hide();
loadPositionServerButton.hide();
savePositionButton.hide();
workModeButton.hide();
centerButton.hide();

workModeButton.on('click', workMode);

viewModeButton.on('click', viewMode);

centerButton.on("click", () => cy.center());

savePositionButton.on('click', () => {
    console.log("savePosition []");
    savePosition();
});

loadPositionButton.on('click', () => {
    console.log("loadPosition []");
    loadPosition(true);
});

loadPositionServerButton.on('click', () => {
    console.log("loadPosition []");
    loadPositionFromServer(true);
});

miniMap.on('click', () => {console.log("mini map button was clicked! :D"); navButton.toggle()});

$(window).on('popstate', function (event) {
    console.log("poping");
    searchs.pop();
    if (searchs.length === 0) return;
    console.log("after searchs");
    event.preventDefault();
    event.stopPropagation();
    $('#loader').show();
    const search = searchs[searchs.length - 1];
    console.log(`search: ${search}`);
    $('#txtSearch').val(search);
    history.pushState("", "trivial", "/trivial?search=" + search)
    // Como "side-effect" trivial_search oculta el
    // loader y también cambia la URL del navegador.
    trivial_search(search);
    // Al pulsar el botón atrás se activa el modo view,
    // y se muestra el loader.
    viewMode();
});

// FIXME
form.submit(e => {
    e.preventDefault();
    e.stopPropagation();
    const txt = $("#search").val();
    if (txt !== searchs[searchs.length - 1]) searchs.push(txt);
    console.log(`SEARCH: ${txt}`);
    viewMode();
    $('#loader').show();
    // trivial_search tiene el "side-effect" de ocultar el
    // loader cuando el grafo carga (técnicamente esto es de herejes
    // y debe evitarse y blah blah).
    trivial_search(txt);
    console.log(`SEARCH: ${txt}`);
});

crearPathsButton.click(function () {
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