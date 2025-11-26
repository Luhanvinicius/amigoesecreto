$(document).ready(function() {
    var loader = $('#loader');

    // Show loader when form is submitted
    $('form').submit(function() {
        loader.fadeIn();
    });

    // Hide loader for links with data-ajax-popup attribute
    $(document).on('click', 'a[data-ajax-popup="true"]', function() {
        loader.fadeOut();
    });


    // Handle page events
    $(window).on('beforeunload', function() {
        loader.fadeIn(); // Show loader when leaving the page
    });

    $(window).on('load', function() {
        loader.fadeOut(); // Hide loader when page is fully loaded
    });

    $(window).on('pageshow', function(event) {
        if (event.originalEvent.persisted) {
            loader.fadeOut(); // Hide loader when page is shown from the cache
        }
    });

});
