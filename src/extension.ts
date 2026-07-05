import * as vscode from "vscode";
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "readme-generator",
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
          title: "Analyzing project files...",
          cancellable: false,
        },
        async (progress) => {
          try {
            const files = await vscode.workspace.fs.readDirectory(rootUri);
            const fileNames = files.map(([name]) => name).join(", ");

            let projectMetadata = "No package.json metadata available.";
            try {
              const packageJsonUri = vscode.Uri.joinPath(
                rootUri,
                "package.json",
              );
              const fileData =
                await vscode.workspace.fs.readFile(packageJsonUri);
              const packageJson = JSON.parse(
                Buffer.from(fileData).toString("utf8"),
              );

              projectMetadata = `Name: ${packageJson.name || "Unnamed"}
                        Description: ${packageJson.description || "None"}
                        Dependencies: ${Object.keys(packageJson.dependencies || {}).join(", ")}
                        DevDependencies: ${Object.keys(packageJson.devDependencies || {}).join(", ")}
                        Available Scripts: ${Object.keys(packageJson.scripts || {}).join(", ")}
                    `;
            } catch {}
            progress.report({ message: "Connecting to Language Model..." });

            const models = await vscode.lm.selectChatModels();
            if (models.length === 0) {
              throw new Error(
                "No active Language Models found. Please ensure Github Copilot is enabled.",
              );
            }
            const model = models[0];
            const prompt = `
				You are an expert technical writer.Generate a comprehensive,professional, and beautiful GitHub README.md for a repository with the following project details:
				
				Files in directory: ${fileNames}
				Project Technical Metadata:
				${projectMetadata}
				Requirements
				-Deduce the main purpose of the project from the data.
- Provide a clear project title and detailed description.
- Tailor installation instructions and execution scripts cleanly based on the package dependencies and files.
- Return ONLY the raw markdown syntax. Do not wrap the output in markdown code blocks (\`\`\`markdown).
`;
            const messages = [vscode.LanguageModelChatMessage.User(prompt)];

            const response = await model.sendRequest(
              messages,
              {},
              new vscode.CancellationTokenSource().token,
            );
            let markdownOutput = "";

            for await (const chunk of response.text) {
              markdownOutput += chunk;
            }

            progress.report({ message: "Opening generated README..." });
            const doc = await vscode.workspace.openTextDocument({
              content: markdownOutput,
              language: "markdown",
            });

            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(
              "README preview generated succesfully! Press Crtl+S/Cmd+S to save it.",
            );
          } catch (error: any) {
            vscode.window.showErrorMessage(
              "Error generating README: ${error.message || error",
            );
          }
        },
      );
    },
  );
  context.subscriptions.push(disposable);
}
export function deactivate() {}
