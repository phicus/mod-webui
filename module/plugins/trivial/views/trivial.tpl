%title = 'Trivial for all hosts'
%helper = app.helper
%search_string = app.get_search_string()

%rebase("layout", title='Trivial for hosts/services', css=['trivial/css/trivial.css'], js=['trivial/js/trivial-style.js','trivial/js/trivial.js'], breadcrumb=[ ['Trivial All hosts', '/trivial'] ])

<input  id="txtSearch" type="hidden" value="{{ search }}">

<script>
var username = '{{ user.get_name() }}';
</script>

<div id="trivial"></div>

<div id="buttons">
  <button class="btn btn-primary btn-sx" id="load-position">Load Position</button>
  <button class="btn btn-primary" id="save-position">Save Position</button>
  <button class="btn btn-primary" id="work-mode">Work Mode</button>
  <button class="btn btn-primary" id="view-mode" style="display: none;">View Mode</button>
</div>

<script src="http://js.cytoscape.org/js/cytoscape.min.js"></script>
<script src="https://cytoscape.github.io/cytoscape.js-cxtmenu/cytoscape-cxtmenu.js"></script>
<script src="https://cytoscape.github.io/cytoscape.js-cose-bilkent/cytoscape-cose-bilkent.js"></script>
<script src="http://cytoscape.github.io/cytoscape.js-navigator/jquery.cytoscape.js-navigator.js"></script>
<script src="http://cdnjs.cloudflare.com/ajax/libs/qtip2/2.2.0/jquery.qtip.min.js"></script>

<link href="http://cdnjs.cloudflare.com/ajax/libs/qtip2/2.2.0/jquery.qtip.min.css" rel="stylesheet" type="text/css" />
<link href="http://cytoscape.github.io/cytoscape.js-navigator/jquery.cytoscape.js-navigator.css" rel="stylesheet" type="text/css" />

<script src="http://ajaxorg.github.io/ace-builds/src-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>


<!--
<script>
var editor = ace.edit("editor");
//editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/json");
editor.getSession().setTabSize(2);
editor.getSession().setUseWrapMode(true);
editor.setValue( JSON.stringify(JSON.parse(localStorage.getItem('trivial')),null,"\t")  );
</script>
-->
