<!DOCTYPE html>
<meta charset="utf-8">
<style>
html, body {
  height: 100%;
  width: 100%;
  font: 14px helvetica neue, helvetica, arial, sans-serif;
}

#grafo {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

</style>
<input  id="txtSearch" type="hidden" value="{{ search }}">

<div id="grafo"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.2.14/cytoscape.min.js"></script>
<script src="https://cytoscape.github.io/cytoscape.js-cxtmenu/cytoscape-cxtmenu.js"></script>
<script src="https://cytoscape.github.io/cytoscape.js-cose-bilkent/cytoscape-cose-bilkent.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>


<script>

var username = '{{ user.get_name() }}';

function index_php(data) {
var cy = cytoscape({
  container: document.getElementById('grafo'),

  boxSelectionEnabled: false,
  autounselectify: true,

  style: cytoscape.stylesheet()
    .selector('node')
      .css({
        'content': 'data(id)',
        'background-color': 'data(color)'
      })
    .selector('node > node')
      .css({
        'width': 'data(size)',
        'height': 'data(size)',
        'border-color': 'data(border_color)',
        'border-width': 5,
        'background-color': 'data(color)',
        'font-family': 'proxima-nova, Roboto, sans-serif',
        'text-transform': 'uppercase',
        'font-size': '20px'
      })

    .selector(':parent')
      .css({
        'background-opacity': 0.333,
        'font-size': '40 px',
        'text-valign': 'bottom',
        'text-halign': 'center',
      })

    .selector('edge')
      .css({
        'label': 'data(label)',
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'width': 4,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)'
      }),

  elements: data,

  layout: {
            name: 'cose-bilkent',
            randomize: false,
            gravityRangeCompound: 0.25,
            nodeDimensionsIncludeLabels: false,
            nodeRepulsion: 1000 * 1000,
            tile: true
          }



});

// {
//   name: 'cose',
//   // Called on `layoutready`
//   ready               : function() {},
//   // Called on `layoutstop`
//   stop                : function() {},
//   // Whether to animate while running the layout
//   animate             : false,
//   // Number of iterations between consecutive screen positions update (0 -> only updated on the end)
//   refresh             : 1,
//   // Whether to fit the network view after when done
//   fit                 : true,
//   // Padding on fit
//   padding             : 10,
//   // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
//   boundingBox         : undefined,
//   // Whether to randomize node positions on the beginning
//   randomize           : true,
//   // Whether to use the JS console to print debug messages
//   debug               : false,
//   // Node repulsion (non overlapping) multiplier
//   nodeRepulsion       : 900000,    // Node repulsion (overlapping) multiplier
//   nodeOverlap         : 10,
//   // Ideal edge (non nested) length
//   idealEdgeLength     : 10,
//   // Divisor to compute edge forces
//   edgeElasticity      : 100,
//   // Nesting factor (multiplier) to compute ideal edge length for nested edges
//   nestingFactor       : 5,
//   // Gravity force (constant)
//   gravity             : 250,
//   // Maximum number of iterations to perform
//   numIter             : 30,
//   // Initial temperature (maximum node displacement)
//   initialTemp         : 200,
//   // Cooling factor (how the temperature is reduced between consecutive iterations
//   coolingFactor       : 0.95,
//   // Lower temperature threshold (below this point the layout will end)
//   minTemp             : 1.0
// }


cy.cxtmenu({
commands: [
    {
    content: 'Search',
    select: function(){
      index_search(this.data('id'))
    }
  },
  {
    content: 'View',
    select: function(){
      top.location.href= "/cpe/" +  this.data('id');
    }
  },
  {
    content: 'Winbox',
    select: function(){
      top.location.href= "winbox://" + username + "@" +  this.data('address') + ':8291';
    }
  },
  {
    content: 'SSH',
    select: function(){
      top.location.href= "krillssh://" + username + "@" +  this.data('address') + ':22';
    }
  }
]
});


}

function index_search(txt) {
  $.getJSON( "grafo.json?search=" + txt, function( data ) {

    console.log(data);

    index_php(data);
  });
}



index_search( $('#txtSearch').val() );
//
// setInterval( function(){
//   index_search( $('#txtSearch').val() );
// }, 30000);


</script>
