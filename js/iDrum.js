/**
 * Created by effie on 17/7/24.
 */

/*
var new_element = document.createElement("script");
new_element.setAttribute("type", "text/javascript");
new_element.setAttribute("src", "../js/pixi.js");
document.body.appendChild(new_element);*/

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
wMessage.position.set((renderer.view.width-wMessage.width)/2, (renderer.view.height-wMessage.height)/2);

//add background of welcome page
var img = new Image();
img.src = "../src/img/bg.jpg";
img.onload = function(){
    var baseTexture = new PIXI.BaseTexture(this);
    var texture = new PIXI.Texture(baseTexture);
    var sprite = new PIXI.Sprite(texture);
    sprite.width = renderer.view.width;
    sprite.height = renderer.view.height;
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

var songList = [];

var beatList = [];
var startTime = null;
var time = 0;//record the current time of the music
var pauseTime = 0;

//draw the beats
var startPos = 0;
var trackWidth = 0;

var colorList = [0xF08080, 0xFFA07A, 0xFAFAD2, 0xE0FFFF, 0xADD8E6, 0xFFFFF0, 0xE6E6FA];

//choose from ChoiceStage, apply in GameStage
var currentSongNum = 0;
var songVelocity = 2;
var aheadTime = renderer.view.style.height/75/songVelocity;
var isMuted = false;
var isPaused = false;
var music = null;

var muteList = [];
var src1 = "../src/img/icon/MUTE.png";
var src2 = "../src/img/icon/UNMUTE.png";
var texture1 = PIXI.Texture.fromImage(src1);
var texture2 = PIXI.Texture.fromImage(src2);
muteList.push(texture1);
muteList.push(texture2);

var muteView = new PIXI.extras.AnimatedSprite(muteList, false);

//point and other statistics
var point = 0;
var maxPerfect = 0;
var perfect = 0;
var combo = 0;
var ok = 0;
var miss = 0;
var onePoint = 0;

//key
var keyAlphas = [];
var keyCodes = [];
var keyObjectList = [];

function setupChoiceStage(){
    choiceStage.removeChildren();
    currentSongNum = 1;
    music = null;
    var width = renderer.view.width;
    var height = renderer.view.height;
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
    gameStage.removeChildren();
    isPaused = false;

    //initializing statistics
    maxPerfect = 0;
    perfect = 0;
    combo = 0;
    ok = 0;
    miss = 0;

    gameStage.addChild(bg);
    var width = renderer.view.width;
    var height = renderer.view.height;

    var cover = new PIXI.Graphics();
    cover.beginFill(0xFFFFFF, 0.85);
    cover.drawRect(0, 0, width, height);
    cover.endFill();
    gameStage.addChild(cover);

    //point
    point = 0;
    var pointText = new PIXI.Text(String(point),
        {fontFamily: "Helvetica", fontSize: 32, fontWeight:"lighter", fill: "0x3A006F"});
    pointText.anchor.set(1, 0);
    pointText.position.set(width - 0.05*height, 0.05*height);
    gameStage.addChild(pointText);

    var comboText = new PIXI.Text("Combo: "+String(combo),
        {fontFamily: "Helvetica", fontSize: 26, fontWeight:"lighter", fill: "0x3A006F"});
    comboText.anchor.set(0.5, 0);
    comboText.position.set(width/2, 5);
    gameStage.addChild(comboText);

    var nameText = new PIXI.Text(nameList[currentSongNum],
        {fontFamily: "Helvetica", fontSize: 20, fontWeight:"lighter", fill: "0x3A006F"});
    nameText.anchor.set(1, 0);
    nameText.position.set(pointText.position.x, pointText.position.y+pointText.height+10);
    gameStage.addChild(nameText);


    var PauseImg = new Image();
    pauseTime = 0;
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
                pauseTime = new Date().getTime();
                //pause the music
                music.pause();

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

                var SelectText = new PIXI.Text("Song Select",
                    {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "0x3A006F"});
                SelectText.anchor.set(0.5, 0.5);
                SelectText.position.set(width/2, height/3);
                SelectButton.addChild(SelectText);

                SelectButton.interactive = true;
                SelectButton.buttonMode = true;
                SelectButton.click = function(){
                    music.pause();
                    music = null;
                    isPaused = false;
                    gameStage.removeChild(PausePanel);
                    gameStage.visible = false;
                    choiceStage.visible = true;
                    choiceStage.addChildAt(bg, 0);
                    renderer.render(stage);
                };

                var ResumeButton = new PIXI.Graphics();
                ResumeButton.beginFill(0xFFFFFF, 0.9);
                ResumeButton.drawPolygon([
                    width/2+height/6, height/3,
                    width/2+height/3, height/2,
                    width/2+height/6, height/3*2,
                    width/2, height/2
                ]);
                ResumeButton.endFill();

                var ResumeText = new PIXI.Text("Resume",
                    {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "0x3A006F"});
                ResumeText.anchor.set(0.5, 0.5);
                ResumeText.position.set(width/2+height/6, height/2);
                ResumeButton.addChild(ResumeText);

                ResumeButton.interactive = true;
                ResumeButton.buttonMode = true;
                ResumeButton.click = function(){
                    isPaused = false;
                    gameStage.removeChild(PausePanel);
                    cover.visible = true;
                    renderer.render(stage);

                    pauseTime = new Date().getTime() - pauseTime;
                    startTime += pauseTime;
                    music.play();
                    gameLoop();
                };

                var RetryButton = new PIXI.Graphics();
                RetryButton.beginFill(0xFFFFFF, 0.9);
                RetryButton.drawPolygon([
                    width/2, height/2,
                    width/2+height/6, height/3*2,
                    width/2, height/6*5,
                    width/2-height/6, height/3*2
                ]);
                RetryButton.endFill();

                var RetryText = new PIXI.Text("Retry",
                    {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "0x3A006F"});
                RetryText.anchor.set(0.5, 0.5);
                RetryText.position.set(width/2, height/3*2);
                RetryButton.addChild(RetryText);

                RetryButton.interactive = true;
                RetryButton.buttonMode = true;
                RetryButton.click = function(){
                    isPaused = false;
                    setupGameStage();
                    renderer.render(stage);

                    //just a test
                    /*
                    gameStage.visible = false;
                    endStage.visible = true;
                    setupEndStage();
                    renderer.render(stage);
                    */
                };

                var MenuButton = new PIXI.Graphics();
                MenuButton.beginFill(0xFFFFFF, 0.9);
                MenuButton.drawPolygon([
                    width/2, height/2,
                    width/2-height/6, height/3*2,
                    width/2-height/3, height/2,
                    width/2-height/6, height/3
                ]);
                MenuButton.endFill();

                var MenuText = new PIXI.Text("Main Menu",
                    {fontFamily: "Helvetica", fontSize: 24, fontWeight:"lighter", fill: "0x3A006F"});
                MenuText.anchor.set(0.5, 0.5);
                MenuText.position.set(width/2-height/6, height/2);
                MenuButton.addChild(MenuText);

                MenuButton.interactive = true;
                MenuButton.buttonMode = true;
                MenuButton.click = function(){
                    //quit the song
                    isPaused = false;
                    music.pause();
                    music = null;

                    gameStage.removeChild(PausePanel);
                    gameStage.visible = false;
                    welcomeStage.visible = true;
                    renderer.render(stage);
                };

                var Cross = new PIXI.Graphics();
                Cross.lineStyle(3, 0x3A006F, 1);
                Cross.moveTo(width/2-height/6, height/3);
                Cross.lineTo(width/2+height/6, height/3*2);
                Cross.moveTo(width/2+height/6, height/3);
                Cross.lineTo(width/2-height/6, height/3*2);

                PausePanel.addChild(PauseCover);
                PausePanel.addChild(SelectButton);
                PausePanel.addChild(ResumeButton);
                PausePanel.addChild(RetryButton);
                PausePanel.addChild(MenuButton);
                PausePanel.addChild(Cross);

                gameStage.addChild(PausePanel);
                renderer.render(stage);
            }
        };

    };//end of pausePanel

    //endLine
    var endLine = new PIXI.Graphics();
    endLine.beginFill(0x000000, 1);
    endLine.drawRect(0, 0.8*height, width, 5);
    endLine.endFill();
    gameStage.addChild(endLine);

    //load beatMap
    loadTrack(songList[currentSongNum].beatmap);

    //init tracks
    startPos = 0.1*width;
    trackWidth = width*0.8/track.keyNumber;
    var trackDrawer = new PIXI.Graphics();
    trackDrawer.lineStyle(2, 0xFFFFFF, 1);
    var mode = 0;
    if(track.keyNumber%2 === 0)
    {
        mode = 1;
    }
    else if(track.keyNumber%3 === 0)
    {
        mode = 2;
    }

    for(var i = 0; i < track.keyNumber; i++)
    {
        if(mode === 1)
        {
            trackDrawer.beginFill(colorList[i%2+1], 0.6);
        }
        else if(mode === 2)
        {
            trackDrawer.beginFill(colorList[i%3], 0.6);
        }
        else
        {
            trackDrawer.beginFill(colorList[i%colorList.length], 0.6);
        }

        trackDrawer.drawRect(startPos+i*trackWidth, 0, trackWidth, height);
    }
    gameStage.addChild(trackDrawer);

    //load music
    sounds.load([songList[currentSongNum].address]);
    sounds.whenLoaded = setupSound;

    //init
    beatList.splice(0, beatList.length);
    time = 0;
    startTime = null;
    aheadTime = height/75/songVelocity;

    //load keyCodes
    switch(track.keyNumber)
    {
        case 4:
            keyAlphas = ['A', 'S', 'K', 'L'];
            break;
        case 5:
            keyAlphas = ['A', 'S', ' ', 'K', 'L'];
            break;
        case 6:
            keyAlphas = ['A', 'S', 'D', 'J', 'K', 'L'];
            break;
        case 7:
            keyAlphas = ['A', 'S', 'D', ' ', 'J', 'K', 'L'];
            break;
        case 8:
            keyAlphas = ['A', 'S', 'D', 'C', 'N', 'J', 'K', 'L'];
            break;
        case 9:
            keyAlphas = ['A', 'S', 'D', 'C', ' ', 'N', 'J', 'K', 'L'];
            break;
        default:
            alert("this song has incorrect keyNumber!");
            break;
    }

    keyCodes.splice(0, keyCodes.length);
    keyObjectList.splice(0, keyObjectList.length);
    for(i = 0; i < keyAlphas.length; i++)
    {
        if(keyAlphas[i] !== ' ')
        {
            var num = keyAlphas[i].charCodeAt(0);
            keyCodes.push(num);
        }
        else
        {
            keyCodes.push(32);
        }

        var keyObject = keyboard(keyCodes[i]);
        keyObjectList.push(keyObject);

        keyObject.press = function(){
            for(var j = 0; j < beatList; j++)
            {
                var beat = beatList[j];
                if(beat.track !== i)
                    continue;

                var hit = false;
                if(beat.beatType === 0)
                {
                    if(endLine.containsPoint(new PIXI.Point(beat.center, beat.startY)))
                    {
                        hit = true;
                        gameStage.removeChild(beat);
                        beatList[j] = null;
                        point += onePoint;
                        maxPerfect += 1;

                    }
                    else if(endLine.containsPoint(new PIXI.Point(beat.center, beat.startY+10))
                        || endLine.containsPoint(new PIXI.Point(beat.center, beat.startY-10)))
                    {
                        hit = true;
                        gameStage.removeChild(beat);
                        beatList[j] = null;
                        point += 0.8*onePoint;
                        perfect += 1;
                    }
                    else if(endLine.containsPoint(new PIXI.Point(beat.center, beat.startY+30))
                        || endLine.containsPoint(new PIXI.Point(beat.center, beat.startY-30)))
                    {
                        hit = true;
                        gameStage.removeChild(beat);
                        beatList[j] = null;
                        point += 0.6*onePoint;
                        ok += 1;
                    }

                    if(hit)
                    {
                        combo++;
                        comboText.text = "Combo: "+ String(combo);
                        pointText.text = String(point);
                        renderer.render(stage);
                    }

                }
                else
                {
                    //todo: beatType = 1
                }

            }
        };

    }
}


function setupSound()
{
    music = sounds[songList[currentSongNum].address];
    music.pause();
    music.loop = false;
    if(isMuted)
    {
        music.volume = 0;
    }
    else
    {
        music.volume = 1;
    }

    var StartText = new PIXI.Text("Start",
        {fontFamily: "Helvetica", fontSize: 56, fontWeight:"lighter", fill: "0x3A006F"});
    StartText.anchor.set(0.5, 0.5);
    StartText.position.set(renderer.view.width/2, renderer.view.height/2);
    gameStage.addChild(StartText);
    StartText.interactive = true;
    StartText.buttonMode = true;

    //start the game
    StartText.click = function(){
        gameStage.removeChild(StartText);
        setTimeout(musicPlay, aheadTime);
        startTime = new Date().getTime();
        gameLoop();
        renderer.render(stage);
    };

    onePoint = 1000000/beatFlow.length;
}

function musicPlay()
{
    music.play();
}

function gameLoop()
{
    if(!isPaused)
        requestAnimationFrame(gameLoop);

    var _time = new Date().getTime();
    if(_time - startTime > time)
    {
        time = _time - startTime;
        popBeat(time);
        for(var i = 0; i < busArray.length; i++)
        {
            var center = startPos + trackWidth/2 + trackWidth*busArray[i].trackNum;
            var beat = new PIXI.Graphics();
            if(busArray[i].type === 0)
            {
                beat.lineStyle(5, 0x000000, 1);
                beat.beginFill(0xFC4C4A, 1);

                beat.drawPolygon([
                    center-10, 0,
                    center, -10,
                    center+10, 0,
                    center, 10,
                    center-10, 0
                ]);
                beat.beatType = 0;
            }
            else
            {
                //todo
                beat.lineStyle(5, 0x000000, 1);
                beat.beginFill(0xFC4C4A, 1);

                beat.drawPolygon([
                    center-10, 0,
                    center, -10,
                    center+10, 0,
                    center, 10,
                    center-10, 0
                ]);

                beat.beatType = 1;
            }
            beat.endFill();

            beat.track = busArray[i].trackNum;
            beat.startY = 0;
            beat.center = center;

            beatList.push(beat);
            gameStage.addChild(beat);
        }
    }

    for(var j = 0; j < beatList.length; j++)
    {
        beatList[j].position.y += songVelocity;
        beatList.startY += songVelocity;
        //todo
    }

    renderer.render(stage);
}

function setupEndStage()
{
    endStage.removeChildren();

    endStage.addChild(bg);
    var width = renderer.view.width;
    var height = renderer.view.height;

    var cover = new PIXI.Graphics();
    cover.beginFill(0xFFFFFF, 0.85);
    cover.drawRect(0, 0, width, height);
    cover.endFill();
    endStage.addChild(cover);

    var nameText = new PIXI.Text(nameList[currentSongNum],
        {fontFamily: "Helvetica", fontSize: 36, fontWeight:"lighter", fill: "0x3A006F"});
    nameText.anchor.set(0.5, 1);
    nameText.position.set(width/4, height/3);
    endStage.addChild(nameText);

    var pointText = new PIXI.Text(String(point),
        {fontFamily: "Helvetica", fontSize: 36, fontWeight:"lighter", fill: "0x3A006F"});
    pointText.anchor.set(0.5, 0);
    pointText.position.set(width/4, height/3*2);
    endStage.addChild(pointText);

    var scoreText = new PIXI.Text("Total Score",
        {fontFamily: "Helvetica", fontSize: 16, fontWeight:"lighter", fill: "0x3A006F"});
    scoreText.anchor.set(0.5, 1);
    scoreText.position.set(pointText.position.x-pointText.width/2, pointText.position.y-5);
    endStage.addChild(scoreText);

    var display = new PIXI.Graphics();
    display.lineStyle(2, 0xFFFFFF, 1);
    display.beginFill(0x516374, 0.93);
    display.drawPolygon([
        width/2, 0.2*height,
        width/2+0.1*height, 0.1*height,
        width/2+0.4*height, 0.4*height,
        width/2+0.3*height, 0.5*height,
        width/2, 0.2*height
    ]);

    display.drawPolygon([
        width/2, 0.4*height,
        width/2+0.1*height, 0.5*height,
        width/2+0.4*height, 0.2*height,
        width/2+0.3*height, 0.1*height,
        width/2, 0.4*height
    ]);

    display.drawPolygon([
        width/2+0.3*height, 0.3*height,
        width/2+0.5*height, 0.1*height,
        width/2+0.7*height, 0.3*height,
        width/2+0.5*height, 0.5*height,
        width/2+0.3*height, 0.3*height
    ]);
    display.endFill();

    var maxNumText = new PIXI.Text(String(maxPerfect),
        {fontFamily: "Helvetica", fontSize: 28, fontWeight:"lighter", fill: "0xFFFFFF"});
    maxNumText.anchor.set(0.5, 0.5);
    maxNumText.position.set(width/2+0.1*height, 0.2*height);
    display.addChild(maxNumText);

    var maxText = new PIXI.Text("Max",
        {fontFamily: "Helvetica", fontSize: 12, fontWeight:"lighter", fill: "0xFFFFFF"});
    maxText.anchor.set(0.5, 0);
    maxText.position.set(maxNumText.position.x, maxNumText.position.y+maxNumText.height/2);
    display.addChild(maxText);

    var perfectNumText = new PIXI.Text(String(perfect),
        {fontFamily: "Helvetica", fontSize: 28, fontWeight:"lighter", fill: "0xFFFFFF"});
    perfectNumText.anchor.set(0.5, 0.5);
    perfectNumText.position.set(width/2+0.3*height, 0.2*height);
    display.addChild(perfectNumText);

    var perfectText = new PIXI.Text("Perfect",
        {fontFamily: "Helvetica", fontSize: 12, fontWeight:"lighter", fill: "0xFFFFFF"});
    perfectText.anchor.set(0.5, 0);
    perfectText.position.set(perfectNumText.x, perfectNumText.y+perfectNumText.height/2);
    display.addChild(perfectText);

    var comboNumText = new PIXI.Text(String(combo),
        {fontFamily: "Helvetica", fontSize: 28, fontWeight:"lighter", fill: "0xFFFFFF"});
    comboNumText.anchor.set(0.5, 0.5);
    comboNumText.position.set(width/2+0.2*height, 0.3*height);
    display.addChild(comboNumText);

    var comboText = new PIXI.Text("Combo",
        {fontFamily: "Helvetica", fontSize: 12, fontWeight:"lighter", fill: "0xFFFFFF"});
    comboText.anchor.set(0.5, 0);
    comboText.position.set(comboNumText.x, comboNumText.y+comboNumText.height/2);
    display.addChild(comboText);

    var okNumText = new PIXI.Text(String(ok),
        {fontFamily: "Helvetica", fontSize: 28, fontWeight:"lighter", fill: "0xFFFFFF"});
    okNumText.anchor.set(0.5, 0.5);
    okNumText.position.set(width/2+0.1*height, 0.4*height);
    display.addChild(okNumText);

    var okText = new PIXI.Text("Ok",
        {fontFamily: "Helvetica", fontSize: 12, fontWeight:"lighter", fill: "0xFFFFFF"});
    okText.anchor.set(0.5, 0);
    okText.position.set(okNumText.x, okNumText.y+okNumText.height/2);
    display.addChild(okText);

    var missNumText = new PIXI.Text(String(miss),
        {fontFamily: "Helvetica", fontSize: 28, fontWeight:"lighter", fill: "0xFFFFFF"});
    missNumText.anchor.set(0.5, 0.5);
    missNumText.position.set(width/2+0.3*height, 0.4*height);
    display.addChild(missNumText);

    var missText = new PIXI.Text("Miss",
        {fontFamily: "Helvetica", fontSize: 12, fontWeight:"lighter", fill: "0xFFFFFF"});
    missText.anchor.set(0.5, 0);
    missText.position.set(missNumText.x, missNumText.y+missNumText.height/2);
    display.addChild(missText);

    var grade = "";
    if(point < 500000)
    {
        grade = "F";
    }
    else if(point < 600000)
    {
        grade = "E";
    }
    else if(point < 700000)
    {
        grade = "D";
    }
    else if(point < 800000)
    {
        grade = "C";
    }
    else if(point < 900000)
    {
        grade = "B";
    }
    else if(point !== 1000000)
    {
        grade = "A";
    }
    else
    {
        grade = "A+";
    }

    var gradeText = new PIXI.Text(grade,
        {fontFamily: "Helvetica", fontSize: 40, fontWeight:"lighter", fill: "0xFFFFFF"});
    gradeText.anchor.set(0.5, 0.5);
    gradeText.position.set(width/2+0.5*height, 0.3*height);
    display.addChild(gradeText);

    var againButton = new PIXI.Graphics();
    againButton.lineStyle(2, 0xFFFFFF, 1);
    againButton.beginFill(0x516374, 0.93);
    againButton.drawPolygon([
        width/2+0.3*height, 0.8*height,
        width/2+0.4*height, 0.7*height,
        width/2+0.5*height, 0.8*height,
        width/2+0.4*height, 0.9*height,
        width/2+0.3*height, 0.8*height
    ]);
    againButton.endFill();

    var againText = new PIXI.Text("Again",
        {fontFamily: "Helvetica", fontSize: 22, fontWeight:"lighter", fill: "0xFFFFFF"});
    againText.anchor.set(0.5, 0.5);
    againText.position.set(width/2+0.4*height, 0.8*height);
    againButton.addChild(againText);

    againButton.interactive = true;
    againButton.buttonMode = true;
    againButton.click = function(){
        endStage.visible = false;
        gameStage.visible = true;
        setupGameStage();
        renderer.render(stage);
    };

    var nextButton = new PIXI.Graphics();
    nextButton.lineStyle(2, 0xFFFFFF, 1);
    nextButton.beginFill(0x516374, 0.93);
    nextButton.drawPolygon([
        width/2+0.5*height, 0.8*height,
        width/2+0.6*height, 0.7*height,
        width/2+0.7*height, 0.8*height,
        width/2+0.6*height, 0.9*height,
        width/2+0.5*height, 0.8*height
    ]);
    nextButton.endFill();

    var nextText = new PIXI.Text("Next",
        {fontFamily: "Helvetica", fontSize: 22, fontWeight:"lighter", fill: "0xFFFFFF"});
    nextText.anchor.set(0.5, 0.5);
    nextText.position.set(width/2+0.6*height, 0.8*height);
    nextButton.addChild(nextText);

    nextButton.interactive = true;
    nextButton.buttonMode = true;
    nextButton.click = function(){
        endStage.visible = false;
        choiceStage.visible = true;
        setupChoiceStage();
        renderer.render(stage);
    };


    endStage.addChild(display);
    endStage.addChild(againButton);
    endStage.addChild(nextButton);
}
