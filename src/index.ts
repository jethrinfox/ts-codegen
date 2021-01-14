#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as inquirer from "inquirer";
import { CliOptions } from "./types/CliOptions";
import chalk from "chalk";
import { render } from "./utils/template";

const main = async () => {
	const CURR_DIR = process.cwd();
	const CHOICES = fs.readdirSync(path.join(__dirname, "templates"));
	const QUESTIONS = [
		{
			name: "template",
			type: "list",
			message: "What project template would you like to use?",
			choices: CHOICES,
		},
		{
			name: "name",
			type: "input",
			message: "New project name?",
		},
	];

	const answers = await inquirer.prompt(QUESTIONS);

	const projectChoice = answers["template"];
	const projectName = answers["name"];
	const templatePath = path.join(__dirname, "templates", projectChoice);
	const tartgetPath = path.join(CURR_DIR, projectName);
	const options: CliOptions = {
		projectName,
		templateName: projectChoice,
		templatePath,
		tartgetPath,
	};
	console.log(options);

	const createProject = (projectPath: string) => {
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
	};

	// list of file/folder that should not be copied
	const SKIP_FILES = ["node_modules", ".template.json"];
	const createDirectoryContents = (
		templatePath: string,
		projectName: string
	) => {
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
				contents = render(contents, { projectName });
				// write file to destination folder
				const writePath = path.join(CURR_DIR, projectName, file);
				fs.writeFileSync(writePath, contents, "utf8");
			} else if (stats.isDirectory()) {
				// create folder in destination folder
				fs.mkdirSync(path.join(CURR_DIR, projectName, file));
				// copy files/folder inside current folder recursively
				createDirectoryContents(
					path.join(templatePath, file),
					path.join(projectName, file)
				);
			}
		});
	};

	if (!createProject(tartgetPath)) {
		return;
	}

	createDirectoryContents(templatePath, projectName);
};

main();
