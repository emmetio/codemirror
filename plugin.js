/**
 * Emmet plugin for CodeMirror
 */
define(['./editor', 'emmet/emmet'], function(editor, emmet) {
	var mac = /Mac/.test(navigator.platform);
	var defaultKeymap = {
		'Cmd-E': 'expand_abbreviation',
		'Tab': 'expand_abbreviation_with_tab',
		'Cmd-D': 'balance_outward',
		'Shift-Cmd-D': 'balance_inward',
		'Cmd-M': 'matching_pair',
		'Shift-Cmd-A': 'wrap_with_abbreviation',
		'Ctrl-Alt-Right': 'next_edit_point',
		'Ctrl-Alt-Left': 'prev_edit_point',
		'Cmd-L': 'select_line',
		'Cmd-Shift-M': 'merge_lines',
		'Cmd-/': 'toggle_comment',
		'Cmd-J': 'split_join_tag',
		'Cmd-K': 'remove_tag',
		'Shift-Cmd-Y': 'evaluate_math_expression',

		'Ctrl-Up': 'increment_number_by_1',
		'Ctrl-Down': 'decrement_number_by_1',
		'Ctrl-Alt-Up': 'increment_number_by_01',
		'Ctrl-Alt-Down': 'decrement_number_by_01',
		'Shift-Ctrl-Up': 'increment_number_by_10',
		'Shift-Ctrl-Down': 'decrement_number_by_10',

		'Shift-Cmd-.': 'select_next_item',
		'Shift-Cmd-,': 'select_previous_item',
		'Cmd-B': 'reflect_css_value',
		
		'Enter': 'insert_formatted_line_break_only'
	};

	// actions that should be performed in single selection mode
	var singleSelectionActions = [
		'prev_edit_point', 'next_edit_point', 'merge_lines',
		'reflect_css_value', 'select_next_item', 'select_previous_item',
		'wrap_with_abbreviation', 'update_tag', 'insert_formatted_line_break_only'
	];

	// add “profile” property to CodeMirror defaults so in won’t be lost
	// then CM instance is instantiated with “profile” property
	if (CodeMirror.defineOption) {
		CodeMirror.defineOption('profile', 'html');
	} else {
		CodeMirror.defaults.profile = 'html';
	}

	function noop() {
		if (CodeMirror.version >= '3.1') {
			return CodeMirror.Pass;
		}
		
		throw CodeMirror.Pass;
	}

	/**
	 * Emmet action decorator: creates a command function
	 * for CodeMirror and executes Emmet action as single
	 * undo command
	 * @param  {String} name Action name
	 * @return {Function}
	 */
	function actionDecorator(name) {
		return function(cm) {
			editor.setupContext(cm);
			var result;
			cm.operation(function() {
				result = runAction(name, cm);
			});
			return result;
		};
	}

	/**
	 * Same as `actionDecorator()` but executes action
	 * with multiple selections
	 * @param  {String} name Action name
	 * @return {Function}
	 */
	function multiSelectionActionDecorator(name) {
		return function(cm) {
			editor.setupContext(cm);
			var selections = editor.selectionList();
			var result = null;
			cm.operation(function() {
				for (var i = 0, il = selections.length; i < il; i++) {
					editor.selectionIndex = i;
					result = runAction(name, cm);
					if (result === CodeMirror.Pass) {
						break;
					}
				}
			});
			return result;
		};
	}

	/**
	 * Runs Emmet action
	 * @param  {String}     name Action name
	 * @param  {CodeMirror} cm CodeMirror instance
	 * @return {Boolean}    Returns `true` if action is performed
	 * successfully
	 */
	function runAction(name, cm) {
		if (name == 'expand_abbreviation_with_tab' && (cm.somethingSelected() || !editor.isValidSyntax())) {
			// pass through Tab key handler if there's a selection
			return noop();
		}
		
		var result = false;
		try {
			result = emmet.run(name, editor);
			if (!result && name == 'insert_formatted_line_break_only') {
				return noop();
			}
		} catch (e) {}

		return result;
	}

	function systemKeybinding(key) {
		return !mac ? key.replace('Cmd', 'Ctrl') : key;
	}

	/**
	 * Adds given `key` as keybinding for Emmet `action`
	 * @param {String} key    Keyboard shortcut
	 * @param {String} action Emmet action name
	 */
	function addKeybinding(key, action) {
		key = systemKeybinding(key);
		CodeMirror.keyMap['default'][key] = 'emmet.' + action;
	}

	// add actions and default keybindings
	Object.keys(defaultKeymap).forEach(function(key) {
		var action = defaultKeymap[key];
		var cmCommand = 'emmet.' + action;
		if (!CodeMirror.commands[cmCommand]) {
			CodeMirror.commands[cmCommand] = ~singleSelectionActions.indexOf(action)
				? actionDecorator(action)
				: multiSelectionActionDecorator(action);
		}

		addKeybinding(key, action);
	});

	return {
		emmet: emmet,
		editor: editor,
		/**
		 * Adds new keybindings for Emmet action. The expected format
		 * of `keymap` object is the same as default `keymap`.
		 * @param {Object} keymap
		 */
		setKeymap: function(keymap) {
			Object.keys(keymap).forEach(function(key) {
				addKeybinding(key, keymap[key]);
			});
		},

		/**
		 * Clears all Emmet keybindings
		 */
		clearKeymap: function() {
			var cmMap = CodeMirror.keyMap['default'];
			var reEmmetAction = /^emmet\./;
			Object.keys(cmMap).forEach(function(p) {
				if (reEmmetAction.test(cmMap[p])) {
					delete cmMap[p];
				}
			});
		},

		addKeybinding: addKeybinding,

		/**
		 * Removes given keybinding or any keybinging bound to
		 * given action name
		 * @param  {String} name Either keybinding or Emmet action name
		 */
		removeKeybinding: function(name) {
			name = systemKeybinding(name);
			var cmMap = CodeMirror.keyMap['default'];
			if (name in cmMap) {
				delete cmMap[name];
			} else {
				name = 'emmet.' + name;
				Object.keys(cmMap).forEach(function(p) {
					if (cmMap[p] === name) {
						delete cmMap[p];
					}
				});
			}
		}
	};
});