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

//copied from https://github.com/kittykatattack/learningPixi#movingexplorer
// making basic keyboard movement
function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}



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

};

welcomeStage.interactive = true;
welcomeStage.click = welcomeStage.tap = function(data){
    console.log(data.target);
    welcomeStage.visible = false;
    choiceStage.visible = true;
    setupChoiceStage();
    renderer.render(stage);
};//end of welcome page

//choiceStage
//load background images
var bgList = [];
for(var i = 0; i < 5; i++)
{
    var src = "../src/img/" + i + ".jpg";
    var texture = PIXI.Texture.fromImage(src);
    bgList.push(texture);
}
var bg = new PIXI.extras.AnimatedSprite(bgList, false);

var nameList = [];
for(i = 0; i < 5; i++)
{
    var str = "Song: " + i;
    nameList.push(str);
}

//choose from ChoiceStage, apply in GameStage
var currentSongNum = 0;
var songVelocity = 1;
var isMuted = false;

var muteList = [];
var src1 = "../src/img/icon/MUTE.png";
var src2 = "../src/img/icon/UNMUTE.png";
var texture1 = PIXI.Texture.fromImage(src1);
var texture2 = PIXI.Texture.fromImage(src2);
muteList.push(texture1);
muteList.push(texture2);

var muteView = new PIXI.extras.AnimatedSprite(muteList, false);

function setupChoiceStage(){
    currentSongNum = 1;
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    var ratio = (Math.sqrt(5) - 1)/2;

    var triangle1 = new PIXI.Graphics();
    triangle1.lineStyle(3, 0x000000, 1);
    triangle1.beginFill(0xFFFFFF, 0.9);

    triangle1.drawPolygon([
        0, 0,
        0, ratio*height,
        ratio*height, 0
    ]);
    triangle1.endFill();

    var triangle2 = new PIXI.Graphics();
    triangle2.lineStyle(3, 0x000000, 1);
    triangle2.beginFill(0xFFFFFF, 0.9);
    var midX = 0;
    var midY = 0;
    if(ratio*width-height > 0)
    {
        triangle2.drawPolygon([
            0, 0,
            ratio*width-height, 0,
            ratio*width, height,
            0, height
        ]);

        midX = (ratio*width-height+ratio*height)/2;
        midY = (ratio*height-height+ratio*width)/2;
    }
    else
    {
        triangle2.drawPolygon([
            0, height-ratio*width,
            ratio*width, height,
            0, height
        ]);

        midX = (ratio*height-height+ratio*width)/2;
        midY = (ratio*width-height+ratio*height)/2;
    }
    triangle2.endFill();

    //display the name of the songs
    if(currentSongNum > 0 && currentSongNum < nameList.length - 1)
    {
        var formerName = new PIXI.Text(nameList[currentSongNum - 1],
            {fontFamily: "Helvetica", fontSize: 28, fontWeight: "lighter", fill: "black"});
        formerName.anchor.set(0.5, 0.5);
        formerName.position.set(midX, midY+0.24*height);

        var Name = new PIXI.Text(nameList[currentSongNum],
            {fontFamily: "Helvetica", fontSize: 36, fontWeight: "lighter", fill: "black"});
        Name.anchor.set(0.5, 0.5);
        Name.position.set(midX, formerName.position.y+formerName.height+30);

        var latterName = new PIXI.Text(nameList[currentSongNum+1],
            {fontFamily: "Helvetica", fontSize: 28, fontWeight: "lighter", fill: "black"});
        latterName.anchor.set(0.5, 0.5);
        latterName.position.set(midX, Name.position.y+Name.height+24);

    }


    bg.width = width;
    bg.height = height;
    bg.gotoAndStop(currentSongNum);
    choiceStage.addChild(bg);
    choiceStage.addChild(triangle1);
    choiceStage.addChild(triangle2);
    choiceStage.addChild(formerName);
    choiceStage.addChild(Name);
    choiceStage.addChild(latterName);
    triangle2.interactive = true;
    triangle2.click = function(event){
        //console.log(event.target);
        var temp = currentSongNum;
        if(event.data.global.y < Name.position.y-Name.height/2-20)
        {
            if(currentSongNum > 0)
            {
                currentSongNum--;
            }
        }
        else if(event.data.global.y > Name.position.y+Name.height/2+20)
        {
            if(currentSongNum+1 < nameList.length)
            {
                currentSongNum++;
            }
        }

        if(currentSongNum !== temp)
        {
            if(currentSongNum > 0)
            {
                formerName.text = nameList[currentSongNum-1];
            }
            else
            {
                formerName.text = "";
            }
            Name.text = nameList[currentSongNum];
            if(currentSongNum+1 < nameList.length)
            {
                latterName.text = nameList[currentSongNum+1];
            }
            else
            {
                latterName.text = "";
            }

            bg.gotoAndPlay(currentSongNum);
            renderer.render(stage);
        }
    };

    //entry to the game
    var StartButton = new PIXI.Graphics();
    StartButton.lineStyle(2, 0xFFFFFF, 1);
    StartButton.beginFill(0x516374, 0.93);
    StartButton.drawPolygon([
        0.85*width, 0.6*height,
        0.85*width+0.15*height, 0.75*height,
        0.85*width, 0.9*height,
        0.85*width-0.15*height, 0.75*height,
        0.85*width, 0.6*height
    ]);
    StartButton.endFill();

    var GoText = new PIXI.Text("GO",
        {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "white"});
    GoText.anchor.set(0.5, 0.5);
    GoText.position.set(0.85*width, 0.75*height);
    StartButton.addChild(GoText);

    StartButton.interactive = true;
    StartButton.buttonMode = true;
    StartButton.click = function(){
        //console.log(event.target);
        choiceStage.visible = false;
        gameStage.visible = true;
        setupGameStage();
        renderer.render(stage);
    };

    //velocity
    var VButton = new PIXI.Graphics();
    VButton.lineStyle(2, 0xFFFFFF, 1);
    VButton.beginFill(0x516374, 0.93);
    VButton.drawPolygon([
        0.85*width-0.15*height, 0.75*height,
        0.85*width-0.225*height, 0.825*height,
        0.85*width-0.3*height, 0.75*height,
        0.85*width-0.225*height, 0.675*height,
        0.85*width-0.15*height, 0.75*height
    ]);
    VButton.endFill();

    songVelocity = 2;
    var VText = new PIXI.Text(String(songVelocity),
        {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "white"});
    VText.anchor.set(0.5, 0.5);
    VText.position.set(0.85*width-0.225*height, 0.75*height);
    VButton.addChild(VText);

    //v-
    var DownButton = new PIXI.Graphics();
    DownButton.lineStyle(2, 0xFFFFFF, 1);
    DownButton.beginFill(0x516374, 0.93);
    DownButton.drawPolygon([
        0.85*width-0.225*height, 0.675*height,
        0.85*width-0.3*height, 0.75*height,
        0.85*width-0.375*height, 0.675*height,
        0.85*width-0.3*height, 0.6*height,
        0.85*width-0.225*height, 0.675*height
    ]);
    DownButton.endFill();

    var DownText = new PIXI.Text("--",
        {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "white"});
    DownText.anchor.set(0.5, 0.5);
    DownText.position.set(0.85*width-0.3*height, 0.675*height);
    DownButton.addChild(DownText);

    DownButton.interactive = true;
    DownButton.buttonMode = true;
    DownButton.click = function(){
        if(songVelocity > 1)
        {
            songVelocity--;
            VText.text = String(songVelocity);
            renderer.render(stage);
        }
    };

    //v+
    var UpButton = new PIXI.Graphics();
    UpButton.lineStyle(2, 0xFFFFFF, 1);
    UpButton.beginFill(0x516374, 0.93);
    UpButton.drawPolygon([
        0.85*width-0.15*height, 0.75*height,
        0.85*width-0.225*height, 0.825*height,
        0.85*width-0.15*height, 0.9*height,
        0.85*width-0.075*height, 0.825*height
    ]);
    UpButton.endFill();

    var UpText = new PIXI.Text("++",
        {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "white"});
    UpText.anchor.set(0.5, 0.5);
    UpText.position.set(0.85*width-0.15*height, 0.825*height);
    UpButton.addChild(UpText);

    UpButton.interactive = true;
    UpButton.buttonMode = true;
    UpButton.click = function(){
        if(songVelocity < 9)
        {
            songVelocity++;
            VText.text = String(songVelocity);
            renderer.render(stage);
        }
    };

    //volume button
    var VolumeButton = new PIXI.Graphics();
    VolumeButton.lineStyle(2, 0xFFFFFF, 1);
    VolumeButton.beginFill(0x516374, 0.93);
    VolumeButton.drawPolygon([
        0.85*width-0.15*height, 0.75*height,
        0.85*width-0.075*height, 0.675*height,
        0.85*width-0.15*height, 0.6*height,
        0.85*width-0.225*height, 0.675*height,
        0.85*width-0.15*height, 0.75*height
    ]);
    VolumeButton.endFill();

    if(!isMuted)
    {
        muteView.gotoAndStop(0);
    }
    else
    {
        muteView.gotoAndStop(1);
    }
    muteView.width = 30;
    muteView.height = 30;
    muteView.anchor.set(0.5, 0.5);
    muteView.position.set(0.85*width-0.15*height, 0.675*height);
    VolumeButton.addChild(muteView);

    VolumeButton.interactive = true;
    VolumeButton.buttonMode = true;
    VolumeButton.click = function(){
        if(isMuted)
        {
            isMuted = false;
            muteView.gotoAndStop(0);
            //todo: set the volume
        }
        else
        {
            isMuted = true;
            muteView.gotoAndStop(1);
        }
        renderer.render(stage);
    };

    choiceStage.addChild(StartButton);
    choiceStage.addChild(VButton);
    choiceStage.addChild(DownButton);
    choiceStage.addChild(UpButton);
    choiceStage.addChild(VolumeButton);

}

function setupGameStage()
{
    var isPaused = false;

    gameStage.addChild(bg);
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;

    var cover = new PIXI.Graphics();
    cover.beginFill(0xFFFFFF, 0.9);
    cover.drawRect(0, 0, width, height);
    cover.endFill();
    gameStage.addChild(cover);

    var PauseImg = new Image();
    PauseImg.src = "../src/img/icon/PAUSE.png";
    PauseImg.onload = function(){
        var baseTexture = new PIXI.BaseTexture(this);
        var texture = new PIXI.Texture(baseTexture);
        var sprite = new PIXI.Sprite(texture);
        sprite.position.set(0.03*height, 0.03*height);
        sprite.width = 0.05*height;
        sprite.height = 0.05*height;
        gameStage.addChild(sprite);
        renderer.render(stage);

        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.click = function(){
            if(!isPaused)
            {
                isPaused = true;
                //todo: pause the music

                //show the pause panel
                var PausePanel = new PIXI.Container();
                var PauseCover = new PIXI.Graphics();
                cover.visible = false;
                PauseCover.beginFill(0x3A006F, 0.5);
                PauseCover.drawRect(0, 0, width, height);
                PauseCover.endFill();

                var SelectButton = new PIXI.Graphics();
                SelectButton.beginFill(0xFFFFFF, 0.9);
                SelectButton.drawPolygon([
                    width/2, height/6,
                    width/2+height/6, height/3,
                    width/2, height/2,
                    width/2-height/6, height/3
                ]);
                SelectButton.endFill();

                var ResumeButton = new PIXI.Graphics();
                ResumeButton.beginFill(0xFFFFFF, 0.9);
                ResumeButton.drawPolygon([
                    width/2+height/6, height/3,
                    width/2+height/3, height/2,
                    width/2+height/6, height/3*2,
                    width/2, height/2
                ]);
                ResumeButton.endFill();

                var RetryButton = new PIXI.Graphics();
                RetryButton.beginFill(0xFFFFFF, 0.9);
                RetryButton.drawPolygon([
                    width/2, height/2,
                    width/2+height/6, height/3*2,
                    width/2, height/6*5,
                    width/2-height/6, height/3*2
                ]);
                RetryButton.endFill();

                var MenuButton = new PIXI.Graphics();
                MenuButton.beginFill(0xFFFFFF, 0.9);
                MenuButton.drawPolygon([
                    width/2, height/2,
                    width/2-height/6, height/3*2,
                    width/2-height/3, height/2,
                    width/2-height/6, height/3
                ]);
                MenuButton.endFill();

                PausePanel.addChild(PauseCover);
                PausePanel.addChild(SelectButton);
                PausePanel.addChild(ResumeButton);
                PausePanel.addChild(RetryButton);
                PausePanel.addChild(MenuButton);

                gameStage.addChild(PausePanel);
                renderer.render(stage);
            }
        };

    };


}