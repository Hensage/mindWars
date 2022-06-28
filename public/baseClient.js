socket = new WebSocket("ws://"+window.location.host+":6970");
socket.binaryType = "arraybuffer";
console.log(window.location.pathname);
function base(){
    if (window.location.pathname != "/"){
        console.log("Not home");
        if (sessionStorage.getItem("token")== undefined){
            window.location.replace("/");
        }else{
            socket.send("newId|"+JSON.stringify({"token":sessionStorage.getItem('token')}));
        }
    }
        /*
        socket.on("goAway",()=>{
            sessionStorage.clear();
            window.location.replace("/");
        });
        */
    if (window.location.pathname != "/pathTo"){
        window.addEventListener('touchmove', ev => {
            ev.preventDefault();
            ev.stopImmediatePropagation();
        }, { passive: false });
    }
    setInterval(stayAlive,500);
}
function stayAlive(){
    socket.send("a|{}");
}