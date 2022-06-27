// JavaScript Document
const tls = require('tls');
tls.DEFAULT_MAX_VERSION = 'TLSv1.2';
const express = require('express');
const { PassThrough } = require('stream');
const e = require('express');
var username;
var fs = require('fs');
var app = express();
const http = require('http').Server(app);
//var https = require('https');
var privateKey  = fs.readFileSync('sslcert/domain.key', 'utf8');
var certificate = fs.readFileSync('sslcert/domain.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
//var httpsServer = https.Server(credentials, app);
const io = require('socket.io')(http);
app.use(express.static('public'));
app.use(express.json());
const router = express.Router();
app.use('/', router);
var savedResponse;
router.get('/', (req, res) => {
	res.sendFile(__dirname + '/start.html'); //Serves the file
});
/*
app.post('/', (req, res)=>{

	let token = req.body.token;
	async function verify() {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
  //console.log(payload)
	}
	verify().catch(console.error);
})
*/
router.get('/operation', (req, res) => {
	res.sendFile(__dirname + '/operation.html'); //Serves the file
});
router.get('/swipe', (req, res) => {
	res.sendFile(__dirname + '/swipe.html'); //Serves the file
});
router.get('/touchNumber', (req, res) => {
	res.sendFile(__dirname + '/touchNumber.html'); //Serves the file
});
router.get('/pathTo', (req, res) => {
	res.sendFile(__dirname + '/pathTo.html'); //Serves the file
});
router.get('/matchStart', (req, res) => {
	res.sendFile(__dirname + '/matchStart.html'); //Serves the file
});
router.get('/scoreScreen', (req, res) => {
	res.sendFile(__dirname + '/scoreScreen.html'); //Serves the file
});
class user{
	constructor(sock,token){
		this.token = token;
		this.sock =sock; //Players socket id
		this.changing=false;
		this.page="start";
		this.state = "chill";
		this.userName = "Unsure";
		this.playerNum = 0;
		this.oldScore=0;
		this.matchId=0;
	}
}
class match{
	constructor(id,user1,user2){
		this.id = id;
		this.users=[user1,user2];
		this.scores = [0,0];
		this.time =60;
		this.started =false;
		this.startTime= 0;
		let ava = [0,1,2,3]
		this.games = [];
		for (i=0;i<3;i++){
			let tempM = Math.floor(Math.random()*ava.length);
			this.games.push(ava[tempM]);
			ava.splice(tempM,1);
		}
		this.votes = [0,0,0];
		this.matchId = 0;
		this.game = "";
	}
}
var users = [];
var searchUser = undefined;

var matches = [];

io.on('connection', (socket) => { //WHEN PLAYER JOINS
	//console.log("New "+socket.id)
  	socket.on('disconnect', function() { //WHEN PLAYER DISCONNECTS
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		  if (p.length > 0){
			if (p[0].changing){
				p[0].changing = false;
			}else{
				users.splice(users.indexOf(p[0]),1);
				if (searchUser != undefined){
					if (searchUser.id == p[0].id){
						searchUser = undefined;
					}
				}
				if (p[0].matchId != 0){
					var m = matches.filter(obj => {
						return obj.id === p[0].matchId
					});
					if (m[0].users[0].token == p[0].token){
						m[0].users[1].changing = true;
						m[0].users[1].page = "";
						m[0].users[1].state = "chill";
						io.to(m[0].users[1].sock.id).emit("changeAccept","");
					}else{
						m[0].users[0].changing = true;
						m[0].users[0].page = "";
						m[0].users[0].state = "chill";
						io.to(m[0].users[0].sock.id).emit("changeAccept","");
					}
				}
			}
		  }
		console.log("DIS")
		console.log(outputTokens());
  	});
	socket.on('hello', () => {
		console.log("New "+socket.id)
		let tempTok = token();
		users.push(new user(socket,tempTok));
		socket.emit("tokenGen",tempTok);
		console.log("HELLO")
		console.log(outputTokens());
	});
	socket.on('newId', (token) => {
		var p = users.filter(obj => {
			return obj.token === token;
	  	});
		if (p.length > 0){
			p[0].sock.id = socket.id;
		}else{
			socket.emit("goAway");
		}
		console.log("IDCHANGE")
		console.log(outputTokens());
	});
	socket.on("search",(userN)=>{
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		p[0].userName= userN;
		if (searchUser == undefined){
			searchUser = p[0];
			p[0].state="search";
		}else{
			p[0].changing = true;
			p[0].page = "matchStart";
			socket.emit("foundOp",searchUser.userName);
			searchUser.changing = true;
			searchUser.page = "matchStart";
			io.to(searchUser.sock.id).emit("foundOp",p[0].userName);
			let matchTok = token();
			matches.push(new match(matchTok,p[0],searchUser));
			p[0].matchId = matchTok;
			searchUser.matchId = matchTok;
			searchUser = undefined;
		}
	});
	socket.on('changingPage', (page) => {
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		p[0].changing=true;
		p[0].page = page;
		socket.emit("changeAccept",page);
	});
	socket.on("vote",(index)=>{
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		var m = matches.filter(obj => {
			return obj.id === p[0].matchId
	  	});
		m[0].votes[index]++;
		console.log(m[0].votes.reduce((partialSum, a) => partialSum + a, 0));
		if (m[0].votes.reduce((partialSum, a) => partialSum + a, 0)==2){
			let votedOn = [];
			for (i = 0;i<3;i++){
				if (m[0].votes[i]>0){
					votedOn.push(i);
				}
			}
			console.log(votedOn);
			let winner = m[0].games[votedOn[Math.floor(Math.random()*votedOn.length)]];
			console.log(winner);
			switch(winner){
				case 0:
					m[0].game = "operation";
					break;
				case 1:
					m[0].game = "swipe";
					break;
				case 2:
					m[0].game = "touchNumber";
					break;
				case 3:
					m[0].game = "pathTo";
					break;
			}
			//console.log(m[0].users);
			m[0].users[0].changing=true;
			m[0].users[0].page = m[0].game;
			m[0].users[0].playerNum = 1;
			//console.log(m[0].users[0].sock.id);
			//console.log(socket.id);
			//socket.emit("gay");
			io.to(m[0].users[0].sock.id).emit("changeAccept",m[0].game);
			m[0].users[1].changing=true;
			m[0].users[1].page = m[0].game;
			m[0].users[1].playerNum = 2;
			io.to(m[0].users[1].sock.id).emit("changeAccept",m[0].game);
			m[0].started = true;
			m[0].startTime = new Date();
			setTimeout(endMatch,30000);
		}
	});
	socket.on("point",(num)=>{

		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		var m = matches.filter(obj => {
			return obj.id === p[0].matchId
	  	});
		if (m.length > 0 ){
			m[0].scores[p[0].playerNum-1]+=num;
			console.log(m[0].scores);
			io.to(m[0].users[0].sock.id).emit("updateScores",m[0].scores[0]+50-m[0].scores[1]);
			io.to(m[0].users[1].sock.id).emit("updateScores",m[0].scores[1]+50-m[0].scores[0]);
		}
	});
	socket.on("getScore",(callback)=>{
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		if (p.length>0){
			callback(p[0].oldScore);
		}else{
			callback(0);
			socket.emit("goAway");
		}
	});
	socket.on("getGames",(callback)=>{
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		if (p.length>0){
			var m = matches.filter(obj => {
				return obj.id === p[0].matchId
			});
			if (m.length>0){
				callback(m[0].games);
			}else{
				callback(0);
				socket.emit("goAway");
			}
		}else{
			callback(0);
			socket.emit("goAway");
		}
	});
	
});
var token = function() {
	return (Math.random().toString(36).substr(2)+Math.random().toString(36).substr(2));
};
/*
function update(){
	for (i=0;i<)
}
*/
function outputTokens(){
	let tokens = [];
	for (i=0;i<users.length;i++){
		tokens.push(users[i].token);
	}
	return tokens;
}
function endMatch(){
	let deadMatch = matches.splice(0,1)[0];
	console.log("ITS OVER");
	deadMatch.users[0].changing = true;
	deadMatch.users[0].page = "";
	deadMatch.users[0].state = "chill";
	deadMatch.users[0].matchId = 0;
	deadMatch.users[0].oldScore = [deadMatch.scores[0],deadMatch.scores[1]]
	io.to(deadMatch.users[0].sock.id).emit("changeAccept","scoreScreen");
	deadMatch.users[1].changing = true;
	deadMatch.users[1].page = "";
	deadMatch.users[1].state = "chill";
	deadMatch.users[1].matchId = 0;
	deadMatch.users[1].oldScore = [deadMatch.scores[1],deadMatch.scores[0]]
	io.to(deadMatch.users[1].sock.id).emit("changeAccept","scoreScreen");
}

//setInterval(update,100);
//Just network code. You can ignore.
http.listen(80, () => {
	console.log('listening on *:80');
  });