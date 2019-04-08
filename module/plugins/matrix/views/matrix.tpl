%from shinken.misc.perfdata import PerfDatas

%groupname = 'all'
%groupalias = 'All hosts'
%title = 'Krill - Matrix all hosts'

%helper = app.helper

%search_string = app.get_search_string()

%rebase("layout", title='Krill - Matrix for hosts/services', css=['matrix/css/matrix.css'], js=['matrix/js/matrix.js'], breadcrumb=[ ['All hosts', '/matrix'] ])

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
  <!--
  <table id="myTable" class="table table-bordered table-condensed" style="text-align: right;">
  </table>
  -->
  <img id="g" src="about:blank" style="position: fixed; bottom: 0px; right: 0px;">
</div>
<div id="dialog"></div>

<!--<button id="x">-</button>-->

<script>
$(function() {
      // Hide leftmenu on trivial
      $('.sidebar').hide();
      $('#page-wrapper').css('margin', 0);
      $('#loader').show()


      $('#x').on('click', function(){


        $.ajax({
          dataType: "json",
          url: "/matrix/json?search=" + 'reg:E13-U1-P3',
          //data: data,
          success: function(data) {
            draw_matrix_table(data, '#dialog', {
              'simple': true
            })
            $( "#dialog" ).dialog();
           },
          error: function(){
            $('#loader').removeClass('loading');
            $('#loader').addClass('error');
          }
        });


      });

});
</script>