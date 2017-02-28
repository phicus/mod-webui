/* Copyright (C) 2009-2015:
   Gabes Jean, naparuba@gmail.com
   Gerhard Lausser, Gerhard.Lausser@consol.de
   Gregory Starck, g.starck@gmail.com
   Hartmut Goebel, h.goebel@goebel-consult.de
   Andreas Karfusehr, andreas@karfusehr.de
   Frederic Mohier, frederic.mohier@gmail.com

   This file is part of Shinken.

   Shinken is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Shinken is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with Shinken.  If not, see <http://www.gnu.org/licenses/>.
   */

var eltdetail_logs=false;

// @mohierf@: really need this global ?

google.charts.load('current', {'packages':['corechart', 'controls','timeline']});
google.charts.setOnLoadCallback(drawDashboard);
drawTimeline();

function reload_custom_view(elt){
    var hname = elt.data('element');
    var cvname = elt.data('name');
    var cvconf = elt.data('conf');

    // Be sure to remove the panel from already loaded panels, else it won't load
    delete _already_loaded[cvname+cvconf];
    show_custom_view(elt);
}

function cleanData(element, index, array) {
    var aux = element[1]
    element[1] = element[0]
    element[0] = new Date(aux * 1000)
}


/*
 * Returns an array with the alert logs of the service/host combination ordered by time
 */
function getServiceAlerts(hostname, service_name, min_date) {
    alerts = logs.filter(function(e){
        return new Date(e.timestamp * 1000) >= min_date && e.type === "SERVICE ALERT" && e.host === hostname && e.service === service_name;
    });

    alerts.sort(function(a, b){
        if(a.timestamp > b.timestamp) {
            return 1;
        }
        if(a.timestamp < b.timestamp) {
            return -1;
        }
        return 0;
    });

    return alerts;

}


function stateIdToStr(state_id) {
    ids = ['OK','WARNING','CRITICAL','UNKNOWN'];
    return ids[state_id];
}

function generateTimelineRows(hostname, service_name) {
    now = new Date();
    min_date = new Date(new Date().setDate(now.getDate() - 7));
    alerts = getServiceAlerts(hostname, service_name, min_date);
    start_time = min_date;
    rows = [];
    state = "UNKNOWN";
    alerts.forEach(function(element, index, array) {
        end_time = new Date(element.timestamp * 1000);
        rows.push({
            group: service_name,
            content: state,
            start: start_time,
            end: end_time,
            className: labelToColor(state)
        });
        start_time = end_time;
        state = stateIdToStr(element.state);
    });
    rows.push({
        group: service_name,
        content: state,
        start: start_time,
        end: now,
        className: labelToColor(state)
    });
    return rows;
}

function labelToColor(label) {
    if (label == 'UP' || label == 'OK')
        return 'green';
    if (label == 'WARNING')
        return 'orange';
    if (label == 'CRITICAL' || label == 'UNREACHABLE')
        return 'red';
    return 'blue';
}

function drawTimeline() {
    var container = document.getElementById('timeline');
    var items = [];
    var groups = [];
    services.forEach(function(service) {
        items = items.concat(generateTimelineRows(cpe_name, service));
        groups.push({id: service, content: service});
    });
    var data = new vis.DataSet(items);
    var options = {
    };
    var timeline = new vis.Timeline(container,data,groups, options);
}

function drawDashboard() {
    cpe_metrics.forEach(function (metric){
        $.getJSON('http://'+window.location.hostname+':4288/render/?width=588&height=310&_salt=1487262913.012&target='+metric.name+'&from=-7d&format=json&jsonp=?', function(result) {
            var data = result[0].datapoints
            data = data.filter(function (e) {
                return e[0] !== null
            })
            data.forEach(cleanData)
            data.unshift([{label: 'Time', id: 'Time', type: 'datetime'},
                {label: metric.name, id: metric.name, type: 'number'}])
            var dataTable = google.visualization.arrayToDataTable(data)
            var options = {
                //title: result[0].target,
                legend: { position: 'top' },
                vAxis: {
                    title: metric.uom,
                    minValue: 0,
                    format: 'short'
                },
                height: 400,
                width: 600,
                chartArea: {
                    width: '80%'
                }
                //explorer: { 
                //    actions: ['dragToZoom', 'rightClickToReset'],
                //    axis: 'horizontal'
                //}
            };
            var dashboard = new google.visualization.Dashboard(document.getElementById(metric.name+'_dashboard'));
            var rangeFilter = new google.visualization.ControlWrapper({
                controlType: 'ChartRangeFilter',
                containerId: metric.name+'_control',
                options: {
                    filterColumnLabel: 'Time',
                    ui: {
                        chartOptions: {
                            height: 50,
                            width: 600,
                            chartArea: {
                                width: '80%'
                            }
                        }
                    }
                }
            });

            var chart = new google.visualization.ChartWrapper({
                'chartType': 'LineChart',
                'containerId': metric.name+'_chart',
                'options': options
            });
            dashboard.bind(rangeFilter, chart);
            dashboard.draw(dataTable);
        });


    })
}


/*
 * Function called when the page is loaded and on each page refresh ...
 */
function on_page_refresh() {
    var element = $('#inner_history').data('element');

    // Log History
    $("#inner_history").html('<i class="fa fa-spinner fa-spin fa-3x"></i> Loading history data ...');
    $("#inner_history").load('/logs/inner/'+encodeURIComponent(element), function(response, status, xhr) {
        if (status == "error") {
            $('#inner_history').html('<div class="alert alert-danger">Sorry but there was an error: ' + xhr.status + ' ' + xhr.statusText+'</div>');
        }
    });

    // Event History
    $("#inner_events").html('<i class="fa fa-spinner fa-spin fa-3x"></i> Loading history data ...');
    $("#inner_events").load('/events/inner/'+encodeURIComponent(element), function(response, status, xhr) {
        if (status == "error") {
            $('#events_history').html('<div class="alert alert-danger">Sorry but there was an error: ' + xhr.status + ' ' + xhr.statusText+'</div>');
        }
    });

    // Show actions bar
    show_actions();

    // Buttons tooltips
    $('button').tooltip();

    // Buttons as switches
    $('input.switch').bootstrapSwitch();

    // Elements popover
    //   $('[data-toggle="popover"]').popover();

    $('[data-toggle="popover"]').popover({
        trigger: "hover",
        container: "body",
        placement: 'bottom',
        toggle : "popover",

        template: '<div class="popover popover-large"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
    });


    $('#btn-reboot').click(function (e) {
        launch('/action/REBOOT_HOST/'+cpe_name+'/', 'Host reboot ordered')
    });

    $('#btn-factrestore').click(function (e) {
        launch('/action/RESTORE_HOST/'+cpe_name+'/', 'Factory reset ordered')
    });

    $('#btn-unprovision').click(function (e) {
        launch('/action/UNPROVISION_HOST/'+cpe_name+'/', 'Unprovision ordered')
    });


    /*
     * Impacts view
     */
    // When toggle list is activated ...
    $('#impacts a.toggle-list').on('click', function () {
        var state = $(this).data('state');
        var target = $(this).data('target');

        if (state=='expanded') {
            $('#impacts ul[name="'+target+'"]').hide();
            $(this).data('state', 'collapsed')
            $(this).children('i').removeClass('fa-minus').addClass('fa-plus');
        } else {
            $('#impacts ul[name="'+target+'"]').show();
            $(this).data('state', 'expanded')
            $(this).children('i').removeClass('fa-plus').addClass('fa-minus');
        }
    });

    /*
     * Custom views
     */
    $('.cv_pane').on('shown.bs.tab', function (e) {
        show_custom_view($(this));
    })

    // Show each active custom view
    $('.cv_pane.active').each(function(index, elt) {
        show_custom_view($(elt));
    });

    /*
     * Dependency graph
     */
    $('a[href="#depgraph"]').on('shown.bs.tab', function (e) {
        // First we get the full name of the object from div data
        var element = $('#inner_depgraph').data('element');
        // Loading indicator ...
        $("#inner_depgraph").html('<i class="fa fa-spinner fa-spin fa-3x"></i> Loading dependency graph ...');
        // Then we load the inner depgraph page. Easy isn't it? :)
        $('#inner_depgraph').load('/inner/depgraph/'+encodeURIComponent(element));
    });

    // Fullscreen management
    $('button[action="fullscreen-request"]').click(function() {
        var elt = $(this).data('element');
        screenfull.request($('#'+elt)[0]);
    });


    /*
     * Commands buttons
     */
    // Change a custom variable
    $('button[action="change-variable"]').click(function () {
        var elt = $(this).data('element');
        var variable = $(this).data('variable');
        var value = $(this).data('value');
        if (eltdetail_logs) console.debug("Button - set custom variable '"+variable+"'="+value+" for: ", elt)

        display_modal("/forms/change_var/"+elt+"?variable="+variable+"&value="+value);
    });

    // Toggles ...
    $('input[action="toggle-active-checks"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle active checks for: ", elt, ", currently: ", value);

        // Toggle active checks & host checks
        toggle_active_checks(elt, value);
        toggle_host_checks(elt, value);
    });
    $('input[action="toggle-passive-checks"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle passive checks for: ", elt, ", currently: ", value);

        // Toggle passive checks
        toggle_passive_checks(elt, value);

        // If active checks match the passive checks state, toggle active checks too
        var active_check_value = $('input[action="toggle-active-checks"]').bootstrapSwitch('state');
        if (value == active_check_value) {
            $('input[action="toggle-active-checks"]').bootstrapSwitch('toggleState');
        }
    });
    $('input[action="toggle-check-freshness"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle freshness checks for: ", elt, ", currently: ", value);

        toggle_freshness_check(elt, value);
    });
    $('input[action="toggle-notifications"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle notifications for: ", elt, ", currently: ", value);

        toggle_notifications(elt, value);
    });
    $('input[action="toggle-event-handler"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle event handler for: ", elt, ", currently: ", value);

        toggle_event_handlers(elt, value);
    });
    $('input[action="toggle-process-perfdata"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle perfdata processing for: ", elt, ", currently: ", value);

        toggle_process_perfdata(elt, value);
    });
    $('input[action="toggle-flap-detection"]').on('switchChange.bootstrapSwitch', function (e, data) {
        var elt = $(this).data('element');
        var value = data==false ? true : false;
        if (eltdetail_logs) console.debug("Toggle flap detection for: ", elt, ", currently: ", value);

        toggle_flap_detection(elt, value);
    });


    /*
     * Availability
     */
    $('a[data-toggle="tab"][href="#availability"]').on('shown.bs.tab', function (e) {
        // First we get the full name of the object from div data
        var element = $('#inner_availability').data('element');

        // Loading indicator ...
        $("#inner_availability").html('<i class="fa fa-spinner fa-spin fa-3x"></i> Loading availability data ...');

        $("#inner_availability").load('/availability/inner/'+encodeURIComponent(element), function(response, status, xhr) {
            if (status == "error") {
                $('#inner_availability').html('<div class="alert alert-danger">Sorry but there was an error: ' + xhr.status + ' ' + xhr.statusText+'</div>');
            }
        });
    })


    /*
     * Timeline
     */
    $('a[data-toggle="tab"][href="#timeline"]').on('shown.bs.tab', function (e) {
        // First we get the full name of the object from div data
        var element = $('#inner_timeline').data('element');
        // Get timeline tab content ...
        $('#inner_timeline').load('/timeline/inner/'+encodeURIComponent(element));

    })


    /*
     * Graphs
     */
    // Change graph
    $('a[data-type="graph"]').click(function (e) {
        current_graph=$(this).data('period');

        // Update graphs
        $("#real_graphs").html( html_graphes[current_graph] );

        // Update active period selected
        $('#graph_periods li').removeClass('active');
        $(this).parent('li').addClass('active');
    });

    // Restore previously selected tab
    bootstrap_tab_bookmark();

    // Show actions bar
    show_actions();
}


/*
 * Host/service aggregation toggle image button action
 */
function toggleAggregationElt(e) {
    var toc = document.getElementById('aggregation-node-'+e);
    var imgLink = document.getElementById('aggregation-toggle-img-'+e);

    img_src = '/static/images/';

    if (toc && toc.style.display == 'none') {
        toc.style.display = 'block';
        if (imgLink != null){
            imgLink.src = img_src+'reduce.png';
        }
    } else {
        toc.style.display = 'none';
        if (imgLink != null){
            imgLink.src = img_src+'expand.png';
        }
    }
}


/* The business rules toggle buttons*/
function toggleBusinessElt(e) {
    //alert('Toggle'+e);
    var toc = document.getElementById('business-parents-'+e);
    var imgLink = document.getElementById('business-parents-img-'+e);

    img_src = '/static/images/';

    if (toc && toc.style.display == 'none') {
        toc.style.display = 'block';
        if (imgLink != null){
            imgLink.src = img_src+'reduce.png';
        }
    } else {
        toc.style.display = 'none';
        if (imgLink != null){
            imgLink.src = img_src+'expand.png';
        }
    }
}


on_page_refresh();
