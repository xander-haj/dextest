# Continue Assistant Plugin

Continue Assistant brings a chat-based AI helper to Obsidian. It creates a sidebar panel where you can have a multi-turn conversation with a language model. The contents of your active note are automatically provided as context for each request and you can insert any assistant response directly into the editor.

## Features

- Dedicated sidebar view named **Continue Assistant**
- Multi-turn chat with streaming responses
- Responses can be inserted into the current note
- Configurable API key, base URL, model, max tokens and temperature

## Installation

1. Clone or download this repository.
2. Run `npm install` inside the `obsidian-continue` folder.
3. Run `npm run build` to generate `dist/main.js`.
4. Copy the entire `obsidian-continue` folder to your Obsidian plugins directory.
5. Enable **Continue Assistant** in Obsidian's community plugins settings.

## Usage

Open the sidebar using the command palette command **Open Continue Assistant**. Type your question and click **Send**. Messages from the assistant include an **Insert** button to paste the response at your cursor position in the active editor.

## Privacy

All network requests are sent directly from your machine to the configured API endpoint. No data is collected by this plugin.
