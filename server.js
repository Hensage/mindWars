// JavaScript Document
const express = require('express');
var fs = require('fs');
var WebSocketServer = require("ws").Server;
var app = express();
const http = require('http');
const htts = http.Server(app);


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
		this.lastcall = new Date();
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

const port = 6969;
//const server = http.createServer(express);
//const wss = new WebSocket.Server({ server })
wss = new WebSocketServer({port:6970});
wss.binaryType = "arraybuffer";

wss.on('connection', (socket) => { //WHEN PLAYER JOINS
	socket.id = token();
	/*
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
	*/
	socket.on('message', function incoming(data) {

		if (typeof data != "string"){
			var d = new TextDecoder().decode(new Uint8Array(data));
		}else{
			var d = data;
		}
		d = d.split("|");
		var para = JSON.parse(d[1]);
		if (d[0]=="hello"){
			let tempTok = token();
			console.log("New "+tempTok)
			users.push(new user(socket,tempTok));
			socket.send("tokenGen|"+JSON.stringify({"token":tempTok}));
			console.log("HELLO")
			console.log(outputTokens());
		}else if (d[0]=="newId"){
			var p = users.filter(obj => {
				return obj.token === para["token"];
			});
			if (p.length > 0){
				p[0].sock = socket;
			}else{
				socket.send("goAway|{}");
			}
			console.log("IDCHANGE")
			console.log(outputTokens());
		}else if (d[0]=="search"){
			var p = users.filter(obj => {
				return obj.sock.id === socket.id
			});
			p[0].userName= para["userN"];
			if (searchUser == undefined){
				searchUser = p[0];
				p[0].state="search";
			}else{
				p[0].changing = true;
				p[0].page = "matchStart";
				socket.send("foundOp|"+JSON.stringify({"userN":searchUser.userName}));
				searchUser.changing = true;
				searchUser.page = "matchStart";
				searchUser.sock.send("foundOp|"+JSON.stringify({"userN":p[0].userName}));
				let matchTok = token();
				matches.push(new match(matchTok,p[0],searchUser));
				p[0].matchId = matchTok;
				searchUser.matchId = matchTok;
				searchUser = undefined;
			}
		}else if (d[0]=="changingPage"){
			var p = users.filter(obj => {
				return obj.sock.id === socket.id
			  });
			p[0].changing=true;
			p[0].page = para["page"];
			socket.send("changeAccept|"+JSON.stringify({"page":para["page"]}));
		}else if (d[0]=="vote"){
			var p = users.filter(obj => {
				return obj.sock.id === socket.id
			  });
			var m = matches.filter(obj => {
				return obj.id === p[0].matchId
			  });
			m[0].votes[para["index"]]++;
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
				m[0].users[0].sock.send("changeAccept|"+JSON.stringify({"page":m[0].game}));
				m[0].users[1].changing=true;
				m[0].users[1].page = m[0].game;
				m[0].users[1].playerNum = 2;
				m[0].users[1].sock.send("changeAccept|"+JSON.stringify({"page":m[0].game}));
				m[0].started = true;
				m[0].startTime = new Date();
				setTimeout(endMatch,30000);
			}
		}else if (d[0]=="point"){
			var p = users.filter(obj => {
				return obj.sock.id === socket.id
			  });
			var m = matches.filter(obj => {
				return obj.id === p[0].matchId
			  });
			if (m.length > 0 ){
				m[0].scores[p[0].playerNum-1]+=para["num"];
				console.log(m[0].scores);
				m[0].users[0].sock.send("updateScores|"+JSON.stringify({"score":m[0].scores[0]+50-m[0].scores[1]}));
				m[0].users[1].sock.send("updateScores|"+JSON.stringify({"score":m[0].scores[1]+50-m[0].scores[0]}));
			}
		}else if (d[0]=="getScore"){
			var p = users.filter(obj => {
				return obj.sock.id === socket.id
			});
			if (p.length>0){
				socket.send("scoreReply|"+JSON.stringify({"score":p[0].oldScore}));
			}else{
				socket.send("goAway|{}");
			}
		}else if (d[0]=="getGames"){
			var p = users.filter(obj => {
				return obj.sock.id === socket.id
			  });
			if (p.length>0){
				var m = matches.filter(obj => {
					return obj.id === p[0].matchId
				});
				if (m.length>0){
					console.log("hai");
					socket.send("gameReply|"+JSON.stringify({"games":m[0].games}));
				}else{
					console.log("no match");
					socket.send("goAway|{}");
				}
			}else{
				console.log("no player");
				socket.send("goAway|{}");
			}
		}
		var p = users.filter(obj => {
			return obj.sock.id === socket.id
	  	});
		if (p.length>0){
    		p[0].lastcall = new Date();
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
	deadMatch.users[0].sock.send("changeAccept|"+JSON.stringify({"page":"scoreScreen"}));
	deadMatch.users[1].changing = true;
	deadMatch.users[1].page = "";
	deadMatch.users[1].state = "chill";
	deadMatch.users[1].matchId = 0;
	deadMatch.users[1].oldScore = [deadMatch.scores[1],deadMatch.scores[0]]
	deadMatch.users[1].sock.send("changeAccept|"+JSON.stringify({"page":"scoreScreen"}));
}
function update(){
	for (i=users.length-1;i>=0;i--){
	  if (new Date(users[i].lastcall.getTime() + 2000)  < new Date()){
		if (searchUser != undefined){
			if (searchUser.token == users[i].token){
				searchUser = undefined;
			}
		}
		if (users[i].matchId != 0){
			var m = matches.filter(obj => {
				return obj.id === users[i].matchId
			});
			if (m[0].users[0].token == users[i].token){
				m[0].users[1].changing = true;
				m[0].users[1].page = "";
				m[0].users[1].state = "chill";
				m[0].users[1].sock.send("changeAccept|"+JSON.stringify({"page":""}));
			}else{
				m[0].users[0].changing = true;
				m[0].users[0].page = "";
				m[0].users[0].state = "chill";
				m[0].users[0].sock.send("changeAccept|"+JSON.stringify({"page":""}));
			}
		}
		users.splice(i,1);
		console.log("Killed");
	  }
	}
  }
setInterval(update,500);
//setInterval(update,100);
//Just network code. You can ignore.
app.listen(80, () => {
	console.log('listening on *:80');
  });