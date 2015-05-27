var NEX_WIDTH = 980;
var NEX_HEIGHT = 1292;

// Code to switch between views
var swapViews = function () {
	if ($('#editor-view').css('display') == 'none') {
		$('#editor-view').css({
			display: 'block'
		});
		$('#game-view').css({
			display: 'none'
		});
	} else {
		$('#editor-view').css({
			display: 'none'
		});
		$('#game-view').css({
			display: 'block'
		});
	}
};

var onLoad = function () {
	// Set body size to be nexus sizes for demo
	document.body.style.width = NEX_WIDTH + 'px';
	document.body.style.height = NEX_HEIGHT + 'px';
	// Name the code page the default
	nameCodePage();
	// Set level properties like title and minimap
	// TODO: replace with actual contents
	var navbarTitle = 'Fetch!'; // TODO: change to dynamic
	// Set minimap image and description
	initMinimapSummary('/client/mockup/assets/editor-fakemap.png', 
			'Mission: Find the bone and bring it back to the doghouse.');
	// Add drag listeners
	initPaletteArrays();
	document.addEventListener('touchstart', handleTouchStart, false);        
	document.addEventListener('touchmove', handleTouchMove, false);
	document.addEventListener('touchend', handleTouchEnd, false);
	// Attach event listeners to static components
	$('.toolkit-handle').click(function () {
		if (canClickToolboxHandle) {
			if (toolboxRaised) {
				lowerToolbox();
			} else {
				raiseToolbox();
			}
		}
	});
	// Attach event listener to toolkit tabs
	for (var i = 0; i < 3; i++) {
		$('.toolkit-tab:eq(' + i + ')').click(function(index) {
			return function() {
				switchTabs(index);
			};
		}(i));
	}
	// Attach listeners to toolkit left and right arrows
	$('#tab-content-left-arrow').click(function () {
		scrollTabContentLeft();
	});
	$('#tab-content-right-arrow').click(function () {
		scrollTabContentRight();
	});
	// Attach listeners to map icon 
	$('.map-icon').click(function () {
		expandMinimap();
	});
	// Attach greyout hider on greyout
	$('.grey-out').click(function() {
		disableGreyout();
	});
	// Attach name change on page name
	$('#code-title-text').click(function() {
		nameCodePage(prompt('Name your pet\'s routine!', ''));
	});
	// Set name of the navbar title
	$('.navbar-title').text(navbarTitle);
	// Set back button
	$('.navbar-back').click(function () {
		window.location = '/client/mockup/gamefail.html';
	});
	// Init the main code page area
	mainPage.init();
	
	// Finally, draw out the toolbox!
	raiseToolbox();
};

/*
 *	CODE FOR MANAGING CENTER CODE CONTENT STARTS HERE
 */
 
// Maintains unique element ids
var NEXT_ID = 8000;
var CODE_ELEMS = {};

// Code for the main page
var mainPage = {};
mainPage.components = [];
mainPage.init = function () {
	mainPage.beforeElement = $('#main-page-empty-slot');
};

mainPage.addComponent = function (component, beforeElement) {
	component.orderingIndex = mainPage.components.length;
	component.parent = mainPage;
	mainPage.components.push(component);
	if (beforeElement == undefined) {
		beforeElement = mainPage.beforeElement;
	}
	beforeElement.before(component.toHtml());
	if (beforeElement == mainPage.beforeElement) {
		// Force scroll to bottom
		$('.code-area').each(function () {
			var jqCodeArea = $(this);
			jqCodeArea.scrollTop(jqCodeArea[0].scrollHeight);
		});
	}
};

mainPage.removeComponent = function (component) {
	var componentIndex = mainPage.components.indexOf(component);
	if (componentIndex == -1) {
		return;
	}
	mainPage.components.splice(componentIndex, 1);
	$('#'+component.uniqueId).remove();
};

// Code to convert into a Code.js object
mainPage.convert = function () {
	var result = new Page(Page.MAIN);
	for (var i = 0; i < mainPage.components.length; i++) {
		result.components.push(mainPage.components[i].convert());
	}
	return result;
};

// Code for basic blocks
var EditorBlock = function (type) {
	this.type = type;
	this.uniqueId = 'elem'+(++NEXT_ID);
	this.orderingIndex = 0;
	this.parent = null;
	CODE_ELEMS[this.uniqueId] = this;
};
// Constants
EditorBlock.BLOCK_NAMES = ['move', 'turn-left', 'turn-right', 'pickup', 'drop'];
EditorBlock.MAP_TO_CODE_TYPE = [1, 2, 3, 4, 5];
// Converts block to splashable HTML
EditorBlock.prototype.toHtml = function () {
	return '<div id="' + this.uniqueId + '" class="basic-block-code nesting" ' + 
			'onclick="basicBlockCodeClicked(\'' + this.uniqueId + 
			'\')"><div class="icon-' + EditorBlock.BLOCK_NAMES[this.type] + 
			' action-icon in-code"></div><div class="basic-block-delete hidden" ' + 
			'onclick="basicBlockDeleteClicked(\'' + this.uniqueId + 
			'\')"></div></div>';
};

// Destruction
EditorBlock.prototype.destroy = function () {
	delete CODE_ELEMS[this.uniqueId];
};

// Code to convert into a Code.js object
EditorBlock.prototype.convert = function () {
	var result = new Block(EditorBlock.MAP_TO_CODE_TYPE[this.type]);
	return result;
};

// Code for conditions
var EditorCondition = function (type, parentPage) {
	this.type = type;
	this.uniqueId = 'elem'+(++NEXT_ID);
	this.parentPage = parentPage;
	CODE_ELEMS[this.uniqueId] = this;
};

// Condition types
EditorCondition.WALLNEAR = 0;
EditorCondition.BONENEAR = 1;
EditorCondition.CONDITION_CLASSES = [
	'wallnear', 
	'bonenear'
];
EditorCondition.MAP_TO_CODE_TYPE = [1, 3];

EditorCondition.prototype.toHtml = function () {
	return '<div id="' + this.uniqueId + '" class="condition-code ' + 
			EditorCondition.CONDITION_CLASSES[this.type] + '" ' + 
			'onclick="EditorConditionEditClicked(\'' + this.uniqueId + '\', \'' + 
			this.parentPage.uniqueId + '\'); event.stopPropagation();"></div>' + 
			'<div class="condition-and-code">+</div>';
};

// Code to convert into a Code.js object
EditorCondition.prototype.convert = function () {
	var result = new Condition(EditorCondition.MAP_TO_CODE_TYPE[this.type], 0, 0);
	return result;
};

// Destruction
EditorCondition.prototype.destroy = function () {
	delete CODE_ELEMS[this.uniqueId];
};

// Code for if/then branches
var EditorBranchPage = function () {
	this.ifComponents = [];
	this.elseComponents = [];
	this.conditions = [[]];
	this.uniqueId = 'elem'+(++NEXT_ID);
	this.orderingIndex = 0;
	this.parent = null;
	CODE_ELEMS[this.uniqueId] = this;
};

EditorBranchPage.prototype.toHtml = function () {
	return '<div id="' + this.uniqueId + '" class="branch-page-code nesting" ' +
			'><div class="branch-page-top" onclick="EditorWhilePageCodeClicked(\'' + 
			this.uniqueId + '\')"><div class="code-page-label">Do this while:' + 
			'</div></div><div class="branch-page-condition">' + 
			this.newConditionRowHtml(0) + '<div class="condition-code-add-row" ' + 
			'onclick="EditorWhilePageNewConditionRowClicked(\'' + this.uniqueId + 
			'\')">' + '</div></div><div class="branch-page-body">' + 
			'<div class="page-empty-slot nesting"></div></div>' + 
			'<div class="branch-page-mid"></div><div class="branch-page-body">' + 
			'<div class="page-empty-slot nesting"></div></div>' +
			'<div class="branch-page-bottom"></div></div>';
};

EditorBranchPage.prototype.newConditionRowHtml = function (index) {
	return '<div class="condition-code-row" ' + 
			'onclick="EditorWhilePageConditionRowClicked(\'' + this.uniqueId + 
			'\', ' + index + ')"><div class="condition-new-code" ' + 
			'onclick="EditorWhilePageNewConditionClicked(\'' + this.uniqueId + 
			'\', ' + index + '); event.stopPropagation();"></div></div>';
};

// Code to convert into a Code.js object
EditorBranchPage.prototype.convert = function () {
	var result = new Page(Page.IFTHEN);
	for (var i = 0; i < this.ifComponents.length; i++) {
		result.components.push(this.ifComponents[i].convert());
	}
	for (var i = 0; i < this.thenComponents.length; i++) {
		result.altComponents.push(this.ifComponents[i].convert());
	}
	result.condition = convertConditions(this.conditions);
	return result;
};

var convertConditions = function (conditions) {
	var innerConditions = [];
	for (var i = 0; i < conditions.length; i++) {
		var pieceConditions = [];
		if (conditions[i].length == 0) {
			continue;
		}
		for (var j = 0; j < conditions[i].length; j++) {
			var piece;
			if ((j == conditions[i].length - 1)) { 
				piece = conditions[i][j].convert();
			} else {
				piece = new Condition(Condition.AND, 0, 0);
				piece.leftInnerCond = conditions[i][j].convert();
			}
			pieceConditions.push(piece);
		}
		for (var j = 0; j < pieceConditions.length - 1; j++) {
			pieceConditions[j].rightInnerCond = pieceConditions[j+1];
		}
		var piece;
		if ((i == conditions.length - 1)) { 
			piece = pieceConditions[0];
		} else {
			piece = new Condition(Condition.OR, 0, 0);
			piece.leftInnerCond = pieceConditions[0];
		}
		innerConditions.push(piece);
	}
	for (var i = 0; i < innerConditions.length - 1; i++) {
		innerConditions[i].rightInnerCond = innerConditions[i+1];
	}
	return innerConditions[0];
};

// Code for while loops
var EditorWhilePage = function () {
	this.components = [];
	this.conditions = [[]];
	this.uniqueId = 'elem'+(++NEXT_ID);
	this.orderingIndex = 0;
	this.parent = null;
	CODE_ELEMS[this.uniqueId] = this;
};

EditorWhilePage.prototype.toHtml = function () {
	return '<div id="' + this.uniqueId + '" class="while-page-code nesting" ' +
			'><div class="while-page-top" onclick="EditorWhilePageCodeClicked(\'' + 
			this.uniqueId + '\')"><div class="code-page-label">Do this while:' + 
			'</div></div><div class="while-page-condition">' + 
			this.newConditionRowHtml(0) + '<div class="condition-code-add-row" ' + 
			'onclick="EditorWhilePageNewConditionRowClicked(\'' + this.uniqueId + 
			'\')">' + '</div></div><div class="while-page-body">' + 
			'<div class="page-empty-slot nesting"></div></div>' +
			'<div class="while-page-bottom"></div></div>';
};

EditorWhilePage.prototype.newConditionRowHtml = function (index) {
	return '<div class="condition-code-row" ' + 
			'onclick="EditorWhilePageConditionRowClicked(\'' + this.uniqueId + 
			'\', ' + index + ')"><div class="condition-new-code" ' + 
			'onclick="EditorWhilePageNewConditionClicked(\'' + this.uniqueId + 
			'\', ' + index + '); event.stopPropagation();"></div></div>';
};

EditorWhilePage.prototype.addNewConditionRow = function () {
	$('#'+this.uniqueId).find('.condition-code-add-row').before(
			'<div class="condition-or-code"> OR </div>' + 
			this.newConditionRowHtml(this.conditions.length));
	this.conditions.push([]);
};

EditorWhilePage.prototype.addNewCondition = function (condition, rowNumber) {
	$('#'+this.uniqueId).find('.condition-code-row:eq(' + rowNumber + ')').find(
			'.condition-new-code').before(condition.toHtml());
	this.conditions[rowNumber].push(condition);
};

EditorWhilePage.prototype.removeCondition = function (rowNumber, index) {
	var removedCondition = this.conditions[rowNumber][index];
	this.conditions[rowNumber].splice(index, 1);
	$('#'+this.uniqueId).find('.condition-code-row:eq(' + rowNumber + ')').find(
			'.condition-and-code:eq(' + index + ')').remove();
	$('#'+removedCondition.uniqueId).remove();
};

EditorWhilePage.prototype.removeConditionRow = function (rowNumber) {
	// Update the index count of all rows after
	for (var i = rowNumber + 1; i < this.conditions.length; i++) {
		$('#' + this.uniqueId).find('.condition-code-row:eq(' + 
				i + ')').attr('onclick', 'EditorWhilePageConditionRowClicked(\'' + 
				this.uniqueId + '\', ' + (i-1) + ')');
		$('#' + this.uniqueId).find('.condition-code-row:eq(' + 
				i + ')').find('.condition-new-code').attr('onclick', 
				'EditorWhilePageNewConditionClicked(\'' + 
				this.uniqueId + '\', ' + (i-1) + ')');
	}
	var row = this.conditions[rowNumber];
	for (var i = 0; i < row.length; i++) {
		var cond = this.conditions[rowNumber][i];
		this.removeCondition(rowNumber, i);
		cond.destroy();
	}
	this.conditions.splice(rowNumber, 1);
	if (rowNumber == 0) {
		$('#'+this.uniqueId).find('.condition-or-code:eq(' + 0 + ')').remove();
	} else {
		$('#'+this.uniqueId).find(
				'.condition-or-code:eq(' + (rowNumber - 1) + ')').remove();
	}
	$('#'+this.uniqueId).find(
			'.condition-code-row:eq(' + rowNumber + ')').remove();
};

EditorWhilePage.prototype.addComponent = function (component, beforeElement) {
	component.orderingIndex = this.components.length;
	component.parent = this;
	this.components.push(component);
	if (beforeElement == undefined) {
		if (this.beforeElement == undefined) {
			this.beforeElement = $('#' + this.uniqueId).find('.page-empty-slot');
		}
		beforeElement = this.beforeElement;
	}
	beforeElement.before(component.toHtml());
};

EditorWhilePage.prototype.removeComponent = function (component) {
	var componentIndex = this.components.indexOf(component);
	if (componentIndex == -1) {
		return;
	}
	this.components.splice(componentIndex, 1);
	$('#'+component.uniqueId).remove();
};

// Destruction
EditorWhilePage.prototype.destroy = function () {
	delete CODE_ELEMS[this.uniqueId];
	for (var i = 0; i < this.components.length; i++) {
		this.components[i].destroy();
	}
	for (var i = 0; i < this.conditions.length; i++) {
		for (var j = 0; j < this.conditions[i].length; j++) {
			this.conditions[i][j].destroy();
		}
	}
};

// Code to convert into a Code.js object
EditorWhilePage.prototype.convert = function () {
	var result = new Page(Page.WHILE);
	for (var i = 0; i < this.components.length; i++) {
		result.components.push(this.components[i].convert());
	}
	result.condition = convertConditions(this.conditions);
	return result;
};

// Code for for loops
var EditorForPage = function () {
	this.components = [];
	this.uniqueId = 'elem'+(++NEXT_ID);
	this.orderingIndex = 0;
	this.parent = null;
	this.loopCount = 1;
	CODE_ELEMS[this.uniqueId] = this;
};

EditorForPage.prototype.toHtml = function () {
	return '<div id="' + this.uniqueId + '" class="for-page-code nesting" ' +
			'><div class="for-page-top" onclick="EditorForPageCodeClicked(\'' + 
			this.uniqueId + '\')"><div class="code-page-label">Do this ' + 
			'<span class="code-page-label-count">' + this.loopCount + ' time' + 
			(this.loopCount == 1 ? '' : 's') + 
			'</span>:</div></div><div class="for-page-body">' + 
			'<div class="page-empty-slot nesting"></div></div>' +
			'<div class="for-page-bottom"></div></div>';
};

EditorForPage.prototype.addComponent = function (component, beforeElement) {
	component.orderingIndex = this.components.length;
	component.parent = this;
	this.components.push(component);
	if (beforeElement == undefined) {
		if (this.beforeElement == undefined) {
			this.beforeElement = $('#' + this.uniqueId).find('.page-empty-slot');
		}
		beforeElement = this.beforeElement;
	}
	beforeElement.before(component.toHtml());
};

EditorForPage.prototype.removeComponent = function (component) {
	var componentIndex = this.components.indexOf(component);
	if (componentIndex == -1) {
		return;
	}
	this.components.splice(componentIndex, 1);
	$('#'+component.uniqueId).remove();
};

// Destruction
EditorForPage.prototype.destroy = function () {
	delete CODE_ELEMS[this.uniqueId];
	for (var i = 0; i < this.components.length; i++) {
		this.components[i].destroy();
	}
};

// Code to convert into a Code.js object
EditorForPage.prototype.convert = function () {
	var result = new Page(Page.FOR);
	for (var i = 0; i < this.components.length; i++) {
		result.components.push(this.components[i].convert());
	}
	result.loopCount = this.loopCount;
	return result;
};


// Handlers for clicks for basic block HTML objects
var basicBlockCodeClicked = function (uniqueId) {
	var clickedBlock = $('#' + uniqueId);
	if (clickedBlock.hasClass('selected')) {
		clickedBlock.removeClass('selected');
		clickedBlock.find('.basic-block-delete').addClass('hidden');
	} else {
		$('.selected').each(function() {
			$(this).removeClass('selected');
			$(this).find('.basic-block-delete').addClass('hidden');
		});
		clickedBlock.addClass('selected');
		clickedBlock.find('.basic-block-delete').removeClass('hidden');
	}
};
var basicBlockDeleteClicked = function (uniqueId) {
	var basicBlock = CODE_ELEMS[uniqueId];
	basicBlock.parent.removeComponent(basicBlock);
	basicBlock.destroy();
};

// Handlers for clicks for 'for' page objects
var EditorForPageCodeClicked = function (uniqueId) {
	showForPagePopup(CODE_ELEMS[uniqueId]);
};

// Handlers for clicks for 'while' page objects 
var EditorWhilePageCodeClicked = function (uniqueId) {
	showWhilePagePopup(CODE_ELEMS[uniqueId]);
};

var EditorWhilePageNewConditionClicked = function (uniqueId, rowNumber) {
	showConditionPopup(CODE_ELEMS[uniqueId], rowNumber, 
			CODE_ELEMS[uniqueId].conditions[rowNumber].length);
};

var EditorWhilePageConditionRowClicked = function (uniqueId, rowNumber) {
	if (CODE_ELEMS[uniqueId].conditions.length != 1) {
		showConditionRowPopup(CODE_ELEMS[uniqueId], rowNumber);
	}
};

var EditorWhilePageNewConditionRowClicked = function (uniqueId) {
	// Check for no empty rows
	var whilePage = CODE_ELEMS[uniqueId];
	for (var i = 0; i < whilePage.conditions.length; i++) {
		if (whilePage.conditions[i].length == 0) {
			alert('You already have a row that is blank! Use that first.');
			return;
		}
	}
	whilePage.addNewConditionRow();
};

// Handlers for clicks for editing conditions
var EditorConditionEditClicked = function(conditionId, parentId) {
	var rowNumber = 0;
	var indexNumber = 0;
	for (var i = 0; i < CODE_ELEMS[parentId].conditions.length; i++) {
		if ((indexNumber = CODE_ELEMS[parentId].conditions[i].indexOf(
				CODE_ELEMS[conditionId])) != -1) {
			rowNumber = i;
			break;
		}
	}
	showConditionPopup(CODE_ELEMS[parentId], rowNumber, indexNumber);
};

/*
 *	CODE FOR MANAGING CENTER CODE CONTENT ENDS HERE
 */

// Initialize minimap image and level description
var initMinimapSummary = function(imageSrc, description) {
	$('#minimap').attr('src', imageSrc);
	$('#map-description').text(description);
}

// Touch handlers for dragging components
var PALETTE_ACTION_DIVS;
var PALETTE_PAGE_DIVS;
var PALETTE_TRICK_DIVS;

var initPaletteArrays = function () {
	PALETTE_ACTION_DIVS = [
		$('.icon-move.action-icon.palette-icon')[0],
		$('.icon-turn-left.action-icon.palette-icon')[0],
		$('.icon-turn-right.action-icon.palette-icon')[0],
		$('.icon-pickup.action-icon.palette-icon')[0],
		$('.icon-drop.action-icon.palette-icon')[0]
	];
	PALETTE_PAGE_DIVS = [
		$('.icon-ifthen.action-icon.palette-icon')[0],
		$('.icon-while.action-icon.palette-icon')[0],
		$('.icon-for.action-icon.palette-icon')[0]
	];
	// TODO: initialize trick divs
};

var handleTouchStart = function (event) {
	var target = event.target;
	var touchX = event.touches[0].pageX;
	var touchY = event.touches[0].pageY;
	// Palette check code
	checkPaletteTouchStart(target, touchX, touchY);
};

var handleTouchMove = function (event) {
	var target = event.target;
	var touchX = event.touches[0].pageX;
	var touchY = event.touches[0].pageY;
	// Palette check code
	checkPaletteTouchMove(target, touchX, touchY);
};

var handleTouchEnd = function (event) {
	var target = event.target;
	var touchX = event.changedTouches[0].pageX;
	var touchY = event.changedTouches[0].pageY;
	// Palette check code
	checkPaletteTouchEnd(target, touchX, touchY);
};

var checkPaletteTouchStart = function (target, touchX, touchY) {
	var index = PALETTE_ACTION_DIVS.indexOf(target);
	if (index != -1) {
		var originalIcon = PALETTE_ACTION_DIVS[index];
		var iconClass = originalIcon.className.split(/\s+/)[0];
		showDragIcon(iconClass, index, touchX, touchY);
		return;
	}
	index = PALETTE_PAGE_DIVS.indexOf(target);
	if (index != -1) {
		var originalIcon = PALETTE_PAGE_DIVS[index];
		var iconClass = originalIcon.className.split(/\s+/)[0];
		showDragIcon(iconClass, index + TAB_ACTION_COUNTS[0], touchX, touchY);
		return;
	}
};

var checkPaletteTouchMove = function (target, touchX, touchY) {
	if (currentIconType != null) {
		moveDragIcon(touchX, touchY);
	}
};

var checkPaletteTouchEnd = function (target, touchX, touchY) {
	if (currentIconType != null) {
		savedCIT = currentIconType;
		savedCII = currentIconIndex;
		hideDragIcon();
		target = document.elementFromPoint(touchX, touchY);
		// Dropping onto the main page
		var droppableParent = null;
		if (isDescendant(mainPage.beforeElement.get()[0], target)) {
			// Check if it is a basic action
			mainPage.addComponent(getNewComponentFromIconIndex(savedCII));
			return;
		} else if ((droppableParent = 
				findParentWithClass(target, 'basic-block-code')) != null) {
			// Resolve the proper id of target
			target = droppableParent;
			var targetName = target.id;
			CODE_ELEMS[targetName].parent.addComponent(
					getNewComponentFromIconIndex(savedCII), $(target));
			return;
		} else if (target.className.indexOf('page-empty-slot') != -1) {
			if (target.className.indexOf('page-empty-slot-if') != -1) {
				// TODO: handle if and then pages
			} else if (target.className.indexOf('page-empty-slot-else') != -1) {
				// TODO: handle if and then pages
			} else {
				// Whiles and fors are easy
				CODE_ELEMS[target.parentElement.parentElement.id].addComponent(
						getNewComponentFromIconIndex(savedCII));
			}
		} else if ((droppableParent = 
				findParentWithClass(target, 'for-page-top')) != null) {
			// In case of drag drop before a FOR page
			// Resolve the proper id of target
			target = droppableParent.parentElement;
			var targetName = target.id;
			CODE_ELEMS[targetName].parent.addComponent(
					getNewComponentFromIconIndex(savedCII), $(target));
			return;
		}
	}
};

// Helper to get the appropriate block to add
var PAGE_IFTHEN_INDEX = 0;
var PAGE_WHILE_INDEX = 1;
var PAGE_FOR_INDEX = 2;
var getNewComponentFromIconIndex = function (index) {
	if (index < TAB_ACTION_COUNTS[0]) {
		return new EditorBlock(index);
	} else if (index < TAB_ACTION_COUNTS[0] + TAB_ACTION_COUNTS[1]) {
		switch (index - TAB_ACTION_COUNTS[0]) {
			case PAGE_IFTHEN_INDEX:
				return new EditorBranchPage();
			break;
			case PAGE_WHILE_INDEX:
				return new EditorWhilePage();
			break;
			case PAGE_FOR_INDEX:
				return new EditorForPage();
			break;
		}
	}
};

// Commands for showing, moving, and hiding dragged icon
var dragIcon;
var currentIconType;
var currentIconIndex;

var showDragIcon = function (iconType, iconIndex, x, y) {
	if (dragIcon == null) {
		dragIcon = $('#drag-icon');
	}
	dragIcon.css({
		display: 'block',
		left: (x - 64) + 'px',
		top: (y - 64) + 'px'
	});
	currentIconType = iconType;
	currentIconIndex = iconIndex;
	dragIcon.addClass(iconType);
}

var moveDragIcon = function (x, y) {
	dragIcon.css({
		left: (x - 64) + 'px',
		top: (y - 64) + 'px'
	});
};

var hideDragIcon = function () {
	dragIcon.css({
		display: 'none',
		left: '-1000px',
		top: '-1000px'
	});
	dragIcon.removeClass(currentIconType);
	currentIconType = null;
	currentIconIndex = null;
}

// Function for renaming primary code page
var DEFAULT_CODE_NAME = 'Pet Routine';
var codeName = null;
var nameCodePage = function (name) {
	name = name == undefined ? '' : name.trim();
	if (name.length == 0) {
		codeName = DEFAULT_CODE_NAME;
	} else {
		codeName = name;
	}
	$('#code-title-text').text(codeName);
};

// Functions for raising and lowering toolbox
var TOOLBOX_RAISED_TOP = '812px';
var TOOLBOX_LOWERED_TOP = '1228px';
var canClickToolboxHandle = true;
var toolboxRaised = false;
var raiseToolbox = function (callback) {
	canClickToolboxHandle = false;
	$('.toolkit-body').css({
		visibility: 'visible'
	});
	$('.code-area').animate({
		height: '781px'
	});
	$('#toolkit-whole').animate({
		top: TOOLBOX_RAISED_TOP,
	}, function () {
		canClickToolboxHandle = true;
		toolboxRaised = true;
		$('#toolkit-handle-arrow').toggleClass('hz-flip');
		if (callback) {
			callback();
		}
	});
};

var lowerToolbox = function (callback) {
	canClickToolboxHandle = false;
	$('.code-area').animate({
		height: '1197px'
	});
	$('#toolkit-whole').animate({
		top: TOOLBOX_LOWERED_TOP,
	}, function () {
		$('.toolkit-body').css({
			visibility: 'hidden'
		});
		canClickToolboxHandle = true;
		toolboxRaised = false;
		$('#toolkit-handle-arrow').toggleClass('hz-flip');
		if (callback) {
			callback();
		}
	});
};

// Functions for switching tabs
var TAB_ACTION_COUNTS = [5, 3, 0];
var ITEMS_PER_VIEW = 3;
var selectedTabIndex = 0;
var leftItemIndex = 0;
var switchTabs = function (tabIndex) {
	$('.toolkit-tab:eq(' + tabIndex + ')').toggleClass('inactive');
	$('.toolkit-tab:eq(' + selectedTabIndex + ')').toggleClass('inactive');
	$('.palette:eq(' + tabIndex + ')').css({left: 0});
	leftItemIndex = 0;
	$('.palette:eq(' + tabIndex + ')').toggleClass('shown');
	$('.palette:eq(' + selectedTabIndex + ')').toggleClass('shown');
	selectedTabIndex = tabIndex;
	// For the pages tab, disable both arrow buttons
	$('#tab-content-left-arrow').addClass('hidden');
	if (TAB_ACTION_COUNTS[selectedTabIndex] <= ITEMS_PER_VIEW) {
		$('#tab-content-right-arrow').addClass('hidden');
	} else {
		$('#tab-content-right-arrow').removeClass('hidden');
	}
};

// Functions for scrolling left and right in tab content
var PALETTE_ITEM_WIDTH = 244;
var canScrollTabContents = true;
var scrollTabContentLeft = function (callback) {
	var actionCounts = TAB_ACTION_COUNTS[selectedTabIndex];
	if (!canScrollTabContents || actionCounts <= ITEMS_PER_VIEW || 
			leftItemIndex == 0) {
		return;
	}
	canScrollTabContents = false;
	$('.palette:eq(' + selectedTabIndex + ')').animate({
		left: -PALETTE_ITEM_WIDTH * (leftItemIndex - 1)
	}, function () {
		canScrollTabContents = true;
		leftItemIndex--;
		if (leftItemIndex == 0) {
			$('#tab-content-left-arrow').addClass('hidden');
		} else {
			$('#tab-content-left-arrow').removeClass('hidden');
		}
		$('#tab-content-right-arrow').removeClass('hidden');
		if (callback) {
			callback();
		}
	});
};

var scrollTabContentRight = function (callback) {
	var actionCounts = TAB_ACTION_COUNTS[selectedTabIndex];
	if (!canScrollTabContents || actionCounts <= ITEMS_PER_VIEW || 
			leftItemIndex == actionCounts - 3) {
		return;
	}
	canScrollTabContents = false;
	$('.palette:eq(' + selectedTabIndex + ')').animate({
		left: -PALETTE_ITEM_WIDTH * (leftItemIndex + 1)
	}, function () {
		canScrollTabContents = true;
		leftItemIndex++;
		if (leftItemIndex == actionCounts - 3) {
			$('#tab-content-right-arrow').addClass('hidden');
		} else {
			$('#tab-content-right-arrow').removeClass('hidden');
		}
		$('#tab-content-left-arrow').removeClass('hidden');
		if (callback) {
			callback();
		}
	});
};

/*
 * Popups section
 */
var showForPagePopup = function(editorForPage) {
	greyoutViewUndoFn = hideForPagePopup;
	enableGreyout();
	$('#for-page-popup').css({
		top: '300px',
		left: '170px',
		display: 'block'
	});
	// Bind click handlers appropriately
	$('#for-popup-count').html(editorForPage.loopCount);
	$('.for-popup-left-arrow').click(function () {
		if (editorForPage.loopCount > 1) {
			editorForPage.loopCount--;
			$('#for-popup-count').html(editorForPage.loopCount);
			$('#'+editorForPage.uniqueId).find('.code-page-label-count').html(
					editorForPage.loopCount + ' time' + 
					(editorForPage.loopCount == 1 ? '' : 's'));
		}
	});
	$('.for-popup-right-arrow').click(function () {
		if (editorForPage.loopCount < 99) {
			editorForPage.loopCount++;
			$('#for-popup-count').html(editorForPage.loopCount);
			$('#'+editorForPage.uniqueId).find('.code-page-label-count').html(
					editorForPage.loopCount + ' time' + 
					(editorForPage.loopCount == 1 ? '' : 's'));
		}
	});
	$('#for-popup-delete').click(function() {
		editorForPage.parent.removeComponent(editorForPage);
		editorForPage.destroy();
		disableGreyout();
	});
};

var hideForPagePopup = function() {
	$('.for-popup-left-arrow').off('click');
	$('.for-popup-right-arrow').off('click');
	$('#for-popup-delete').off('click');
	$('#for-page-popup').css({
		top: '-1000px',
		left: '-1000px',
		display: 'none'
	});
};

var showWhilePagePopup = function(editorWhilePage) {
	greyoutViewUndoFn = hideWhilePagePopup;
	enableGreyout();
	$('#for-page-popup').css({
		top: '300px',
		left: '170px',
		display: 'block'
	});
	$('#for-page-increment-area').css({
		display: 'none'
	});
	// Bind click handlers appropriately
	$('#for-popup-delete').click(function() {
		editorWhilePage.parent.removeComponent(editorWhilePage);
		editorWhilePage.destroy();
		disableGreyout();
	});
};

var hideWhilePagePopup = function() {
	$('#for-popup-delete').off('click');
	$('#for-page-increment-area').css({
		display: 'block'
	});
	$('#for-page-popup').css({
		top: '-1000px',
		left: '-1000px',
		display: 'none'
	});
};

var showConditionPopup = function(editorWhilePage, rowNumber, index) {
	greyoutViewUndoFn = hideConditionPopup;
	enableGreyout();
	$('#condition-popup').css({
		top: '300px',
		left: '170px',
		display: 'block'
	});
	var isNewCondition = editorWhilePage.conditions[rowNumber].length == 
			index;
	// Bind click handlers appropriately
	if (!isNewCondition) {
		$('#condition-popup-delete').css({
			display: 'block'
		});
		$('#condition-popup-delete').click(function () {
			var removedCondition = editorWhilePage.conditions[rowNumber][index];
			editorWhilePage.removeCondition(rowNumber, index);
			removedCondition.destroy();
			disableGreyout();
		});
	} else {
		$('#condition-popup-delete').css({
			display: 'none'
		});
		$('#condition-popup-wallnear').click(function () {
			var newCond = new EditorCondition(EditorCondition.WALLNEAR, 
					editorWhilePage);
			editorWhilePage.addNewCondition(newCond, rowNumber);
			disableGreyout();
		});
		$('#condition-popup-bonenear').click(function () {
			var newCond = new EditorCondition(EditorCondition.BONENEAR, 
					editorWhilePage);
			editorWhilePage.addNewCondition(newCond, rowNumber);
			disableGreyout();
		});
	}
};

var hideConditionPopup = function() {
	$('#condition-popup-wallnear').off('click');
	$('#condition-popup-bonenear').off('click');
	$('#condition-popup-delete').off('click');
	$('#condition-popup').css({
		top: '-1000px',
		left: '-1000px',
		display: 'none'
	});
};

var showConditionRowPopup = function(editorWhilePage, rowNumber) {
	greyoutViewUndoFn = hideConditionRowPopup;
	enableGreyout();
	$('#condition-popup-conditions').css({
		display: 'none'
	});
	$('#condition-popup-delete').css({
		display: 'block'
	});
	$('#condition-popup-delete').click(function () {
			editorWhilePage.removeConditionRow(rowNumber);
			disableGreyout();
		});
	$('#condition-popup').css({
		top: '300px',
		left: '170px',
		display: 'block'
	});
};

var hideConditionRowPopup = function() {
	$('#condition-popup-delete').off('click');
	$('#condition-popup-conditions').css({
		display: 'block'
	});
	$('#condition-popup-delete').css({
		display: 'block'
	});
	$('#condition-popup').css({
		top: '-1000px',
		left: '-1000px',
		display: 'none'
	});
};

// Functions to expand minimap
var canResizeMinimap = true;
var minimapExpanded = false;
var expandMinimap = function (callback) {
	if (greyedOut || !canResizeMinimap || minimapExpanded) {
		return;
	}
	// Expand the square and remove icon and title
	greyoutViewUndoFn = shrinkMinimap;
	enableGreyout();
	$('.navbar-title').animate({
		opacity: 0.0
	}, 200);
	$('.map-icon').animate({
		opacity: 0.0
	}, 200);
	$('.map-icon-outer').animate({
		width: '704px',
		height: '736px',
		left: '276px'
	}, function () {
		$('.map-summary').css({
			display:'block'
		});
		$('.map-summary').animate({
			opacity:1.0
		}, 200, function () {
			if (callback) {
				callback();
			}
		});
	});
};

var shrinkMinimap = function (callback) {
	$('.map-summary').animate({
		opacity:0.0
	}, 200, function () {
		$('.map-summary').css({
			display:'none'
		});
		$('.map-icon-outer').animate({
			width: '224px',
			height: '224px',
			left: '756px'
		}, function () {
			$('.navbar-title').animate({
				opacity: 1.0
			}, 200);
			$('.map-icon').animate({
				opacity: 1.0
			}, 200);
			if (callback) {
				callback();
			}
		});
	});
};

// Function to enable greyout of UI
var greyedOut = false;
var greyoutViewUndoFn;
var enableGreyout = function(callback) {
	greyedOut = true;
	$('.grey-out').css({
		zIndex: 1
	});
	$('.grey-out').animate({
		opacity: 0.6
	}, function () {
		if (callback) {
			callback();
		}
	});
};

var disableGreyout = function(callback) {
	if (greyoutViewUndoFn) {
		greyoutViewUndoFn();
	}
	$('.grey-out').animate({
		opacity: 0.0
	}, function () {
		greyedOut = false;
		$('.grey-out').css({
			zIndex: -1
		});
		if (callback) {
			callback();
		}
	});
};


// Helper Functions
var isDescendant = function (parent, child) {
	if (parent == child) {
		return true;
	}
	var node = child.parentNode;
	while (node != null) {
		if (node == parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
};

var findParentWithClass = function (target, className) {
	var element = target;
	while (element != null) {
		if (element.className.indexOf(className) != -1) {
			return element;
		}
		element = element.parentElement;
	}
	return null;
};