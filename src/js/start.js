let cmdInput=document.getElementById("aard-command-input");
let displayOutput=document.getElementById("aard-display");

let mud = new MudClient();

mud.displayOutputCallback=function(text){
  displayOutput.insertAdjacentHTML('beforeend', text);
};
mud.connect();

cmdInput.addEventListener('keyup',(e)=>{
  if (e.keyCode === 13) {// 13 is enter
      e.preventDefault();
      e.stopPropagation();
      mud.send(cmdInput.value);
      cmdInput.value="";
  }    
});

