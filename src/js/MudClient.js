class MudClient {

  constructor() {
    this.ti = new TelnetInterpreter();
    this.socketId = null;
    this.connected = false;
    this.eventListeners={
      connect:[],
      disconnect:[]
    };
    this.checkConnectionTimeout=null;

    
    //syntactic sugar
    this.boundOnReceiveCallback=this.onReceiveCallback.bind(this);
    this.boundOnReceiveErrorCallback=this.onReceiveErrorCallback.bind(this);
  }

  addConnectEventListener (func){
    addEventListener ("connect",func)
  }

  addDisconnectEventListener (func){
    addEventListener ("disconnect",func)
  }

  addEventListener (eventType,func){
    this.eventListeners[eventType].push(func);
  }

  removeEventListener (eventType,func){
    let arr=this.eventListeners[eventType];
    for (let i=0,len=arr.len;i<len;i++){
      let el=arr[i];
      if (el==func){
        arr.slice(i,1);
        break;
      }
    }
  }

  fireEventListener (eventType,event){
    let arr=this.eventListeners[eventType];
    for (let i=0,len=arr.len;i<len;i++){
      let el=arr[i];
      el(event);
    }
  }
  
  get displayOutputCallback (){
    return this.ti.displayOutputCallback;
  }

  set displayOutputCallback (displayOutputCallback){
    this.ti.displayOutputCallback=displayOutputCallback;
  }

  connect(host = 'aardwolf.net', port = 23) {
    return new Promise((resolve, reject) => {
      if (this.connected === true) {
        reject(Error("Already connected"));
        return;
      }
      chrome.sockets.tcp.create({
        bufferSize:TelnetInterpreter.BUFFER_SIZE //It's important that this value is shared
      },createInfo => {
        if (chrome.runtime.lastError) {
          reject(Error('Unable to create socket: ' + chrome.runtime.lastError.message));
        }
        chrome.sockets.tcp.connect(createInfo.socketId, host, port, result => {
          if (result < 0) {
            reject(Error('Unable to connect, errorcode: ' + result));
          }
          console.log("connection established, id:" + createInfo.socketId + ", return code:" + result);
          this.socketId = createInfo.socketId;
          this.connected = true;
          chrome.sockets.tcp.onReceive.addListener(this.boundOnReceiveCallback);
          chrome.sockets.tcp.onReceiveError.addListener(this.boundOnReceiveErrorCallback);
          this.fireEventListener("connect",{type:"ConnectionEvent",timeStamp:Date.now()});
          this.checkConnectionTimeout=setInterval(() =>{
            chrome.sockets.tcp.getInfo(this.socketId, (socketInfo)=>{
              console.log(socketInfo);
              if (!socketInfo.connected){
              this.disconnect();
            }});
          },5000);         
          resolve();
        });
      });
    });
  }

  send(txt){
    let buf = new ArrayBuffer(txt.length+2);
    let bufView = new Uint8Array(buf);
    for (let i=0, strLen=txt.length; i < strLen; i++) {
      bufView[i] = txt.charCodeAt(i);
    }   
    bufView[txt.length]=12;
    bufView[txt.length]=13; 
    chrome.sockets.tcp.send(this.socketId , buf, (sendInfo)=>{
     // console.log(sendInfo);
      if(sendInfo.resultCode < 0 ){
         console.error("Unabel to send data:"+sendInfo.resultCode);
      }
    });
  }
  
  onReceiveCallback(info){
    //console.log(info);
    let dataview = new DataView(info.data);
    for (let i=0,len=info.data.byteLength;i<len;i++){
      //console.log(i);
      this.ti.receive(dataview.getUint8(i));
    }
    this.ti.flushDataBuffer();
    chrome.sockets.tcp.send(this.socketId , this.ti.prepareResponseBuffer(), (sendInfo)=>{
      if(sendInfo.resultCode < 0 ){
         console.error("Unabel to send data:"+sendInfo.resultCode);
      }
    });
  }

  onReceiveErrorCallback(info){
    Error('I/O error from server, return code:' + info.resultCode);
  }

  disconnect() {
    return new Promise( (resolve, reject) =>{
      if (this.connected === false) {
        reject(Error("Already not connected"));
        return;
      }
      chrome.sockets.tcp.disconnect(this.socketId,  () => {
        chrome.sockets.tcp.close(this.socketId,  ()  =>{
          if(this.checkConnectionTimeout!= null){
            clearInterval(this.checkConnectionTimeout);
          }
          this.socketId = null;
          this.connected = false;
          console.log("disconnected.");
          chrome.sockets.tcp.onReceive.removeListener(this.boundOnReceiveCallback);
          chrome.sockets.tcp.onReceiveError.removeListener(this.boundOnReceiveErrorCallback); 
          this.fireEventListener("disconnect",{type:"DisconnectionEvent",timeStamp:Date.now()});
          resolve();
        });
      });
    });
  }

}
