// layout = window.cy.makeLayout({'name': 'cose'})
// layout.options.eles = window.cy.elements();
// layout.run()
var tryPromise = fn => Promise.resolve().then(fn);
var calculateCachedCentrality = () => {
    var nodes = cy.nodes();
    if (nodes.length > 0 && nodes[0].data('centrality') == null) {
        var centrality = cy.elements().closenessCentralityNormalized();
        nodes.forEach(n => n.data('centrality', centrality.closeness(n)));
    }
};
var $layout = $('#layout');
var maxLayoutDuration = 1500;
var layoutPadding = 50;
var concentric = function (node) {
    calculateCachedCentrality();
    return node.data('centrality');
};
var levelWidth = function (nodes) {
    calculateCachedCentrality();
    var min = nodes.min(n => n.data('centrality')).value;
    var max = nodes.max(n => n.data('centrality')).value;
    return (max - min) / 5;
};
var layouts = {
    cola: {
        name: 'cola',
        padding: layoutPadding,
        nodeSpacing: 12,
        edgeLengthVal: 45,
        animate: true,
        randomize: true,
        maxSimulationTime: maxLayoutDuration,
        boundingBox: { // to give cola more space to resolve initial overlaps
            x1: 0,
            y1: 0,
            x2: 10000,
            y2: 10000
        },
        edgeLength: function (e) {
            var w = e.data('weight');

            if (w == null) {
                w = 0.5;
            }

            return 45 / w;
        }
    },
    concentricCentrality: {
        name: 'concentric',
        padding: layoutPadding,
        animate: true,
        animationDuration: maxLayoutDuration,
        concentric: concentric,
        levelWidth: levelWidth
    },
    concentricHierarchyCentrality: {
        name: 'concentric',
        padding: layoutPadding,
        animate: true,
        animationDuration: maxLayoutDuration,
        concentric: concentric,
        levelWidth: levelWidth,
        sweep: Math.PI * 2 / 3,
        clockwise: true,
        startAngle: Math.PI * 1 / 6
    },
    custom: { // replace with your own layout parameters
        name: 'preset',
        padding: layoutPadding
    }
};
var prevLayout;
var getLayout = name => Promise.resolve(layouts[name]);
var applyLayout = layout => {
    if (prevLayout) {
        prevLayout.stop();
    }
    var l = prevLayout = cy.makeLayout(layout);
    return l.run().promiseOn('layoutstop');
}
var applyLayoutFromSelect = () => Promise.resolve($layout.value).then(getLayout).then(applyLayout);

var ctxmenu_commands_all = [{
    content: 'Search',
    select: function () {
        trivial_search(this.data('id'))
    }
}, {
    content: 'Expand',
    select: function () {
        trivial_expand(this.data('id'))
    }
}, {
    content: 'View',
    select: function () {
        var url = "/cpe/" + this.data('id');
        var win = window.open(url, '_blank');
        win.focus();
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

var ctxmenu_commands_cpe = [{
    content: 'View',
    select: function () {
        var url = "/cpe/" + this.data('id');
        var win = window.open(url, '_blank');
        win.focus();
    }
}]

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

function trivial_expand(txt) {
    $.getJSON("trivial.json?search=" + txt, function (data) {
        console.log(data);
        window.cy.add(data);
    });
}

function trivial_init(data) {
    var cy = cytoscape({
        container: document.getElementById('trivial'),
        ready: function () {
            console.log("cy::ready []");
            window.cy = this;
            // ugly
            setTimeout(() => {
                loadPosition(true);
                cy.nodes().lock();
            }, 45);
        },
        boxSelectionEnabled: true,
        maxZoom: 2,
        minZoom: 0.125,
        style: TRIVIAL_STYLE,
        elements: data,
        layout: LAYOUT1
    });
    // ugly
    setTimeout(() => {
        $('#loader').hide();
        $('#work-mode').show();
        $('#center').show();
    }, 55);
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
            if (window.cy.workMode) { return }
            var node = event.target;
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

    data = {}

    if (!confirm("really?")) {
        return;
    }

    $.each(window.cy.nodes(), function (k, node) {
        data[node.data().id] = {
            'position': node.position()
        };
    });

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
    this.cy.nodes().unlock();
    $.ajax({
        dataType: 'json',
        url: '/trivial/settings/load',
        success: (data) => {
            for (var x = 0; x < 30; x++) {
                if (loadBackup) {
                    data = data.backup

                } else {
                    data = data.save1
                }
                $.each(data, (k, v) => {
                    //console.log(v);
                    ele = this.cy.getElementById(k);
                    ele.position(v.position)
                })
                if (!shouldUnlock) {
                    this.cy.nodes().lock();
                }
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
    for (var x = 0; x < 30; x++) {
        loadPosition(true);
    }
});

$('#load-position-backup').on('click', function () {
    console.log("loadPositionackup []")
    loadPosition(true, true);
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


