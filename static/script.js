const grid=document.getElementById("grid");

let drawn=[];

for(let i=1;i<=90;i++){

const div=document.createElement("div");

div.className="cell";

div.innerText=i;

div.id="n"+i;

grid.appendChild(div);

}

function speak(number){

speechSynthesis.cancel();

speechSynthesis.speak(
new SpeechSynthesisUtterance(number)
);

}

function getNextNumber(){

fetch("/tambola")

.then(res=>res.json())

.then(data=>{

if(data.message){

document.getElementById("number-display").innerHTML=data.message;

speak(data.message);

return;

}

drawn=data.drawn_numbers;

document.getElementById("number-display").innerHTML=data.number;

document.getElementById("history").innerHTML=

"Drawn Numbers : "+drawn.join(", ");

document
.getElementById("n"+data.number)
.classList.add("active");

speak(data.number);

});

}