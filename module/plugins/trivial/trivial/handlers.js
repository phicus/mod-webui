'use strict';
import $ from "jquery";

class Handlers {
    constructor(trivial) {
        $('#load-position').hide();
        $('#save-position').hide();
        $('#work-mode').on('click', function() {
            trivial.workMode();
        });
        $('#view-mode').on('click', function() {
            trivial.viewMode();
        });
        $('#save-position').on('click', function() {
            console.log("savePosition []");
            trivial.savePosition();
        });
        $('#load-position').on('click', function() {
            console.log("loadPosition []");
            trivial.loadPosition();
        });
        $('#play').on('click', function() {
            let b = trivial.cy
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
            if (trivial.status) {
                trivial.add(trivial.status);
                trivial.zoom(0.07);
                // $("#load-position").click();
            }
        });
    }
}