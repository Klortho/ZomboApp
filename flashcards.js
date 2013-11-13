    // Math flashcards
    var math_problem = function() {
        var problem = (Math.floor((Math.random() * 6))) + " + " +
                      (Math.floor((Math.random() * 6)));
        //console.info(problem);
        $('#question').text(problem);
    };
