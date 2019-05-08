%import time
%import re
%import ast
%import json
%import yaml

%from shinken.misc.perfdata import PerfDatas
%now = int(time.time())

%# If got no element, bailout
%if not cpe:
%rebase("layout", title='Invalid element name')

Invalid element name

%else:

%helper = app.helper

%from shinken.macroresolver import MacroResolver

%# Main variables
%if hasattr(cpe.__class__, 'my_type'):
  %cpe_type = cpe.__class__.my_type
%else:
  %cpe_type = 'None'
%end

%if cpe_type=='host':
  %cpe_host = cpe if cpe_type=='host' else cpe.host
  %cpe_name = cpe.host_name if cpe_type=='host' else cpe.host.host_name+'/'+cpe.service_description
  %cpe_display_name = cpe_host.display_name if cpe_type=='host' else cpe_service.display_name+' on '+cpe_host.display_name
  %cpe_graphs = helper.get_graphs_for_cpe(cpe_host.host_name, cpe.customs.get('_TECH'))
%else:
  %cpe_host = cpe
  %cpe_display_name = "none"
  %cpe_name = "NONE"
  %cpe_graphs = []
%end

%if hasattr(cpe, 'cpe_registration_host') and hasattr(cpe, 'cpe_registration_id'):
  %reboot_available = cpe.cpe_registration_host and cpe.cpe_registration_id
%else:
  %reboot_available = True
%end


%if hasattr(cpe, 'cpe_connection_request_url'):
  %tr069_available = cpe.cpe_connection_request_url
%end

%# Replace MACROS in display name ...
%if hasattr(cpe, 'get_data_for_checks'):
    %cpe_display_name = MacroResolver().resolve_simple_macros_in_string(cpe_display_name, cpe.get_data_for_checks())
%end

%business_rule = False
%if hasattr(cpe, 'get_check_command') and cpe.get_check_command().startswith('bp_rule'):
%business_rule = True
%end

%breadcrumb = [ ['All '+ ( cpe_type.title() if hasattr(cpe_type, 'title') else 'UNK' ) + 's', '/'+cpe_type+'s-groups'], [cpe_display_name, '/host/'+cpe_name] ]
%breadcrumb = []

%title = ( cpe_type.title() if hasattr(cpe_type, 'title') else 'KIWI' ) +' detail: ' + cpe_display_name

%title = cpe_host.host_name


%js=['js/shinken-actions.js', 'cpe/js/bootstrap-switch.min.js', 'cpe/js/datatables.min.js', 'cpe/js/google-charts.min.js', 'cpe/js/vis.min.js', 'cpe/js/cpe.js?122345']
%css=['cpe/css/bootstrap-switch.min.css', 'cpe/css/datatables.min.css', 'cpe/css/vis.min.css', 'cpe/css/cpe.css']
%rebase("layout", js=js, css=css, breadcrumb=breadcrumb, title=title)

<!--<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>-->

%cpe_proxy_url  = "None"


%proto  = ""
%if hasattr(cpe, 'customs') and cpe.customs.get('_WEB_SECURE'):
  %proto  = "https"
%end

%if cpe.customs.get('_WEB_PORT') and hasattr(cpe, 'address'):
  %cpe_proxy_url  = "http://{}{}-{}.{}".format(proto,cpe.address, cpe.customs.get('_WEB_PORT'), app.proxy_sufix)
%elif hasattr(cpe, 'address'):
  %cpe_proxy_url  = "http://{}{}.{}".format(proto,cpe.address, app.proxy_sufix)
%end

<script src="/static/cpe/js/jquery.flot.js" charset="utf-8"></script>
<script src="/static/cpe/js/plots.js" charset="utf-8"></script>

<script>
var CPE_QUICKSERVICES_UPDATE_FREQUENCY = 5000;
var CPE_POLL_UPDATE_FREQUENCY = 10000;

%if app.proxy_sufix:
var proxy_sufix = "{{app.proxy_sufix}}";
%else:
var proxy_sufix = "";
%end

%if str(cpe.customs.get('_SN', 'ffffffff').upper())[0:8].decode("hex") ==  'HWTC':
var proxy_prefix = "h";
%else:
var proxy_prefix = "";
%end


%if str(cpe.customs.get('_CPE_MODEL', 'ffffffff')) in ('HG8010H+ACS', 'HG8310H+ACS'):
var proxy_prefix = "";
%end

var cpe = {
    name: '{{ cpe_host.host_name }}',
    state: '{{ cpe_host.state if hasattr(cpe_host,"state") else "UNK" }}',
    state_id: '{{cpe_host.state_id  if hasattr(cpe_host,"state_id") else 0 }}',
    last_state_change: '{{cpe_host.last_state_change  if hasattr(cpe_host,"last_state_change") else "UNK" }}',
    url: '/host/{{cpe_host.host_name}}'
};

var cpe_name = cpe.name
var cpe_graphs = JSON.parse('{{!json.dumps(cpe_graphs)}}');
var services = [];
%for service in ( cpe.services if hasattr(cpe,"state") else []):
  services.push({
    name: '{{service.display_name}}',
    state: '{{service.state}}',
    state_id: '{{service.state_id}}',
    last_state_change: '{{service.last_state_change}}',
    url: '/service/{{cpe_host.host_name}}/{{service.service_description}}'
  });
%end



function check_cpe_registration_host(){
  $host = $('[data-type="registration-host"]').html()
  $.getJSON('/cpe/quick/'+ $host, function(data){
    $('[data-type="registration-host"]').css('color', getHostColorState(data.state_id) );



    if( data.state_id == 1) {
      $('[data-type="registration-host-state"]').html('<i class="fa fa-ban" alt="Host DOWN" title="Host DOWN"></i>')
      $('[data-type="registration-host-state"]').css('color', getHostColorState(1) );
    } else if( data.worst_state_id == 1) {
      $('[data-type="registration-host-state"]').html('<i class="fa fa-exclamation-triangle" alt="Host with PROBLEMS" title="Host with PROBLEMS"></i>')
      $('[data-type="registration-host-state"]').css('color', getColorState(data.worst_state_id) );
    } else if( data.worst_state_id == 2) {
      $('[data-type="registration-host-state"]').html('<i class="fa fa-exclamation-triangle" alt="Host with PROBLEMS" title="Host with PROBLEMS"></i>')
      $('[data-type="registration-host-state"]').css('color', getColorState(data.worst_state_id) );
    } else {
      $('[data-type="registration-host-state"]').html('')
      
    }

    console.log(data);
  });
}


function notify(msg) {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(msg);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        var notification = new Notification(msg);
      }
    });
  }
};

var STATUS_GREEN   = ["UP", "WORKING", "OK"];
var STATUS_RED     = ["DOWN", "LOS", "DYINGGASP", "OFFLINE", "AUTHFAILED"];
var STATUS_YELLOW  = ["NOT FOUND", "NOTFOUND", "SYNCMIB", "LOGGING"];
var STATUS_BLUE    = ["NONE", "NULL", ""];

function poll_cpe() {
  check_cpe_registration_host();

  $.getJSON('/api/kraken/info/{{cpe_host.host_name[3:]}}', function(data){


        if ( typeof data.hostevent !== 'undefined' ) {
          $.each(data.hostevent, function(k,v){
              if ( typeof v.leased_address !== 'undefined' ) {
                alertify.log("New IP ADDRESS: " + v.leased_address, "info", 15000);
              }

          });
        }

        if(data && data.status) {

            data.status = data.status.replace(/\W+\s+/g, '').toUpperCase()

            $('#registration_state').html(data.status)
            $('#upbw').html(humanBytes(data.upbw))
            $('#dnbw').html(humanBytes(data.dnbw))
            $('#dnrx').html(data.dnrx)
            $('#uprx').html(data.uprx)

            if (typeof data.ccq !== 'undefined') {
              $('#ccq').html(data.ccq + "%").show()
            }

            if (typeof data.catvrx !== 'undefined') {
              $('#ccq').html("CATV:" + data.catvrx + "").show()
            }

            if (typeof data.uptime === 'string') {
              d1 = Date.parse(data.uptime);
              console.log(d1)
              d2 = Date.parse(new Date());
              console.log(d2)
              delta = (d2 - d1) / 1000;
              $('#uptime').html(toHHMMSS(delta));
              if(delta > window.cpe_uptime) {
                window.cpe_uptime = delta;
              }
              $('#last_state_change').html( (new Date(d1)).toString() )
            }

            if (typeof data.uptime === 'number') {
              start = Date.parse(new Date()) - data.uptime;
              delta = data.uptime  /* / 1000 */
              if(delta > window.cpe_uptime) {
                window.cpe_uptime = delta;
              }
              $('#last_state_change').html( (new Date(start)).toString() )
            }



            if (typeof data.status_id !== "undefined") {
              $('#registration_state').css('color', Krill.getColorState(data.status_id) );
              $('#status2').html(getHTMLState(data.status_id));
            }


            //console.log(data);
            //enable or disable buttons

            if ( data.status_id == 0 ) {
              $('#btn-reboot')      .removeClass("disabled").prop("disabled", false);
              $('#btn-factrestore') .removeClass("disabled").prop("disabled", false);
              $('#btn-unprovision') .removeClass("disabled").prop("disabled", false);
              $('#btn-tr069')       .removeClass("disabled").prop("disabled", false);
            } else if ( data.status_id == 2 )  {
              $('#btn-reboot')      .addClass("disabled").prop("disabled", true);
              $('#btn-factrestore') .addClass("disabled").prop("disabled", true);
              $('#btn-tr069')       .addClass("disabled").prop("disabled", true);
              $('#btn-unprovision') .removeClass("disabled").prop("disabled", false);
            }

            if ( typeof data.cpe_registration_host === 'undefined' ) {
              $('#btn-reboot')     .addClass("disabled").prop("disabled", true);
              $('#btn-factrestore').addClass("disabled").prop("disabled", true);
              $('#btn-unprovision').addClass("disabled").prop("disabled", true);
              $('#btn-tr069')      .addClass("disabled").prop("disabled", true);
            } else {
              $('[data-type="registration-host"]').html(data.cpe_registration_host)
              $('[data-type="registration-id"]').html(data.cpe_registration_id)
            }


            if ( typeof data.lapse !== 'undefined' ) {
               CPE_POLL_UPDATE_FREQUENCY = Math.round( (data.lapse * 1000 ) * 1.20 );
               if ( CPE_POLL_UPDATE_FREQUENCY < 10000 ) {
                 CPE_POLL_UPDATE_FREQUENCY = 10000;
               }
            }

            if ( typeof data.ips !== 'undefined' ) {
               $("#ips").html('')
               $.each(data.ips, function(v,k){
                 $("#ips").append('<a href="http://'+proxy_prefix+k[1]+'.'+proxy_sufix+'">'+k[1]+'</a> | ');
               })
            }

            if (typeof data.service_ports !== "undefined") {
              line = ""
              $.each(data.service_ports, function(k,v){
                 line = line + v.service_vlan + '/'+ v.user_vlan
                 if ( typeof v.native_vlan !== 'undefined' && v.native_vlan ) {
                   line = line + "N";
                 }
                 line = line + " ";
              })
              $('#service_ports').html(line)
            }

            if (data.status && data.status != cpe.state) {
                //notify("{{cpe_host.host_name}} is " + data.status);
                cpe.state = data.status;
            }

            if (typeof data.perfdatas  !== 'undefined') {

              var downstreams = Krill.parsePerfdata(data.perfdatas.downstream);
              var upstreams   = Krill.parsePerfdata(data.perfdatas.upstream);
              var qoss        = Krill.parsePerfdata(data.perfdatas.qos);


              for (var i = 0; i < downstreams; i++) {
                if (downstreams[i][0] == 'dnrx') {
                  //data.dnrx = parseFloat(downstreams[i][1])
                  data.dnrx = Krill.parsePerfdata(downstreams[i])

                }
              }

              for (var i = 0; i < upstreams; i++) {
                if (upstreams[i][0] == 'uptx') {
                  data.uptx = Krill.parsePerfdata(upstreams[i][1])
                }
              }


              for (var i = 0; i < qoss; i++) {
                if (qoss[i][0] == 'dncorr') {
                  data.dncorr = Krill.parsePerfdata(upstreams[i][1])
                }
                if (qoss[i][0] == 'dnko') {
                  data.dnko = Krill.parsePerfdata(upstreams[i][1])
                }
              }


              qoss_table          = parsePerfdataTable2(qoss)
              qoss_table_titles   = Object.keys(qoss_table)
              qoss_table_rows     = Object.values(qoss_table)

              downstreams_table        = parsePerfdataTable2(downstreams)
              upstreams_table          = parsePerfdataTable2(upstreams)

              downstreams_table.dncorr = qoss_table.dncorr
              downstreams_table.dnko   = qoss_table.dnko
              upstreams_table.upcorr   = qoss_table.upcorr
              upstreams_table.upko     = qoss_table.upko

              downstreams_table_titles = Object.keys(downstreams_table)
              downstreams_table_rows   = Object.values(downstreams_table)

              upstreams_table_titles   = Object.keys(upstreams_table)
              upstreams_table_rows     = Object.values(upstreams_table)


              try {
                $('#docsisDownstreamTable').html(generatePerfTable(downstreams_table_titles, downstreams_table_rows));
                $('#docsisUpstreamTable').html(generatePerfTable(upstreams_table_titles, upstreams_table_rows));
              } catch(err) {
                console.log(err)
              }
              //$('#docsisQosTable').html(generatePerfTable(qoss_table_titles, qoss_table_rows));

            }


            updateGraphs(data);

        }

    });
}
</script>


<hr />


%if hasattr(cpe, 'customs') and cpe.customs.get('_CPE_ID'):
  %include('_cpe_header.tpl')
%else:
  %include('_header.tpl')
%end


%if hasattr(cpe, 'customs') and cpe.customs.get('_CPE_ID'):
<div class="row">
  <div class="col-md-6"><div id="timeline"></div></div>
  <div class="col-md-6" id="quickservices"> </div>
</row>
%else:
<div class="row">
  <div class="col-md-6"><div id="timeline"></div></div>
  <div class="col-md-6" id="quickservices"> </div>
</row>
%end

%if hasattr(cpe, 'customs') and cpe.customs.get('_CPE_ID'):
  %include('_realtime.tpl')
  %include('_history.tpl')
  %include('_graphs.tpl')
%end

<!-- cpe_graphs: {{ helper.get_graphs_for_cpe(cpe_host.host_name, cpe.customs.get('_TECH')) }} -->

%#End of the element exist or not case
%end


<script>
$("[data-type='host']").each(function(key, value){
    item = $(value)
    $.getJSON('/quick/'+item.html(), function(data){
        //console.log(data)
        if (data.last_state_id == 0) {
            item.addClass('font-up')
        } else if (data.last_state_id == 1) {
            item.addClass('font-unreachable')
        } else if (data.last_state_id == 2) {
           item.addClass('font-down')
        }
    });
});

// Actualizador servicios
function update_cpe_services() {
  $.ajax({
    url: '/cpe/quickservices/{{cpe_host.host_name}}',
    success: function(data) {
      var html = $('ul',data);
      $('li', html).on('click', function(){
         //console.log($(this).text());

         var _txt = $(this).clone().children().remove().end().text();
         _txt = _txt.split(":")
         _txt.shift()
         _txt = _txt.join(":")

         $('#search').val( _txt  );
      });
      $('#quickservices').html( $(html).html()
            .replace(/\$PROXY_SUFIX/g,proxy_sufix)
            .replace(/\$PROXY_PREFIX/g,proxy_prefix)
       );


      // $('#quickservices li').on('click', function(){
      //   console.log(  $(this) );
      // });


    },
    //complete: function() {
    //  setTimeout(worker, CPE_QUICKSERVICES_UPDATE_FREQUENCY);
    //}
  });
}

// Poller
// var realtimeTimer = window.setInterval(function(){
//   poll_cpe()
//}, CPE_POLL_UPDATE_FREQUENCY);


// lazy start
$(function(){


  if( typeof window.cpe_poll_interval === 'undefined' ){
    poll_cpe();
    window.cpe_poll_interval = setInterval(function(){
      poll_cpe();
    }, CPE_POLL_UPDATE_FREQUENCY);
  }

  if( typeof window.cpe_update_services_interval === 'undefined' ){
    update_cpe_services();
    window.cpe_update_services_interval = setInterval(function(){
      update_cpe_services();
    }, CPE_QUICKSERVICES_UPDATE_FREQUENCY);

  }

  if( typeof window.cpe_uptime === 'undefined' ){
    window.cpe_uptime = null;
  }

  if( typeof window.cpe_uptime_interval === 'undefined' ){
    window.cpe_uptime_interval = setInterval(function(){
      if(window.cpe_uptime != null) {
        window.cpe_uptime += 1;
        $('#uptime').html(toHHMMSS(window.cpe_uptime));
      }
    }, 1000);
  }

  var cpeSRN = document.getElementById("cpe-sn");
  var cpeMAC = document.getElementById("cpe-mac");

  if (cpeSRN) {
    cpeSRN.addEventListener("click", function() { copyToClipboard(cpeSRN) });
  }

  if (cpeMAC) {
    cpeMAC.addEventListener("click", function() { copyToClipboard(cpeMAC) });
  }

});

</script>
