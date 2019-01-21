var _cache = {}

function humanBytes(fileSizeInBytes) {

    var i = -1;
    var byteUnits = ['kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

function humanHertz(frequency) {

    var i = 0;
    var byteUnits = ['Hz', 'kHz', 'MHz', 'GHz'];
    do {
        frequency = frequency / 1000;
        i++;
    } while (frequency > 1000);

    return Math.max(frequency, 0).toFixed(0) + byteUnits[i];
};

function toHHMMSS(num) {
    var sec_num = parseInt(num, 10); // don't forget the second param
    var days    = Math.floor(sec_num / (3600 * 24));
    var hours   = Math.floor((sec_num / 3600) % 24);
    var minutes = Math.floor((sec_num / 60) % 60);
    var seconds = sec_num % 60;

    if (days    >  1) {days    = days + "d " } else { days = ""}
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return days+hours+':'+minutes+':'+seconds;
};

function getServiceFromMetric(metric) {
  for (var i in _cache.groups) {
    if( $.inArray(metric, _cache.groups[i]) >= 0 ) {
       return i;
    }
  }
  return '';
}

function g(host,metric) {
  var ser = getServiceFromMetric(metric)
  if (ser == 'host') ser = '__HOST__';
  var val = "" + host + "." + ser + "." + metric;
  var src = "http://"+window.location.hostname+":4288/render/?width=640&height=200&lineMode=connected&target="+val+"&fontSize=12&from=-7days"
  $('#g').attr('src',src);
}

function processMetric(m) {
    str = "";

    if (Array.isArray(m)) {
      nm = {
        'name': m[0],
        'value': m[1],
        'uom' : m[2],
      }
      if ( m.length >= 5 ) {
        nm['warning'] = m[3];
        nm['critical'] = m[4];
      }
      if ( m.length >= 7 ) {
        nm['min'] = m[5]
        nm['max'] = m[6]
      }
      m = nm;
    }


    if (false) { null }
    //else if (m.name == 'upbw' || m.name == 'dnbw') str = str + humanBytes(m.value);
    else if (m.name.includes('upbw') || m.name.includes('dnbw')) str = str + humanBytes(m.value);
    else if (m.name == 'filesize') str = str + humanBytes(m.value);
    else if (m.name.includes('freq') && m.uom == 'Hz') str = str + humanHertz(m.value);
    else if (m.uom == 's') str = str + toHHMMSS(m.value);
    else if (m.name.includes('uptime')) str = str + toHHMMSS(m.value);
    else if (m.name.includes('airtime')) str = m.value + '%';
    else str = str + m.value;

    //if ( m.uom ) str = str +  " " + m.uom;


    if (false) { null }
    else if ( m.critical && m.critical > m.warning && m.value > m.critical ) str = '<span class="font-critical">' + str + '<span>';
    else if ( m.critical && m.critical < m.warning && m.value < m.critical ) str = '<span class="font-critical">' + str + '<span>';
    else if ( m.warning && m.critical > m.warning && m.value > m.warning )   str = '<span class="font-warning">' + str + '<span>';
    else if ( m.warning && m.critical < m.warning && m.value < m.warning )   str = '<span class="font-warning">' + str + '<span>';
    else if ( m.warning == null && m.critical == null) str = '<span>' + str + '<span>'
    else  str = '<span class="font-ok">' + str + '<span>';

    return str

}


var draw_matrix_table = function( data, parent, options ) {
  _cache = data;
  _options = {};
  _defaults = {simple: false};

  if(options) {
    _options = $.extend(_defaults, options);
  }

  console.log(_options);

  var _table = $('<table class="table table-bordered table-condensed" style="text-align: right;"></table>')
  var _headers = [];

  _headers.push('host');
  if ('host' in data.groups) {
    data.groups['host'].push('reg');
  }

  row = '<thead><tr><th></th>';
  $.each(data.groups, function(k,v){
     if (v.length > 0) {
       row = row + '<th colspan="'+v.length+'">' + k + "</th>";
     }
  });
  row = row + '</tr><tr>';
  row = row + '<th>Host</th>';


  $.each(data.groups, function(k,v){
     $.each(v, function(kk,vv){
       _headers.push(vv)
       _sort = vv.substr(0,3);
       _sort2 = vv.substr(0,2);
       _class = ""
       if (_sort2 == 'dn' || _sort2 == 'up') {
          _sort = vv.substr(0,5);
       }
       ['blue','green','gray','yellow'].forEach(function(c) {
         if (vv.includes(c)) {
           _class = c;
           _sort = vv.replace(c,'');
         }
       });

       if(vv == "reg" || vv == "uptime" || vv == "ruptime" || vv == "luptime" ) {
         row = row + '<th class="'+_class+'" style="width: 40px; override: hidden"><span title="'+vv+'" alt="'+vv+'">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + vv + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></th>';
       } else {
         row = row + '<th class="'+_class+'" style="width: 40px; override: hidden"><span title="'+vv+'" alt="'+vv+'">' + _sort + "</span></th>";
       }
     });
  });
  row = row + "</tr></thead>";
  _table.append(row);

  row = "<tbody>";
  _table.append(row);
  var host = null;
  $.each(data.data, function(k,v){
      row = "<tr>";
      $.each(_headers, function(kk,i){
        cell = v[i]
        if ( i == "host" ) {
          row = row + '<td class="hoststate' + v.state_id +'"">'
          + '<a href="/cpe/' + cell +'">'
          + '<span class="host_name">' + cell + '</span>'
          + '<span class="display_name hidden">' + v.display_name + '</span>'
          + '</a></td>';
          host = cell;
        } else if ( i == "reg" ) {
          row = row + '<td>'
          + '<a href="?search=reg:' + v.reg +'">'
          + '<span>' + v.reg + '</span>'
          + '</a></td>';
        } else if ( cell instanceof Object ) {
          row = row + '<td data-order="' + Math.round(cell.value) + '" onmouseover="g(\''+host+'\',\''+cell.name+'\')">' + processMetric(cell) +'</td>';
        } else if ( typeof cell === "undefined"){
          row = row + '<td data-order="0">-</td>';
        } else {
          row = row + '<td data-order="0">' + cell + '</td>';
        }
      });

     row = row + "</tr>";
     _table.append(row);
  });

  row = "</tbody>";
  _table.append(row);

  $(parent).append(_table);


  if(_options.simple) {
    _table.DataTable( {
      autoFill: true,
      lengthMenu: [[-1], ["All"]],
      searching: false,
      pageLength: -1,
      //dom: 'Blsfrtip',
      
      dom: "<'row'<'col-sm-12'tr>>",
    });
  } else {
    _table.DataTable( {
      autoFill: true,
      lengthMenu: [[25, 50, 100, -1], [25, 50, 100, "All"]],
      searching: true,
      pageLength: 25,
      //dom: 'Blsfrtip',
      
      dom: "<'row buttons'<'col-xs-8'B><'col-xs-4'f>>" + 
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",


      buttons: [
          'copy', 'csv', 'excel', 'pdf',
      ],


    });

    _table.button().add( 0, {
      action: function ( e, dt, button, config ) {
        $('.display_name').toggleClass('hidden');
        $('.host_name').toggleClass('hidden');
      },
      text: 'Toggle Display Name'
    } );
  }







  // $('#myTable tbody').on( 'click', 'tr', function () {
  //        if ( $(this).hasClass('selected') ) {
  //            $(this).removeClass('selected');
  //        } else {
  //            table.$('tr.selected').removeClass('selected');
  //            $(this).addClass('selected');
  //        }
  //    } );



   $('#loader').hide()
   window.auto_refresh = null;

};

$(document).ready( function (){

  $("#g").hide();
  $("#g").on('click',function(){
    $(this).hide();
  });

  $('body').keypress(function(e) {
    if ( e.key == 'g' ) {
      $('#g').toggle();
    }
  });



  $.ajax({
    dataType: "json",
    url: "/matrix/json?search=" + $('#search').val(),
    //data: data,
    success: function(data) { draw_matrix_table(data, '#matrix') },
    error: function(){
      $('#loader').removeClass('loading');
      $('#loader').addClass('error');
    }
  });


} );
