import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as clipboardy from "clipboardy";
import * as opn from "open";
import { Diff2Html } from "@nullcc/diff2html";

import * as http from "./http-utils";
import * as log from "./logger";
import { Configuration, InputType, DiffyType } from "./types";
import * as utils from "./utils";

function runGitDiff(gitArgsArr: string[], ignore: string[]): string {
  const baseArgs = gitArgsArr.length > 0 ? gitArgsArr.map((arg) => `"${arg}"`) : ["-M", "-C", "HEAD"];
  const colorArgs = gitArgsArr.indexOf("--no-color") < 0 ? ["--no-color"] : [];
  const ignoreArgs = ignore.map((file) => `":(exclude)${file}"`);

  const diffCommand = `git diff ${baseArgs.join(" ")} ${colorArgs.join(" ")} ${ignoreArgs.join(" ")}`;

  return utils.execute(diffCommand);
}

function prepareHTML(diffHTMLContent: string, config: Configuration): string {
  const template = utils.readFile(config.htmlWrapperTemplate);

  const diff2htmlPath = path.join(path.dirname(require.resolve("@nullcc/diff2html")), "..");

  const cssFilePath = path.resolve(diff2htmlPath, "dist", "diff2html.min.css");
  const cssContent = utils.readFile(cssFilePath);

  const jsUiFilePath = path.resolve(diff2htmlPath, "dist", "diff2html-ui.min.js");
  const jsUiContent = utils.readFile(jsUiFilePath);

  return template
    .replace("<!--diff2html-css-->", `<style>\n${cssContent}\n</style>`)
    .replace("<!--diff2html-js-ui-->", `<script>\n${jsUiContent}\n</script>`)
    .replace("//diff2html-fileListCloseable", `diff2htmlUi.fileListCloseable("#diff", ${config.showFilesOpen});`)
    .replace("//diff2html-synchronisedScroll", `diff2htmlUi.synchronisedScroll("#diff", ${config.synchronisedScroll});`)
    .replace("<!--diff2html-diff-->", diffHTMLContent);
}

/**
 * Get unified diff input from type
 * @param inputType - a string `file`, `stdin`, or `command`
 * @param inputArgs - a string array
 * @param ignore    - a string array
 */
export async function getInput(inputType: InputType, inputArgs: string[], ignore: string[]): Promise<string> {
  switch (inputType) {
    case "file":
      return utils.readFile(inputArgs[0]);

    case "stdin":
      return utils.readStdin();

    default:
      return runGitDiff(inputArgs, ignore);
  }
}

export function getOutput(options: Diff2Html.Options, config: Configuration, input: string, coverage: any, coverageFilePatterns: string[][]): string {
  if (config.htmlWrapperTemplate && !fs.existsSync(config.htmlWrapperTemplate)) {
    throw new Error(`Template ('${config.htmlWrapperTemplate}') not found!`);
  }

  const diffJson = Diff2Html.getJsonFromDiff(input, options);

  if (config.formatType === "html") {
    const htmlContent = Diff2Html.getPrettyHtml(diffJson, { ...options, inputFormat: "json" }, coverage, coverageFilePatterns);
    return prepareHTML(htmlContent, config);
  } else if (config.formatType === "json") {
    return JSON.stringify(diffJson);
  }

  throw new Error(`Wrong output format '${config.formatType}'!`);
}

export function preview(content: string, format: string): void {
  const filename = `diff.${format}`;
  const filePath: string = path.resolve(os.tmpdir(), filename);
  utils.writeFile(filePath, content);
  opn(filePath, { wait: false });
}

export async function postToDiffy(diff: string, diffyOutput: DiffyType): Promise<string> {
  const response = await http.put<{ id: string }>("https://diffy.org/api/diff/", { diff: diff });

  const url = `https://diffy.org/diff/${response.id}`;

  log.print("Link powered by https://diffy.org");
  log.print(url);

  if (diffyOutput === "browser") {
    opn(url);
  } else if (diffyOutput === "pbcopy") {
    clipboardy.writeSync(url);
  }

  return url;
}
