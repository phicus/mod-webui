$('#work-mode').on('click', function () {
    workMode();
});

$('#view-mode').on('click', function () {
    viewMode();
});

$("#center").on("click", () => { cy.center() });

$('#save-position').on('click', function () {
    console.log("savePosition []")
    savePosition();
});

$('#save-position-backup').on('click', function () {
    console.log("savePositionBackup []")
    savePosition(true);
});

$('#load-position').on('click', function () {
    console.log("loadPosition []")
    loadPosition(true);
});

$('#load-position-backup').on('click', function () {
    console.log("loadPositionBackup []")
    loadPosition(true, true);
});

$('#play').on('click', function () {

    var b = window.cy
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

$(window).on('popstate', function (event) {
    viewMode();
    $('#loader').show();
    trivial_search($('#txtSearch').val());
});

// FIXME
$("#nav-filters > form").submit(e => {
    var txt = $("#search").val();
    console.log(`SEARCH: ${txt}`);
    e.preventDefault();
    viewMode();
    $('#loader').show();
    trivial_search(txt)
    console.log(`SEARCH: ${txt}`);
});