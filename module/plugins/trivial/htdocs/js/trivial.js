// See trivial-commands.

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

// Utils
const obEach = (object, func) => Object.entries(object).forEach(([k, v]) => func(k, v));
const getEdgeToParent = node => node._private.edges.filter(edge => node.data().id === edge.data().source)[0];
const setupZoom = _ => cy.zoom(cy.maxZoom() / 20) && cy.center();
const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms))
// TODO: Use this in selectPath function
const getParent = node => getEdgeToParent(node) && cy.$(`#${getEdgeToParent(node).data().target}`)[0];
const initButtons = _ => $('#loader').hide() && $('#work-mode, #center, #trivial').show();

// FIXME
// function trivial_expand(node) {
//     let nodesThatShouldNotBeRemoved = [];
//     while (node) {
//         nodesThatShouldNotBeRemoved.push(node.data().id);
//         node = getParent(node);
//         console.log(node && node.data().id);
//     }
//     console.log(`nodesThatShouldNotBeRemoved: ${nodesThatShouldNotBeRemoved}`);
//     cy.nodes()
//         .filter(e => !nodesThatShouldNotBeRemoved.includes(e.data().id))
//         .forEach(n => console.log(`deleting node: ${n}`) && n.remove());
//     // .remove();
// }

function trivial_init(data) {
    $("#trivial").hide();
    var cy = cytoscape({
        container: document.getElementById('trivial'),
        ready: function () {
            console.log("cy::ready []");
            window.cy = this;
            loadPosition()
                .then(setupZoom)
                .then(initButtons);
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
        container: false, // can be a HTML or jQuery element or jQuery selector
        viewLiveFramerate: 0, // set false to update graph pan only on drag end; set 0 to do it instantly; set a number (frames per second) to update not more than N times per second
        thumbnailEventFramerate: 30, // max thumbnail's updates per second triggered by graph updates
        thumbnailLiveFramerate: false, // max thumbnail's updates per second. Set false to disable
        dblClickDelay: 200, // milliseconds
        removeCustomContainer: true, // destroy the container specified by user on plugin destroy
        rerenderDelay: 100, // ms to throttle rerender updates to the panzoom for performance
    };
    cy.navigator(defaults); // get navigator instance, nav
}

function trivial_search(txt) {
    $('#search').val(txt);
    // side-effect
    history.pushState(`trivial: ${txt}`, `Trivial: ${txt}`, `/trivial?search=${txt}`);
    $.getJSON("trivial.json?search=" + txt, function (data) {
        trivial_init(data);
        window.cy.cxtmenu({
            selector: 'node',
            commands: function (e) {
                console.log(this)
                if (e.data()['tech'] == "wimax") return ctxmenu_commands_wimax;
                if (e.data()['model'].search('Mikrotik') == 0) return ctxmenu_commands_mikrotik;
                return ctxmenu_commands_all;
            }
        });

        window.cy.on('tap', 'node', function (event) {
            const node = event.target;
            // TODO: handle locations
            // If we are in work mode, we do not want to open
            // anything when clicking a node.
            // And if the node is a parent, it is a box, no do not
            // want to open a box (that is a location)
            if (window.cy.workMode || node.isParent()) return
            const url = `/cpe/${node.data('id')}`;
            window.open(url, '_blank').focus();
        });


        window.cy.on('mouseover', 'node', function (event) {
            // Very ugly. Maybe also buggy
            if (window.cy.workMode) { return }
            var node = event.target;

            console.log(`${event.renderedPosition.x}/${event.renderedPosition.y}`);
            console.log(node.data().id);
            $.get(`/cpe/quickservices/${node.data().id}`, function (data) {
                console.log(`DATA: ${data}
                            ${typeof data}`)
                $('#info').show();
                $('#info').html(data);
                // TODO: use rem instead of pixels.
                $('#info').css('left', `${event.renderedPosition.x + 30}px`);
                $('#info').css('top', `${event.renderedPosition.y + 30}px`);
            });
        });

        window.cy.on('mouseout', 'node', function () {
            $('#info').hide();
        });
    });
}

async function saveToLocalStorage() {
    let data = {};
    cy.nodes().forEach(n => data[n.data().id] = { 'position': n.position() });
    data = JSON.stringify(data);
    localStorage.setItem('graph', data);
}

async function saveToServer() {
    let data = {};
    cy.nodes().forEach(n => data[n.data().id] = { 'position': n.position() });
    data = JSON.stringify({ save1: data });
    $.ajax({
        type: "POST",
        url: '/trivial/settings/save',
        dataType: 'json',
        data: data,
        success: function (data) {
            console.log(data);
            alertify.success("Save result:" + data.status);
        }
    });
}
async function savePosition() {
    // TODO: this only works with a specific search
    // Generally, you view "type:host bp:>2", you edit it
    // and you save THAT graph
    // So, if you search " (insert some awsome filter here)"
    // then you do not have the positions of that search
    // or maybe you ahve only some positions
    // and this results in an non-beauty graph

    // Execute this only if user says that wants to save.
    function save() {
        saveToLocalStorage();
        saveToServer();
    }
    alertify.confirm("Do you want to save?", save);

}

async function loadPosition(shouldUnlock) {
    cy.nodes().unlock();
    let graph = JSON.parse(localStorage.getItem("graph"));
    if (graph === null) return;
    // TRICK
    // Al parecer para que se cargen bien las positiones
    // hay que establecer las posiciones 2 veces
    console.log("LOAD: 0");
    obEach(graph, (k, v) => this.cy.getElementById(k).position(v.position));
    console.log("LOAD: 1");
    obEach(graph, (k, v) => this.cy.getElementById(k).position(v.position));
    cy.forceRender();
    // await sleep(800);
    if (!shouldUnlock) cy.nodes().lock();
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

// See init.js