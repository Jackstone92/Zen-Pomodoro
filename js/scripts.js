var sessionLength = $(".session > .length").text() * 60,
    breakLength = $(".break > .length").text() * 60,
    sessionColor = "#2F8C2F",
    breakColor = "#AF3A3A",
    sound = true,
    timer;

var clockDisplay = $(".clock-display"),
    clockContainer = $(".clock-container"),
    clockContainerBefore = $(".clock-container-before");

var isRunning = false,
    isMuted = false,
    isSession = false;
    isBreak = false,
    isPlaying = '';

function grammar(amount) {
  var grammar;
  if(amount > 1) {
    grammar = "minutes";
  } else {
    grammar = "minute";
  }
  return grammar;
}

function updateLength(btn, btnParent) {
  // cache the jQuery selectors we will use
  var thisLength = $(btnParent).find($(".length")),
      thisTimeUnit = $(btnParent).find($(".timeUnit"));

  var thisTime = thisLength.text();

  if(btn === "plus" && thisTime < 1000) {
    thisTime++;
  } else if(btn === "minus" && thisTime > 1) {
    thisTime--;
  }

  if(btnParent === ".session" && !timer.isActive()) {
    clockDisplay.html(thisTime + "<br><span>" + grammar(thisTime) + "</span>");
    $(".whichClock").text("Session");
  }

  thisLength.text(thisTime);
  thisTimeUnit.text(grammar(thisTime));

  if(btnParent === ".session") {
    sessionLength = thisTime * 60;
    if(timer.isActive()) {
      timer.update(btnParent, sessionLength);
    }
  } else if (btnParent === ".break") {
    breakLength = thisTime * 60;
    if (timer.isActive()) {
      timer.update(btnParent, breakLength);
    }
  }
  return;
}

var Timer = function(sTime, bTime, display) {
  var hours,
      minutes,
      seconds,
      intervalID,
      paused = false,
      active = false,
      startSecs = sTime,
      counter = sTime + 1,
      color = sessionColor,
      whichActive = ".session";

  var startTimer = function(which) {
    if(!paused) {
      counter--;
      updateDisplay(which);
      if(counter == 1 && sound) {
        $(".alarm").trigger("play");
      }
      if(counter < 1) {
        switchTimer(which);
      }
    }
  }

  var updateDisplay = function() {
    hours = (counter / 3600) | 0;
    minutes = ((counter % 3600) / 60) | 0;
    seconds = (counter % 60) | 0;

    // Pad the time with zeros if needed
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.html(hours > 0 ? (hours + " : " + minutes + " : " + seconds) : "" + minutes + " : " + seconds);
    if(sound) {
      $(".clockTick").trigger("play");
    }
    fill();
    return;
  }

  var fill = function() {
    var per = Math.abs((counter / startSecs) * 100 - 100);
    per++;
    clockContainer.css({
      background: "linear-gradient(to top, " + color + " " + per + "%,transparent " + per + "%,transparent 100%)"
    });
  }

  var switchTimer = function(which) {
    clearInterval(intervalID);
    var w = which;
    if(w === "Session") {
      w = "Break!";
      counter = bTime + 1;
      whichActive = ".break";
      color = breakColor;
      startSecs = bTime;
      isBreak = true;
      isSession = false;
    } else {
      w = "Session";
      counter = sTime + 1;
      whichActive = ".session";
      color = sessionColor;
      startSecs = sTime;
      isSession = true;
      isBreak = false;
    }

    $(".whichClock").text(w);
    clockContainerBefore.css("border-color", color);
    intervalID = setInterval(function() {
      startTimer(w)
    }, 1000);
  }

  this.toggleSound = function() {
    if(sound) {
      sound = false;
    } else {
      sound = true;
    }
  }

  this.run = function() {
    if(!active) {
      active = true;
      paused = false;
      startTimer("Session");
      clockContainerBefore.css("border-color", color);
      return intervalID = setInterval(function() {
        startTimer("Session")
      }, 1000);
    } else {
      return paused = false;
    }
  }

  this.restart = function() {
    active = false;
    paused = true;
    clockContainer.css("background", "transparent");
    clockContainerBefore.css("border-color", "#FFF");
    return clearInterval(intervalID);
  }

  this.pause = function() {
    return paused = true;
  }

  this.isActive = function() {
    return active;
  }

  this.update = function(which, newTime) {
    if(which === ".session") {
      return sTime = newTime;
    } else if(which === ".break") {
      return bTime = newTime;
    }
  }
}

function buttonListeners() {
  $(".minus, .plus").click(function() {
    var btnParent = "." + $(this).parent().attr("class"),
        btn = $(this).attr("class");
    updateLength(btn, btnParent);
  });

  $(".start").click(function() {
    if(!timer.isActive()) {
      timer = new Timer(sessionLength, breakLength, clockDisplay);
    }

    $(this).hide(0, function() {
      $(".pause").show(0);
    });
    timer.run();
    isRunning = true;
  });

  $(".pause").click(function() {
    $(this).hide(0, function() {
      $(".start").show(0);
    });
    timer.pause();
    isRunning = false;
  });

  $(".reset").click(function() {
    if(timer.isActive()) {
      $(".pause").hide(0, function() {
        $(".start").show(0);
      });
      timer.restart();
      updateLength(null, ".session");
    }
    isRunning = false;
  });

  $('.ambient1, .ambient2, .coffeeShopAmbience').click(function() {
    playMusic(this);
  });

  $(".sound-on").click(function() {
    $(this).hide(0, function() {
      $(".sound-off").show(0);
    });
    timer.toggleSound();
    isMuted = true;
    softPause(isPlaying);
  });

  $(".sound-off").click(function() {
    $(this).hide(0, function() {
      $(".sound-on").show(0);
    });
    timer.toggleSound();
    isMuted = false;
    resume(isPlaying);
  });
}

$(document).ready(function() {
  timer = new Timer(sessionLength, breakLength, clockDisplay);
  buttonListeners();
});



// Music //
var ambient1 = document.getElementById('ambient1');
var ambient2 = document.getElementById('ambient2');
var coffeeShopAmbience = document.getElementById('coffeeShopAmbience');

function playMusic(track) {
  switch(track.className) {
    case 'ambientSelector ambient1':
      pause(ambient2);
      pause(coffeeShopAmbience);
      if(isMuted === false) {
        ambient1.play();
      }
      isPlaying = ambient1;
      break;
    case 'ambientSelector ambient2':
      pause(ambient1);
      pause(coffeeShopAmbience);
      if(isMuted === false) {
        ambient2.play();
      }
      isPlaying = ambient2;
      break;
    case 'ambientSelector coffeeShopAmbience':
      pause(ambient1);
      pause(ambient2);
      if(isMuted === false) {
        coffeeShopAmbience.play();
      }
      isPlaying = coffeeShopAmbience;
      break;
    default:
      pause(ambient2);
      pause(coffeeShopAmbience);
      if(isMuted === false) {
        ambient1.play();
      }
  }
}

function softPause(track) {
  track.pause();
}

function resume(track) {
  track.play();
}

function pause(track) {
  track.pause();
  track.currentTime = 0;
}

function stopMusic() {
  pause(ambient1);
  pause(ambient2);
  pause(coffeeShopAmbience);
}

// ZenRainAnimation Start //
setTimeout(function() {

  function resizeCanvas() {
    ch = window.innerHeight;
    cw = window.innerWidth;
    zenBackground.width = cw;
    zenBackground.height = ch;
  };

  var cw, ch,
      zenBackground = document.getElementById('zenBackground'),
      ctx = zenBackground.getContext('2d'),
      parts = [],
      globalTick = 0,
      rand = function(min, max){
        return Math.floor( (Math.random() * (max - min + 1) ) + min);
      };

  var Part = function(){
    this.reset();
  };

  Part.prototype.reset = function(){
    this.startRadius = rand(1, 10);
    // this.startRadius = rand(20, 25);
    this.radius = this.startRadius;
    this.x = rand(0, zenBackground.width);
    this.y = rand(0, zenBackground.height);
    this.hue = 210;
    this.saturation = rand(40, 60);
    this.lightness = rand(70, 80);
    this.startAlpha = 0.5;
    this.alpha = this.startAlpha;
    this.decayRate = .3;
    this.startLife = rand(20, 30);
    this.life = this.startLife;
    this.lineWidth = 1;
  }

  Part.prototype.update = function(){
    this.alpha = this.startAlpha * (this.life / this.startLife);
    this.radius = this.radius+1;
    this.life -= this.decayRate;
  };

  Part.prototype.render = function(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = ctx.strokeStyle = 'hsla('+this.hue+', '+this.saturation+'%, '+this.lightness+'%, '+this.alpha+')';
    ctx.lineWidth = this.lineWidth;
    ctx.fill();
    // ctx.stroke();
  };

  var createParts = function(){
    parts.push(new Part());
  };

  var updateParts = function(){
    var i = parts.length;
    while(i--){
      if (parts[i].life < 0){
        parts.splice(i, 1)
      }
      parts[i].update();
    }
  };

  var renderParts = function(){
    var i = parts.length;
    while(i--){
      parts[i].render();
    }
  };

  var clear = function(){
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'hsla(0, 0%, 0%, 1)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
  };

  //Run through the first iterations to get all the parts ready for rendering.
  for (i = 0 ; i < 200 ; i++){
    if (globalTick % 15 == 0){
      createParts();
    }
    updateParts();
    globalTick++;
  }

  var loop = function(){
    window.requestAnimFrame(loop, zenBackground);
    clear();

    if (globalTick % 15 == 0){
      createParts();
    }

		updateParts();
		renderParts();
		globalTick++;
  };

  window.requestAnimFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){window.setTimeout(a,1E3/60)}}();

  resizeCanvas();
  window.onresize = resizeCanvas;

  loop();
}, 1);
