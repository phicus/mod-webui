%from shinken.misc.perfdata import PerfDatas

%groupname = 'all'
%groupalias = 'All hosts'
%title = 'Krill - Matrix all hosts'

%helper = app.helper

%search_string = app.get_search_string()

%rebase("layout", title='Krill - Matrix for hosts/services', css=['matrix/css/matrix.css'], js=['matrix/js/matrix.js'], breadcrumb=[ ['All hosts', '/matrix'] ])

<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/bs/dt-1.10.16/datatables.min.css"/>

<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/dataTables.buttons.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.flash.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.32/pdfmake.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.32/vfs_fonts.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.html5.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/1.5.1/js/buttons.print.min.js"></script>


<style>
.hoststate0 {background-color: #5bb75b; color: #fff;}
.hoststate1 {background-color: #da4f49; color: #fff;}
.hoststate2 {background-color: #faa732; color: #fff;}
.hoststate3 {background-color: #49afcd; color: #fff;}
.hoststate0 a { color: #fff; }
.hoststate1 a { color: #fff; }
.hoststate2 a { color: #fff; }
.hoststate3 a { color: #fff; }
td.highlight { background-color: whitesmoke !important; }



.blue   { background-color:#0051BA !important; }
.green  { background-color:#008751 !important; }
.gray   { background-color:#919693 !important; }
.yellow { background-color:#FFC61E !important; }

</style>


<div id="loader"></div>
<div id="matrix">
  <table id="myTable" class="table table-bordered table-condensed" style="text-align: right;">
  </table>
  <img id="g" src="about:blank" style="position: fixed; bottom: 0px; right: 0px;">
</div>


<script>
$(function() {
      // Hide leftmenu on trivial
      $('.sidebar').hide();
      $('#page-wrapper').css('margin', 0);
      $('#loader').show()

});
</script>


<style>
#loader {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #005A4E;
  width: 120px;
  height: 120px;
  -webkit-animation: spin 2s linear infinite;
  animation: spin 2s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
