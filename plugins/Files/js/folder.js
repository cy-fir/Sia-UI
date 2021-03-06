'use strict';

/*
 * folder class module:
 *   folder is an object literal that inherits from file by instantiating one
 *   and assigning more specific members on top of it. It's meant to point to
 *   files, aide file browsing, and facilitate recursive file operations.
 */

// Node modules
const siad = require('sia.js');
const mkdirp = require('mkdirp');
const fileClass = require('./file');
const fileFactory = require('./fileFactory');
const tools = require('./uiTools');

var folder = Object.assign(Object.create(fileClass), {
	type: 'folder',
	files: {},

	// The below are just function forms of the renter calls a function can
	// enact on itself, see the API.md
	// https://github.com/NebulousLabs/Sia/blob/master/doc/API.md#renter

	// Changes folder's and its files' paths with siad call
	// TODO: Verify if works
	setPath (newPath, callback) {
		if (tools.notType(newPath, 'string')) {
			return;
		}

		// Make array of each file's setPath function with its `this` variable
		// set to prevent waterfall from changing it
		var functs = this.filesArray.map(file => file.setPath.bind(file));

		// Make array of new paths per folder's file, ensuring that no name
		// starts with '/' if newPath is '' for the rootFolder
		var paths = newPath !== '' ? this.fileNames.map(name => `${newPath}/${name}`) : this.fileNames;

		// Call callback only if all operations succeed
		tools.waterfall(functs, paths, () => {
			this.path = newPath;
			callback();
		});
	},

	// Recursively delete folder and its files
	delete (callback) {
		// Make array of each file's delete function with its `this` variable
		// set to prevent waterfall from changing it
		var functs = this.filesArray.map(file => file.delete.bind(file));

		// Call callback only if all operations succeed
		tools.waterfall(functs, () => {
			// Delete parent folder's reference to this folder
			delete this.parentFolder.files[this.name];
			callback();
		});
	},

	// Download files in folder at destination with same structure
	download (destination, callback) {
		if (tools.notType(destination, 'string')) {
			return;
		}

		// Make folder at destination
		mkdirp.sync(destination);

		// Make array of each file's download function with its `this` variable
		// set to prevent waterfall from changing it
		var functs = this.filesArray.map(file => file.download.bind(file));

		// Make corresponding array of destination paths
		var names = this.fileNames.map(name => `${destination}/${name}`);

		// Call callback iff all operations succeed
		tools.waterfall(functs, names, callback);
	},

	// Share .sia files of all files in this folder and subfolders to destination
	share (destination, callback) {
		if (tools.notType(destination, 'string')) {
			return;
		} else if (destination.slice(-4) !== '.sia') {
			console.error('Share path needs end in ".sia"!', destination);
			return;
		}
		siad.apiCall({
			url: '/renter/share',
			qs: {
				siapaths: this.paths,
				destination: destination,
			},
		}, callback);
	},

	// Share ascii of all files in this folder and subfolders
	shareascii (callback) {
		siad.apiCall({
			url: '/renter/shareascii',
			qs: {
				siapaths: this.paths,
			},
		}, callback);
	},

	// Misc. functions
	// Add a file
	// TODO: Verify if works
	addFile (fileObject) {
		if (tools.notType(fileObject, 'object')) {
			return;
		}
		// TODO: verify that the fileObject belongs in this folder
		var f = fileFactory(fileObject);
		this.files[f.name] = f;
		f.parentFolder = this;
		return f;
	},

	// Add a folder, defined after folderFactory() to use it without breaking
	// strict convention
	addFolder (name) {
		if (tools.notType(name, 'string')) {
			return;
		}
		// Copy this folder and erase its state to 'create' a new folder
		// TODO: This seems like an imperfect way to add a new Folder. Can't
		// use folderFactory function down below because using the folder
		// factory again seems to return the same folder. Example:
		//   rootFolder.addFolder('foo') returns a rootFolder with a path of
		//   'foo' but all the same files, resulting in circular pointers
		//   Thus rootFolder.files === rootFolder.files.foo.files
		var f = Object.create(this);
		f.path = this.path !== '' ? `${this.path}/${name}` : name;
		f.files = {};
	
		// Link new folder to this one and vice versa
		f.parentFolder = this;
		this.files[name] = f;
		return f;
	},

	// Return if it's an empty folder
	isEmpty () {
		return this.fileNames.length === 0;
	},

	// Return if a file belongs in this folder
	contains (f) {
		var folderNames;
		// File passed in is a file object
		if (typeof f === 'object') {
			folderNames = f.folderNames;
		} else if (typeof f === 'string') {
			// File passed in is a file path
			folderNames = f.split('/');
			folderNames.pop();
		}

		// Verify
		var index = folderNames.indexOf(this.name);
		var thisFoldersNames = this.folderNames;

		// Root folder contains all
		if (this.path === '') {
			return true;
		} else {
			// Test if all of this folder's names are included in the passed in
			// file's path
			return thisFoldersNames.every(function(fName, i) {
    			return fName === folderNames[i]; 
			});		
		}
	},

	// Return the name a file would show up as in this folder. If the file
	// doesn't belong in this folder, return -1
	innerNameOf (f) {
		if (!this.contains(f)) {
			return -1;
		}

		var pathArray;
		// File passed in is a file object
		if (typeof f === 'object') {
			pathArray = f.pathArray;
		} else if (typeof f === 'string') {
			// File passed in is a file path
			pathArray = f.split('/');
		}

		var index = pathArray.indexOf(this.name);
		return pathArray[index + 1];
	}
});

// TODO: How to place a getter in the object definition without it being
// evaluated and misconstrued upon Object.assign?
function addGetter(name, getter) {
	Object.defineProperty(folder, name, {
		get: getter,
	});
}

// Return the names of the files
Object.defineProperty(folder, 'fileNames', {
	get: function() {
		return Object.keys(this.files);
	},
});

// Return the files object as an array instead
Object.defineProperty(folder, 'filesArray', {
	get: function() {
		return this.fileNames.map(name => this.files[name]);
	},
});

var typeError = 'type is neither folder nor file!';

// The below getters follow the same structure of recursively (bfs) getting
// data of all files within a folder

// Return one-dimensional array of all files in this folder
Object.defineProperty(folder, 'filesArrayDeep', {
	get: function() {
		var files = [];
		this.filesArray.forEach(file => {
			if (file.type === 'folder') {
				files = files.concat(file.filesArrayDeep);
			} else if (file.type === 'file') {
				files.push(file);
			} else {
				console.error(typeError, file);
			}
		});
		return files;
	},
});

// Calculate sum of file sizes
Object.defineProperty(folder, 'filesize', {
	get: function() {
		var sum = 0;
		this.filesArray.forEach(file => {
			sum += file.filesize;
		});
		return sum;
	},
});

// Count the number of files
Object.defineProperty(folder, 'count', {
	get: function() {
		return this.filesArrayDeep.length;
	},
});

// Return one-dimensional array of all siapaths in this folder, used primarily
// for share and shareascii
Object.defineProperty(folder, 'paths', {
	get: function() {
		return this.filesArrayDeep.map(file => file.path);
	},
});

module.exports = folder;
