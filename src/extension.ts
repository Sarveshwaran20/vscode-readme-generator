import * as vscode from "vscode";
import { TextDecoder } from "util";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "readme-generator.generate",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          "Please open a project workspace first.",
        );
        return;
      }

      const rootUri = workspaceFolders[0].uri;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Analyzing project code...",
          cancellable: false,
        },
        async (progress) => {
          try {
            let projectMetadata = "No package.json metadata available.";
            try {
              const packageJsonUri = vscode.Uri.joinPath(
                rootUri,
                "package.json",
              );
              const packageData =
                await vscode.workspace.fs.readFile(packageJsonUri);
              projectMetadata = new TextDecoder().decode(packageData);
            } catch (e) {}

            const files = await vscode.workspace.fs.readDirectory(rootUri);
            let codeContext = "";
            const allowedExtensions = [
              ".html",
              ".css",
              ".js",
              ".ts",
              ".json",
              ".md",
            ];

            for (const [name, type] of files) {
              if (
                type === vscode.FileType.File &&
                allowedExtensions.some((ext) => name.endsWith(ext)) &&
                name !== "package-lock.json"
              ) {
                try {
                  const fileUri = vscode.Uri.joinPath(rootUri, name);
                  const fileData = await vscode.workspace.fs.readFile(fileUri);
                  const fileContent = new TextDecoder().decode(fileData);
                  codeContext += `\n\n--- File: ${name} ---\n${fileContent.substring(0, 2000)}`;
                } catch (error) {}
              }
            }

            const MAX_LENGTH = 12000;
            if (codeContext.length > MAX_LENGTH) {
              codeContext =
                codeContext.substring(0, MAX_LENGTH) +
                "\n\n... [TRUNCATED due to size limits] ...";
            }

            const systemPrompt = `You are an expert developer and technical writer. Your task is to analyze the provided code and write a professional README.md for the project.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THIS EXACT STRUCTURE IN ORDER:

1. Title + One-sentence description: The project name as an H1, followed by exactly one sentence describing what it is to a human who has never heard of it. Do not describe the internal tech stack here.
2. Hero Image Placeholder: Add a markdown image tag here (e.g., ![Hero Image](docs/screenshot.png)).
3. Try It Link Placeholder: Add a bold link pointing to a live demo placeholder.
4. Quick Start: Provide the absolute fastest way to start using this (e.g., the install command or import statement based on the code). Keep it under 3 commands.
5. Features: A scannable bulleted list of 3 to 7 specific things the project actually does based on the code context. No marketing fluff.
6. How to run it locally: Step-by-step instructions for local development. Infer the run commands (like npm run dev) from the package.json file. Mention any obvious dependencies.
7. How it works: 1 to 2 paragraphs explaining the interesting technical choices, architecture, or libraries used, based strictly on the provided code context.
8. Credits / Acknowledgements: A simple header with a placeholder for the author to thank people or list asset packs.

Do NOT include conversational filler like "Here is the README you requested". Output ONLY the raw Markdown content.`;

            const userPrompt = `
Here is the package.json data:
${projectMetadata}

Here is the code context from the main files:
${codeContext}`;

            const models = await vscode.lm.selectChatModels({
              vendor: "copilot",
            });

            if (models.length === 0) {
              vscode.window.showErrorMessage(
                "No AI models found. Please make sure GitHub Copilot is installed and active.",
              );
              return;
            }

            const model = models[0];

            const messages = [
              vscode.LanguageModelChatMessage.User(systemPrompt),
              vscode.LanguageModelChatMessage.User(userPrompt),
            ];

            const chatResponse = await model.sendRequest(
              messages,
              {},
              new vscode.CancellationTokenSource().token,
            );

            let generatedReadme = "";
            for await (const fragment of chatResponse.text) {
              generatedReadme += fragment;
            }

            const document = await vscode.workspace.openTextDocument({
              content: generatedReadme,
              language: "markdown",
            });

            await vscode.window.showTextDocument(document);
          } catch (error) {
            vscode.window.showErrorMessage(
              "An error occurred while analyzing the project files.",
            );
            console.error(error);
          }
        },
      );
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
