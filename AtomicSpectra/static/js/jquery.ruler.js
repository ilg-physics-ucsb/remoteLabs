var c_wrap = $('#canvas_wrap'),
    video = $('#v'),
    canvas_dom = $('canvas')

c_wrap.css('height',video.css('height'))
c_wrap.css('width',video.css('width'))

function getWidth(){
    return document.getElementById('v').clientWidth; //parseInt(video.css('width'),10)
}

function getHeight(){
    return  document.getElementById('v').clientHeight;
}
// canvas_dom.css('height', video.css('height'))
// canvas_dom.css('width',video.css('width'))


// video.mousemove(function(event){
//     draw(event.pageX- c_wrapRectangle.left,event.pageY- c_wrapRectangle.top)
// })