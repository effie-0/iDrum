/**
 * Created by effie on 17/7/24.
 */

var new_element = document.createElement("script");
new_element.setAttribute("type", "text/javascript");
new_element.setAttribute("src", "../js/pixi.js");
document.body.appendChild(new_element);

//just a test
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

//welcome, choice, game and end stage
var welcomeStage = new PIXI.Container();
var choiceStage = new PIXI.Container();
var gameStage = new PIXI.Container();
var endStage = new PIXI.Container();

stage.addChild(welcomeStage);
stage.addChild(choiceStage);
stage.addChild(gameStage);
stage.addChild(endStage);

choiceStage.visible = false;
gameStage.visible = false;
endStage.visible = false;

//force to have a width>=height view, todo: adjust the canvas to a fixed width-height scale
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

//add welcome text
var wMessage = new PIXI.Text(
    "Welcome to iDrum!", {fontFamily: "Arial", fontSize: 46, fill: "white"});
wMessage.position.set((window.innerWidth-wMessage.width)/2, (window.innerHeight-wMessage.height)/2);

//add background of welcome page
var img = new Image();
img.src = "../src/img/bg.jpg";
img.onload = function(){
    var baseTexture = new PIXI.BaseTexture(this);
    var texture = new PIXI.Texture(baseTexture);
    var sprite = new PIXI.Sprite(texture);
    sprite.width = window.innerWidth;
    sprite.height = window.innerHeight;
    welcomeStage.addChild(sprite);
    welcomeStage.addChild(wMessage);
    renderer.render(stage);

    //sprite.interactive = true;
};

welcomeStage.interactive = true;
welcomeStage.click = welcomeStage.tap = function(data){
    console.log(data.target);
    welcomeStage.visible = false;
    choiceStage.visible = true;
    renderer.render(stage);
};

var bgList = [];
for(var i = 0; i < 5; i++)
{
    var pic = new Image();
    pic.src = "../src/img/" + i + ".jpg";
    bgList.append(pic);
}

var songList = [];
for(i = 0; i < 5; i++)
{
    var str = "Song: " + i;
    songList.append(str);
}
