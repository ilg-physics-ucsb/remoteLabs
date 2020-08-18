var canvas 
var context 
var crosshair_button
var draw_call=false
var draw_queded=false
var staticCrossHairsStatus = false

function hide_all_crosshair(){
    draw_call= false
    document.getElementById('chcv').style.visibility='hidden'
    document.getElementById('imgCrossHairs').style.visibility='hidden'
    staticCrossHairsStatus = false
}

function show_image_crosshairs() {
    draw_call= false
    document.getElementById('chcv').style.visibility='hidden'
    document.getElementById('imgCrossHairs').style.visibility='visible'
    staticCrossHairsStatus = true
}

function start_CH(){
    console.log('Crosshair Toggle')
    document.getElementById('imgCrossHairs').style.visibility='hidden'
    staticCrossHairsStatus = false
        if (document.getElementById('chcv').style.visibility =='visible'){
            draw_call= false
            document.getElementById('chcv').style.visibility='hidden'
            console.log("Switched to hidden")
        }else{
            draw_call=true
            document.getElementById('chcv').style.visibility ='visible'
            console.log("Switched to visible")
        }
    if(!draw_queded){
        draw_queded=true
        queue_draw()
    }
}

function resize_canvas(){
    document.getElementById('chcv').width= document.getElementById('v').clientWidth
    document.getElementById('chcv').height = document.getElementById('v').clientHeight  
    document.getElementById('wrapper_v').width = document.getElementById('v').clientWidth
    document.getElementById('wrapper_v').height = document.getElementById('v').clientHeight 
}

window.onresize= function(){
    resize_canvas();
}

function queue_draw (){
    resize_canvas()
    canvas = document.getElementById('chcv');
    context = canvas.getContext('2d');
    crosshair_button=document.getElementById('crossHairs')
    draw_call=true

    canvas.addEventListener("click", function(evt){
       
        if (canvas.style.visibility =='visible'){
            if (draw_call){
                draw_call= false
            } else{
                draw_call= true
            }
        }
    })

    canvas.addEventListener('mousemove', function(evt) 
    {  console.log('draw')
        if(draw_call){
        var mousePos = getMousePos(canvas, evt);
        var message = 'Mouse position: ' + mousePos.x.toFixed(0) + ',' + mousePos.y.toFixed(0);
        
        draw_cursor(mousePos.x,mousePos.y)
        writeMessage(canvas, message);
        }
    }, 
    false);

    
    crosshair_button.addEventListener("click", function(evt){
        resize_canvas();
        // start_CH();
    })
    



function writeMessage(canvas, message, x, y) {
    var context = canvas.getContext('2d');
   // context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '14pt Calibri';
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

}

