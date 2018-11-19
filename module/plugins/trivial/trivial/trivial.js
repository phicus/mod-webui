'use strict';
import $ from "jquery";
import cytoscape from "cytoscape";
import TRIVIAL_STYLE from "./trivial-style";
import "cytoscape-cxtmenu";
import "cytoscape-cose-bilkent";

class Trivial {
    constructor(commands) {
        this.commands = commands;
        let txt = $('#txtSearch').val();
        $('#search').val(txt);
        history.pushState('trivial:' + txt, 'Trivial: ' + txt, '/trivial?search=' + txt);
        $.getJSON("trivial.json?search=" + txt, (data) => {
            this.trivial_init(data);
        })

        ///Layouts
        this.LAYOUT1 = {
            name: 'cose-bilkent',
            // The this of this arrow function will be the this of this class
            stop: () => {
                console.log("cy::stop []");
                this.cy.nodes().lock();
            },
            randomize: true,
            gravityRangeCompound: 0.25,
            nodeDimensionsIncludeLabels: false,
            nodeRepulsion: 1000 * 1000,
            tile: true
        }
        this.status = null;
    }

    trivial_init(data) {
        let _this = this;
        cytoscape({
            container: document.getElementById('trivial'),
            ready: function() {
                console.log("cy::ready []");
                _this.cy = this;
                $('#loader').hide();
                // TODO: load position
                // this.load();
            },
            boxSelectionEnabled: true,
            maxZoom: 2,
            minZoom: 0.125,
            style: TRIVIAL_STYLE,
            elements: data,
            layout: this.LAYOUT1,
        });
    }

    load() {
        $.ajax({
            dataType: 'json',
            url: '/trivial/settings/load',
            success: function(data) {
              $.each(data, function(k,v){
                ele = this.cy.getElementById(k);
                ele.position(v.position)
              })
        
            }
          });
    }

    save() {
        data = {}
        if(!confirm("really?")) {
            return;
        }
        $.each(window.cy.nodes(), function(k,node){
            data[ node.data().id ] = {
                'position': node.position()
            };
        });
        $.ajax({
            type: "POST",
            url: '/trivial/settings/save',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(data){
                console.log(data);
                alert("Save result:" + data.status);
            }
        });
    }

    expand() {
        // The this of this arrow function will be the this of this class
        $.getJSON("trivial.json?search=" + txt, (data) => {
            console.log(data);
            this.cy.add(data);
        });
    }

    search() {
        $('#search').val(txt);
        history.pushState('trivial:' + txt, 'Trivial: ' + txt, '/trivial?search=' + txt);
        $.getJSON("trivial.json?search=" + txt, function(data) {
            this.trivial_init(data);
            window.cy.cxtmenu({
                selector: 'node',
                commands: function(e) {
                    console.log(this)
                    if (e.data()['tech'] == "wimax") {
                        return this.commands.wimax;
                    }
                    if (e.data()['model'].search('Mikrotik') == 0) {
                        return this.commands.mikrotik;
                    }
                    return this.commands.all;
                }
            });
            // window.cy.cxtmenu({
            //   selector: 'node.ap',
            //   commands: this.commands.wimax
            // });
            // this.cy.nodes().bind("mouseover", function(event) {
            //     let node = event.target;
            //     //$('#resumen').load('/cpe/quickservices/' + node.data().id )
            // });
        });
    }

    workMode() {
        $('#load-position').show();
        $('#save-position').show();
        $('#view-mode').show();
        $('#work-mode').hide();
        this.cy.nodes().unlock();
        $('#trivial').css('background-color', '#f3c019');
    }

    viewMode() {
        $('#load-position').hide();
        $('#save-position').hide();
        $('#view-mode').hide();
        $('#work-mode').show();
        this.cy.nodes().lock();
        $('#trivial').css('background-color', 'transparent');
    }
}


export default Trivial;