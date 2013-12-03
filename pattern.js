(function() {

    // Get the URL query string parameters
    // Initialize with defaults
    var url_params = {
        d:  false,  // debug
        nd: 16,     // number of dots
        j:   7      // number to jump each time
    };
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        while (match = search.exec(query)) {
            var k = decode(match[1]);
            var v = decode(match[2]);
            vlc = v.toLowerCase();
            if (k in url_params) {
                var t = typeof url_params[k];
                if (t == 'boolean') {
                    var first = vlc.substring(0, 1);
                    url_params[k] = (first == 't' || first == 'y');
                }
                else if (t == 'number') {
                    url_params[k] = v - 0;
                }
                else {  // string
                    url_params[k] = v;
                }
            }
        }
    })();

    // Initialize a bunch of stuff derived from the url params
    var debug = url_params.d,
        num_dots = url_params.nd,
        jump = url_params.j;

    // Function to make the form sticky.  This is called on document load
    function make_form_sticky() {
        // Make the form sticky:
        $('#dots').val(num_rows);
        $('#jump').val(num_cols);
    }

    // Initialize canvas context
    var canvas;
    function init_canvas() {
        canvas = new fabric.Canvas('canvas');
        canvas.selection = false;
    }
    var canvas_width = 1000,
        canvas_height = 1000;

    // document ready function
    $(function() {
        init_canvas();

        for (var i = 0; i < num_dots; ++i) {
            var angle = jump / num_dots * i * 2 * Math.PI;
            var cx = 500 + Math.sin(angle) * 300;
            var cy = 500 + Math.cos(angle) * 300;
            canvas.add(new fabric.Circle({
                selectable: false,
                radius: 4,
                fill: 'black',
                left: cx,
                top: cy
            }));
            canvas.add(new fabric.Text(i + '', {
                fontSize: 30,
                left: 500 + Math.sin(angle) * 340,
                top: 500 + Math.cos(angle) * 340
            }));
        }
    });


})();
