var canvas 
var context 
var CH_click
var draw_call

function hide_crosshair(){
    draw_call= false
    canvas.style.visibility='hidden'
}

function show_crosshair(){
   // draw_call= true
    canvas.style.visibility='visible'
}

function resize_canvas(){
    canvas.width = getWidth()
    canvas.height = getHeight()
    c_wrap.css('height', getHeight())
    c_wrap.css('width', getWidth())
}

$(document).ready(function(){

    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    CH_click=document.getElementById('crossHairs')
    draw_call=true
    
    
    // canvas.width=getWidth()
    // canvas.height=getHeight()
    
    canvas.addEventListener('mousemove', function(evt) 
    {   
        if(draw_call){
        var mousePos = getMousePos(canvas, evt);
        var message = 'Mouse position: ' + mousePos.x.toFixed(0) + ',' + mousePos.y.toFixed(0);
        
        draw_cursor(mousePos.x,mousePos.y)
        writeMessage(canvas, message);
        }
    }, 
    false);
    
    canvas.addEventListener("click", function(evt){
        if (canvas.style.visibility =='visible'){
            if (draw_call){
                draw_call= false
            } else{
                draw_call= true
            }
        }
    })
    
    CH_click.addEventListener("click", function(evt){
        if (canvas.style.visibility =='visible'){
            draw_call= false
            canvas.style.visibility='hidden'
        }else{
            draw_call=true
            canvas.style.visibility ='visible'
        }
    
    })
})

function writeMessage(canvas, message, x, y) {
    var context = canvas.getContext('2d');
   // context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '10pt Calibri';
    context.fillStyle = 'rgb(143, 255, 147)';
    context.fillText(message, 10, 15);
  }
function getMousePos(this_canvas, evt) {
    var rect = this_canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

 
function draw_cursor(x,y){
    context.clearRect(0,0,2000,2000)
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 2000);
    context.stroke();
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(2000, y);
    context.strokeStyle = 'rgb(143, 255, 147)';
    context.stroke();
}


