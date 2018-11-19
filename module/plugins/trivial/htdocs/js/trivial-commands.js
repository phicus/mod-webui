
var ctxmenu_commands_all = [
  {
    content: 'Search',
    select: function(){
      cy_status = cy.nodes();
      trivial_search(this.data('id'))
    }
  },{
    content: 'Expand',
    select: function(){
      cy_status = cy.nodes();
      trivial_expand(this.data('id'))
    }
  },{
    content: 'View',
    select: function(){
      var url = "/cpe/" +  this.data('id');
      var win = window.open(url, '_blank');
      win.focus();
    }
  }
]


var ctxmenu_commands_mikrotik = ctxmenu_commands_all.slice()

ctxmenu_commands_mikrotik.push({
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


var ctxmenu_commands_access = ctxmenu_commands_all.slice()

ctxmenu_commands_access.push(  {
    content: 'Enter the Matrix',
    select: function(){
      var url = "/matrix/?search=reg:" +  this.data('id');
      var win = window.open(url, '_blank');
      win.focus();
    }
});


var ctxmenu_commands_wimax = ctxmenu_commands_all.slice()

ctxmenu_commands_wimax.push(  {
    content: 'Web',
    select: function(){
      var url = "http://" + this.data('address') + '.' + window.location.host.split('.')[0] + '.phicus.net';
      var win = window.open(url, '_blank');
      win.focus();
    }
});

ctxmenu_commands_wimax.push(  {
    content: 'Enter the Matrix',
    select: function(){
      var url = "/matrix?search=reg:" +  this.data('id');
      var win = window.open(url, '_blank');
      win.focus();
    }
});

var ctxmenu_commands_cpe = [
  {
    content: 'View',
    select: function(){
      var url = "/cpe/" +  this.data('id');
      var win = window.open(url, '_blank');
      win.focus();
    }
  }
]
