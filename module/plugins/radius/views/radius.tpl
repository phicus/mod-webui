%title = 'Krill - Matrix all hosts'
%rebase("layout", title='Krill - Radius', css=[], js=[], breadcrumb=[ ['All hosts', '/matrix'] ])

<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs/dt-1.10.16/datatables.min.css"/>
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css"/>
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/buttons/1.5.1/css/buttons.dataTables.min.css" />

<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.19/js/dataTables.bootstrap.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/dataTables.buttons.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.flash.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.32/pdfmake.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.32/vfs_fonts.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.html5.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.colVis.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>


<div id="loader" class="loading">
  <div>
    <i class="fa fa-exclamation-triangle"></i>
    <h1>system failure</h1>
  </div>
</div>
<div id="matrix">
  <img id="g" src="about:blank" style="position: fixed; bottom: 0px; right: 0px;">
</div>
<div id="dialog"></div>

<table id="radius" class="table table-bordered table-condensed" style="text-align: right; width:100%">
</table>
<script>

function getUnixTime() {
    return Math.round(Date.now() / 1000) 
};


function toHHMMSS(num) {
    var sec_num = parseInt(num, 10); // don't forget the second param
    var days    = Math.floor(sec_num / (3600 * 24));
    var hours   = Math.floor((sec_num / 3600) % 24);
    var minutes = Math.floor((sec_num / 60) % 60);
    var seconds = sec_num % 60;

    if (days    >  0) {days    = days + "d " } else { days = ""}
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return days+hours+':'+minutes+':'+seconds;
};

function renderToHHMMSS ( data, type, row, meta ) {
  if (type == "sort" || type == 'type')
    return data;

  return '<span class="counter" data-counter="'+data+'" >' + toHHMMSS(data) + '</span>';
}


function renderDate ( data, type, row, meta ) {

  timestamp = Math.round(new Date(data).getTime() / 1000);
  value = getUnixTime() - timestamp + 7200;

  if (type == "sort" || type == 'type')
    return value;

  return '<span class="counter" data-counter="'+value+'" >' + renderToHHMMSS(value) + '</span>';
}

(new Date("Sun, 30 Jun 2019 22:09:37 GMT")).getTime()


function renderAction ( data, type, row, meta ) {
      return '<button class="btn btn-primary" onclick="deauth(\''+data+'\')">Deauth</button>'
}

function deauth(data) {
  $.getJSON('/oratio/deauth/'+ data, function(data){
      alert(data.result);
      update();    
  });
}


function draw_table(data) {
  $("#radius").DataTable ({

    autoFill: true,
    lengthMenu: [[25, 50, 100, -1], [25, 50, 100, "All"]],
    searching: true,
    pageLength: 25,
    //dom: 'Blsfrtip',

    "data" : data,
    "columns" : [
        {
          "title" : "Username",
          "data" : "username"
        }, { 
          "title" : "MAC",
          "data" : "callingstationid",
           "className": "mac"
        }, {
          "title" : "Framedip",
          "data" : "framedipaddress"
        //}, {
        //  "title": "Session Time",
        //  "data":  "acctsessiontime",
        //  "render": renderToHHMMSS,
        }, {
          "title": "Session Time",
          "data":  "acctstarttime",
          "render": renderDate,
        }, { 
          "title": "Actions",
          "data":  "username",
          "render": renderAction,
        },
        //{"data":null,"defaultContent":"<button>Deauth</button>"}
    ]
    });
};

function update(){
  $.getJSON('/oratio/online_sessions', function(data){
    $('#radius').dataTable().fnClearTable();
    $('#radius').dataTable().fnAddData(data);  
  })
}

function update_counter(){
  $('.counter').each(function(e){
    counter = $(this).data('counter')
    $(this).text( toHHMMSS( counter + getUnixTime() - last_update_online_sessions ) )
  });
  console.log('tick!')
}

$(document).ready(function() {
  $('#loader').hide()
  disable_refresh();

  $.ajax({
    dataType: "json",
    url: '/oratio/online_sessions',
    success: function(data) {
      draw_table(data);
      window.radiusInterval =  setInterval(function(){ update() }, 60000); 
      window.counterInterval = setInterval(function(){ update_counter() }, 1000); 
      
    },
    error: function(){
      $('#loader').removeClass('loading');
      $('#loader').addClass('error');
    }
  });

  window.last_update_online_sessions = getUnixTime();

});




</script>