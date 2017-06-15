//TODO trasfmormare in classe mainCOntroller

function bindDisplayOutput(mud){
  let displayOutput=document.getElementById("aard-display");
  mud.displayOutputCallback=function(text){
    displayOutput.insertAdjacentHTML('beforeend',convertToHtml(text));
    displayOutput.scrollTop = displayOutput.scrollHeight;
  };
}

function convertToHtml(text){
  if(text== null)return text;
  console.log(">"+text+"<")
  return text.replace("\r\n","\n").replace("\n\n","\n");
}

function bindCommandInput(mud){
  let cmdInput=document.getElementById("aard-command-input");
  cmdInput.addEventListener('keyup',(e)=>{
    if (e.keyCode === 13) {// 13 is enter
      e.preventDefault();
      e.stopPropagation();
      mud.send(cmdInput.value);
      cmdInput.value="";
    }    
  });
}  

function bindConnectButton(mud){
  let connectBtn = document.getElementById("aard-connect");
  connectBtn.addEventListener("click",function(){
    mud.connect();
  });
  mud.addConnectEventListener(function(){
    connectBtn.style.display='none';
  });
  mud.addDisconnectEventListener(function(){
    connectBtn.style.display='block';
  });
}

function bindMenuButton(mud){
  let menuBtn = document.getElementById("aard-menu");
  menuBtn.addEventListener("click",function(){
    console.log("menu clicked");
  });
  mud.addDisconnectEventListener(function(){
    menuBtn.style.display='none';
  });
  mud.addConnectEventListener(function(){
    menuBtn.style.display='block';
  });
}

//Start
let mud = new MudClient();

bindDisplayOutput(mud);
bindCommandInput(mud);
bindConnectButton(mud);
bindMenuButton(mud);