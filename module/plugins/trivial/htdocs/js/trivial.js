// layout = window.cy.makeLayout({'name': 'cose'})
// layout.options.eles = window.cy.elements();
// layout.run()
//var tryPromise = fn => Promise.resolve().then(fn);
//var calculateCachedCentrality = () => {
//    var nodes = cy.nodes();
//    if (nodes.length > 0 && nodes[0].data('centrality') == null) {
//        var centrality = cy.elements().closenessCentralityNormalized();
//        nodes.forEach(n => n.data('centrality', centrality.closeness(n)));
//    }
//};
//var $layout = $('#layout');
//var maxLayoutDuration = 1500;
//var layoutPadding = 50;
//var concentric = function (node) {
//    calculateCachedCentrality();
//    return node.data('centrality');
//};
//var levelWidth = function (nodes) {
//    calculateCachedCentrality();
//    var min = nodes.min(n => n.data('centrality')).value;
//    var max = nodes.max(n => n.data('centrality')).value;
//    return (max - min) / 5;
//};
//var layouts = {
//    cola: {
//        name: 'cola',
//        padding: layoutPadding,
//        nodeSpacing: 12,
//        edgeLengthVal: 45,
//        animate: true,
//        randomize: true,
//        maxSimulationTime: maxLayoutDuration,
//        boundingBox: { // to give cola more space to resolve initial overlaps
//            x1: 0,
//            y1: 0,
//            x2: 10000,
//            y2: 10000
//        },
//        edgeLength: function (e) {
//            var w = e.data('weight');
//
//            if (w == null) {
//                w = 0.5;
//            }
//
//            return 45 / w;
//        }
//    },
//    concentricCentrality: {
//        name: 'concentric',
//        padding: layoutPadding,
//        animate: true,
//        animationDuration: maxLayoutDuration,
//        concentric: concentric,
//        levelWidth: levelWidth
//    },
//    concentricHierarchyCentrality: {
//        name: 'concentric',
//        padding: layoutPadding,
//        animate: true,
//        animationDuration: maxLayoutDuration,
//        concentric: concentric,
//        levelWidth: levelWidth,
//        sweep: Math.PI * 2 / 3,
//        clockwise: true,
//        startAngle: Math.PI * 1 / 6
//    },
//    custom: { // replace with your own layout parameters
//        name: 'preset',
//        padding: layoutPadding
//    }
//};
//var prevLayout;
//var getLayout = name => Promise.resolve(layouts[name]);
//var applyLayout = layout => {
//    if (prevLayout) {
//        prevLayout.stop();
//    }
//    var l = prevLayout = cy.makeLayout(layout);
//    return l.run().promiseOn('layoutstop');
//}
//var applyLayoutFromSelect = () => Promise.resolve($layout.value).then(getLayout).then(applyLayout);


function trivial_expand(txt) {
    $.getJSON("trivial.json?search=" + txt, function (data) {
        console.log(data);
        window.cy.add(data);
    });
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
    // ugly
    setTimeout(() => {
        cy.zoom(cy.maxZoom()/20);
        setTimeout(_ => {
            cy.center();
            $('#loader').hide();
            $('#work-mode').show();
            $('#center').show();
            $("#trivial").show();
        }, 500)
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
            if (loadBackup) {data = data.backup}
            else {data = data.save1}
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
    window.cy.workMode = false;
}

function getDFS(root, goal) {
    var dfs = cy.elements().aStar({
        root: root,
        goal: goal,
        directed: false
    })
    if (!dfs.path) {
        // TODO: do something
    }
    return dfs;
    //   dfs.path.select()
}

function deleteNodesNotPresentInDFSAndSelectPath(dfs) {
    var ids = dfs.path.map(n => n.data().id);
    console.log(ids);
    var index;
    var nodesToRemove = [];
    // FIXME
    cy.nodes().forEach(n => {
        index = ids.indexOf(n.data().id);
        if (index === -1 && !n.isParent()) {
            nodesToRemove.push(n);
        } else {
            console.log(`I'm not going to delete ${index}, ${n.data().id}`);
        }
    });
    nodesToRemove.forEach(n => n.remove())
    dfs.path.select();
}