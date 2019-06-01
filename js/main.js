/* main.js */

// document ready wrap
function run() {

// ========================
// Data
// ========================

// Stat data
var stats = {
	totalPoints: 0,
	averageScore: 0,
	averageVariance: 0,
	groupCenter: [0.0, 0.0]
};

// Current shot data
var currentShot = {
	index: 0,
	score: 0,
	coords: [0.0, 0.0],
	variance: 0.0
};

// Shot constructor
function Shot(index, score, coords, variance) {
	this.index = index;
	this.score = score;
	this.coords = coords;
	this.variance = variance;
}

// Mouse coordinates
var mouseX;
var mouseY;

// Log data
var log = [
	// currentShot data pushed here via constructor
];

// ========================
// Actions
// ========================

// Enter coordinates
document.getElementById('enter-coordinates').addEventListener('click', inputCoords);
document.addEventListener('keyup', function(){
	var x = document.getElementById('x-coordinate').value;
	var y = document.getElementById('y-coordinate').value;
	if (x && y) {
		document.getElementById('enter-coordinates').classList.remove('disabled');
	}
});

// Track cursor
document.getElementById('target').addEventListener('mousemove', trackCursor);

// Click coordinates
document.getElementById('target').addEventListener('click', clickCoords);

// Clear log
// document.getElementById('clear-log').addEventListener('click', clearLog);

// Rewind slider
document.getElementById('rewind').addEventListener('click', rewind);

// Play slider
document.getElementById('play').addEventListener('click', play);

// Pause slider
document.getElementById('pause').addEventListener('click', pause);

// Fast forward slider
document.getElementById('fast-forward').addEventListener('click', fastForward);

// Scrub slider
document.getElementById('slider').addEventListener('input', scrub);


// ========================
// Functions
// ========================

// Track cursor
function trackCursor(e) {
	var target = document.getElementById('target');

	// update mouse indicator position
	mouseX = e.pageX;
    mouseY = e.pageY;
    document.getElementById('mouse-coordinates').setAttribute('style','top:' + (mouseY + 8) + 'px; left:' + (mouseX + 8) + 'px;');

    // convert to target offset values
    mouseX -= target.offsetLeft;
    mouseY -= target.offsetTop;

    // convert to percents
    mouseX = (mouseX / target.offsetWidth) * 100;
    mouseY = (mouseY / target.offsetWidth) * 100;

    // convert to coordinates
    mouseX = round(((mouseX - 50) / 5), 1).toFixed(1);
    mouseY = round((-(mouseY - 50) / 5), 1).toFixed(1);

    // update mouse coordinate values
    document.getElementById('mouse-x').innerHTML = mouseX, 1;
    document.getElementById('mouse-y').innerHTML = mouseY, 1;
}

// Input coordinates
function inputCoords() {
	// get values from inputs
	var x = parseFloat(document.getElementById('x-coordinate').value);
	var y = parseFloat(document.getElementById('y-coordinate').value);

	// clear inputs, reset disable
	document.getElementById('x-coordinate').value = '';
	document.getElementById('y-coordinate').value = '';
	document.getElementById('enter-coordinates').classList.add('disabled');

	// round to one decimal
	x = x.toFixed(1);
	y = y.toFixed(1);

	// update current shot coordinates based on inputs
	currentShot.coords = [x, y];

	// plot shot
	plotShot();

	// log shot
	logShot();

	// calculate stats
	calcStats();
}

// Click coordinates
function clickCoords() {
	// update currentShot coordinates based on mouse position
	currentShot.coords = [mouseX, mouseY];

	// plot shot
	plotShot();

	// log shot
	logShot();

	// calculate stats
	calcStats();
}

// Plot shot
function plotShot() {
	// multiply the coordinate by five and add to 50 for the location percentage
	var xPercent = 50 + (currentShot.coords[0] * 5);
	var yPercent = 50 - (currentShot.coords[1] * 5);

	// remove current class from arrows
	var arrows = document.querySelectorAll('.arrow');

	for (i = 0; i < arrows.length; i++) {
		arrows[i].style.visibility = 'visible';
	    arrows[i].classList.remove('current');
	}

	// place arrow on target based on coords
	var target = document.getElementById('target');
	var arrow = document.createElement('span');
	arrow.setAttribute('class','arrow');
	arrow.setAttribute('style','top:' + yPercent + '%; left:' + xPercent + '%;');
	arrow.classList.add('current');
	target.appendChild(arrow);

	// get distance from origin
	var distance = Math.sqrt((currentShot.coords[0] * currentShot.coords[0]) + (currentShot.coords[1] * currentShot.coords[1]));

	// consider arrow width (ring units): arrow is 3/10 of ring, half of arrow is 0.15
	distance -= 0.15;

	// round to int
	distance = Math.floor(distance);

	// highlight appropriate ring
	highlightShot(distance);

	// update range slider
	document.getElementById('slider').setAttribute('max', currentShot.index + 1);
	document.getElementById('slider').value = currentShot.index + 1;
	document.getElementById('current').innerHTML = currentShot.index + 1;
	document.getElementById('total').innerHTML = currentShot.index + 1;

	// disable play and fast forward
	document.getElementById('play').classList.add('disabled');
	document.getElementById('fast-forward').classList.add('disabled');

	// enable rewind
	document.getElementById('rewind').classList.remove('disabled');
}

// Log shot
function logShot() {
	// update current shot index
	currentShot.index++;

	// calculate shot variance
	if (currentShot.index - 1){
		currentShot.variance = Math.sqrt(Math.pow(((currentShot.coords[0] - log[currentShot.index - 2].coords[0])), 2) + Math.pow(((currentShot.coords[1] - log[currentShot.index - 2].coords[1])),2));
		currentShot.variance = currentShot.variance.toFixed(1);
	} else {
		currentShot.variance = 0.0;
		currentShot.variance = currentShot.variance.toFixed(1);
	}

	// push currentShot data to log via constructor
	log.push(new Shot(currentShot.index, currentShot.score, currentShot.coords, currentShot.variance));

	// add shot data to table
	var table = document.getElementById('shots');
	var row = table.insertRow(2);
	row.insertCell(0).innerHTML = currentShot.index;
	row.insertCell(1).innerHTML = currentShot.score;
	row.insertCell(2).innerHTML = currentShot.coords[0] + ', ' + currentShot.coords[1];
	row.insertCell(3).innerHTML = currentShot.variance;

	// remove blank rows one at a time while in existence
	if (currentShot.index < 6) {
		var rows = table.getElementsByTagName('tr');
		var lastrow = rows[rows.length - 1];
		lastrow.remove();
	}

	// trigger scrub - for highlight
	scrub();
}

// Calculate stats
function calcStats() {
	// calculate average score
	if (currentShot.index === 1) {
		stats.totalPoints = currentShot.score;
		stats.averageScore = currentShot.score;
	} else {
		stats.totalPoints += currentShot.score;
		stats.averageScore = stats.averageScore + ((currentShot.score - stats.averageScore) / currentShot.index);
		stats.averageScore = round(stats.averageScore, 1);
	}

	// calculate average variance
	if (currentShot.index <= 2) {
		stats.averageVariance = parseFloat(currentShot.variance);
	} else {
		stats.averageVariance = stats.averageVariance + ((currentShot.variance - stats.averageVariance) / (currentShot.index - 1));
		stats.averageVariance = round(stats.averageVariance, 1);
	}

	// calculate group center
	if (currentShot.index < 2) {
		stats.groupCenter[0] = currentShot.coords[0];
		stats.groupCenter[1] = currentShot.coords[1];
	} else {
		// (all x divided by shot count), (all y divided by shot count)
		stats.groupCenter[0] = round(((parseFloat(stats.groupCenter[0]) * (parseFloat(currentShot.index) - 1)) + parseFloat(currentShot.coords[0])) / currentShot.index, 1).toFixed(1);
		stats.groupCenter[1] = round(((parseFloat(stats.groupCenter[1]) * (parseFloat(currentShot.index) - 1)) + parseFloat(currentShot.coords[1])) / currentShot.index, 1).toFixed(1);
	}

	// update total score, average score, average variance, and group center
	document.getElementById('total-score').innerHTML = stats.totalPoints + '/' + currentShot.index * 10;
	document.getElementById('average-score').innerHTML = stats.averageScore.toFixed(1);
	document.getElementById('average-variance').innerHTML = stats.averageVariance.toFixed(1);
	document.getElementById('group-center').innerHTML = stats.groupCenter[0] + ', ' + stats.groupCenter[1];
}

// Highlight shot
function highlightShot(score) {
	// determine score by subtacting distance from center from ring count
	score = 10 - score;

	// set to zero if negative
	if (score < 0) {
		score = 0;
	}

	// if bull's eye
	if (score === 11) {
		score = 10;
	}

	// update current shot score
	currentShot.score = score;

	// remove highlight from previous scored ring
	var highlight = document.getElementsByClassName('highlight');
	if (highlight[0]){
    	highlight[0].classList.remove('highlight');
	}

	// add highlight to current scored ring
	if (score > 0) {
		highlight = document.querySelectorAll('[score="'+score+'"]');
		highlight[0].classList.add('highlight');

		// remove highlight after animation
		setTimeout(function(){
	    	highlight[0].classList.remove('highlight');
	    }, 700);
	}

	// color code plotted arrow
	var target = document.getElementById('target');
	var arrow = target.lastChild;
	switch (true) {
	    case (score < 3):
	        // 1,2 white ring
	        arrow.classList.add('white');
	        break;
	    case (score > 2 && score < 5):
	        // 3,4 black ring
	        arrow.classList.add('black');
	        break;
	    case (score > 4 && score < 7):
	        // 5,6 blue ring
	        arrow.classList.add('blue');
	        break;
	    case (score > 6 && score < 9):
	        // 7,8 red ring
	        arrow.classList.add('red');
	        break;
	    case (score > 8):
	        // 9,10 gold ring
	        arrow.classList.add('gold');
	        break;
	}
}

// Clear log
// function clearLog() {
// 	// clear target
// 	var arrows = document.getElementsByClassName('arrow');
// 	for (i = (arrows.length - 1); i >= 0; i--) {
// 		arrows[i].remove();
// 	}

// 	// reset group center indicator
// 	var center = document.getElementById('group-center-indicator');
// 	center.setAttribute('style','top: 50%; left: 50%;');

// 	// clear stats
// 	document.getElementById('total-score').innerHTML = '0/0';
// 	document.getElementById('average-score').innerHTML = '0.0';
// 	document.getElementById('average-variance').innerHTML = '0.0';
// 	document.getElementById('group-center').innerHTML = '0.0, 0.0';

// 	// clear stat data
// 	stats.totalPoints = 0;
// 	stats.averageScore = 0;
// 	stats.averageVariance = 0;
// 	stats.groupCenter = [0.0, 0.0];

// 	// clear log
// 	var table = document.getElementById('shots');
// 	var tbody = table.children;
// 	var rows = tbody[0].children;

// 	// remove all rows after 2nd
// 	for (i = (rows.length -1); i >= 2; i--) {
// 		rows[i].remove();
// 	}

// 	// insert five blank rows after 2nd
// 	for (i = 0; i < 5; i++) {
// 		var blank = table.insertRow(2);
// 		for (j = 0; j < 4; j++) {
// 			blank.insertCell(j).innerHTML = '-';
// 		}
// 	}

// 	// clear log data
// 	log = [];

// 	// reset shot index
// 	currentShot.index = 0;

// 	// reset scrubber
// 	document.getElementById('current').innerHTML = 0;
// 	document.getElementById('total').innerHTML = 0;
// 	document.getElementById('slider').value = 0;
// 	document.getElementById('slider').setAttribute('max', 0);
// }

// Rewind
function rewind() {
	// pause playback
	clearInterval(player);
	document.getElementById('pause').classList.add('inactive');
	document.getElementById('play').classList.remove('inactive');

	// move scrub to beginning
	document.getElementById('slider').value = 0;

	// trigger range change
	scrub();
}

// Play
function play() {
	var range = document.getElementById('slider');
	var value = parseInt(range.value);
	var max = parseInt(range.getAttribute('max'));

	// toggle play/pause
	document.getElementById('play').classList.add('inactive');
	document.getElementById('pause').classList.remove('inactive');

	// start playback
	player = window.setInterval(playback, 750);

	// playback function
	function playback() {
		// stop playback if at end
		if (range.value == (max - 1)) {
			stopPlayback();
		}

		// increment scrub
	    range.value++;
		scrub();

		// highlight current shot
		highlightShot(10 - log[range.value - 1].score);
	}

	// stop playback function
	function stopPlayback() {
    	clearInterval(player);
    	document.getElementById('pause').classList.add('inactive');
		document.getElementById('play').classList.remove('inactive');
	}
}

// Pause
function pause() {
	clearInterval(player);
	document.getElementById('pause').classList.add('inactive');
	document.getElementById('play').classList.remove('inactive');
}

// Fast forward
function fastForward() {
	// pause playback
	clearInterval(player);
	document.getElementById('pause').classList.add('inactive');
	document.getElementById('play').classList.remove('inactive');

	// move scrub to beginning
	var max = document.getElementById('slider').getAttribute('max');
	document.getElementById('slider').value = max;

	// trigger range change
	scrub();
}

// Scrub
function scrub() {
	var range = document.getElementById('slider');
	var value = parseInt(range.value);
	var min = range.getAttribute('min');
	var max = range.getAttribute('max');
	var arrows = document.querySelectorAll('.arrow');
	var table = document.getElementById('shots');
	var rows = table.getElementsByTagName('tr');
	var center = document.getElementById('group-center-indicator');

	// update current indicated based on range value
	document.getElementById('current').innerHTML = value;

	// show all arrows
	for (i = 0; i < arrows.length; i++) {
	    arrows[i].style.visibility = 'visible';
	    arrows[i].classList.remove('current');
	}

	// hide arrows past current value
	for (i = value; i < max; i++) {
		arrows[i].style.visibility = 'hidden';
	}

	// mark currently shown arrow as selected
	if (value > 0) {
		arrows[value - 1].classList.add('current');
	}

	// highlight corresponding entry in log
	for (i = 0; i < rows.length; i++) {
	    rows[i].classList.remove('current');
	}

	if (value >= 1) {
		rows[max - (value - 2)].classList.add('current');
	}

	// calculate group center up to current scrub
	if (currentShot.index > 0) {
		var currentX = 0;
		var currentY = 0;

		// all x and all y up to current
		for (i = 0; i < value; i++) {
			currentX += parseFloat(log[i].coords[0]);
			currentY += parseFloat(log[i].coords[1]);
		}

		// update group center of current scrub (all x up to current divided by current index), (all y up to current divided by current index)
		currentX = currentX / value;
		currentY = currentY / value;

		// multiply the coordinate by five and add to 50 for the location percentage
		var xPercent = 50 + (currentX * 5);
		var yPercent = 50 - (currentY * 5);

		// place group center on target based on center coords
		center.setAttribute('style','top:' + yPercent + '%; left:' + xPercent + '%;');

		// return group indicator to center if at start
		if (value <= 0) {
			center.setAttribute('style','top: 50%; left: 50%;');
		}
	}

	// toggle play and fast forward
	if (value < max) {
		document.getElementById('play').classList.remove('disabled');
		document.getElementById('fast-forward').classList.remove('disabled');
	} else {
		document.getElementById('play').classList.add('disabled');
		document.getElementById('fast-forward').classList.add('disabled');
	}

	// toggle rewind
	if (value > min) {
		document.getElementById('rewind').classList.remove('disabled');
	} else {
		document.getElementById('rewind').classList.add('disabled');
	}
}

// Round to precision
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

}

// document ready logic
if (document.readyState!='loading') run();
// modern browsers
else if (document.addEventListener) document.addEventListener('DOMContentLoaded', run);
// IE <= 8
else document.attachEvent('onreadystatechange', function(){
    if (document.readyState=='complete') run();
});