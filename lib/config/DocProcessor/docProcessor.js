var fs = require("fs");
var path = require("path");
var program = require("commander");

var remark = require("remark");
var parse = require("remark-parse");
var stringify = require("remark-stringify");
var frontMatter = require("remark-frontmatter");


// "Aggregate" data collected over the whole file set.
var aggData = {};

var toolsFolderName = "tools";
var configFileName = "doctool.config.json";
var defaultFolder = path.resolve("..", "docs");


function initPhase(aggData) {
    toolList.forEach(toolName => {
        toolModules[toolName].initPhase(aggData);
    });
}


function readPhase(filenames, aggData) {
    for (var i = 0; i < filenames.length; i++) {
        var pathname = filenames[i];//path.resolve(srcFolder, filenames[i]);
        
        var src = fs.readFileSync(pathname);
        var tree = remark().use(frontMatter, ["yaml"]).parse(src);

        toolList.forEach(toolName => {
            toolModules[toolName].readPhase(tree, pathname, aggData);
        });
    }

    //console.log(JSON.stringify(aggData.mdFileData));
}


function aggPhase(aggData) {
    toolList.forEach(toolName => {
        toolModules[toolName].aggPhase(aggData);
    });
}


function updatePhase(filenames, aggData) {
    for (var i = 0; i < filenames.length; i++) {
        var pathname = filenames[i]; // path.resolve(srcFolder, filenames[i]);
        
        var src = fs.readFileSync(pathname);
        var tree = remark().use(frontMatter, ["yaml"]).parse(src)

        var modified = false;

        toolList.forEach(toolName => {
            modified |= toolModules[toolName].updatePhase(tree, pathname, aggData);
        });
        
        if (modified)
            fs.writeFileSync(filenames[i], remark().use(frontMatter, {type: 'yaml', fence: '---'}).data("settings", {paddedTable: false, gfm: false}).stringify(tree));
        
        //console.log(JSON.stringify(tree));
    }
}


function loadToolModules() {
    var mods = {};
    var toolsFolderPath = path.resolve(__dirname, toolsFolderName);
    var modFiles = fs.readdirSync(toolsFolderPath);

    for (var i = 0; i < modFiles.length; i++) {
        var modPath = path.resolve(toolsFolderPath, modFiles[i])

        if (path.extname(modPath) === ".js") {
            var toolName = path.basename(modPath, ".js");
            mods[toolName] = require(modPath);
        }
    }

    return mods;
}


function loadToolConfig(configFilePath) {
    var config = JSON.parse(fs.readFileSync(configFilePath));

    return config.enabledTools;
}


function getAllDocFilePaths(docFolder, files) {
    var items = fs.readdirSync(docFolder);

    for (var i = 0; i < items.length; i++) {
        var itemPath = path.resolve(docFolder, items[i]);
        var itemInfo = fs.statSync(itemPath);

        if (itemInfo.isFile()){
            files.push(itemPath);
        } else if (itemInfo.isDirectory()) {
            getAllDocFilePaths(itemPath, files);
        }
    }
}


program
.usage("[options] <source>")
.parse(process.argv);

if (program.args.length === 0) {
    console.log("Error: source argument required");
    return 0;
}


var sourcePath = path.resolve(program.args[0]);
var sourceInfo = fs.statSync(sourcePath);

/*
var destPath;
var destInfo;

if (program.args.length >= 2) {
    destPath = path.resolve(program.args[1]);
    destInfo = fs.statSync(sourcePath);
} else {
    destPath = sourcePath;
    destInfo = sourceInfo;
}

if (sourceInfo.isDirectory() && !destInfo.isDirectory()) {
    console.log("Error: The <dest> argument must be a directory");
    return 0;
}
*/

var toolModules = loadToolModules();
var toolList = loadToolConfig(path.resolve(__dirname, configFileName));


var files = [];

if (sourceInfo.isDirectory()) {
    getAllDocFilePaths(sourcePath, files);
} else if (sourceInfo.isFile()) {
    files = [ sourcePath ];
    //files = [ path.basename(sourcePath) ];
    //sourcePath = path.dirname(sourcePath);
    //destPath = path.dirname(destPath);
}

files = files.filter(filename => 
    (path.extname(filename) === ".md") &&
    (filename !== "README.md")
);

//files.forEach(element => console.log(element));

console.log("Initialising...");
initPhase(aggData);

console.log("Analysing Markdown files...");
readPhase(files, aggData);

console.log("Computing aggregate data...");
aggPhase(aggData);

console.log("Updating Markdown files...");
updatePhase(files, aggData);



