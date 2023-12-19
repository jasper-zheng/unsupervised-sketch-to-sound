
$(document).ready(function () {
  const connection = SimpleWebSerial.setupSerialConnection({
    baudRate: 115200,
    requestAccessOnPageLoad: true,
    // logOutgoingSerialData: true
  });
  
  const FRAME_SIZE    = 256   // input frame size
  const PAD_MAX_WIDTH = 1792
  const LINE_WIDTH    = 1
  let crop_factor     = 0.2     // 0: no crop, 1: crop everything
  const input_quality = 0.5  // quality from client to server
  const FRAME_RATE    = 100   // ms per frame
  const LINE_MAX_LEN  = 150
  const LATENT_DIM    = 32
  const DISPLAY_LATENT= true;
  const PAD_SENSITIVE = 4;

  const SCALE = FRAME_SIZE/PAD_MAX_WIDTH
  let namespace = "/demo";
    

const monitor = window.open("", "", "width=300,height=800");
monitor.document.write('<html><head><style>body{background-color: #AAAAAA;font-family: Arial; font-size: 60px;}.latentBlocks{height:5px;width:100px;background-color: black;margin-top:3px}</style></head><body><canvas id="inputCanvas"></canvas><div id="clear_speed"></div><div id="is_recording">playing</div><button id="playSwitch">Run</button><div id="latent_display"></div></body></html>');


let layer_names = document.querySelector("#layerNames");
let initialisation = false;
let layer_selection = '';
let layer_list = {};
let cluster_numbers = {};

let cur_input = 0  // 0: webcam, 1:file
let file_is_init = false
let is_pause = false

latent = monitor.document.getElementById('latent');
latent_display = monitor.document.getElementById('latent_display');
is_recording = monitor.document.getElementById('is_recording');
    
let latentBlocks = []
for (let i = 0; i < LATENT_DIM; i++){
    let latentBlock = document.createElement("div");
    latentBlock.setAttribute("class", "latentBlocks");
    latent_display.appendChild(latentBlock)
    latentBlocks.push(latentBlock)
}


var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);


socket.on('connect', function() {
console.log('Connected!');
});

socket.on('processed_frame',function(data){
    if (DISPLAY_LATENT){
        for (let i = 0; i < LATENT_DIM; i++){
            let w = data.latent_code[i]
            latentBlocks[i].style.width = 100 + 33*w + 'px'
            
        }
    }
})




// Send named events to the Arduino with a number, string, array or json object
connection.send('event-to-arduino', "Hello there, Arduino");

var count = 0;
setInterval(function () {
    connection.send('event', "1");
    // connection.sendData(12345);
    count++;
}, 20);

const canvas = monitor.document.querySelector("#inputCanvas");
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

let clear_speed = 512;
let point_xy = ""
let recording = 0;
let playing = true
    
let last_x = 0;
let last_y = 0;

play_switch = monitor.document.getElementById('playSwitch');
    
play_switch.addEventListener('click',(e)=>{
    playing = !playing
})

// React to incoming events
connection.on('event-from-arduino', function(data) {

    // ################## add
    
    let str_messages = data.split(":")
    clear_speed = parseInt(str_messages[0])
    point_xy = str_messages[1]
    recording = parseInt(str_messages[2])
    
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

        let cal_x = parseInt(startX/PAD_SENSITIVE)
        let cal_y = parseInt(startY/PAD_SENSITIVE)
        last_x = cal_x
        last_y = cal_y
        
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

        let cal_x = parseInt(startX/PAD_SENSITIVE)
        let cal_y = parseInt(startY/PAD_SENSITIVE)
        if (!(last_x == cal_x && last_y == cal_y)){
            let points = {x:startX, y:startY}
            lines[lines.length-1].push(points)
            s+=1;
            last_x = cal_x
            last_y = cal_y
        }
        
    } else if (packets.length==1 && isPainting){
        isPainting = false;
        console.log("end painting")
    } 
    // console.log(lines)
    
});




// #####################

clear_speed_text = monitor.document.getElementById('clear_speed');
const pads = document.getElementsByClassName("drawPad");
for (let i = 0; i < pads.length; i++){
    pads[i].width = FRAME_SIZE-20;
    pads[i].height = FRAME_SIZE-20;
}
    
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


// setInterval(function () {
//   drawLines();
//   removeLines();
//   removeMaxLines();
// }, 100);


    
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
    
// function removeLines(){
    
//     clamp_speed = clamp(clear_speed, 0, 800);
//     speed = parseInt(scale(clamp_speed, 0, 1000, 0, 20));
//     clear_speed_text.innerHTML = s + " " + speed
//     if (speed > 11){
//         clear_amount = speed - 11;
//         if (s > clear_amount){
//             if (lines[0].length>clear_amount){
//                 lines[0].splice(0, clear_amount);
//                 s -= clear_amount;
//             } else {
//                 if (lines.length > 1){
//                     s -= lines[0].length;
//                     lines.shift();
//                 }
//             }
//         }
//     } else if (speed > 10){ // speed == 11
//         wait_amount = 3;
//         clear_amount = 2;
//         if (clear_count >= wait_amount){
//             clear_count = 0;
//             if (s >= 1){
//                 if (lines[0].length>clear_amount){
//                     lines[0].splice(0, clear_amount);
//                     s -= clear_amount;
//                 } else {
//                     if (lines.length > 1){
//                         s -= lines[0].length;
//                         lines.shift();
//                     }
//                 }
//             }
//         } else {
//             clear_count += 1;
//         }
    
//     } else if (speed > 0) {
//         wait_amount = 11 - speed;
//         if (clear_count >= wait_amount){
//             clear_count = 0;
//             if (s >= 1){
//                 if (lines[0].length>1){
//                     lines[0].shift()
//                 } else {
//                     if (lines.length > 1){
//                         lines.shift()
//                     }
//                 }
//                 s -= 1;
//             }
//         } else {
//             clear_count += 1;
//         }
//     }
// }

function removeLines(){
    
    clamp_speed = clamp(clear_speed, 0, 1000);
    speed = parseInt(scale(clamp_speed, 0, 1000, -5, 5));
    clear_speed_text.innerHTML = s + " " + speed

    if (speed == 4 || speed == -4){
        wait_amount = 3;
        clear_amount = 2;
        if (clear_count >= wait_amount){
            clear_count = 0;
            
            if (s >= 1 && speed > 0){
                if (lines[0].length>clear_amount){
                    lines[0].splice(0, clear_amount);
                    s -= clear_amount;
                } else {
                    if (lines.length > 1){
                        s -= lines[0].length;
                        lines.shift();
                    }
                }
            } else if (s >= 1 && speed < 0){
                let l = lines.length - 1
                if (lines[l].length>clear_amount){
                    lines[l].splice(lines[l].length-clear_amount, clear_amount);
                    s -= clear_amount;
                } else {
                    if (l > 0){
                        s -= lines[l].length;
                        lines.pop();
                    }
                }
            }
        } else {
            clear_count += 1;
        }
    } else if (speed > 0 && speed < 4){
        wait_amount = 5 - speed;
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
    } else if (speed < 0 && speed > -4){
        wait_amount = 5 + speed;
        if (clear_count >= wait_amount){
            clear_count = 0;
            if (s >= 1){
                let l = lines.length - 1
                if (lines[l].length>1){
                    lines[l].pop()
                } else {
                    if (l > 0){
                        lines.pop()
                    }
                }
                s -= 1;
            }
        } else {
            clear_count += 1;
        }
    } else if (speed == 5){
        clear_amount = 2;
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
    } else if (speed == -5){
        clear_amount = 2;
        if (s > clear_amount){
            let l = lines.length - 1
            if (lines[l].length>clear_amount){
                lines[l].splice(lines[l].length-clear_amount, clear_amount);
                s -= clear_amount;
            } else {
                if (l > 0){
                    s -= lines[l].length;
                    lines.pop();
                }
            }
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

function drawPads(){
    for (let i = 0; i < pads.length; i++){
        var swapContext = pads[i].getContext('2d');
        swapContext.drawImage(canvas, -10, -10);
    }
    
}
    

// #####################


function sendFrame() {
    
    let dataURL = canvas.toDataURL('image/jpeg',input_quality);
    socket.emit('input_frame', dataURL);
    if (playing){
        socket.emit('recording', recording)
        is_recording.style.color = 'black'
        is_recording.innerHTML = 'playing'
        // console.log('send osc')
    } else if (recording){
        socket.emit('recording', recording)
        // console.log('send osc')
        is_recording.style.color = 'black'
        is_recording.innerHTML = 'recording'
    } else {
        is_recording.style.color = 'red'
        is_recording.innerHTML = 'waiting'
    }
}

    


setInterval(function () {
  sendFrame();
  drawPads();
}, FRAME_RATE);



    
});


