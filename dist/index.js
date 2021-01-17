#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const inquirer = __importStar(require("inquirer"));
const path = __importStar(require("path"));
const shell = __importStar(require("shelljs"));
const template = __importStar(require("./utils/template"));
const CHOICES = fs.readdirSync(path.join(__dirname, "templates"));
const QUESTIONS = [
    {
        name: "projectChoice",
        type: "list",
        message: "What template would you like to use?",
        choices: CHOICES,
    },
    {
        name: "projectName",
        type: "input",
        message: "Please input a new project name:",
    },
    {
        name: "authorName",
        type: "input",
        message: "Please input if you want an author name:",
    },
    {
        name: "gitRepository",
        type: "input",
        message: "Please input if you have a git repo:",
    },
];
const CURR_DIR = process.cwd();
inquirer.prompt(QUESTIONS).then((answers) => {
    const templatePath = path.join(__dirname, "templates", answers["projectChoice"]);
    const targetPath = path.join(CURR_DIR, answers["projectName"]);
    const options = Object.assign(Object.assign({}, answers), { templatePath,
        targetPath });
    if (!createProject(targetPath)) {
        return;
    }
    createDirectoryContents(options, answers["projectName"]);
    postProcess(options);
});
function createProject(projectPath) {
    if (fs.existsSync(projectPath)) {
        console.log(chalk_1.default.red(`Folder ${projectPath} exists. Delete or use another name.`));
        return false;
    }
    fs.mkdirSync(projectPath);
    return true;
}
const SKIP_FILES = ["node_modules", ".template.json"];
function createDirectoryContents(options, projectName) {
    const { templatePath } = options;
    // read all files/folders (1 level) from template folder
    const filesToCreate = fs.readdirSync(templatePath);
    // loop each file/folder
    filesToCreate.forEach((file) => {
        const origFilePath = path.join(templatePath, file);
        // get stats about the current file
        const stats = fs.statSync(origFilePath);
        // skip files that should not be copied
        if (SKIP_FILES.indexOf(file) > -1)
            return;
        if (stats.isFile()) {
            // read file content and transform it using template engine
            let contents = fs.readFileSync(origFilePath, "utf8");
            contents = template.render(contents, Object.assign({}, options));
            // write file to destination folder
            const writePath = path.join(CURR_DIR, projectName, file);
            fs.writeFileSync(writePath, contents, "utf8");
        }
        else if (stats.isDirectory()) {
            // create folder in destination folder
            fs.mkdirSync(path.join(CURR_DIR, projectName, file));
            // copy files/folder inside current folder recursively
            options.templatePath = path.join(templatePath, file);
            createDirectoryContents(options, path.join(projectName, file));
        }
    });
}
function postProcess(options) {
    const isNode = fs.existsSync(path.join(options.templatePath, "package.json"));
    if (isNode) {
        shell.cd(options.targetPath);
        const result = shell.exec("yarn");
        if (result.code !== 0) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=index.js.map