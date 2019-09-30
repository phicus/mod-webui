const obEach = (object, func) => Object.entries(object).forEach(([k, v]) => func(k, v));
const getEdgeToParent = node => node._private.edges.filter(edge => node.data().id === edge.data().source)[0];
// TODO: Use this in selectPath function
const getParent = node => getEdgeToParent(node) && cy.$(`#${getEdgeToParent(node).data().target}`)[0];
// TODO: this does not work
const setupZoom = async _ => {await sleep(500); cy.zoom(0.06936194370526784); (async _ => {await sleep(100); cy.center()})()};
const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const initButtons = _ => $('#loader').hide() && $('#work-mode, #center, #trivial').show();
const initNavigator = (options = undefined) => cy.navigator(options);
const savePosition = async () => alertify.confirm("Do you want to save?", _ => {saveToLocalStorage(); saveToServer()});
const loadPosition = async (shouldUnlock) => {await sleep(500); await loadPositionFromLocalStorage(shouldUnlock); loadPositionFromServer(shouldUnlock)};
const elementById = id => cy.getElementById(id.startsWith("#") ? id : `#${id}`);
const setPositions = data => obEach(data, (k, v) => ele = this.cy.getElementById(k).position(v.position));

///Layouts
var LAYOUT1 = {
    name: 'cose-bilkent',
    stop: function () {
        console.log("cy::stop []");
        window.cy.nodes().lock();
    },
    randomize: true,
    gravityRangeCompound: 0.25,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: 1000 * 1000,
    tile: true
}

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
            .then(initButtons).then(async _ => {
                await sleep(10);
                cy.panzoom();
                initNavigator();
            }).then(setupZoom);
        },
        boxSelectionEnabled: true,
        maxZoom: 2,
        minZoom: 0.035,
        style: TRIVIAL_STYLE,
        elements: data,
        layout: LAYOUT1,
    });
    

    cy.cxtmenu({
        selector: 'node',
        commands: function (e) {
            console.log(this)
            if (e.data()['tech'] == "wimax") return ctxmenu_commands_wimax;
            if (e.data()['model'].search('Mikrotik') == 0) return ctxmenu_commands_mikrotik;
            return ctxmenu_commands_all;
        }
    });

    cy.on('tap', 'node', function (event) {
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

    cy.on('mouseover', 'node', function (event) {
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
            $('#info').css('left', `${event.renderedPosition.x + 50}px`);
            $('#info').css('top', `${event.renderedPosition.y + 50}px`);
        });
    });

    cy.on('mouseout', 'node', () => $('#info').hide());
}

function trivial_search(txt) {
    $('#search').val(txt);
    // side-effect
    history.pushState(`trivial: ${txt}`, `Trivial: ${txt}`, `/trivial?search=${txt}`);
    $.getJSON("trivial.json?search=" + txt, trivial_init);
}

async function saveToLocalStorage() {
    let data = {};
    cy.nodes().forEach(n => data[n.data().id] = { 'position': n.position() });
    data = JSON.stringify({save1: data});
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

async function loadPositionFromLocalStorage(shouldUnlock) {
    cy.nodes().unlock();
    let graph = JSON.parse(localStorage.getItem("graph"));
    if (graph === null) return;
    // TRICK
    // Al parecer para que se cargen bien las positiones
    // hay que establecer las posiciones 2 veces
    console.log("LOAD");
    setPositions(graph.save1);
    setPositions(graph.save1);
    cy.forceRender();
    // await sleep(800);
    if (!shouldUnlock) cy.nodes().lock();
}


function loadPositionFromServer(shouldUnlock) {
    //var loadData = JSON.parse(localStorage.getItem('trivial'));
    window.cy.nodes().unlock();
    $.ajax({
        dataType: 'json',
        url: '/trivial/settings/load',
        success: data => {
            console.log("LOAD");
            if (data.save1) {
                setPositions(data.save1);
            }
            if (!shouldUnlock) {
                cy.nodes().lock();
            }
        }
    });
}

function workMode() {
    $('#load-position').show();
    $('#load-position-server').show();
    $('#save-position').show();
    $('#view-mode').show();
    $('#work-mode').hide();
    window.cy.nodes().unlock();

    $('#trivial').css('background-color', '#f3c019');
    window.cy.workMode = true;
}

function viewMode() {
    $('#load-position').hide();
    $('#load-position-server').hide();
    $('#save-position').hide();
    $('#view-mode').hide();
    $('#work-mode').show();
    window.cy.nodes().lock();

    $('#trivial').css('background-color', 'transparent');

    window.cy.workMode = false;
}

function selectPath(origin, hops = 0) {
    while (true) {
        console.log(`origin: ${origin}`);
        let parent = getParent(origin);
        if (parent === undefined || parseFloat === null) {
            if (hops === 0) alertify.warning(`This node has not any parent, it is God`);
            else alertify.success(`There is ${hops} hops`);
            break
        };
        let edge = getEdgeToParent(origin);
        edge.originalStyle = {};
        Object.assign(edge.originalStyle, edge._private.style)
        edge.style("target-arrow-color", "red");
        edge.style("line-color", "red");
        hops += 1;
        origin = parent;
    }
}

// See init.js