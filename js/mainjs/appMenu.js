'use strict';

const Electron = require('electron');
const Menu = Electron.Menu;

module.exports = function(window) {
	// Template for OSX app menu commands
	// Selectors call the main app's NSApplication methods.
	var menutemplate = [
		{
			label: 'Sia',
			submenu: [
				{ label: 'About Sia', selector: 'orderFrontStandardAboutPanel:' },
				{ type: 'separator' },
				{ label: 'Hide Sia', accelerator: 'CmdOrCtrl+H', selector: 'hide:'},
				{ type: 'separator' },
				{ label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: function() { window.destroy(); }},
			]
		},
		{
			label: 'Edit',
			submenu: [
				{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
				{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
				{ type:  'separator' },
				{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
				{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
				{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
				{ label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
			]
		},
	];

	return Menu.buildFromTemplate(menutemplate);
};
