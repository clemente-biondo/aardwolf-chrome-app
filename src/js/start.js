//TODO trasfmormare in classe mainCOntroller
let cmdInput=document.getElementById("aard-command-input");
let displayOutput=document.getElementById("aard-display");

let mud = new MudClient();

mud.displayOutputCallback=function(text){
  displayOutput.insertAdjacentHTML('beforeend', text);
  displayOutput.scrollTop = displayOutput.scrollHeight;
};

initToolbarButtons();

cmdInput.addEventListener('keyup',(e)=>{
  if (e.keyCode === 13) {// 13 is enter
      e.preventDefault();
      e.stopPropagation();
      mud.send(cmdInput.value);
      cmdInput.value="";
  }    
});

function initToolbarButtons(){
  let connectBtn = document.getElementById("aard-connect");
  let menutBtn = document.getElementById("aard-menu");

  connectBtn.addEventListener("click",function(){
    mud.connect();
    connectBtn.style.display='none';
    menutBtn.style.display='block';
  });

 //TODO:registrare un evento disconnessione per resettare i pulsanti

}