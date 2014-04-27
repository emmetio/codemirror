/**
 * Emmet Editor interface implementation for CodeMirror.
 * Interface is optimized for multiple cursor usage: authors
 * should run acttion multiple times and update `selectionIndex`
 * property on each iteration.
 */
define(['emmet/utils/common', 'emmet/utils/action', 'emmet/assets/resources', 'emmet/assets/tabStops'], function(utils, actionUtils, res, tabStops) {
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

	return {
		context: null,
		selectionIndex: 0,
		modeMap: {
			'text/html': 'html',
			'application/xml': 'xml',
			'text/xsl': 'xsl',
			'text/css': 'css',
			'text/x-less': 'less',
			'text/x-scss': 'scss',
			'text/x-sass': 'sass'
		},

		setupContext: function(ctx, selIndex) {
			this.context = ctx;
			this.selectionIndex = selIndex || 0;
			var indentation = '\t';
			if (!ctx.getOption('indentWithTabs')) {
				indentation = utils.repeatString(' ', ctx.getOption('indentUnit'));
			}
			
			res.setVariable('indentation', indentation);
		},

		/**
		 * Returns list of selections for current CodeMirror instance. 
		 * @return {Array}
		 */
		selectionList: function() {
			var cm = this.context;
			return cm.listSelections().map(function(sel) {
				var anchor = posToIndex(cm, sel.anchor);
				var head = posToIndex(cm, sel.head);

				return {
					start: Math.min(anchor, head),
					end: Math.max(anchor, head)
				};
			});
		},

		getCaretPos: function() {
			return this.getSelectionRange().start;
		},

		setCaretPos: function(pos) {
			this.createSelection(pos);
		},

		/**
		 * Returns current selection range (for current selection index)
		 * @return {Object}
		 */
		getSelectionRange: function() {
			return this.selectionList()[this.selectionIndex];
		},

		createSelection: function(start, end) {
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
		},

		/**
		 * Returns current selection
		 * @return {String}
		 */
		getSelection: function() {
			var sel = this.getSelectionRange();
			sel.start = indexToPos(this.context, sel.start);
			sel.end = indexToPos(this.context, sel.end);
			return this.context.getRange(sel.start, sel.end);
		},

		getCurrentLineRange: function() {
			var caret = indexToPos(this.context, this.getCaretPos());
			return {
				start: posToIndex(this.context, caret.line, 0),
				end:   posToIndex(this.context, caret.line, this.context.getLine(caret.line).length)
			};
		},

		getCurrentLine: function() {
			var caret = indexToPos(this.context, this.getCaretPos());
			return this.context.getLine(caret.line) || '';
		},

		replaceContent: function(value, start, end, noIndent) {
			if (typeof end == 'undefined') {
				end = (typeof start == 'undefined') ? this.getContent().length : start;
			}
			if (typeof start == 'undefined') {
				start = 0;
			}
			
			// indent new value
			if (!noIndent) {
				value = utils.padString(value, utils.getLinePaddingFromPosition(this.getContent(), start));
			}
			
			// find new caret position
			var tabstopData = tabStops.extract(value, {
				escape: function(ch) {
					return ch;
				}
			});
			value = tabstopData.text;

			var firstTabStop = tabstopData.tabstops[0] || {start: value.length, end: value.length};
			firstTabStop.start += start;
			firstTabStop.end += start;

			this.context.replaceRange(value, indexToPos(this.context, start), indexToPos(this.context, end));
			this.createSelection(firstTabStop.start, firstTabStop.end);
		},

		getContent: function() {
			return this.context.getValue();
		},

		getSyntax: function() {
			var syntax = this.context.getOption('mode');
			return this.modeMap[syntax] || actionUtils.detectSyntax(this, syntax);
		},

		/**
		 * Returns current output profile name (@see emmet#setupProfile)
		 * @return {String}
		 */
		getProfileName: function() {
			if (this.context.getOption('profile')) {
				return this.context.getOption('profile');
			}
			
			return actionUtils.detectProfile(this);
		},

		/**
		 * Ask user to enter something
		 * @param {String} title Dialog title
		 * @return {String} Entered data
		 */
		prompt: function(title) {
			return prompt(title);
		},

		/**
		 * Returns current editor's file path
		 * @return {String}
		 */
		getFilePath: function() {
			return location.href;
		},

		/**
		 * Check if current editor syntax is valid, e.g. is supported by Emmet
		 * @return {Boolean}
		 */
		isValidSyntax: function() {
			return res.hasSyntax(this.getSyntax());
		}
	};
});