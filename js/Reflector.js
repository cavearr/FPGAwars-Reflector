var Reflector = function (port) {

  this.wss = {
    supported: false,
    port: 9999,
    connected: false
  };

  this.serial ={
    sm:false,
    connected:false,
  };

  this.bus= false;

  this.networkInterfaces = [];

  this.__CONSTRUCTOR__ = function () {
    this.getNetworkInterfaces();

    if (http.Server && http.WebSocketServer) {
      this.wss.supported = true;
      this.bus = new LOVEFPGABus();
    }
    this.serial.sm=new SerialManager();
  };

  this.getUARTs = function(_callback){

    if(this.serial.sm !==false){

      this.serial.sm.refreshDevices(_callback);
    }
  };
  //-- Using webRTC api we can obtain our ip in all modern browser
  this.getNetworkInterfaces = function (callback) {
    let ips = [];
    let RTCPeerConnection =
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection;

    let pc = new RTCPeerConnection({
      // Don't specify any stun/turn servers, otherwise you will
      // also find your public IP addresses.
      iceServers: []
    });
    // Add a media line, this is needed to activate candidate gathering.
    pc.createDataChannel("");
    let _this = this;
    // onicecandidate is triggered whenever a candidate has been found.
    pc.onicecandidate = function (e) {
      if (!e.candidate) {
        // Candidate gathering completed.
        pc.close();
        _this.networkInterfaces = ips;
        if (typeof callback !== "undefined") callback(ips);
        return;
      }
      let ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
      if (ips.indexOf(ip) == -1)
        // avoid duplicate entries (tcp/udp)
        ips.push(ip);
    };

    pc.createOffer(
      function (sdp) {
        pc.setLocalDescription(sdp);
      },
      function onerror() {}
    );
  };

  this.isConnected = function () {

    return this.wss.connected;
  }

  this.isUARTConnected = function () {

    return this.serial.connected;
  }

  this.stopWSS = function () {

    if (this.wss.supported === false) return false;
    this.wss.connected = false;
    this.wss.server.close();



  };

  this.stopUART = function(){

    if(this.serial.connected){
      
      this.serial.sm.unplug();
      this.serial.connected=false;
    }

  }


  this.startUART=function(id,_onConnect, _onReceive,options={}){

    let _this=this;

    function connectUART(info){
        if(typeof _onConnect !== 'undefined') _onConnect(info);
    }
    function receiveFromUART(data){
        _this.bus.send(data);
        if(typeof _onReceive !== 'undefined') _onReceive(data);


    }
    this.serial.sm.plug(id,options,connectUART,receiveFromUART);
    this.serial.connected=true;

  }


  //-- Start WebSocket Server
  this.startWSS = function (port, _onStart) {

    if (this.wss.supported === false || this.wss.connected === true) return false;

    this.wss.port = parseInt(port);
    // Listen for HTTP connections.
    this.wss.server = new http.Server();
    this.wss.wsServer = new http.WebSocketServer(this.wss.server);
    this.wss.server.listen(this.wss.port);

    this.wss.server.addEventListener("request", function (req) {
      let url = req.headers.url;
      if (url == "/") url = "/index.html";
      // Serve the pages of this chrome application.
      req.serveUrl(url);
      return true;
    });

    // A list of connected websockets.
    this.wss.connectedSockets = [];

    this.wss.wsServer.addEventListener(
      "request",
      function (req) {
        let socket = req.accept();
        this.wss.connectedSockets.push(socket);

        // When a message is received on one socket, rebroadcast it on all
        // connected sockets.
        socket.addEventListener(
          "message",
          function (e) {
            for (let i = 0; i < this.wss.connectedSockets.length; i++)
              this.wss.connectedSockets[i].send(e.data);
          }.bind(this)
        );

        // When a socket is closed, remove it from the list of connected sockets.
        socket.addEventListener(
          "close",
          function () {
            for (let i = 0; i < this.wss.connectedSockets.length; i++) {
              if (this.wss.connectedSockets[i] == socket) {
                this.wss.connectedSockets.splice(i, 1);
                break;
              }
            }
          }.bind(this)
        );
        return true;
      }.bind(this)
    );

    this.wss.connected = true;
    if (typeof _onStart !== 'undefined') {
      setTimeout(function () {
         this.bus.connect('localhost', this.wss.port);
        _onStart(this.networkInterfaces, this.wss.port);
      }.bind(this), 250);
    }
  };

  this.__CONSTRUCTOR__(port);
};