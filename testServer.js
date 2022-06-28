const express = require('express');
//const WebSocket = require('./ws');
var WebSocketServer = require("ws").Server;
const { PassThrough } = require('stream');
var app = express();
const http = require('http');
const htts = http.Server(app);

app.use(express.static('public'));
app.use(express.json());
const router = express.Router();
app.use('/', router);
var savedResponse;
router.get('/', (req, res) => {
	res.sendFile(__dirname + '/test.html'); //Serves the file
});

class user{
	constructor(sock,token){
		this.token = token;
		this.sock =sock; //Players socket
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

const port = 6969;
//const server = http.createServer(express);
//const wss = new WebSocket.Server({ server })
wss = new WebSocketServer({port:6970});
wss.binaryType = "arraybuffer";
var clients = [];
wss.on('connection', function connection(ws) {
  clients.push(new user(ws,"123"));
  console.log(clients);
  ws.on('message', function incoming(data) {
    if (typeof data != "string"){
      var d = new TextDecoder().decode(new Uint8Array(data));
    }else{
      var d = data;
    }
    d = d.split("|");
    var para = JSON.parse(d[1]);
    if (d[0]=="m"){
      console.log(para["name"]);
      ws.send(para["name"]);
    }else if (d[0]=="a"){
      //console.log("ALIVE");
    }
    var p = clients.filter(obj => {
			return obj.sock === ws
	  });
    p[0].lastcall = new Date();
    /*
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    })
    */
  });
});
function update(){
  for (i=clients.length-1;i>=0;i--){
    if (new Date(clients[i].lastcall.getTime() + 5000)  < new Date()){
      clients.splice(i,1);
      console.log(clients);
    }
  }
}
setInterval(update,500);
app.listen(80, function() {
  console.log(`Server is listening on 80?`)
})
