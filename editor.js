/**
 * Emmet Editor interface implementation for CodeMirror.
 * Interface is optimized for multiple cursor usage: authors
 * should run acttion multiple times and update `selectionIndex`
 * property on each iteration.
 */
import emmet from './emmet';

export var modeMap = {
	'text/html': 'html',
	'application/xml': 'xml',
	'text/xsl': 'xsl',
	'text/css': 'css',
	'text/x-less': 'less',
	'text/x-scss': 'scss',
	'text/x-sass': 'sass'
};

export default class EmmetEditor {
	constructor(ctx, selIndex=0) {
		this.context = ctx;
		this.selectionIndex = selIndex || 0;
	}

	/**
	 * Returns list of selections for current CodeMirror instance. 
	 * @return {Array}
	 */
	selectionList() {
		var cm = this.context;
		return cm.listSelections().map(function(sel) {
			var anchor = posToIndex(cm, sel.anchor);
			var head = posToIndex(cm, sel.head);

			return {
				start: Math.min(anchor, head),
				end: Math.max(anchor, head)
			};
		});
	}

	getCaretPos() {
		return this.getSelectionRange().start;
	}

	setCaretPos(pos) {
		this.createSelection(pos);
	}

	/**
	 * Returns current selection range (for current selection index)
	 * @return {Object}
	 */
	getSelectionRange() {
		return this.selectionList()[this.selectionIndex];
	}

	createSelection(start, end) {
		if (typeof end == 'undefined') {
			end = start;
		}

		var sels = this.selectionList();
		var cm = this.context;
		sels[this.selectionIndex] = {start: start, end: end};
		this.context.setSelections(sels.map(function(sel) {
			return {
				head: indexToPos(cm, sel.start),
				anchor: indexToPos(cm, sel.end)
			};
		}));
	}

	/**
	 * Returns current selection
	 * @return {String}
	 */
	getSelection() {
		var sel = this.getSelectionRange();
		sel.start = indexToPos(this.context, sel.start);
		sel.end = indexToPos(this.context, sel.end);
		return this.context.getRange(sel.start, sel.end);
	}

	getCurrentLineRange() {
		var caret = indexToPos(this.context, this.getCaretPos());
		return {
			start: posToIndex(this.context, caret.line, 0),
			end:   posToIndex(this.context, caret.line, this.context.getLine(caret.line).length)
		};
	}

	getCurrentLine() {
		var caret = indexToPos(this.context, this.getCaretPos());
		return this.context.getLine(caret.line) || '';
	}

	replaceContent(value, start, end, noIndent) {
		if (typeof end == 'undefined') {
			end = (typeof start == 'undefined') ? this.getContent().length : start;
		}
		if (typeof start == 'undefined') {
			start = 0;
		}
		
		// normalize indentation according to editor preferences
		value = this.normalize(value);

		// indent new value
		if (!noIndent) {
			value = emmet.utils.common.padString(value, emmet.utils.common.getLinePaddingFromPosition(this.getContent(), start));
		}

		// find new caret position
		var tabstopData = emmet.tabStops.extract(value, {escape: ch => ch});
		value = tabstopData.text;

		var firstTabStop = tabstopData.tabstops[0] || {start: value.length, end: value.length};
		firstTabStop.start += start;
		firstTabStop.end += start;

		this.context.replaceRange(value, indexToPos(this.context, start), indexToPos(this.context, end));
		this.createSelection(firstTabStop.start, firstTabStop.end);
	}

	/**
	 * Normalizes string indentation in given string
	 * according to editor preferences
	 * @param  {String} str
	 * @return {String}
	 */
	normalize(str) {
		var indent = '\t';
		var ctx = this.context;
		if (!ctx.getOption('indentWithTabs')) {
			indent = emmet.utils.common.repeatString(' ', ctx.getOption('indentUnit'));
		}

		return emmet.utils.editor.normalize(str, {
			indentation: indent
		});
	}

	getContent() {
		return this.context.getValue();
	}

	getSyntax() {
		var editor = this.context;
		var pos = editor.posFromIndex(this.getCaretPos());
		var mode = editor.getModeAt(editor.getCursor());
		var syntax = mode.name;
		if (syntax === 'xml' && mode.configuration) {
			syntax = mode.configuration;
		}

		return syntax || emmet.utils.action.detectSyntax(this, syntax);
	}

	/**
	 * Returns current output profile name (@see emmet#setupProfile)
	 * @return {String}
	 */
	getProfileName() {
		if (this.context.getOption('profile')) {
			return this.context.getOption('profile');
		}
		
		return emmet.utils.action.detectProfile(this);
	}

	/**
	 * Ask user to enter something
	 * @param {String} title Dialog title
	 * @return {String} Entered data
	 */
	prompt(title) {
		return prompt(title);
	}

	/**
	 * Returns current editor's file path
	 * @return {String}
	 */
	getFilePath() {
		return location.href;
	}

	/**
	 * Check if current editor syntax is valid, e.g. is supported by Emmet
	 * @return {Boolean}
	 */
	isValidSyntax() {
		return emmet.resources.hasSyntax(this.getSyntax());
	}
}

/**
 * Converts CM’s inner representation of character
 * position (line, ch) to character index in text
 * @param  {CodeMirror} cm  CodeMirror instance
 * @param  {Object}     pos Position object
 * @return {Number}
 */
function posToIndex(cm, pos) {
	if (arguments.length > 2 && typeof pos !== 'object') {
		pos = {line: arguments[1], ch: arguments[2]}
	}
	return cm.indexFromPos(pos);
}

/**
 * Converts charater index in text to CM’s internal object representation
 * @param  {CodeMirror} cm CodeMirror instance
 * @param  {Number}     ix Character index in CM document
 * @return {Object}
 */
function indexToPos(cm, ix) {
	return cm.posFromIndex(ix);
}