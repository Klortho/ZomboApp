(function() {
    // Canvas context
    var ctx;

    var math_problem = function() {
        var problem = (Math.floor((Math.random() * 6))) + " + " +
                      (Math.floor((Math.random() * 6)));
        console.info(problem);
        $('#question').text(problem);
    };


    function init_canvas() {
        var canvas = document.getElementById('canvas');
        if (canvas.getContext) {
            ctx = canvas.getContext('2d');
        }
    }

    function make_maze() {
            ctx.fillStyle = "rgb(200, 0, 0)";
            ctx.fillRect (0, 0, 1000, 500);

            ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
            ctx.fillRect (30, 30, 55, 50);
    }

    // document ready function
    $(function() {
        init_canvas();

        //math_problem();
        make_maze();
        $('#answer').focus();
    });
})();
