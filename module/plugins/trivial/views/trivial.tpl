%title = 'Trivial for all hosts'
%helper = app.helper
%search_string = app.get_search_string()

%rebase("layout", title='Trivial for hosts/services', css=['trivial/css/trivial.css'], js=['trivial/js/trivial-style.js','trivial/js/trivial.js'], breadcrumb=[ ['Trivial All hosts', '/trivial'] ])

<input  id="txtSearch" type="hidden" value="{{ search }}">

<script>
var username = '{{ user.get_name() }}';
</script>


<div id="loader"></div>

<div id="info" style="z-index: 9999; position: absolute; left: 0; top: 0;"></div>

<div id="trivial" ></div>

<div id="buttons">
  <button class="btn btn-primary btn-sx" id="load-position">Load Position</button>
  <button class="btn btn-primary" id="save-position">Save Position</button>
  <button class="btn btn-primary" id="work-mode">Work Mode</button>
  <button class="btn btn-primary" id="view-mode" style="display: none;">View Mode</button>
</div>


<script src="/static/trivial/js/cytoscape.min.js"></script>
<script src="/static/trivial/js/cytoscape-cose-bilkent.js"></script>
<script src="/static/trivial/js/cytoscape-cxtmenu.js"></script>

<script>
$(function() {
      // Hide leftmenu on trivial
      $('.sidebar').hide();
      $('#buttons').hide()
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
