
function trivial_expand(txt) {
  $.getJSON( "trivial.json?search=" + txt, function( data ) {
    console.log(data)
    window.cy.json(data)
  });
}

function trivial_init(data) {
var cy = cytoscape({
  container: document.getElementById('trivial'),
  ready: function(){
    window.cy = this;
  },
  boxSelectionEnabled: false,
  autounselectify: true,

  maxZoom: 2,
  minZoom: 0.125,

  style: TRIVIAL_STYLE,

  elements: data,

  layout: {
            name: 'cose-bilkent',
            randomize: true,
            gravityRangeCompound: 0.25,
            nodeDimensionsIncludeLabels: false,
            nodeRepulsion: 1000 * 1000,
            tile: true
          }
});


}

function trivial_search(txt) {
  history.pushState('trivial:'+txt, 'Trivial: '+txt, '/trivial?search='+txt);
        selector: 'node.devices',$.getJSON( "trivial.json?search=" + txt, function( data ) {
    trivial_init(data);

    window.cy.cxtmenu({
      commands: ctxmenu_commands_all
    });

  });
}


var ctxmenu_commands_all = [
  {
    content: 'Search',
    select: function(){
      trivial_search(this.data('id'))
    }
  },{
    content: 'Expand',
    select: function(){
      trivial_expand(this.data('id'))
    }
  },{
    content: 'View',
    select: function(){
      top.location.href= "/cpe/" +  this.data('id');
    }
  }
]



var ctxmenu_commands_mikrotik = ctxmenu_commands_all.slice()

ctxmenu_commands_mikrotik.push(  {
    content: 'Winbox',
    select: function(){
      top.location.href= "winbox://" + username + "@" +  this.data('address') + ':8291';
    }
});

ctxmenu_commands_mikrotik.push({
  content: 'SSH',
  select: function(){
    top.location.href= "krillssh://" + username + "@" +  this.data('address') + ':22';
  }
});


var ctxmenu_commands_ap = ctxmenu_commands_all.slice()

ctxmenu_commands_ap.push(  {
    content: 'Web',
    select: function(){
      top.location.href= "http://" + this.data('address');
    }
});


var ctxmenu_commands_cpe = [
  {
    content: 'View',
    select: function(){
      top.location.href= "/cpe/" +  this.data('id');
    }
  }
]

$(function(){
  trivial_search( $('#txtSearch').val() );
})
