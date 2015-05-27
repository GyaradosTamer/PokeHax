var GameDrawingUtil = (function() {
	var DIR_UP = 0;
	var DIR_RIGHT = 1;
	var DIR_DOWN = 2;
	var DIR_LEFT = 3;

	var wallClasses = ['top-wall', 'right-wall', 'bottom-wall', 'left-wall'];

	var getPosInDir = function (position, dir, distance) {
		var xOrigin = position.x; 
		var yOrigin = position.y;
		if (dir == DIR_UP) {
			return {
				x: xOrigin,
				y: yOrigin - distance
			};
		} else if (dir == DIR_RIGHT) {
			return {
				x: xOrigin + distance,
				y: yOrigin
			};
		} else if (dir == DIR_DOWN) {
			return {
				x: xOrigin,
				y: yOrigin + distance
			};
		} else if (dir == DIR_LEFT) {
			return {
				x: xOrigin - distance,
				y: yOrigin
			};
		}
	};

	var onErr = function(currCellSelector, callback) {
		$('#dog').spStop(true);
		$(currCellSelector).animate({
			backgroundColor: "red",
		}, 300, callback);
	};

	return {
		animateMove: function(gridPet, canMove, callback) {
			var currCellSelector = "#cell-" + gridPet.pos.y + "-" + gridPet.pos.x;
			if (canMove) {
				console.log(gridPet.dir);
				var nextPos = getPosInDir(gridPet.pos, gridPet.dir, 1);
				console.log(nextPos);
				var nextCellSelector = "#cell-" + nextPos.y + "-" + nextPos.x;
				$('#dog').animate({
					top: $(nextCellSelector).offset().top,
					left: $(nextCellSelector).offset().left,
				}, 300, callback);
			} else {
				onErr(currCellSelector, callback);
			}
			
		},

		animateTurnRight: function(gridPet, callback) {
			var newState = gridPet.dir + 1 == 4 ? 1 : gridPet.dir + 2;
			$('#dog').spState(newState);
			setTimeout(callback, 300);
		},

		animateTurnLeft: function(gridPet, callback) {
			var newState = gridPet.dir - 1 < 0 ? 4 : gridPet.dir;
			$('#dog').spState(newState);
			setTimeout(callback, 300);
		},

		animatePickup: function(gridPet, canPickUp, callback) {
			var currCellSelector = "#cell-" + gridPet.pos.y + "-" + gridPet.pos.x;
			if(canPickUp) {
				//assumes only one item per cell
				var item = $(currCellSelector).children(".cell-item")[0];
				$(item).hide("shake", 300, callback);
			} else {
				onErr(currCellSelector, callback);
			}

		},

		animateDrop: function(gridPet, canPickUp, callback) {
			
		},

		renderGrid: function(selector, cellSelector, gridBoard, gridPet) {
			var numRows = gridBoard.levelJSON.width;
			var numCols = gridBoard.levelJSON.height;

			//alternatively, we can configure a default grid width and adjust the height to it
			var widthPcnt = ($(selector).width() / numCols).toString() + "px";
			var height = ($(selector).height() / numRows).toString() + "px";


			for (var row = 0; row < numRows; row ++ ) {
				for (var col = 0; col < numCols; col ++) {
					var id = cellSelector + "-" + row.toString() + "-" + col.toString();

					var cell = gridBoard.board[row][col];

					//handle wall here
					var classStr = "grid-cell ";

					if (cell.isEnd) {
						classStr += "home-cell";
					}

					for (var w = 0; w < cell.hasWall.length; w ++ ) {
						if (cell.hasWall[w]) {
							classStr += " " + wallClasses[w];
						}
					}

					//get 100/width of grid
					var cellDiv = document.createElement('div');
					$(cellDiv).attr("id",id);
					$(cellDiv).addClass(classStr);
					$(cellDiv).css({
						"width": widthPcnt, 
						"height": height});
					//get the width

					//assumes that each cell can only have at most one item
					if (cell.item) {
						var imgStr = '<img src="' + cell.item.getImagePath() + '" class="cell-item"/>';
						$(cellDiv).prepend(imgStr);
					}

					$(selector).append(cellDiv);
				}
			}

			var currCellSelector = "#" + cellSelector + "-" + gridPet.pos.x + "-" + gridPet.pos.y;
      console.log(currCellSelector);
			$('#dog').css({
				"top": $(currCellSelector).offset().top,
				"left": $(currCellSelector).offset().left,
			});
			 $('#dog').sprite({fps: 9, no_of_frames: 2}).spState(gridPet.dir + 1);
		},
	};
})();

/*
psuedo code to animate dog

row, col
turn left, turn right

pick up.. get the giv using the id, row, col
find the first item child inside that array
//fade out
//remove



*/
