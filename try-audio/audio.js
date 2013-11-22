$(function() {
    // Create audio context object
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audio_context = window.AudioContext ? new AudioContext() : null;

    // Load the sound
    var sounds = {
        boing: {
            filename: 'Boing-Low.mp3',
            buffer: null
        }
    };
    for (var sk in sounds) {
        console.info("Loading " + sk);
        var s = sounds[sk];
        var request = new XMLHttpRequest();
        request.open('GET', 'Boing-Low.mp3', true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            audio_context.decodeAudioData(request.response,
                function(buffer) {  // success
                    console.info("decoded");
                    boing_buffer = buffer;
                    playSound(buffer);
                },
                function() {  // error
                    console.info("error trying to decode audio data");
                }
            );
        }
        request.send();
    }

    var boing_buffer = null;

    function playSound(buffer) {
        var source = audio_context.createBufferSource();
        source.buffer = buffer;
        source.connect(audio_context.destination);
        source.start(0);
    }
});
