var socket = io();
console.log(window.location.pathname);
if (window.location.pathname != "/"){
    console.log("Not home");
    if (sessionStorage.getItem("token")== undefined){
        window.location.replace("/");
    }else{
        socket.emit("newId",sessionStorage.getItem('token'));
    }
}
socket.on("goAway",()=>{
    sessionStorage.clear();
    window.location.replace("/");
});
if (window.location.pathname != "/pathTo"){
    window.addEventListener('touchmove', ev => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
    }, { passive: false });
    }