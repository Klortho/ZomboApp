/*
  See try-path.html
*/

(function() {
    var canvas;   // fabric object
    function init_canvas() {
        canvas = new fabric.Canvas('canvas');
    }

    function draw() {
        var path = new fabric.Path('M 0 0 L 200 100 L 170 300');
        path.set({ left: 500, top: 500 });
        canvas.add(path);
    }

    // document ready function
    $(function() {
        init_canvas();
        draw();
    });
})();
