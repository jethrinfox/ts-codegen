#!/usr/bin/env node

import chalk from "chalk";
import * as fs from "fs";
import * as inquirer from "inquirer";
import * as path from "path";
import * as shell from "shelljs";
import * as template from "./utils/template";

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

export interface CliOptions {
	projectName: string;
	authorName: string;
	gitRepository: string;
	templatePath: string;
	targetPath: string;
}

const CURR_DIR = process.cwd();

inquirer.prompt(QUESTIONS).then((answers) => {
	const templatePath = path.join(
		__dirname,
		"templates",
		answers["projectChoice"]
	);
	const targetPath = path.join(CURR_DIR, answers["projectName"]);

	const options: CliOptions = {
		...answers,
		templatePath,
		targetPath,
	};

	if (!createProject(targetPath)) {
		return;
	}

	createDirectoryContents(options, answers["projectName"]);

	postProcess(options);
});

function createProject(projectPath: string) {
	if (fs.existsSync(projectPath)) {
		console.log(
			chalk.red(
				`Folder ${projectPath} exists. Delete or use another name.`
			)
		);
		return false;
	}
	fs.mkdirSync(projectPath);

	return true;
}

const SKIP_FILES = ["node_modules", ".template.json"];

function createDirectoryContents(options: CliOptions, projectName: string) {
	const { templatePath } = options;
	// read all files/folders (1 level) from template folder
	const filesToCreate = fs.readdirSync(templatePath);
	// loop each file/folder
	filesToCreate.forEach((file) => {
		const origFilePath = path.join(templatePath, file);

		// get stats about the current file
		const stats = fs.statSync(origFilePath);

		// skip files that should not be copied
		if (SKIP_FILES.indexOf(file) > -1) return;

		if (stats.isFile()) {
			// read file content and transform it using template engine
			let contents = fs.readFileSync(origFilePath, "utf8");
			contents = template.render(contents, { ...options });
			// write file to destination folder
			const writePath = path.join(CURR_DIR, projectName, file);
			fs.writeFileSync(writePath, contents, "utf8");
		} else if (stats.isDirectory()) {
			// create folder in destination folder
			fs.mkdirSync(path.join(CURR_DIR, projectName, file));
			// copy files/folder inside current folder recursively
			options.templatePath = path.join(templatePath, file);
			createDirectoryContents(options, path.join(projectName, file));
		}
	});
}

function postProcess(options: CliOptions) {
	const isNode = fs.existsSync(
		path.join(options.templatePath, "package.json")
	);
	if (isNode) {
		shell.cd(options.targetPath);
		const result = shell.exec("yarn");
		if (result.code !== 0) {
			return false;
		}
	}

	return true;
}
