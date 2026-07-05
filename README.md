# AI README Generator

An automated utility for Visual Studio Code that instantly analyzes your active workspace project and writes a professional, comprehensive GitHub `README.md` using native AI infrastructure. No custom API keys or paid tiers required.
#:octocat:THE EXTENSION IS UNDER THE NAME:AI BASED README GENERATOR Version 0.0.6

###  [INSTALL THE EXTENSION](https://marketplace.visualstudio.com/items?itemName=SarveshwaranKrishnan.ai-readme-creator-SARV)

## Features

- **Zero-Configuration AI:** Taps directly into your local or configured VS Code Language Model API (such as GitHub Copilot) out of the box.
- **Workspace Analysis:** Smart scanning of top-level directory names and deep context fetching through `package.json` configurations (detecting project names, descriptions, dependencies, and automated run scripts).
- **Live Review Stream:** Generates the documentation directly inside an unsaved in-memory Markdown editor, letting you preview, edit, and tweak the results before committing files to disk.
- **Progress Reports:** Uses integration loaders to notify you exactly what step of the workspace evaluation the system is executing.

## Requirements

To run this extension seamlessly, you need an active Language Model provider mapped inside your VS Code client environment:

- **Recommended:** [GitHub Copilot Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) active and logged into your editor environment.

## Usage

1. Open any project workspace folder in VS Code.
2. Launch the Command Palette using **`Ctrl+Shift+P`** (Windows/Linux) or **`Cmd+Shift+P`** (macOS).
3. Type and select: **`AI: Generate README.md`**.
4. Wait for the loading sequence to process. An unsaved workspace document window will populate with your custom structured Markdown content.
5. Press **`Ctrl+S`** or **`Cmd+S`** to save the generated file directly to your project root.

## Known Issues

- **Large Projects:** Highly nested workspaces with thousands of source elements may hit prompt context truncation windows. The extension focuses on parsing structural files (`package.json`) to safely mitigate this limitation.

## Release Notes

### 1.0.0

- Initial release.
- Automated project context mapping via `package.json`.
- Native VS Code Language Model implementation.
