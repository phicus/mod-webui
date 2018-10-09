// layout = window.cy.makeLayout({'name': 'cose'})
// layout.options.eles = window.cy.elements();
// layout.run()




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
      top.location.href= "winbox://" + username + "@" +  this.data('address') + ':9291';
    }
});

ctxmenu_commands_mikrotik.push({
  content: 'SSH',
  select: function(){
    top.location.href= "krillssh://" + username + "@" +  this.data('address') + ':22';
  }
});


var ctxmenu_commands_access = ctxmenu_commands_all.slice()

ctxmenu_commands_access.push(  {
    content: 'Enter the Matrix',
    select: function(){
      top.location.href= "/matrix/?search=reg:" +  this.data('id');
    }
});


var ctxmenu_commands_wimax = ctxmenu_commands_all.slice()

ctxmenu_commands_wimax.push(  {
    content: 'Web',
    select: function(){
      top.location.href= "http://" + this.data('address') + '.' + window.location.host.split('.')[0] + '.phicus.net';
    }
});

ctxmenu_commands_wimax.push(  {
    content: 'Enter the Matrix',
    select: function(){
      top.location.href= "/matrix?search=reg:" +  this.data('id');
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





///Layouts

var LAYOUT1 = {
  name: 'cose-bilkent',
  stop: function(){
    console.log("cy::stop []");
    window.cy.nodes().lock();
  },
  randomize: true,
  gravityRangeCompound: 0.25,
  nodeDimensionsIncludeLabels: false,
  nodeRepulsion: 1000 * 1000,
  tile: true
}

var LAYOUT2 = {
  name: 'preset'
}

function trivial_expand(txt) {
  $.getJSON( "trivial.json?search=" + txt, function( data ) {
    console.log(data)
    window.cy.add(data);
  });
}

function trivial_init(data) {




var cy = cytoscape({
  container: document.getElementById('trivial'),

  ready: function(){
    console.log("cy::ready []");
    window.cy = this;
  },

  boxSelectionEnabled: true,
  maxZoom: 2,
  minZoom: 0.125,

  style: TRIVIAL_STYLE,

  elements: data,

  layout: LAYOUT1
});




}

function trivial_search(txt) {
  $('#search').val(txt);
  history.pushState('trivial:'+txt, 'Trivial: '+txt, '/trivial?search='+txt);
        selector: 'node.devices',$.getJSON( "trivial.json?search=" + txt, function( data ) {

    trivial_init(data);

    window.cy.cxtmenu({
      selector: 'node',
      commands: function(e){
          console.log(this)

          if (e.data()['tech'] == "wimax") {
            return ctxmenu_commands_wimax;
          }

          if (e.data()['name'].search('MK') == 0) {
            return ctxmenu_commands_mikrotik;
          }

          return ctxmenu_commands_all;
      }
    });

    // window.cy.cxtmenu({
    //   selector: 'node.ap',
    //   commands: ctxmenu_commands_wimax
    // });

    window.cy.nodes().bind("mouseover", function(event){
      var node = event.target;

      //$('#resumen').load('/cpe/quickservices/' + node.data().id )

    });
  });
}





$(function(){
  trivial_search( $('#txtSearch').val() );
})



function savePosition() {
  data = {}

  $.each(window.cy.nodes(), function(k,node){
    data[ node.data().id ] = {
      'position': node.position()
    };
  });

  localStorage.setItem('trivial', JSON.stringify(data));
}

function loadPosition() {
  var loadData = JSON.parse(localStorage.getItem('trivial'));

  if(loadData) {

    $.each(loadData, function(k,v){
      //console.log(v);
      ele = window.cy.getElementById(k);
      ele.position(v.position)
    })

  }

  // $.each(data.nodes, function(k,v){
  //   _id = v.data.id;
  //   if (_id in loadData) {
  //     console.log(_id)
  //     position = saveData[_id].position
  //     v['position'] = saveData[_id].position
  //   }
  // });
}


$('#load-position').hide();
$('#save-position').hide();

function workMode(){
  $('#load-position').show();
  $('#save-position').show();
  $('#view-mode').show();
  $('#work-mode').hide();
  window.cy.nodes().unlock();
}

function viewMode(){
  $('#load-position').hide();
  $('#save-position').hide();
  $('#view-mode').hide();
  $('#work-mode').show();
  window.cy.nodes().lock();
}

$('#work-mode').on('click', function(){
  workMode();
});

$('#view-mode').on('click', function(){
  viewMode();
});


$('#save-position').on('click', function(){
  console.log("savePosition []")
  savePosition();
});

$('#load-position').on('click', function(){
  console.log("loadPosition []")
  loadPosition();
});


$('#play').on('click', function(){
//

  var b = window.cy

  .nodes().animate({
    position: { x: 0, y: 0 }
  })

  .delay(1000)

  .animate({
      pan: { x: 0, y: 0 }
  });

    // a.animation().play().promise().then(function () {
    //     b.animation().play();
    // });
//--
});
