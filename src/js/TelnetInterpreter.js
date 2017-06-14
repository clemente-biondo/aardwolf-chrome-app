class TelnetInterpreter{
    constructor(){
      this._displayOutputCallback=null;
      this.lastWasIAC=false;
      this.lastWasDO=false;
      this.lastWasDONT=false;
      this.lastWasWONT=false;
      this.lastWasWILL=false;
      this.insideSubneg=false;
      
      this.subNegBuffer=new Uint8Array(1024);
      this.subNegPos=0;

      this.dataBuffer=new Uint8Array(TelnetInterpreter.BUFFER_SIZE);
      this.dataBuffPos=0;
      
      this.respBuffer=new Uint8Array(1024);
      this.respBuffPos=0;
    }
  
  get displayOutputCallback (){
    return this._displayOutputCallback;
  }

  set displayOutputCallback (displayOutputCallback){
    this._displayOutputCallback=displayOutputCallback;
  }

    processDONT(byte){
      console.error("<<DONT "+byte+" unsupported");
      this.lastWasDONT=false;
    }
    
    processWONT(byte){
      console.error("<<WONT "+byte+" unsupported");
      this.lastWasWONT=false;
    }
    
    processDO(byte){
      console.log("<<DO "+byte);
      switch(byte) {
         case 31://NAWS 
           this.respBuffer[this.respBuffPos++]=255;//IAC
           this.respBuffer[this.respBuffPos++]=251;//WILL
           this.respBuffer[this.respBuffPos++]=31;//NAWS
           console.log(">>WILL "+byte);
         break;
         case 24://TERMINAL-TYPE  
           this.respBuffer[this.respBuffPos++]=255;//IAC
           this.respBuffer[this.respBuffPos++]=251;//WILL
           this.respBuffer[this.respBuffPos++]=24;//NAWS
           console.log(">>WILL "+byte);
         break;         
         default:
          this.respBuffer[this.respBuffPos++]=255;//IAC
          this.respBuffer[this.respBuffPos++]=252;//WONT
          this.respBuffer[this.respBuffPos++]=byte;//CMD
          console.log(">>WONT "+byte);
      }  
      this.lastWasDO=false;
    }
    
    processWILL(byte){
      //253 -> DO
      this.respBuffer[this.respBuffPos++]=255;
      this.respBuffer[this.respBuffPos++]=254;//DONT
      this.respBuffer[this.respBuffPos++]=byte;        
      console.log("<<WILL "+byte);
      console.log(">>DONT "+byte);
      this.lastWasWILL=false;
    }
    
    processSubNeg(byte){
        console.log("SUbneg unsupported: "+String.fromCharCode.apply(null, new Uint8Array(this.subNegBuffer,0,this.subNegPos)));
      //TODO: process this.subNegBuffer
      this.subNegPos=0;
    }

    processIAC(byte){
        switch(byte) {
          case 255:  this.dataBuffer[this.dataBuffPos++]=255; break;
          case 254:  this.lastWasDONT=true; break;
          case 253:  this.lastWasDO=true; break;
          case 252:  this.lastWasWONT=true; break;
          case 251:  this.lastWasWILL=true; break;
          case 250://SB
            console.log("SB");
            this.insideSubneg=true; 
            break;
          case 240://SE
            //TODO:process subNegBuffer
            this.processSubNeg();
            this.insideSubneg=false; 
            break;
          default:
           console.error("Command "+byte+" unsupported");
          break;
        }
        this.lastWasIAC=false;
    }

    receive(byte){
      let log=true;
      if(this.lastWasIAC){
       this.processIAC(byte);
      } else if(this.lastWasDONT) {
        this.processDONT(byte);
      } else if(this.lastWasDO) {
        this.processDO(byte);
      } else if(this.lastWasWONT) {
        this.processWONT(byte);
      } else if(this.lastWasWILL) {
        this.processWILL(byte);
      } else if(this.insideSubneg){
        console.log(byte);
        this.subNegBuffer[this.subNegPos++]=byte;  
      } else if(byte==255){ //IAC
         this.lastWasIAC=true;  
      }else{ 
        log=false;   
        this.dataBuffer[this.dataBuffPos++]=byte;
      }
      if(log){
        console.log(byte);
      }
    }
    
    flushDataBuffer(){
        if (this.dataBuffPos==0){
          return;
        }
       // let tmp= new Uint8Array();
      let buff=(String.fromCharCode.apply(null, new Uint8Array(this.dataBuffer).subarray(0,this.dataBuffPos)));
      this._displayOutputCallback(buff);
      
      //TODO:inviare il buffer
      this.dataBuffPos=0;
    }

    prepareResponseBuffer(){
      let res = new Uint8Array(this.respBuffPos);
      res.set(this.respBuffer.subarray(0,this.respBuffPos));
      this.respBuffPos=0;
      return res.buffer;
    }    


}

TelnetInterpreter.BUFFER_SIZE=10*1024;
/*
      NAME               CODE              MEANING

      SE                  240    End of subnegotiation parameters.
      NOP                 241    No operation.
      Data Mark           242    The data stream portion of a Synch.
                                 This should always be accompanied
                                 by a TCP Urgent notification.
      Break               243    NVT character BRK.
      Interrupt Process   244    The function IP.
      Abort output        245    The function AO.
      Are You There       246    The function AYT.
      Erase character     247    The function EC.
      Erase Line          248    The function EL.
      Go ahead            249    The GA signal.
      SB                  250    Indicates that what follows is
                                 subnegotiation of the indicated
                                 option.
      WILL (option code)  251    Indicates the desire to begin
                                 performing, or confirmation that
                                 you are now performing, the
                                 indicated option.
      WON'T (option code) 252    Indicates the refusal to perform,
                                 or continue performing, the
                                 indicated option.
      DO (option code)    253    Indicates the request that the
                                 other party perform, or
                                 confirmation that you are expecting
                                 the other party to perform, the
                                 indicated option.
      DON'T (option code) 254    Indicates the demand that the
                                 other party stop performing,
                                 or confirmation that you are no
                                 longer expecting the other party
                                 to perform, the indicated option.
      IAC                 255    Data Byte 255.
*/

/*

Enabling Options Using Negotiation

The first stage in Telnet option negotiation is for the client and server to decide whether or not they want to enable a particular option. One of the aspects of Telnet’s symmetry of operation is that either device may choose to initiate the use of an option. The initiating device may either specify that it wants to start using an option, or that it wants the other device to start using it. The responding device may either agree or disagree in either case; an option can only be enabled if both devices agree to its use.

This negotiation is performed using four Telnet protocol commands, as follows:

WILL: Sent by the initiator to indicate that it wants to start using a particular option. There are two possible replies by the responding device:
DO: Sent to indicate agreement that the initiator should use the option; it is then considered enabled. 

DONT: Sent to specify that the initiator must not use the option.


DO: Sent by the initiator to request that the other device start using an option. That device may respond in two ways:
WILL: Sent to specify that the responding device will agree to use the option; the option is enabled. 

WONT: Sent to tell the initiator that the responder will not use the option requested.
The symmetry of Telnet, combined with the fact that both DO and WILL can be used either to initiate a negotiation or respond to one, make Telnet’s option negotiation potentially complicated. Since either device can initiate negotiation of an option at any time, acknowledgment loops could potentially arise if both devices were to try to enable an option simultaneously, or get into a situation where each kept responding to the other’s replies.

For this reason, the Telnet standard specifies restrictions on when the WILL and DO commands are used. One is that a device may only send a negotiation command to request a change in the status of an option; it cannot send DO or WILL just to confirm or reinforce the current state of the option. Another is that a device receiving a request to start using an option it is already using should not acknowledge it using DO or WILL.

Disabling Options
Since an option may only be activated if both devices agree to use it, either may disable the use of an option at any time by sending either of these commands:

WONT: Sent by a device to indicate that it is going to stop using an option. The other device must respond with DONT as a confirmation. 

DONT: Sent by a device to indicate that it wants the other device to stop using an option. The other device must respond with WONT.

*/