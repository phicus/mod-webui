var TRIVIAL_STYLE = cytoscape.stylesheet()
.selector('node').css({
  'content': 'data(id)',
  'background-color': 'data(color)'
})
.selector('node > node').css({
  'width': 'data(size)',
  'height': 'data(size)',
  //'border-color': 'data(border_color)',
  //'border-width': 5,
  'background-color': 'data(color)',
  'font-family': 'proxima-nova, Roboto, sans-serif',
  'text-transform': 'uppercase',
  'font-size': '20px',
  
  'pie-size': '80%',
  'pie-1-background-color': '#8BC34A',
  'pie-1-background-size': function(d) { data = d.json().data; if( data.servicen == 0) {return 0}; return (data.service0 / data.servicen) * 100 },
  'pie-2-background-color': '#FAA732',
  'pie-2-background-size': function(d) { data = d.json().data; if( data.servicen == 0) {return 0}; return (data.service1 / data.servicen) * 100 },
  'pie-3-background-color': '#FF7043',
  'pie-3-background-size': function(d) { data = d.json().data; if( data.servicen == 0) {return 0}; return (data.service2 / data.servicen) * 100 },
  'pie-4-background-color': '#49AFCD',
  'pie-4-background-size': function(d) { data = d.json().data; if( data.servicen == 0) {return 0}; return (data.service3 / data.servicen) * 100 },

})

.selector(':parent').css({
  'background-opacity': 0.333,
  'font-size': '40 px',
  'text-valign': 'bottom',
  'text-halign': 'center',
})

.selector('edge.ptp-remote').css({
  'line-style': 'dashed', //dotted
  'line-color': 'green',
  'target-arrow-color': 'green'
})

.selector('edge').css({
  'label': 'data(label)',
  'curve-style': 'bezier',
  //'target-arrow-shape': 'triangle',
  'target-arrow-shape': 'triangle',
  'width': 4,
  'edge-text-rotation': 'autorotate',
  //'line-color': 'data(color)',
  //'target-arrow-color': 'data(color)'
})
