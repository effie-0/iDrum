/**
 * Created by effie on 17/7/24.
 */

var new_element = document.createElement("script");
new_element.setAttribute("type", "text/javascript");
new_element.setAttribute("src", "../js/pixi.js");
document.body.appendChild(new_element);

//just a test for pixi
var type = "WebGL";
if(!PIXI.utils.isWebGLSupported())
{
    type = "canvas";
}
PIXI.utils.sayHello(type);

//add the renderer.view(an instance of WebGL or canvas) which occupies the window to the body
var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.autoResize = true;
document.body.appendChild(renderer.view);
var stage = new PIXI.Container();
renderer.render(stage);

//force to have a width>=height view
var evt = "onorientationchange" in window ? "orientationchange" : "resize";
window.addEventListener(evt, function(){
    console.log(evt);
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    if(width < height)
    {
        renderer.resize(height, width);
        renderer.view.style.top = String((height-width)/2);
        renderer.view.style.left = String(0-(height-width)/2);
        renderer.view.style.transform = "rotate(90deg)";
        renderer.view.style["transform-origin"] = "50% 50%";
    }
    else
    {
        renderer.resize(width, height);
        renderer.view.style.top = 0;
        renderer.view.style.left = 0;
        renderer.view.style.transform = "none";
    }
}, false);