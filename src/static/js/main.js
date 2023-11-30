
$(document).ready(function () {
  const connection = SimpleWebSerial.setupSerialConnection({
    baudRate: 115200,
    requestAccessOnPageLoad: true,
    // logOutgoingSerialData: true
  });
  
  const FRAME_SIZE    = 448   // input frame size
  const PAD_MAX_WIDTH = 1792
  const LINE_WIDTH    = 4
  let crop_factor     = 0.2     // 0: no crop, 1: crop everything
  const input_quality = 0.75  // quality from client to server
  const FRAME_RATE    = 100   // ms per frame
  const LINE_MAX_LEN  = 300
  const LATENT_DIM    = 32

  const SCALE = FRAME_SIZE/PAD_MAX_WIDTH
  let namespace = "/demo";
  // let video = document.querySelector("#videoElement");
  // let canvas = document.querySelector("#inputCanvas");
  // canvas.width = FRAME_SIZE_Y;
  // canvas.height = FRAME_SIZE;
  // let ctx = canvas.getContext('2d');
  // ctx.translate(FRAME_SIZE_Y,0);
  // ctx.scale(-1,1);
  var constraints = {
    audio: false,
    video: {
      width: FRAME_SIZE,
      height: FRAME_SIZE,
    }
  };

let layer_names = document.querySelector("#layerNames");
let initialisation = false;
let layer_selection = '';
let layer_list = {};
let cluster_numbers = {};

let cur_input = 0  // 0: webcam, 1:file
let file_is_init = false
let is_pause = false

latent = document.getElementById('latent');
latent_display = document.getElementById('latent_display');

let latentBlocks = []
for (let i = 0; i < LATENT_DIM; i++){
    let latentBlock = document.createElement("div");
    latentBlock.setAttribute("class", "latentBlocks");
    latent_display.appendChild(latentBlock)
    latentBlocks.push(latentBlock)
}
    
var localMediaStream = null;


var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);


socket.on('connect', function() {
console.log('Connected!');
});

socket.on('processed_frame',function(data){
  // output_canvas.setAttribute('src', data.latent_code);
    // latent.innerHTML = data.latent_code
    for (let i = 0; i < LATENT_DIM; i++){
        
        // let w = latentBlocks[i].style.width
        // console.log(w)
        let w = data.latent_code[i]
        latentBlocks[i].style.width = 100 + 33*w + 'px'
        
    }
    // console.log(data.latent_code)
    // let latents = data.latent_code.split(",").map(Number);
    // latent.innerHTML = latents
})








// setInterval(function () {
//     if (!isPainting){
//         return
//     }
    
// }, 25);



// Send named events to the Arduino with a number, string, array or json object
connection.send('event-to-arduino', "Hello there, Arduino");

var count = 0;
setInterval(function () {
    connection.send('event', "1");
    // connection.sendData(12345);
    count++;
}, 20);

const canvas = document.querySelector("#inputCanvas");
canvas.width = FRAME_SIZE;
canvas.height = FRAME_SIZE;
const ctx = canvas.getContext('2d');
ctx.lineWidth = LINE_WIDTH;
ctx.fillStyle = "black";
ctx.strokeStyle = "white";
ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
let isPainting = false;
let startX;
let startY;


    
    
if ("serial" in navigator) {
    console.log('support')
// The Web Serial API is supported.
}

let lines = []
let points = [];
let s=0;
    
let packet = []

let clear_speed = 0;
let point_xy = ""
// React to incoming events
connection.on('event-from-arduino', function(data) {

    // ################## add
    
    let str_messages = data.split(":")
    clear_speed = parseInt(str_messages[0])
    point_xy = str_messages[1]
    
    
    packets = point_xy.split("_")

    // ##################

    
    if (packets.length>1 && !isPainting){
        packet = packets[0].split(',')
        isPainting = true;
        console.log("starts painting " + packet)
        startX = parseInt(packet[0])
        startY = parseInt(packet[1])
        if (startX==0 || startY==0 || startX==PAD_MAX_WIDTH || startY==PAD_MAX_WIDTH){
            isPainting = false;
            console.log("end painting")
            return
        }
        startX = startX*SCALE
        startY = FRAME_SIZE - startY*SCALE
        let line = []
        let points = {x:startX,y:startY}
        line.push(points)
        lines.push(line)
        s+=1;
    } else if (packets.length>1 && isPainting){
        packet = packets[0].split(',')
        startX = parseInt(packet[0])
        startY = parseInt(packet[1])

        if (startX==0 || startY==0 || startX==PAD_MAX_WIDTH || startY==PAD_MAX_WIDTH){
            isPainting = false;
            console.log("end painting")
            return
        }
        startX = startX*SCALE
        startY = FRAME_SIZE - startY*SCALE
        
        let points = {x:startX, y:startY}
        lines[lines.length-1].push(points)
        s+=1;
        
    } else if (packets.length==1 && isPainting){
        isPainting = false;
        console.log("end painting")
    } 
    
});




// #####################

clear_speed_text = document.getElementById('clear_speed');
    
function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}
function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
    
function animate(timestamp) {
  
  drawLines();
  removeLines();
  removeMaxLines();
    
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

function drawLines(){
    if (lines.length == 0){return;}
    ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
    for (var i=0; i<lines.length; i++){
        let thisLine = lines[i]
        if (lines[i].length == 1){
            ctx.fillRect(thisLine[0].x,thisLine[0].y,3,3)
        } else {
            ctx.beginPath();
            ctx.moveTo(thisLine[0].x,thisLine[0].y);
            for (var n=0; n<thisLine.length; n++){
                ctx.lineTo(thisLine[n].x,thisLine[n].y);   
            }
            ctx.stroke();
            ctx.closePath();   
        }
    }
}

let clear_count = 0;
let clamp_speed = 0;
let speed = 0;
let clear_amount = 0;
let wait_amount = 0;
    
function removeLines(){
    
    clamp_speed = clamp(clear_speed, 0, 800);
    speed = parseInt(scale(clamp_speed, 0, 1000, 0, 20));
    clear_speed_text.innerHTML = s + " " + speed
    if (speed > 11){
        clear_amount = speed - 11;
        if (s > clear_amount){
            if (lines[0].length>clear_amount){
                lines[0].splice(0, clear_amount);
                s -= clear_amount;
            } else {
                if (lines.length > 1){
                    s -= lines[0].length;
                    lines.shift();
                }
            }
        }
    } else if (speed > 10){ // speed == 11
        wait_amount = 3;
        clear_amount = 2;
        if (clear_count >= wait_amount){
            clear_count = 0;
            if (s >= 1){
                if (lines[0].length>clear_amount){
                    lines[0].splice(0, clear_amount);
                    s -= clear_amount;
                } else {
                    if (lines.length > 1){
                        s -= lines[0].length;
                        lines.shift();
                    }
                }
            }
        } else {
            clear_count += 1;
        }
    
    } else if (speed > 0) {
        wait_amount = 11 - speed;
        if (clear_count >= wait_amount){
            clear_count = 0;
            if (s >= 1){
                if (lines[0].length>1){
                    lines[0].shift()
                } else {
                    if (lines.length > 1){
                        lines.shift()
                    }
                }
                s -= 1;
            }
        } else {
            clear_count += 1;
        }
    }
}
    
function removeMaxLines(){
    if (s >=LINE_MAX_LEN){
        if (lines[0].length>1){
            lines[0].shift()
        } else {
            if (lines.length > 1){
                lines.shift()
            }
        }
        s -= 1;
    }
}


// #####################

ctx.beginPath();
ctx.moveTo(10,10);
ctx.lineTo(10,10);
ctx.strokeWidth = 5;

ctx.closePath();
ctx.stroke();
    
// ctx.beginPath();
// ctx.moveTo(140,140);
// ctx.lineTo(200,200);
// ctx.closePath();
// ctx.stroke();
    
function sendFrame() {
    
    // if (cur_input==0){
    //   if (!is_pause){
    //     ctx.drawImage(video,
    //                   crop_factor/2*video.videoWidth,
    //                   crop_factor/2*video.videoHeight,
    //                   (1-crop_factor/2)*video.videoWidth,
    //                   (1-crop_factor/2)*video.videoHeight,
    //                   0,0,FRAME_SIZE_Y,FRAME_SIZE);
    //   }
    // } else if (cur_input==1) {
    //   if (file_is_init){
    //     ctx.drawImage(loadedImg,
    //                   0,0,loadedImg.width,loadedImg.height,0,0,FRAME_SIZE_Y,FRAME_SIZE);
    //   } else {
    
    //   }
    // }
    
    
    let dataURL = canvas.toDataURL('image/jpeg',input_quality);
    socket.emit('input_frame', dataURL);

}


setInterval(function () {
  sendFrame();
}, FRAME_RATE);


    
});


