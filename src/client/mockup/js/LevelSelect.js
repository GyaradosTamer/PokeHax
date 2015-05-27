var LevelSelect = function() {
  return this;
};

var levelSelectTemplate = document.getElementById("level-select-template");
var templates = {
  renderlevelSelect: Handlebars.compile(levelSelectTemplate.innerHTML)
};
var datas = [];
var currLevel = -1;

LevelSelect.render = function(world) {
  $.ajax({
    url: '/world/all',
    dataType: "json", 
    type: 'GET',
    success: function(data) { 
      $("#level-select").html((templates.renderlevelSelect(data))); 
      for (var world = 0; world < data.worlds.length; world++) {
        for (var level = 0; level < data.worlds[world]._levels.length; level++) {
          var levelJSON = data.worlds[world]._levels[level];
          var levelID = levelJSON._id;
          var levelData = JSON.parse(levelJSON._datablob);
          datas[levelID] = levelData;
        }
      }
      $('.world-panel').on('hide.bs.collapse', function() {
        $('#dog').css('display', 'none');
      });
      $('.world-panel').on('show.bs.collapse', function() {
        $(this).find('.level').removeClass('in');
      });

      $('.level').on('show.bs.collapse', function() {
        $('#dog').css('display', 'none');
        $('.level').each(function() {
          if ($(this).hasClass('in')) {
            $(this).removeClass('in');
          }
        })
      });

      $('.level-panel').on('shown.bs.collapse', function() {
        $(this).find('.level').each
        var levelID = parseInt($(this).find('.level-click').attr('href').match(/[\d]+/));
        if (currLevel >= 0) {
          $('#board'+currLevel).html('');
        }
        var data = datas[levelID];
        var startCoords = data._start;
        var board = data._board;
        $('#board'+levelID).css('height', 94 * board.width + 'px');
        $('#board'+levelID).css('width', 94 * board.height + 'px');
        GridPet.init(1,1,1,1,1);
        GridPet.setPos({
          x:startCoords[0], 
          y:startCoords[1]
        });
        GridPet.setDir(parseInt(data._dir));
        GridBoard.load(board);
        localStorage.setItem('levelData', JSON.stringify(data));
        localStorage.setItem('levelDescription', $('#level-description'+levelID).text());
        GameDrawingUtil.renderGrid("#board" + levelID, 'cell' + levelID, GridBoard, GridPet);
        $('#dog').css('display', 'inline');
        currLevel = levelID;
      });
    },
    error: function() { alert('Failed!'); }
  });
};