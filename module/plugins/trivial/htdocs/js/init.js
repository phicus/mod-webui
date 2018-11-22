$(function () {
    $("#nav-filters > form").attr("action", "#")
    trivial_search($('#txtSearch').val());
        $('#load-position').hide();
    $('#save-position').hide();
    $('#work-mode').hide();
    $('#center').hide();
    $('#save-position-backup').hide();
    $('#load-position-backup').hide();
})