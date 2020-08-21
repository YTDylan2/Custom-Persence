import { workspace, TextDocumentChangeEvent, window, debug, ExtensionContext, StatusBarAlignment, StatusBarItem, TextEditor, languages, TextDocument, DiagnosticSeverity } from "vscode";
import { Client, register, Presence } from "discord-rpc";
import imageKeys from "./imageKeys.json";