# Emmet plugin for CodeMirror 4

To add Emmet support for CodeMirror editor, simply add `dist/emmet.js` as a `<script>` tag into your HTML page right after CodeMirror script. This script creates global `emmetPlugin` variable but also can be loaded as Require.JS module.

Additionally, you can pass `profile` option into your into CodeMirror's init script to change Emmet’s HTML output style: 

```js
CodeMirror.fromTextArea(document.getElementById("code"), {
	mode : 'text/html',
	
	// define Emmet output profile
	profile: 'xhtml'
});
```

Available profiles are: _html_, _xhtml_, _xml_, but you can create your own output profile with 
`emmetPlugin.emmet.loadProfiles({name: options})`.

See [profile.js](https://github.com/emmetio/emmet/blob/master/lib/assets/profile.js#L30)
for a list of available options.

### Default keybindings
* `Cmd-E` or `Tab`: Expand abbreviation
* `Cmd-D`: Balance Tag (matches opening and closing tag pair)
* `Shift-Cmd-D`: Balance Tag Inward
* `Shift-Cmd-A`: Wrap With Abbreviation
* `Ctrl-Alt-Right`: Next Edit Point
* `Ctrl-Alt-Left`: Previous Edit Point
* `Cmd-L`: Select line
* `Cmd-Shift-M`: Merge Lines
* `Cmd-/`: Toggle Comment
* `Cmd-J`: Split/Join Tag
* `Cmd-K`: Remove Tag
* `Shift-Cmd-Y`: Evaluate Math Expression
* `Ctrl-Up`: Increment Number by 1
* `Ctrl-Down`: Decrement Number by 1
* `Ctrl-Alt-Up`: Increment Number by 0.1
* `Ctrl-Alt-Down`: Decrement Number by 0.1
* `Shift-Ctrl-Up`: Increment Number by 10
* `Shift-Ctrl-Down`: Decrement Number by 10
* `Shift-Cmd-.`: Select Next Item
* `Shift-Cmd-,`: Select Previous Item
* `Cmd-B`: Reflect CSS Value

### Overriding keybindings

To override default keybindings, you can call `emmetPlugin.setKeymap(keymap)` method and pass `keymap` object (see [plugin.js](./plugin.js) file for keymap object description). You can also remove default Emmet keybindings by calling `emmetPlugin.clearKeymap()` method.

## Building from source

This plugin uses [gulp.js](http://gulpjs.com) as build tool:

1. Install [Node.JS and NPM](http://nodejs.org).
2. Install gulp.js: `npm install -g gulp`
3. Clone this repo and cd to cloned dir:
4. In cloned repo run `npm install` and `gulp` to build project. The build tool will create `dist/emmet.js` and `dist/emmet.min.js` files.