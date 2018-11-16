'use strict';
import $ from "jquery";

class Handlers {
    constructor(cytoscape) {
        $('#load-position').hide();
        $('#save-position').hide();
        $('#work-mode').on('click', function() {
            cytoscape.workMode();
        });
        $('#view-mode').on('click', function() {
            cytoscape.viewMode();
        });
        $('#save-position').on('click', function() {
            console.log("savePosition []");
            cytoscape.savePosition();
        });
        $('#load-position').on('click', function() {
            console.log("loadPosition []");
            cytoscape.loadPosition();
        });
        $('#play').on('click', function() {
            let b = cytoscape.cy
                .nodes().animate({
                    position: {
                        x: 0,
                        y: 0
                    }
                })
                .delay(1000)
                .animate({
                    pan: {
                        x: 0,
                        y: 0
                    }
                });
            // a.animation().play().promise().then(function () {
            //     b.animation().play();
            // });
            //--
        });
        $(window).on('popstate', function(event) {
            if (cytoscape.status) {
                cytoscape.add(cytoscape.status);
                cytoscape.zoom(0.07);
                // $("#load-position").click();
            }
        });
    }
}