(function() {

    // Get the URL query string parameters
    //   d - debug (defaults to "false")
    //   r - number of rows
    //   c - number of cols
    //   wt - wall thickness
    //   clr - wall color
    //   tr - leave breadcrumb trail (default "true")
    var url_params;
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        url_params = {};
        while (match = search.exec(query))
           url_params[decode(match[1])] = decode(match[2]);
    })();

    // Canvas context
    var canvas;
    function init_canvas() {
        canvas = new fabric.Canvas('canvas');
        canvas.selection = false;
    }

    var canvas_width = 1000,
        canvas_height = 1000;

    var debug = 'd' in url_params ? url_params.d == 'true' : false,
        num_rows = 'r' in url_params ? url_params.r - 0 : 20,
        num_cols = 'c' in url_params ? url_params.c - 0 : 20,
        wall_thickness = 'wt' in url_params ? url_params.wt - 0 : 10,
        color = 'clr' in url_params ? url_params.clr : 'red',
        leave_trail = 'tr' in url_params ? !(url_params.tr == "false") : true;

    var maze = {
        num_rows: num_rows,
        num_cols: num_cols,
        wall_thickness: wall_thickness,
        color: color,
        cell_width: (canvas_width - wall_thickness) / num_cols,
        cell_height: (canvas_height - wall_thickness) / num_rows,
        cells: [],   // 2d array of objects
        walls: []
    };

    var fabric_path = '';
    function draw_maze() {
        var walls = maze.walls;
        var num_walls = walls.length;
        for (var wn = 0; wn < num_walls; ++wn) {
            var w = walls[wn];
            if (w.exists) {
                draw_wall(w);
            }
        }

        if (debug) console.info(fabric_path);
        var path = new fabric.Path(fabric_path);
        path.set({
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
            selectable: false,
            fill: "none",
            stroke: color,
            strokeWidth: wall_thickness,
            strokeLineCap: 'round'
        });
        canvas.add(path);
    }

    function draw_wall(w) {
        put_wall(w, maze.color);
    }
    function erase_wall(w) {
        put_wall(w, "white");
    }
    function put_wall(w, color) {
        var cw = maze.cell_width,
            ch = maze.cell_height,
            o = w.orientation,
            wt = maze.wall_thickness;

        var left = cw * w.col;
        var top = ch * w.row;
        var width  = o == "horizontal" ? cw + wt : wt;
        var height = o == "horizontal" ? wt : ch + wt;

        fabric_path += 'M ' + left + ' ' + top + ' ' +
            'l ' + (o == 'horizontal' ? cw : 0) + ' ' +
                   (o == 'horizontal' ? 0 : ch) + ' ';
    }

    function make_maze() {
        var num_rows = maze.num_rows;
        var num_cols = maze.num_cols;
        var num_cells = num_rows * num_cols;
        var cells = maze.cells;
        var walls = maze.walls;

        // Make the form sticky:
        $('#r').val(num_rows);
        $('#c').val(num_cols);
        $('#wt').val(wall_thickness);
        $('#clr').val(color);

        // First initialize the two-dimensional array of the cell objects
        for (var r = 0; r < num_rows; ++r) {
            var cell_row = cells[r] = [];
            for (var c = 0; c < num_cols; ++c) {
                var cell = cell_row[c] = {
                    visited: false,
                    walls: {}
                };
            }
        }

        // Now initialize the wall objects, such that all the walls
        // have "exists: 1".
        for (var r = 0; r < num_rows; ++r) {
            var cell_row = cells[r];
            for (var c = 0; c < num_cols; ++c) {
                var cell = cell_row[c];

                // Add cell walls, taking into account that cells share walls
                var cw = cell.walls;

                // north: if there is a cell to the north, that already has
                // a southern wall, then use that.
                if (r > 0 && cells[r-1][c].walls.S) {
                    cw.N = cells[r-1][c].walls.S;
                }
                else {
                    cw.N = {
                        exists: true,
                        orientation: 'horizontal',
                        row: r,
                        col: c
                    };
                    walls.push(cw.N);
                }

                // east
                if (c < num_cols - 1 && cells[r][c+1].walls.W) {
                    cw.E = cells[r][c+1].walls.W;
                }
                else {
                    cw.E = {
                        exists: true,
                        orientation: 'vertical',
                        row: r,
                        col: c+1
                    };
                    walls.push(cw.E);
                }

                // south
                if (r < num_rows - 1 && cells[r+1][c].walls.N) {
                    cw.S = cells[r+1][c].walls.N;
                }
                else {
                    cw.S = {
                        exists: true,
                        orientation: 'horizontal',
                        row: r+1,
                        col: c
                    };
                    walls.push(cw.S);
                }

                // west
                if (c > 0 && cells[r][c-1].walls.E) {
                    cw.W = cells[r][c-1].walls.E;
                }
                else {
                    cw.W = {
                        exists: true,
                        orientation: 'vertical',
                        row: r,
                        col: c
                    };
                    walls.push(cw.W);
                }
            }
        }

        // Set the mole to a random place to start, and initialize start
        // and finish flags
        var got_start = false;
        var got_finish = false;
        var mole = {};
        var num_cells_visited = 0;

        // Move the mole into a specific cell
        function move_mole(row, col) {
            mole.r = row;
            mole.c = col;
            cells[row][col].visited = true;
            num_cells_visited++;
        }

        // Start in a random cell
        move_mole(Math.floor(Math.random() * num_rows),
                  Math.floor(Math.random() * num_cols));

        // When we hit a dead-end, "hop" the mole to a cell that we've
        // already visited.
        function hop_mole() {
            do {
                mole.r = Math.floor(Math.random() * num_rows);
                mole.c = Math.floor(Math.random() * num_cols);
            }
            while (!cells[mole.r][mole.c].visited);
        }

        // This says when we're done
        function done_digging() {
            return got_start && got_finish && num_cells_visited == num_cells;
        }

        // Start digging
        while (!done_digging()) {
            var r = mole.r;
            var c = mole.c;
            var cell = cells[r][c];

            // which directions can we go from here?
            var good_directions = [];
            // North?
            if ((r == 0 && !got_start) || (r > 0 && !cells[r-1][c].visited)) {
                good_directions.push('N');
            }
            // East?
            if (c < num_cols - 1 && !cells[r][c+1].visited) {
                good_directions.push('E');
            }
            // South?
            if ((r == num_rows-1 && !got_finish) ||
                (r < num_rows-1 && !cells[r+1][c].visited)) {
                good_directions.push('S');
            }
            // West?
            if (c > 0 && !cells[r][c-1].visited) {
                good_directions.push('W');
            }

            // Can we go anywhere?
            var num_dirs = good_directions.length;
            if (num_dirs == 0) {
                // No, we need to hop the mole
                hop_mole(mole);
            }
            else {
                // Pick one of those directions, and dig there
                var dir = good_directions[ Math.floor(Math.random() * num_dirs) ];
                // Clear the wall
                cell.walls[dir].exists = false;
                // If you want to see it work while debugging, uncomment:
                //erase_wall(cell.walls[dir]);
                // Move the mole
                if (dir == 'N') {
                    if (r == 0) {
                        got_start = true;
                        maze.start_col = c;
                        if (!done_digging()) hop_mole();
                    }
                    else {
                        move_mole(r-1, c);
                    }
                }
                else if (dir == 'E') {
                    move_mole(r, c+1);
                }
                else if (dir == 'S') {
                    if (r == num_rows - 1) {
                        got_finish = true;
                        if (!done_digging()) hop_mole();
                    }
                    else {
                        move_mole(r+1, c);
                    }
                }
                else if (dir = 'W') {
                    move_mole(r, c-1);
                }
            }
        }

        draw_maze();
    }

    // document ready function
    $(function() {
        init_canvas();
        make_maze();
        var nr = maze.num_rows,
            nc = maze.num_cols,
            wt = maze.wall_thickness,
            cw = maze.cell_width,
            ch = maze.cell_height,
            cw_free = cw - wt,   // free space between walls
            ch_free = ch - wt,
            start_col = maze.start_col,
            sprite_size = Math.min(cw_free * 0.8, ch_free * 0.8);

        var sprite;
        var sprite_data = {
            row: 0,
            col: start_col,
            dir: 'S'
        };

        // This function computes the `left` and `top`, given a cell row and col
        function coords(row, col) {
            return {
                left: col * cw + (cw + wt)/2,
                top: row * ch + (ch + wt)/2
            };
        }

        // Call this function when the sprite image has finished loading
        function sprite_loaded(oImg) {
            sprite = oImg;
            var size = sprite_size;
            var start_coords = coords(0, maze.start_col);
            sprite.set({
                left: start_coords.left,
                top: start_coords.top,
                width: size,
                height: size,
                angle: 180
            });
            canvas.add(sprite);
            var animation_in_progress = false;

            $('body').on('keydown', function(evt) {
                var k = evt.keyCode;
                // Return if it's not one of the arrow keys
                if (k < 37 || k > 40) return true;

                // Return if our previous animation isn't finished yet
                if (animation_in_progress) return false;

                var dir,    // new direction
                    prop,   // property to animate
                    delta,  // amount to animate
                    angle;  // angle of the image, in degrees

                if (k == 37) {
                    dir = 'W';
                    prop = 'left';
                    delta = '-=' + cw;
                    angle = 270;
                }
                else if (k == 38) {
                    dir = 'N';
                    prop = 'top';
                    delta = '-=' + ch;
                    angle = 0;
                }
                else if (k == 39) {
                    dir = 'E';
                    prop = 'left';
                    delta = '+=' + cw;
                    angle = 90;
                }
                else {
                    dir = 'S';
                    prop = 'top';
                    delta = '+=' + ch;
                    angle = 180;
                }

                // Can we go that way?
                var r = sprite_data.row,
                    c = sprite_data.col;
                var can_move = !(maze.cells[r][c].walls[dir].exists ||
                                 c == 0 && dir == 'W' ||
                                 r == 0 && dir == 'N' ||
                                 c == nc - 1 && dir == 'E' ||
                                 r == nr - 1 && dir == 'S');
                if (debug) console.info("can_move = " + can_move);

                // Define a function that will handle the move (as opposed to the rotation)
                var animate_move = can_move ?
                    function() {
                        if (dir == 'W')
                            sprite_data.col--;
                        else if (dir == 'N')
                            sprite_data.row--;
                        else if (dir == 'E')
                            sprite_data.col++;
                        else
                            sprite_data.row++;

                        sprite.animate(prop, delta, {
                            onChange: canvas.renderAll.bind(canvas),
                            onComplete: function() {
                                animation_in_progress = false;
                            }
                        });
                        if (leave_trail && !maze.cells[r][c].seen) {
                            if (debug) console.info("adding trail dot");
                            var dot_coords = coords(r, c);
                            var circle = new fabric.Circle({
                                radius: sprite_size/5,
                                fill: 'black',
                                left: dot_coords.left,
                                top: dot_coords.top
                            });
                            canvas.add(circle);
                            canvas.sendToBack(circle);
                            maze.cells[r][c].seen = true;
                        }
                    } :
                    function() {
                        animation_in_progress = false;
                        if (debug) console.info("sorry");
                    };

                if (debug) {
                    console.info("dir = " + dir + "\nprop = " + prop + "\ndelta = " + delta +
                    "\nangle = " + angle + "\nnew row = " + sprite_data.row +
                    "\nnew col = " + sprite_data.col);
                }

                // Do we need to change direction?
                animation_in_progress = true;
                if (sprite_data.dir != dir) {
                    sprite_data.dir = dir;
                    sprite.animate('angle', angle, {
                        duration: 100,
                        onChange: canvas.renderAll.bind(canvas),
                        onComplete: animate_move
                    });
                }
                else {
                    animate_move();
                }

                return false;
            });

        };

        // Load the sprite image and kick things off
        fabric.Image.fromURL('ladybug_red-100.png', sprite_loaded);


    });
})();
