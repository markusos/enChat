var socket;
var serverHostName = '85.227.247.169'; //	http://localhost';
var user;
var mid = 0;
var lastMessage = null;


$(document).ready(function() {
    $('#message').focus();

    $('#messageForm').submit(function () {
	 send();
	 return false;
	});

	$('#loginForm').submit(function () {
	 connect();
	 return false;
	});
});

function recieveMessage(data) {
	console.log(data);
	if(lastMessage != null && lastMessage.sender.uid == data.sender.uid
	 && data.timestamp - lastMessage.timestamp < 60000) {
		appendToLastMessageRow(data);
	}
	else {
		mid += 1;
		newMessageRow(data);
	}	
}

function newMessageRow(data) {
	var currentTime = new Date(data.timestamp);
	lastMessage = data;
	var messageCssClasses = 'message'
	if (data.sender.uid == 0){
		messageCssClasses += ' serverMessage'
	}
	if (data.sender.uid == user.uid){
		messageCssClasses += ' myMessage'
	}

	$('#messages').append("<div class='messageContainer'><div class='"
	 + messageCssClasses + "' id='mid" + mid + "'><div class='messageInfo'>"
	 + "<img class='messageInfoImage' src='data:image/png;base64," + data.sender.image + "' />"
	 + "<div class='messageInfoName'>" + data.sender.username + "</div>"
	 + "<div class='messageInfoTime'>" + currentTime.toLocaleString() + "</div>"
	 + "</div></div></div>");

	appendToLastMessageRow(data);
}

function appendToLastMessageRow(data) {
	data.message = linkify(data.message);
	data.message = emotify(data.message);

	$('#mid' + mid).append("<div class='messageText'>"
				 + data.message +"</div>");
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
}

// Send message

function send() {
	var message = $('#message').val();
	if (message == '') {
		return;
	}
    socket.emit('message', message);
    $('#message').val('');
    $('#message').focus();    
}

function connect() {

	// Validate input
	$('#username').removeClass("error"); 
	$('#room').removeClass("error"); 

	var username = $('#username').val();
	var room = $('#room').val();
	var error = false;
	if (username == '') {
		$('#username').addClass("error");
		error = true;  	
	}
	if (room == '') {
		$('#room').addClass("error");
		error = true;  	  	
	}
	if (error){
		return;
	}

	// Display the chatt and connect to the server
	$('#login').hide();
	$('#chatt').show();
	socket = io.connect(serverHostName);

	// Set username
	var connect = new Object();
	connect.username = username;
	connect.room = room;
	socket.emit('connect', connect);
	console.log('Set username:' + connect.username + ' and connect to room: ' + connect.room);

	// Connect
	socket.on('connect', function (data) {
		console.log(data);
		user = data;
	});

	// Recieve messages
	socket.on('message', function (data) {
		recieveMessage(data)	
	});
}

// Create links from url:s
function linkify(text) {  
    var urlRegex =/((\b(https?|ftp|file):\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;  
    return text.replace(urlRegex, function(url) {  
        return '<a href="' + url + '">' + url + '</a>';  
    })  
}

// Replace text with emoticons
function emotify(text) {

	var smileRegex = /(\:D)/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/emoticon_happy.png">'; 
    })

	smileRegex = /(\:\))/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/emoticon_smile.png">'; 
    })

	smileRegex = /(\:O)/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/emoticon_surprised.png">'; 
    })

	smileRegex = /(\:P)/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/emoticon_tongue.png">'; 
    })

    smileRegex = /(\:\()/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/emoticon_unhappy.png">'; 
    })

    smileRegex = /(\;\))/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/emoticon_wink.png">'; 
    })

    smileRegex = /(\<3)/ig;
	text = text.replace(smileRegex, function(url) {  
        return '<img src="/images/icons/heart.png">'; 
    })

	return text;
}

