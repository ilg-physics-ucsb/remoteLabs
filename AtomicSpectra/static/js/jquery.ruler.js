var cH = $('#crosshair-h'),
    cV = $('#crosshair-v'),
    CC = $('#CrossContainer');
    showruler= $('#showRuler');
    Coordinates = $('#Coordinates');

var CCoffsetx=parseInt(CC.css('left'))
var CCoffsety=parseInt(CC.css('top'))

var track_mouse= false
var xpos=0
var ypos=0 


cH.css( "width", $('#v').css('width') )
CC.css( "width", $('#v').css('width') )
cV.css( "height", $('#v').css('height') )
CC.css( "width", $('#v').css('width') )

showruler.prop("checked",false)
track_mouse= false

showruler.on('change',function(e){
    if (showruler.prop("checked")==false){
        document.getElementById("crosshair-v").style.visibility = "hidden";
        document.getElementById("crosshair-h").style.visibility = "hidden";
        track_mouse= false;

    } else{
        document.getElementById("crosshair-v").style.visibility = "visible";
        document.getElementById("crosshair-h").style.visibility = "visible";
        //track_mouse= true;
    }

})



$(document.querySelector("#v")).on('mousemove',function(e){
    var scroll = parseInt($(window).scrollTop())
    if (track_mouse===true){
        xpos=e.pageX
        ypos=e.pageY 
        cH.css('top',ypos-scroll);
        cV.css('top',CC.offset().top-scroll+15 );
        cV.css('left',xpos+CCoffsetx-10);
       // cH.css('left',xpos);
       Coordinates.html("x:" + xpos +" y:" + ypos)
    }else{
        cH.css('top',ypos-scroll);
        cV.css('top',CC.offset().top-scroll+15 );
        cV.css('left',xpos+CCoffsetx-10);
       Coordinates.html("x:" + xpos +" y:" + ypos)
    }
});

$(document).on('scroll',function(e){
    var scroll = parseInt($(window).scrollTop())
    if (track_mouse===true){
        xpos=e.pageX
        ypos=e.pageY 
        cH.css('top',ypos-scroll);
        cV.css('top',CC.offset().top-scroll+15 );
        cV.css('left',xpos+CCoffsetx-10);
       // cH.css('left',xpos);
       Coordinates.html("x:" + xpos +" y:" + ypos)
    }else{
        cH.css('top',ypos-scroll);
        cV.css('top',CC.offset().top-scroll+15 );
        cV.css('left',xpos+CCoffsetx-10);
       Coordinates.html("x:" + xpos +" y:" + ypos)
    }
});

$(document.querySelector("#v")).on('mousedown',function(e){
    if (track_mouse===true){
        track_mouse=false
    } else if(showruler.prop("checked")==true){ 
        track_mouse=true
       
    }
});