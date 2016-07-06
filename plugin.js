/**
 * Emmet plugin for CodeMirror
 */
import EmmetEditor from './editor';
import emmet from './emmet';

const actionBreak = {};

// actions that should be performed in single selection mode
const singleSelectionActions = [
	'prev_edit_point', 'next_edit_point', 'merge_lines',
	'reflect_css_value', 'select_next_item', 'select_previous_item',
	'wrap_with_abbreviation', 'update_tag', 'insert_formatted_line_break_only'
];

export const defaultKeymap = {
	'Cmd-E': 'emmet.expand_abbreviation',
	'Tab': 'emmet.expand_abbreviation_with_tab',
	'Cmd-D': 'emmet.balance_outward',
	'Shift-Cmd-D': 'emmet.balance_inward',
	'Cmd-M': 'emmet.matching_pair',
	'Shift-Cmd-A': 'emmet.wrap_with_abbreviation',
	'Ctrl-Alt-Right': 'emmet.next_edit_point',
	'Ctrl-Alt-Left': 'emmet.prev_edit_point',
	'Cmd-L': 'emmet.select_line',
	'Cmd-Shift-M': 'emmet.merge_lines',
	'Cmd-/': 'emmet.toggle_comment',
	'Cmd-J': 'emmet.split_join_tag',
	'Cmd-K': 'emmet.remove_tag',
	'Shift-Cmd-Y': 'emmet.evaluate_math_expression',

	'Ctrl-Up': 'emmet.increment_number_by_1',
	'Ctrl-Down': 'emmet.decrement_number_by_1',
	'Ctrl-Alt-Up': 'emmet.increment_number_by_01',
	'Ctrl-Alt-Down': 'emmet.decrement_number_by_01',
	'Shift-Ctrl-Up': 'emmet.increment_number_by_10',
	'Shift-Ctrl-Down': 'emmet.decrement_number_by_10',

	'Shift-Cmd-.': 'emmet.select_next_item',
	'Shift-Cmd-,': 'emmet.select_previous_item',
	'Cmd-B': 'emmet.reflect_css_value',

	'Enter': 'emmet.insert_formatted_line_break_only'
};

/**
 * Setup Emmet on given CodeMirror editor instance
 * @param  {CodeMirror} cm
 * @param  {Object} keymap
 * @return {CodeMirror}
 */
export default function(cm, keymap=defaultKeymap) {
	keymap = systemKeymap(keymap);
	cm.__emmetKeymap = keymap;
	cm.addKeyMap(keymap);
	return cm;
}

/**
 * Removes Emmet bindings from given CodeMirror editor instance
 * @param  {CodeMirror} cm
 * @return {CodeMirror}
 */
export function dispose(cm) {
	if (cm.__emmetKeymap) {
		cm.removeKeyMap(cm.__emmetKeymap);
		delete cm.__emmetKeymap;
	}
    return cm;
};

export function systemKeymap(keymap) {
	var mac = /Mac/.test(navigator.platform);
	var out = {};
	Object.keys(keymap).forEach(key => out[!mac ? key.replace('Cmd', 'Ctrl') : key] = keymap[key]);
	return out;
}

/**
 * Initial setup of CodeMirror class. Should be called only once to register
 * Emmet actions
 * @param  {CodeMirror} CodeMirror
 */
export function setup(CodeMirror) {
    // setup default Emmet actions
	emmet.actions.getList().forEach(obj => {
		var action = obj.name;
		var command = `emmet.${action}`;

		if (!CodeMirror.commands[command]) {
            CodeMirror.commands[command] = (cm) => {
                let result = singleSelectionActions.indexOf(action) !== -1
                    ? runForSingleCursor(action, cm)
                    : runForMultipleCursors(action, cm);

                if (result === actionBreak) {
                    if (CodeMirror.version >= '3.1') {
                		return CodeMirror.Pass;
                	}

                	throw CodeMirror.Pass;
                }

                return result;
            }
		}
	});

	// add “profile” property to CodeMirror defaults so in won’t be lost
	// then CM instance is instantiated with “profile” property
	if (CodeMirror.defineOption) {
		CodeMirror.defineOption('profile', 'html');
	} else {
		CodeMirror.defaults.profile = 'html';
	}
};

// automatically setup CodeMirror for Emmet
if (typeof window !== 'undefined' && window.CodeMirror) {
	setup(window.CodeMirror);
}

/**
 * Runs Emmet action for a single cursor
 * @param {String} name Action name
 * @param {CodeMirror} cm CodeMirror editor instance
 */
function runForSingleCursor(name, cm) {
    var result;
    cm.operation(() => result = runAction(name, new EmmetEditor(cm)));
    return result;
};

/**
 * Runs given Emmet action for all cursors in editor
 * @param {String} name Action name
 * @param {CodeMirror} cm CodeMirror editor instance
 */
function runForMultipleCursors(name, cm) {
    var editor = new EmmetEditor(cm);
    var selections = editor.selectionList();
    var result = null;
    cm.operation(() => {
        for (var i = 0, il = selections.length; i < il; i++) {
            editor.selectionIndex = i;
            result = runAction(name, editor);
            if (result === actionBreak) {
                break;
            }
        }
    });
    return result;
}

/**
 * Runs Emmet action
 * @param  {String}      name Action name
 * @param  {EmmetEditor} editor EmmetEditor instance
 * @return {Boolean}    Returns `true` if action is performed successfully
 */
function runAction(name, editor) {
    if (name == 'expand_abbreviation_with_tab' && (editor.context.somethingSelected() || !editor.isValidSyntax())) {
        // pass through Tab key handler if there's a selection
        return actionBreak;
    }

    var result = false;
    try {
        result = emmet.run(name, editor);
        if (!result && name == 'insert_formatted_line_break_only') {
            return actionBreak;
        }
    } catch (e) {
        console.error(e);
    }

    return result;
}
