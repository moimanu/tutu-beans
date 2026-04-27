# 🫘 Tutu Beans

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**Tutu Beans** is a high-performance **Obsidian** plugin designed to automate the article publishing lifecycle. It allows designers and developers to send local notes to a custom backend, automatically managing metadata via frontmatter and handling attachments (images) natively.

---

## 🚀 Key Features

* **Automated Metadata Management:** Automatic injection of UUIDs, authors, and publication timestamps directly into the note's frontmatter.
* **Image Synchronization:** Automatically converts Obsidian embeds to Base64 for API transmission.
* **Global Sync Dashboard:** Dedicated interface to identify "remote-only" notes (on the server but not local), local-only notes, and synchronized notes.
* **Security:** Support for Bearer Tokens with field masking in the settings interface.
* **Local-First:** Prioritizes local data sovereignty, utilizing the Obsidian API for secure Vault manipulation.

---

## 📖 Usage

1.  **Setup:** Go to `Settings` > `Tutu Beans` and configure your API endpoints and Bearer Token.
2.  **Target Folder:** Define a **Watched Folder**. The plugin will only initialize properties for notes created or moved inside this specific folder.
3.  **Manage:** * Click the **Bean Icon** in the leaf header of any active note to open the Action Modal (Publish/Update/Delete).
    * Use the **Ribbon Icon (Sprout)** on the left sidebar to open the **Global Sync Dashboard**.
4.  **Commands:** You can also trigger the sync panel via the Command Palette (`Ctrl/Cmd + P` -> *Tutu Beans: Open Global Synchronization Panel*).

---

## 📑 Frontmatter Metadata

The plugin automatically manages the following properties in your notes:

| Property | Description |
| :--- | :--- |
| `tutu-uuid` | Unique identifier generated on file creation/move. |
| `tutu-author` | Author name defined in settings. |
| `tutu-published-at` | ISO timestamp of the last successful synchronization. |
| `tutu-art-resume` | A short summary or excerpt of the article. |

> Automatic Tag Extraction: The plugin automatically identifies native Obsidian tags (both from the YAML tags: field and from the body text using #) and converts them into categories for your backend, eliminating the need for a manual property.

---

## 🛡️ Security and Privacy

> [!CAUTION]
> **Important Notice:** Configuration data (including Bearer Tokens and Endpoints) are stored by Obsidian in the `data.json` file within the plugin folder.
> 
> * **Do not version this file:** Ensure that your `.obsidian/` folder (or specifically this plugin's `data.json`) is included in your `.gitignore`.
> * **Beware of Public Clouds:** Avoid syncing sensitive configurations on cloud services that lack end-to-end encryption if device access is shared.

---

## 🛠️ Request Structure (JSON)

### 1. Publish/Update Article (POST)
**Endpoint:** `endpoint`  
```json
{
  "metadata": {
    "uuid": "string (UUID v4)",
    "author": "string",
    "category": "tag1, tag2, tag3", 
    "resume": "string",
    "title": "string",
    "subtitle": "string"
  },
  "content": "string (Markdown content without frontmatter)",
  "attachments": [
    {
      "name": "image.png",
      "extension": "png",
      "data": "iVBORw0KGgoAAAANSUhEUgA..." 
    }
  ]
}
```

### 2. Check Status (GET)
**Endpoint:** `endpointStatus?uuid={uuid}`  
```json
{
  "published": true,
  "lastUpdate": "2026-04-25T22:36:11Z"
}
```

### 3. Delete Article (DELETE)
**Endpoint:** `endpointDelete`  
```json
{
  "uuid": "string (UUID v4)"
}
```

### 4. Global Listing (GET)
**Endpoint:** `endpointList`  
```json
{
  "notes": [
    {
      "uuid": "string",
      "title": "string",
      "updated_at": "string (optional)"
    }
  ]
}
```

> The plugin enforces HTTPS for all external connections to ensure data security, allowing HTTP only for loopback addresses (localhost/127.0.0.1) for local development and testing purposes.

---

## 📂 Project Structure

```text
src/
├── core/           # Type interfaces and payload builders
├── infrastructure/ # API Client (Obsidian requestUrl)
├── services/       # Business logic (Vault I/O and Article lifecycle)
├── ui/             # Modals and UI components
├── main.ts         # Entry point and event registration
└── settings.ts     # Plugin settings tab and configuration logic
```

---

## ⚙️ Development Setup

### Environment Configuration (.env)
```bash
# Path to your plugin folder in your Obsidian test Vault
OBSIDIAN_VAULT_PATH="/Users/your-user/Documents/Vault/.obsidian/plugins/tutu-beans"
```

### Commands
1. **Install:** `npm install`
2. **Dev Mode:** `npm run dev`
3. **Build:** `npm run build`

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

**Author:** Moisés Emanuel  
**Version:** 1.0.0