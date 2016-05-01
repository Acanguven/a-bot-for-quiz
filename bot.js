// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.quizup.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var CURRENTSTATE = 0;
    var PLAYBUTTONSTATE = 1;
    var INGAME = 2;
    var GAMEENDED = 3;
    var POSTGAMEENDED = 4;
    var HOMEPAGE = 5;
    var GAMEINIT = 6;
    var ERRORSTATE = 7;

    var botStarted = false;
    var answerProgrammed = false;

    var nextGameTimer = Date.now();
    var lastQuestion = "";
    var questionsFound = 0;
    var questionsKnew = 0;

    var winCount = 0;
    var netErrorCount = 0;
    var loseCount = 0;

    $("body").prepend('<div class="bot-ui" style="position: absolute;width: 200px;top: 0;left: 0;height: 450px;background-color: black;color: green;z-index: 9999999;padding-top: 20px;text-align: center;line-height: 25px;"><div class="botstate">HOMEPAGE</div><hr><div class="questionCount">Recorded Questions:<span class="qCount">32</span></div><hr><button id="ststop">Start</button><hr><div class="qIndentified">False</div><hr><div class="ansState" style="min-height:25px;">Not Ready</div><hr><div class="knowledge">0/0</div><hr><div>Win:<span class="winc">0</span><br>Lose:<span class="losec">0</span><br>Err:<span class="errc">0</span><br></div><hr><input type="file" id="file" name="file"/><button id="exp">Export</button></div>');

    $("#ststop").click(function(){
        if(botStarted){
            $("#ststop").html("Start");
        }else{
            $("#ststop").html("Stop");
        }
        botStarted = !botStarted;
    });

    $(document).on('change','#file' , function(){ 
        var input = event.target;
        var reader = new FileReader();
        reader.onload = function(){
            var importedJson = reader.result;
            var data = JSON.parse(importedJson);
            Object.keys(data).forEach(function (k) {
                localStorage.setItem(k, data[k]);
            });
        };
        reader.readAsText(input.files[0]);
    });

    $("#exp").click(function(){
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:attachment/text,' + encodeURI(JSON.stringify(localStorage));
        hiddenElement.target = '_blank';
        hiddenElement.download = 'knowledge.json';
        hiddenElement.click();
    });

    var _stateDetector = setInterval(function(){
        var tempState = 0;
        if($(".TopicHeader__header").length > 0 ){
            tempState = HOMEPAGE;
        }
        if($(".ChallengeGame").length > 0 ){
            tempState = GAMEINIT;
        }
        if($(".PlayRandomButton__icon").length > 0){
            tempState = PLAYBUTTONSTATE;
        }
        if($(".QuestionScene__timer__text").length > 0 ){
            tempState = INGAME;
        }
        if($(".EndGameHeader__title").length > 0){
            tempState = GAMEENDED;
        }
        if($(".EndGameResultsActions__button--play").length > 0){
            tempState = POSTGAMEENDED;
        }
        if($(".GameErrorScene__text").length > 0){
            tempState = ERRORSTATE;
        }
        CURRENTSTATE = tempState;
        _worker();
    },500);

    var _worker = function(){
        switch(CURRENTSTATE){
            case PLAYBUTTONSTATE:
                $(".botstate").text("Play Button");
                if(botStarted){
                    $(".PlayRandomButton span").click();
                }
                break;
            case INGAME:
                if($(".Answer--correct").length > 0){
                    localStorage.setItem($(".Question__text").text(), $(".Answer--correct").text());
                }else{
                    console.log("%c"+localStorage.getItem($(".Question__text").text()), "color: blue; font-size:23px;"); 
                    $(".qIndentified").text(localStorage.getItem($(".Question__text").text()));
                    if(botStarted){
                        var roundMultiplier = 2;
                        var timeRemains = parseInt($(".QuestionScene__timer__value").text());
                        var myScore = parseInt($(".QuestionScene__profile__score").eq(0).text());
                        var enemyScore = parseInt($(".QuestionScene__profile__score").eq(1).text());

                        if(lastQuestion != $(".Question__text").text() && $(".Question__text") && $(".Question__text").text().length > 5){

                            questionsFound++;
                            lastQuestion = $(".Question__text").text();
                            if(localStorage.getItem($(".Question__text").text())){
                                questionsKnew++;
                            }
                            $(".knowledge").text(questionsKnew + "/" + questionsFound);
                        }
                        if($(".Question__text").text() && $(".Question__text") && $(".Question__text").text().length > 5){
                            if(myScore > enemyScore + 40){
                                /* Random Answer */
                                $(".ansState").text("Huge win, random answering");
                                if(!answerProgrammed){
                                    answerProgrammed = true;
                                    setTimeout(function(){
                                        randomAnswer();
                                    },getRandomInt(600,1000));
                                }

                            }else{
                                if(localStorage.getItem($(".Question__text").text())){
                                    $(".qIndentified").text(localStorage.getItem($(".Question__text").text()));
                                    if(enemyScore >= myScore){
                                        /* Answer Fast To Catch */
                                        if(!answerProgrammed && answerVisible()){
                                            console.log("set answer");
                                            if(myScore === 0){
                                                answerProgrammed = true;
                                                setTimeout(function(){
                                                    answerFromLocal();
                                                },getRandomInt(600,1100));
                                            }else{
                                                answerProgrammed = true;
                                                setTimeout(function(){
                                                    answerFromLocal();
                                                },getRandomInt(350,1250));
                                            }
                                        }
                                        $(".ansState").text("Trying to catch him, know the answer");

                                    }else{
                                        /* Answer Calm To Not Get Detected */

                                        if(timeRemains >= 7 + Math.floor((Math.random() * 3) + 1)){
                                            $(".ansState").text("Waiting for calm answer over 5 seconds");
                                            if((timeRemains-1) * roundMultiplier + myScore < enemyScore){
                                                answerFromLocal();
                                            }
                                        }else{
                                            $(".ansState").text("Minimum time answer reached");
                                            answerFromLocal();
                                        }
                                    }
                                }else{
                                    /* Random Answer */
                                    $(".qIndentified").text(":(");
                                    $(".ansState").text("Don't know the question random answering");
                                    if(!answerProgrammed){
                                        answerProgrammed = true;
                                        setTimeout(function(){
                                            randomAnswer();
                                        },getRandomInt(600,2500));
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            case GAMEENDED:
                $(".botstate").text("Game Ended");
                if(botStarted){
                    var resTest = $(".EndGameHeader__results__text").text();
                    if(resTest == "You won!"){
                        winCount++;
                        $(".winc").text(winCount);
                    }else if(resTest == "You lost!"){
                        loseCount++;
                        $(".losec").text(loseCount);
                    }else{
                        netErrorCount++;
                        $(".errc").text(netErrorCount);
                    }
                    $(".ModalClose")[0].click();
                }
                break;
            case POSTGAMEENDED:
                $(".botstate").text("Post Game Ended");
                if(botStarted){
                    if(nextGameTimer + getRandomInt(3000,12000) < Date.now()){
                        nextGameTimer = Date.now();
                        $(".ModalClose")[0].click();
                    }
                }
                break;
            case HOMEPAGE:
                $(".botstate").text("Homepage");
                if(botStarted){
                    $(".PlayButton--big span").click();
                }
                break;
            case GAMEINIT:
                $(".botstate").text("Game loading");
                break;
            case ERRORSTATE:
                if(botStarted){
                    $(".ModalClose")[0].click();
                }
                break;

        }

        $(".qCount").text(localStorage.length-1);
    };

    var randomAnswer = function(){
        answerProgrammed = false;
        var len = $(".Answer__text").length;
        var random = Math.floor( Math.random() * len ) + 1;
        $(".Answer__text").eq(random).click();
    };

    var answerFromLocal = function(){
        var answerText = localStorage.getItem($(".Question__text").text());
        $(".Answer__text").each(function(i,elem){
            if($(elem).text() == answerText){
                $(elem).click();
                answerProgrammed = false;
            }
        });
    };

    var answerVisible = function(){
        var ret = false;
        var answerText = localStorage.getItem($(".Question__text").text());
        $(".Answer__text").each(function(i,elem){
            if($(elem).text() == answerText){
                if(!$(elem).parent().hasClass("Answer--hidden")){
                    ret = true;
                }
            }
        });
        return ret;
    };

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
