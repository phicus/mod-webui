// TODO: import trivial-commands

///Layouts
var LAYOUT1 = {
    name: 'cose-bilkent',
    stop: function () {
        console.log("cy::stop []");
        window.cy.nodes().lock();
    },
    randomize: true,
    gravityRangeCompound: 0.25,
    nodeDimensionsIncludeLabels: false,
    nodeRepulsion: 1000 * 1000,
    tile: true
}

// TODO: Use this in selectPath function
const getParent = node => {
    let edge = node._private.edges.filter(edge => node.data().id === edge.data().source)[0];
    return cy.$("#" + edge.data().target)[0];
}

// FIXME
function trivial_expand(node) {
    let nodesThatShouldNotBeRemoved = [];
    while (n) {
        nodesThatShouldNotBeRemoved.push(n.data().id);
        node = getParent(node);
        console.log(node && node.data().id);
    }
    cy.nodes().filter(e => !nodesThatShouldNotBeRemoved.includes(e.data().id)).remove();
}

function trivial_init(data) {
    $("#trivial").hide();
    var cy = cytoscape({
        container: document.getElementById('trivial'),
        ready: function () {
            console.log("cy::ready []");
            window.cy = this;
            // ugly and TRICKY
            // 25 después de que el grafo emita el evento
            // ready, acermos click en el botón de load position
            // (no, ejecutar loadPosition(true) justo como lo hace el
            // event handler de load-position no sirve)
            setTimeout(() => {
                $("#load-position").click();
                // ugly and TRICKY
                // 55 milisegundos después de que se carguen las posiciones
                // se configura el zoom, se centra, se oculta el loader etc...
                setTimeout(() => {
                    cy.zoom(cy.maxZoom() / 20);
                    console.log("GOING TO CENTER GRAPH")
                    setTimeout(() => { cy.center(); console.log("CENTER EXECUTED") }, 120);
                    console.log("GRAPH (SHOULD BE) CENTERED")
                    $('#loader').hide();
                    $('#work-mode').show();
                    $('#center').show();
                    $("#trivial").show();
                }, 55);
                // window.cy.nodes().unlock();
                // loadPosition(true);
                // window.cy.nodes().lock();
            }, 25);
        },
        boxSelectionEnabled: true,
        maxZoom: 2,
        minZoom: 0.035,
        style: TRIVIAL_STYLE,
        elements: data,
        layout: LAYOUT1
    });
    cy.panzoom();

    var defaults = {
        container: false // can be a HTML or jQuery element or jQuery selector
        , viewLiveFramerate: 0 // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
        , thumbnailEventFramerate: 30 // max thumbnail's updates per second triggered by graph updates
        , thumbnailLiveFramerate: false // max thumbnail's updates per second. Set false to disable
        , dblClickDelay: 200 // milliseconds
        , removeCustomContainer: true // destroy the container specified by user on plugin destroy
        , rerenderDelay: 100 // ms to throttle rerender updates to the panzoom for performance
    };

    cy.navigator(defaults); // get navigator instance, nav

}

function trivial_search(txt) {
    $('#search').val(txt);
    // side-effect
    history.pushState('trivial:' + txt, 'Trivial: ' + txt, '/trivial?search=' + txt);
    $.getJSON("trivial.json?search=" + txt, function (data) {
        trivial_init(data);

        window.cy.cxtmenu({
            selector: 'node',
            commands: function (e) {
                console.log(this)

                if (e.data()['tech'] == "wimax") {
                    return ctxmenu_commands_wimax;
                }

                if (e.data()['model'].search('Mikrotik') == 0) {
                    return ctxmenu_commands_mikrotik;
                }

                return ctxmenu_commands_all;
            }
        });

        window.cy.on('tap', 'node', function (event) {
            var node = event.target;
            // TODO: handle locations
            // If we are in work mode, we do not want to open
            // anything when clicking a node.
            // And if the node is a parent, it is a box, no do not
            // want to open a box (that is a location)
            if (window.cy.workMode || node.isParent()) { return }
            var url = "/cpe/" + node.data('id');
            var win = window.open(url, '_blank');
            win.focus();
        });


        window.cy.on('mouseover', 'node', function (event) {
            // Very ugly. Maybe also buggy
            if (window.cy.workMode) { return }
            var node = event.target;

            console.log(event.renderedPosition.x + '/' + event.renderedPosition.y);
            console.log(node.data().id);
            $.get('/cpe/quickservices/' + node.data().id, function (data) {
                console.log(`DATA: ${data}
              ${typeof data}`)
                $('#info').show();
                $('#info').html(data);
                $('#info').css('left', event.renderedPosition.x + 30 + 'px');
                $('#info').css('top', event.renderedPosition.y + 30 + 'px');
            });
        });

        window.cy.on('mouseout', 'node', function () {
            $('#info').hide();
        });
    });
}

$(function () {
    trivial_search($('#txtSearch').val());
})

function savePosition(saveBackup) {
    // TODO: this only works with a specific search
    // Generally, you view "type:host bp:>2", you edit it
    // and you save THAT graph
    // So, if you search " (insert some awsome filter here)"
    // then you do not have the positions of that search
    // or maybe you ahve only some positions
    // and this results in an non-beauty graph

    // TODO: use alertify (it is more beatiful :D)
    if (!confirm("really?")) {
        return;
    }

    data = {};
    window.cy.nodes()
        .forEach(n => data[n.data().id] = { 'position': n.position() });
    // $.each(window.cy.nodes(), function (k, node) {
    //     data[node.data().id] = {
    //         'position': node.position()
    //     };
    // });

    if (saveBackup) { data = JSON.stringify({ backup: data }) }
    else { data = JSON.stringify({ save1: data }) }

    //localStorage.setItem('trivial', JSON.stringify(data));
    $.ajax({
        type: "POST",
        url: '/trivial/settings/save',
        dataType: 'json',
        data: data,
        success: function (data) {
            console.log(data);
            alert("Save result:" + data.status);
        }
    });
}

function loadPosition(shouldUnlock, loadBackup) {
    //var loadData = JSON.parse(localStorage.getItem('trivial'));
    window.cy.nodes().unlock();
    $.ajax({
        dataType: 'json',
        url: '/trivial/settings/load',
        success: (data) => {
            if (loadBackup) { data = data.backup }
            else { data = data.save1 }
            // TRICKY
            // Al parecer para que se cargen bien las positiones
            // hay que establecer las posiciones 2 veces
            for (var x = 0; x < 2; x++) {
                console.log(`LOAD: ${x}`)
                $.each(data, (k, v) => {
                    //console.log(v);
                    ele = this.cy.getElementById(k);
                    ele.position(v.position)
                })
            }
            if (!shouldUnlock) {
                window.cy.nodes().lock();
            }
        }
    });
}

function workMode() {
    $('#load-position').show();
    $('#save-position').show();
    $('#save-position-backup').show();
    $('#load-position-backup').show();
    $('#view-mode').show();
    $('#work-mode').hide();
    window.cy.nodes().unlock();

    $('#trivial').css('background-color', '#f3c019');
    window.cy.workMode = true;
}

function viewMode() {
    $('#load-position').hide();
    $('#load-position-backup').hide();
    $('#save-position').hide();
    $('#save-position-backup').hide();
    $('#view-mode').hide();
    $('#work-mode').show();
    window.cy.nodes().lock();

    $('#trivial').css('background-color', 'transparent');
    // 
    window.cy.workMode = false;
}

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

$('#save-position-backup').on('click', function () {
    console.log("savePositionBackup []")
    savePosition(true);
});

$('#load-position').on('click', function () {
    console.log("loadPosition []")
    loadPosition(true);
});

$('#load-position-backup').on('click', function () {
    console.log("loadPositionBackup []")
    loadPosition(true, true);
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

// TRICKY
// Esto hace que el formulario se envíe al propio
// documento, haciendo así que no se recarge la página
// Idealmente esto se haría con un preventDefault
// pero parece que no funciona.
$("#nav-filters > form").attr("action", "#")

$("#nav-filters > form").submit(e => {
    // TRICKY (?)
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

function selectPath(origin, hops = 0) {
    // Esta función busca el padre de un nodo
    // y pinta el edge, entonces incrementa el
    // contador de hops y se ejecuta a sí misma,
    // es una función recursiva.
    console.log(`origin: ${origin}`);
    let parent;
    // for any reason .edges() returns none
    cy.$(`#${origin}`)[0]._private.edges.forEach((edge) => {
        console.log("Processing edge:");
        console.log(edge);
        // En este grafo, el edge que enlaza un hijo
        // a su padre, no tiene la dirección padre -> hijo
        // como normalmente sino que es hijo -> padre
        // Entonces, cuando el origen del edge es el propio
        // nodo, es un enlace hacia un padre.
        // En cambio, si el origen del edge es otro nodo,
        // es un enlace con un hijo.
        if (edge.data().source !== origin) return
        parent = edge.data().target;
        console.log(`We got a parent! It is: ${parent}`);
        // Select is like cliking in the edge:
        // it selects the edge and changes its color
        // but if you click somewhere, its color
        // gets back to default
        // e.select();
        // Mmm... Nope xD
        // Object.keys(edge.css()).filter(e => e.includes("color")).forEach(e => edge.style(e, "red"));
        // Se guarda el estilo actual para restaurarlo más tarde
        edge.originalStyle = {};
        Object.assign(edge.originalStyle, edge._private.style)
        edge.style("target-arrow-color", "red");
        edge.style("line-color", "red");
    });
    // Si no se ha encontrado ningún padre y los saltos son 0,
    // el nodo no tiene ningún padre, así que él es el creador
    // de todo es decir: Dios
    // Si tiene algún padre, los enlaces ya están pintados, sólo resta
    // notificar el número de saltos
    if (parent === undefined) {
        if (hops === 0) alertify.warning(`This node has not any parent, it is God.`);
        else alertify.success(`There is ${hops} hops`);
        return
    };
    hops += 1;
    selectPath(cy.$(`#${parent}`)[0].id(), hops);
}

$("#clearPaths").click(function () {
    // TRICKY
    // En algún sitio muy, muy lejano se cambia el estilo de
    // algunos edges, y para guardar su estilo original, se
    // guarda en el propio objeto, en un nuevo atributo llamado
    // originalStyle.
    // Esta función limpia los estilos de los edges, poniendo su
    // estilo por defecto.
    cy.edges().forEach(e => {
        // Explicación:
        // true || false se evalúa a true
        // false || true se evalúa a true
        // false || "some text" se evalúa a "some text", NO a true
        // así que e.prop || e.prop2 devuelve e.prop si e.prop no es false
        // (si accedes a un atributo inexistente te devuelve undefined)
        // y si e.prop es false (o undefined, etc...) entonces se devuelve e.prop2
        // Básicamente al nodo se le pone el estilo original si existe el atributo
        // y sino, se le pone el estilo actual xD
        e._private.style = e.originalStyle || e._private.style;
    });
    cy.forceRender();
});

$(function () {
    // TRICKY
    // Esto es para desactivar el auto-refresco.
    // Cuando el refresco está activo, el botón se pinta sin la raya,
    // la clase de ese icono es "fa-refresh", así que se comprueba si
    // #header_loading tiene esa clase; de ser así se hace click en el
    // botón.
    if ($("#header_loading")[0].classList.value.includes("fa-refresh")) {
        $("#header_loading").parent().click();
    }
})