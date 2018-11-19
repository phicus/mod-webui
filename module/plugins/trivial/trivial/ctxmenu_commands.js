'use strict';

class Commands {
    constructor(trivial) {
        this.trivial = trivial;
        this.ctxmenu_commands_all = [{
            content: 'Search',
            select: function() {
                this.trivial.search(this.data('id'))
            }
        }, {
            content: 'Expand',
            select: function() {
                this.trivial.expand(this.data('id'))
            }
        }, {
            content: 'View',
            select: function() {
                var url = "/cpe/" + this.data('id');
                var win = window.open(url, '_blank');
                win.focus();
            }
        }]
        
        this.ctxmenu_commands_mikrotik = ctxmenu_commands_all.slice()
        
        this.ctxmenu_commands_mikrotik.push({
            content: 'Winbox',
            select: function() {
                top.location.href = "winbox://" + username + "@" + this.data('address') + ':8291';
            }
        });
        
        this.ctxmenu_commands_mikrotik.push({
            content: 'SSH',
            select: function() {
                top.location.href = "krillssh://" + username + "@" + this.data('address') + ':22';
            }
        });
        
        
        this.ctxmenu_commands_access = ctxmenu_commands_all.slice()
        
        this.ctxmenu_commands_access.push({
            content: 'Enter the Matrix',
            select: function() {
                let url = "/matrix/?search=reg:" + this.data('id');
                let win = window.open(url, '_blank');
                win.focus();
            }
        });
        
        
        this.ctxmenu_commands_wimax = ctxmenu_commands_all.slice()
        
        this.ctxmenu_commands_wimax.push({
            content: 'Web',
            select: function() {
                let url = "http://" + this.data('address') + '.' + window.location.host.split('.')[0] + '.phicus.net';
                let win = window.open(url, '_blank');
                win.focus();
            }
        });
        
        this.ctxmenu_commands_wimax.push({
            content: 'Enter the Matrix',
            select: function() {
                let url = "/matrix?search=reg:" + this.data('id');
                let win = window.open(url, '_blank');
                win.focus();
            }
        });
        
        this.ctxmenu_commands_cpe = [{
            content: 'View',
            select: function() {
                let url = "/cpe/" + this.data('id');
                let win = window.open(url, '_blank');
                win.focus();
            }
        }]
    }
}


export default Commands;