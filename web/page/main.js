//Copyright (C) 2015 <>< Charles Lohr, see LICENSE file for more info.
//
//This particular file may be licensed under the MIT/x11, New BSD or ColorChord Licenses.

function KickHID()
{
}

var lastMouseX;
var lastMouseY;
var TimeLastUp;
var ButtonsDown = 0;

var UpTimeout;


function HandleUpDown( button, down )
{
	console.log( "HandleUpDown: " + button + " " + down );
	var Mask = 1<<button;
	if( down )
		ButtonsDown |= Mask;
	else
		ButtonsDown &= ~Mask;

	DeltaMouse( 0, 0 );

	if( down )
	{
		$("#MouseCap").css("background-color","blue");
	}
	else
	{
		$("#MouseCap").css("background-color","green");
	}

}

function MouseUpDown( down )
{
	if( !down )
	{
		TimeLastUp = Date.now();
		UpTimeout = setTimeout( function() { HandleUpDown( 0, false ); }, 200 );
	}
	else
	{
		var now = Date.now();
	    var dt = now - TimeLastUp;
		HandleUpDown( 0, dt < 150 );
		try{ clearTimeout( UpTimeout ); } catch(e) { }
	}
}

function DeltaMouse( x, y )
{
	msg = Math.round(x) + ", " + Math.round(y);
	var msg = "CM" + ButtonsDown + "\t" + Math.round(x) + "\t" + Math.round(y);
	QueueOperation( msg );	
	console.log( msg );
}

var KeyboardModifiers = 0;

var allUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+{}|:\"~<>?";
var usblookup = {
    0x08 : 0x2A, // BACKSPACE
    0x09 : 0x2B, // TAB
    0x0C : 0x28,
    0x10 : 0xE1, // SHIFT
    0x11 : 0xE0, // CTRL
    0x12 : 0xE2, // ALT
    0x14 : 0x39, // CAPS
    0x1B : 0x29,
    0x20 : 0x2C,
    0xAD : 0x7F, // MUTE
}
var s1 = "abcdefghijklmnopqrstuvwxyz1234567890";
var s2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()";
for (var c = 0; c < 36; c++) {
    usblookup[s1[c].charCodeAt(0)] = c + 4;
    usblookup[s2[c].charCodeAt(0)] = c + 4;
}
var s1 = "-=[]\\ ;'`,./";
var s2 = "_+{}| :\"~<>?";
for (var c = 0; c < 12; c++) {
    if (c == 5) continue; // Skip over american-only hash-tilde, since that will mess with the non-american 3-hash and grave-tilde keys.
    usblookup[s1[c].charCodeAt(0)] = c + 0x2D;
    usblookup[s2[c].charCodeAt(0)] = c + 0x2D;
}
for (var c = 0; c < 12; c++) { // F1 .. F12
    usblookup[c + 0x70] = c + 0x3A;
}
//for (var c = 0; c < 12; c++) { // F13 .. F24
//    usblookup[c + /* TODO: Figure out keycode for F13 */] = c + 0x68;
//}
// TODO: Numpad

$(document).ready(function () {
    // Delay adding events, until the document is fully loaded
    $("#kbd").click(function () {$("#kin").focus(); });
    $("#kin").on("keydown keyup", function (ev) {
        var type = ev.type == "keydown" ? 1 : 0;
        var c = ev.originalEvent.keyCode;
        if (c == 229) { // Android keyboard "Unidentified" (for Swipe, etc.)
            if (type == 1) return; // Only check the text box on KeyUp events
            KeypressMulti(this.value);
            this.value = "";
            return;
        }
        var usbId = usblookup[c];
        console.log(ev);
        if (usbId === undefined) return; // Not a valid HID key code
        ev.preventDefault(); // Stop things like TAB switching fields
        this.value = "";
        
        Keypress(usbId, type, ev.shiftKey);
    });
});

function Keypress(id, type, shift) {
    if (shift) {
        KeyboardModifiers |= 2;
    } else {
        KeyboardModifiers &=~2;
    }
    
    if (type == 1) QueueOperation("CK" + KeyboardModifiers + "\t" + id); // Need a sanity check;
    if (type == 0) QueueOperation("CK0\t0");
}
function KeypressMulti(str) {
    [].forEach.call(str, function(char) {
        console.log(char);
        var modifier = 0;
        if (allUpper.indexOf(char) >= 0) modifier = 2;
        let id = usblookup[char.charCodeAt(0)];
        if (id === undefined) return;
        $("#typed").text(($("#typed").text() + char).slice(-50));
        $("#codes").text(($("#codes").text() + " " + ("0"+id.toString(16)).slice(-2)).slice(-50))
        QueueOperation("CK" + modifier + "\t" + id);
    });
    QueueOperation("CK0\t0");
}

function AttachMouseListener()
{
    $("#MouseCap").on("touchstart", function(event) {
		event.preventDefault();
		var e = event.originalEvent.changedTouches[0];
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
		MouseUpDown( true );
	});

    $("#MouseCap").on("touchend", function(event) {
		event.preventDefault();
		var e = event.originalEvent.changedTouches[0];
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
		MouseUpDown( false );
	});

	$("#MouseCap").on("touchmove", function(event)  {
		event.preventDefault();
		var e = event.originalEvent.changedTouches[0];
		DeltaMouse( e.clientX - lastMouseX, e.clientY - lastMouseY );
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
		return false;
	});

	//This is for desktop mice.
	for( var b = 0; b < 3; b++ )
	{
		let ths = b; //Thank you, Mortiz from youtube live chat!!!
		$("#Mouse"+b).on("mouseup", function(event) { HandleUpDown( ths, 0 ); } );
		$("#Mouse"+b).on("mousedown", function(event) { HandleUpDown( ths, 1 ); } );
		$("#Mouse"+b).on("touchend", function(event) { HandleUpDown( ths, 0 ); } );
		$("#Mouse"+b).on("touchstart", function(event) { HandleUpDown( ths, 1 ); } );
	}

	console.log( "Attaching." );
}

window.addEventListener("load", AttachMouseListener, false);

/*
is_leds_running = false;
pause_led = false;

function KickLEDs()
{
	$( "#LEDPauseButton" ).css( "background-color", (is_leds_running&&!pause_led)?"green":"red" );

	if( !is_leds_running && !pause_led )
		LEDDataTicker();

}

window.addEventListener("load", KickLEDs, false);

function ToggleLEDPause()
{
	pause_led = !pause_led;
	KickLEDs();
}


function GotLED(req,data)
{
	var ls = document.getElementById('LEDCanvasHolder');
	var canvas = document.getElementById('LEDCanvas');
	var ctx = canvas.getContext('2d');
	var h = ls.height;
	var w = ls.width;
	if( canvas.width != ls.clientWidth-10 )   canvas.width = ls.clientWidth-10;
	if( ctx.canvas.width != canvas.clientWidth )   ctx.canvas.width = canvas.clientWidth;

	var secs = data.split( ":" );

	$( "#LEDPauseButton" ).css( "background-color", "green" );

	var samps = Number( secs[1] );
	var data = secs[2];
	var lastsamp = parseInt( data.substr(0,4),16 );
	ctx.clearRect( 0, 0, canvas.width, canvas.height );

	for( var i = 0; i < samps; i++ )
	{
		var x2 = i * canvas.clientWidth / samps;
		var samp = data.substr(i*6,6);
		var y2 = ( 1.-samp / 2047 ) * canvas.clientHeight;

		ctx.fillStyle = "#" + samp.substr( 2, 2 ) + samp.substr( 0, 2 ) + samp.substr( 4, 2 );
		ctx.lineWidth = 0;
		ctx.fillRect( x2, 0, canvas.clientWidth / samps+1, canvas.clientHeight );
	}

	var samp = parseInt( data.substr(i*2,2),16 );

	LEDDataTicker();
} 

function LEDDataTicker()
{
	if( IsTabOpen('LEDs') && !pause_led )
	{
		is_leds_running = true;
		QueueOperation( "CL",  GotLED );
	}
	else
	{
		is_leds_running = 0;
	}
	$( "#LEDPauseButton" ).css( "background-color", (is_leds_running&&!pause_led)?"green":"red" );

}

*/


