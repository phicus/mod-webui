%title = 'Trivial for all hosts'

%helper = app.helper

%search_string = app.get_search_string()

%rebase("layout", title='Trivial for hosts/services', css=['trivial/css/trivial.css'], js=['trivial/js/trivial-style.js','trivial/js/trivial.js'], breadcrumb=[ ['Trivial All hosts', '/trivial'] ])

<input  id="txtSearch" type="hidden" value="{{ search }}">
<script>
var username = '{{ user.get_name() }}';
</script>

<div id="trivial"></div>

<script src="http://js.cytoscape.org/js/cytoscape.min.js"></script>
<script src="https://cytoscape.github.io/cytoscape.js-cxtmenu/cytoscape-cxtmenu.js"></script>
<script src="https://cytoscape.github.io/cytoscape.js-cose-bilkent/cytoscape-cose-bilkent.js"></script>
<!--<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>-->
<script src="http://cdnjs.cloudflare.com/ajax/libs/qtip2/2.2.0/jquery.qtip.min.js"></script>
<link href="http://cdnjs.cloudflare.com/ajax/libs/qtip2/2.2.0/jquery.qtip.min.css" rel="stylesheet" type="text/css" />
