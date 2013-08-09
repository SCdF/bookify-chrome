//@ sourceURL=content.js
window.bookify_chrome = (function() {
  var pointer = {
    // The node at the top of the *current* page
    pageHead: null,
    // The node that will be at the top of the *next* page
    nextPageHead: null
  };
  var article;
  var surface, cursorHideTimeoutId;

  function nukePageFromOrbit() {
    // Nuke the current page from orbit
    window.onload = window.onunload = function() {};
    $("head").empty();
    $("body").empty();

    $("body").append("<div id='content'></div><div id='progress'></div>");
    return $('#content');
  }

  function cleanMouseMovement(successFn) {
    // Clean up bogus mouse movement
    var x = -1, y = -1;

    return function(e) {
      if (e.pageX !== x || e.pageY !== y) {
        x = e.pageX;
        y = e.pageY;

        successFn(e);
      }
    }
  }

  function mouseMovement(e) {
    if (cursorHideTimeoutId) {
      window.clearTimeout(cursorHideTimeoutId);
    }

    $("body").css("cursor", "default");

    cursorHideTimeoutId = window.setTimeout(
      function() {
        $("body").css("cursor", "none");
      }, 3000);
  }

  function initEvents() {
    Mousetrap.bind(['right', 'space', 'j'], function() {
      pointer = bookify.controller.renderNextPage(pointer, surface);
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
    Mousetrap.bind(['left', 'shift+space', 'k'], function() {
      pointer = bookify.controller.renderPreviousPage(pointer, surface);
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
    Mousetrap.bind(['up', 'h'], function() {
      //TODO move back one element
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
    Mousetrap.bind(['down', 'l'], function() {
      //TOOD move forward one element (unless you're already rendering the last page)
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
    Mousetrap.bind('home', function() {
      pointer = bookify.controller.renderCurrentPage({pageHead: pointer.pageHead.siblings().addBack().first()}, surface);
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
    Mousetrap.bind("d", function() {
      bookify.settings.debug = !bookify.settings.debug;
      pointer = bookify.controller.renderCurrentPage(pointer, surface);
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
    Mousetrap.bind("?", function() {
      alert("Right/Space/j = move forward\nLeft/Shift+Space/k = move back\nHome = top of document\nd = toggle debug mode");
    });
    $(document).mousemove(cleanMouseMovement(mouseMovement));
    $(window).resize(function() {
      pointer = bookify.controller.renderCurrentPage(pointer, surface);
      bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
    });
  }

  function loadPageAttempt() {
    bookify.readability.getContent(document.URL,
      function(results) {
        chrome.runtime.sendMessage({state: "loaded"}, function() {
          surface = nukePageFromOrbit();
          initEvents();

          document.title = results.title;

          var title = $("<h1>").html(results.title);
          article = results.content.first().before(title).siblings();

          $("#progress").progressbar({
            value: 0,
            max: article.length
          });

          pointer = bookify.controller.renderCurrentPage({pageHead: article.first()}, surface);
          bookify.controller.updateProgressbar($("#progress"), article, pointer.nextPageHead);
        });
      },
      function(jqXHR, textStatus, errorThrown) {
        chrome.runtime.sendMessage({state: "error", textStatus: textStatus, errorThrown: errorThrown});

        console.log("Something went wrong, error below the line!")
        console.log(textStatus, errorThrown);
        $("#content").append("<p>"+textStatus+"</p><p>"+errorThrown+"</p>");
      });
  }

  return {
    init: function() {
      if (!bookify) {
        throw "Bookify not loaded"
      }

      // Config bookify
      bookify.settings.token = "3f5c9f6c9869dbb23897ffe7c06f79ea4c1f1963";

      chrome.runtime.sendMessage({state: "loading"}, function() {
        loadPageAttempt();
      });
    }
  }
})();

bookify_chrome.init();