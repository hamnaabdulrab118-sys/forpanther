$.coinFlip = function () {
  return Math.random() > .75;
}

var h;
var w;
$.move = function (firefly) {
  var left = $(firefly).position().left;
  var top = $(firefly).position().top;
  var size = $(firefly).outerWidth() + 10;

  var dirH = parseInt($(firefly).attr('dirH'));
  var dirV = parseInt($(firefly).attr('dirV'));

  if (left >= w - size - 10 || left <= 10) {
    dirH = -dirH;
  }

  if (top >= h - size - 10 || top <= 10) {
    dirV = -dirV;
  }

  if (dirH > 0) {
    $(firefly).addClass('flip');
  } else {
    $(firefly).removeClass('flip');
  }

  $(firefly).animate({
    left: (left + dirH),
    top: (top + dirV)
  }, 'fast', 'linear', function () {
    setTimeout(function () { $.move(firefly); }, 1);
  })
    .attr('dirH', dirH)
    .attr('dirV', dirV);
}

$.star = function () {
  var x = Math.max(Math.floor(Math.random() * w), 10);
  var y = Math.max(Math.floor(Math.random() * h), 10);
  var r = Math.max(Math.floor(Math.random() * 255), 200);
  var g = Math.max(Math.floor(Math.random() * 255), 200);
  var b = Math.max(Math.floor(Math.random() * 255), 200);
  var size = Math.max(Math.round(Math.random() * 3), 1);

  if (x >= w) {
    x = w - 10;
  }

  if (y >= h) {
    y = h - 10;
  }

  var star = $('s').first().clone();

  $('#sky').append($(star));
  $(star).css({
    'left': x + 'px',
    'top': y + 'px',
    'background-color': 'rgb(' + r + ',' + g + ',' + b + ')',
  });

  if ($.coinFlip()) {
    var delay = Math.max(Math.round(Math.random() * 4000), 500);
    setTimeout(function () {
      $(star).css({ 'animation': 'fade 20s linear infinite' });
    }, delay);
  }

  return star;
}

$.bug = function () {
  var multiple = Math.random() * 15;
  var dirH = Math.random() > .5 ? -multiple : multiple;
  var dirV = Math.random() > .5 ? -multiple : multiple;

  var r = Math.max(Math.floor(Math.random() * 255), 100);
  var g = Math.max(Math.floor(Math.random() * 255), 100);
  var b = Math.max(Math.floor(Math.random() * 255), 100);

  if (r == g) {
    b = 0;
  }
  else if (r == b) {
    g = 0;
  }
  else if (b == g) {
    r = 0;
  }

  var x = Math.max(Math.floor(Math.random() * w), 10);
  var y = Math.max(Math.floor(Math.random() * h), 10);

  if (x >= w) {
    x = w - 10;
  }

  if (y >= h) {
    y = h - 10;
  }

  var firefly = $('.fly').first().clone();

  $('#sky').append($(firefly));
  $(firefly).css({
    'left': x + 'px',
    'top': y + 'px'
  })
    .attr('dirH', dirH)
    .attr('dirV', dirV);

  $(firefly).find('.light').css({
    'background-color': 'rgb(' + r + ',' + g + ',' + b + ')',
    'box-shadow': 'inset 0 0 20px rgb(' + r + ',' + g + ',' + b + '), 0 0 10px rgb(' + r + ',' + g + ',' + b + ')'
  });

  $(firefly).fadeIn();

  var delay = Math.max(Math.round(Math.random() * 1000), 500);
  setTimeout(function () {
    $(firefly).fadeOut('slow', 'linear', function () {
      $(firefly).remove();
    });
    $.move($.bug());
  }, delay * 10);



  return firefly;
}

$(document).ready(function () {
  h = $('body').outerHeight();
  w = $('body').outerWidth();
  fireflies();

  for (var i = 0; i < 300; i++) {
    $.star();
  }

  $(window).resize(function () {
    h = $('body').outerHeight();
    w = $('body').outerWidth();
    var s = $('s').first().clone();
$('s').remove();
    $('#sky').append(s);
  for (var i = 0; i < 300; i++) {
    $.star();
  }
  });
});

function fireflies() {


  for (var i = 0; i < 10; i++) {
    var delay = Math.max(Math.round(Math.random() * 1000), 500);
    setTimeout(function () {
      $.move($.bug());

    }, delay * 2);
  }
}