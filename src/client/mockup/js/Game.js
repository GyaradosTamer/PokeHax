var data = JSON.parse(localStorage.getItem('levelData'));
var startCoords = data._start;
var board = data._board;
$('#grid').css('height', 94 * board.width + 'px');
$('#grid').css('width', 94 * board.height + 'px');
GridPet.init(1,1,1,1,1);
GridPet.setPos({
	x:startCoords[0], 
	y:startCoords[1]
});
GridPet.setDir(parseInt(data._dir));
GridBoard.load(board);
GameDrawingUtil.renderGrid('#grid', 'cell', GridBoard, GridPet);
$('#dog').css('display', 'inline');
$('#description').text(localStorage.getItem('levelDescription'));