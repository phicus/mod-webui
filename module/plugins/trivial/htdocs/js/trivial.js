// layout = window.cy.makeLayout({'name': 'cose'})
// layout.options.eles = window.cy.elements();
// layout.run()

var ctxmenu_commands_all = [{
    content: 'Search',
    select: function () {
        trivial_search(this.data('id'))
    }
}, {
    content: 'Expand',
    select: function () {
        trivial_expand(this)
    }
}, {
    content: 'View',
    select: function () {
        var url = "/cpe/" + this.data('id');
        var win = window.open(url, '_blank');
        win.focus();
    }
}, {
    content: 'Path to parent',
    select: function () {
        selectPath(this.data("id"))
    }
}]
var ctxmenu_commands_mikrotik = ctxmenu_commands_all.slice()
ctxmenu_commands_mikrotik.push({
    content: 'Winbox',
    select: function () {
        top.location.href = "winbox://" + username + "@" + this.data('address') + ':8291';
    }
});
ctxmenu_commands_mikrotik.push({
    content: 'SSH',
    select: function () {
        top.location.href = "krillssh://" + username + "@" + this.data('address') + ':22';
    }
});

var ctxmenu_commands_access = ctxmenu_commands_all.slice()
ctxmenu_commands_access.push({
    content: 'Enter the Matrix',
    select: function () {
        var url = "/matrix/?search=reg:" + this.data('id');
        var win = window.open(url, '_blank');
        win.focus();
    }
});


var ctxmenu_commands_wimax = ctxmenu_commands_all.slice()
ctxmenu_commands_wimax.push({
    content: 'Web',
    select: function () {
        var url = "http://" + this.data('address') + '.' + window.location.host.split('.')[0] + '.phicus.net';
        var win = window.open(url, '_blank');
        win.focus();
    }
});
ctxmenu_commands_wimax.push({
    content: 'Enter the Matrix',
    select: function () {
        var url = "/matrix?search=reg:" + this.data('id');
        var win = window.open(url, '_blank');
        win.focus();
    }
});


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

// LAYAOUT2 is unused
// var LAYOUT2 = {
//     name: 'preset'
// }

// TODO: Use this in selectPath function
// Hmm... Is it buggy? 🤔
const getParent = node => node._private.edges.filter(edge => node.data().id === edge.data().source)[0];

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
            // ugly
            setTimeout(() => {
                $("#load-position").click();
                // ugly
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

        // window.cy.cxtmenu({
        //   selector: 'node.ap',
        //   commands: ctxmenu_commands_wimax
        // });

        window.cy.on('tap', 'node', function (event) {
            var node = event.target;
            // TODO: handle locations
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

$('#load-position').hide();
$('#save-position').hide();
$('#work-mode').hide();
$('#center').hide();
$('#save-position-backup').hide();
$('#load-position-backup').hide();

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
    window.cy.workMode = false;
}

$('#work-mode').on('click', function () {
    workMode();
});

$('#view-mode').on('click', function () {
    viewMode();
});

$("#center").on("click", () => { cy.center() });

$('#save-position').on('click', function () {
    console.log("savePosition []")
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
    console.log("mini map was clicked! :D");
    $(".cytoscape-navigator").toggle();
});

$('#play').on('click', function () {

    var b = window.cy
        .nodes().animate({
            position: {
                x: 0,
                y: 0
            }
        })
        .delay(1000)
        .animate({
            pan: {
                x: 0,
                y: 0
            }
        });

    // a.animation().play().promise().then(function () {
    //     b.animation().play();
    // });
    //--
});

$(window).on('popstate', function (event) {
    viewMode();
    $('#loader').show();
    trivial_search($('#txtSearch').val());
});

$("#nav-filters > form").attr("action", "#")

$("#nav-filters > form").submit(e => {
    var txt = $("#search").val();
    console.log(`SEARCH: ${txt}`);
    e.preventDefault();
    viewMode();
    $('#loader').show();
    trivial_search(txt)
    console.log(`SEARCH: ${txt}`);
});

function selectPath(origin, hops = 0) {
    console.log(`origin: ${origin}`);
    let parent;
    // for any reason .edges() returns none
    cy.$(`#${origin}`)[0]._private.edges.forEach((edge) => {
        console.log("Processing edge:");
        console.log(edge);
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
        edge.originalStyle = {};
        Object.assign(edge.originalStyle, edge._private.style)
        edge.style("target-arrow-color", "red");
        edge.style("line-color", "red");
    });
    if (parent === undefined) {
        if (hops === 0) alertify.warning(`This node has not any parent, it is God.`);
        else alertify.success(`There is ${hops} hops`);
        return
    };
    hops += 1;
    selectPath(cy.$(`#${parent}`)[0].id(), hops);
}

$("#clearPaths").click(function () {
    cy.edges().forEach(e => {
        e._private.style = e.originalStyle || e._private.style;
    });
    cy.forceRender();
});

$(function () {
    if ($("#header_loading")[0].classList.value.includes("fa-refresh")) {
        $("#header_loading").parent().click();
    }
})