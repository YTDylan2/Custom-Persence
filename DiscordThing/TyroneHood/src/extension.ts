import { workspace, TextDocumentChangeEvent, window, debug, ExtensionContext, StatusBarAlignment, StatusBarItem, TextEditor, languages, TextDocument, DiagnosticSeverity } from "vscode";
import { Client, register, Presence } from "discord-rpc";
import imageKeys from "./imageKeys.json";

const rpcData: Presence = {};
const ClientID = "746230401269366824"
const RPC = new Client({ transport: "ipc" })
let StatusBar: StatusBarItem
let ActiveTimeout = NodeJS.Timeout
let ErrorCount: number = 0

export function Activate(content: ExtensionContext)
{
  statusBar = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  content.subscriptions.push(statusBar);
  statusBar.text = "${vm-connect)";
  statusBar.tooltip = "Connecting To The Discord Client!"
  statusbar.show()
  activateRPC()
}

function activateRPC()
{
  register(ClientID)
  rpc.login({ clientID }).catch(console.error)
  
  rpc.on("ready", () =>
    {
    statusBar.text = "${vm-active)";
    statusBar.tooltip = "Connected To Discord Client!"
    rpcData.details = "Looking For File"
    rpcData.state = workspace.name ? `in ${workspace.name}` : "Not In A Workspace"
    rpcData.smallImageKey = "active"
    rpcData.smallImageText = "Programming In VSCode!"
    rpcData.largeImageKey = "VSCode"
    rpcData.largeImageText = "Thinking About What Will They Program Today"
    rpcData.instance = true
    setRPC()
    
    activeTimeout = setInterval(() =>
      {
        if (window.state.focused) setActive(true)
        else setActive(false)
        setRPC()
    }, 1000 * 60)
    
    registerVSCodeEvents()
  })
}

function registerVSCodeEvents()
{

	workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) =>
	{

		if (e.document.fileName.endsWith(".git")) return;

		if (e.document.languageId == "scminput")
		{
			rpcData.largeImageKey = "git";
			rpcData.details = "Writing a commit message";
		}
		else
		{
			const activity: string = debug.activeDebugSession ? "Debugging" : "Editing";

			rpcData.details = `${activity} ${resolveFileName(e.document.fileName)} | ${errorCount} problem${errorCount == 1?"":"s"} found`;

			const currentLine = window.activeTextEditor.selection.active.line + 1 > e.document.lineCount ? e.document.lineCount : window.activeTextEditor.selection.active.line + 1;

			setImageByLang(e.document);

			rpcData.largeImageText = `${e.document.languageId} file, on line ${currentLine}/${e.document.lineCount}${e.document.isDirty ? ", unsaved changes" : ""}`;
		}


		setActive(true);

		setRPC();
	});
  
  	window.onDidChangeActiveTextEditor((e: TextEditor) =>
	{
		if (e)
		{
			const activity: string = debug.activeDebugSession ? "Debugging" : "Viewing";

			rpcData.details = `${activity} ${resolveFileName(e.document.fileName)} | ${errorCount} problem${errorCount == 1?"":"s"} found`;

			rpcData.state = workspace.name ? `in ${workspace.name}` : "Can't Find Workspace :(";

			setImageByLang(e.document);

			rpcData.largeImageText = `${e.document.languageId} file, ${e.document.lineCount} line${e.document.lineCount == 1 ? "" : "s"}`;

			setActive(true);

			// new file status, new timer
			rpcData.startTimestamp = new Date();

			setRPC();
		}
		else
		{
      
			const temp = rpcData.details;
			setTimeout(() =>
			{
				if (temp == rpcData.details)
				{
					rpcData.details = "No file opened";

					rpcData.largeImageKey = "vscode";

					rpcData.largeImageText = "No Programming Going On";

					rpcData.state = workspace.name ? `in ${workspace.name}` : "Can't Find Workspace :(";

					rpcData.startTimestamp = new Date();

					setRPC();
				}
			}, 500);
		}
	});
  
  	debug.onDidStartDebugSession(() =>
	{
		setActive(true);
		rpcData.details = `Debugging ${rpcData.details.split(" ").slice(1, Infinity).join(" ")}`;
		setRPC();
	});

	debug.onDidTerminateDebugSession(() =>
	{
		rpcData.details = `Viewing ${rpcData.details.split(" ").slice(1, Infinity).join(" ")}`;
		setRPC();
	});

	languages.onDidChangeDiagnostics(() =>
	{
		const diag = languages.getDiagnostics();
		let counted: number = 0;
		diag.forEach(i =>
		{
			if (i[1])
			{
				i[1].forEach(i =>
				{
					if (i.severity == DiagnosticSeverity.Warning || i.severity == DiagnosticSeverity.Error) counted++;
				});
			}
		});
		errorCount = counted;
	});
}

function setRPC()
{
	if (true) rpc.setActivity(rpcData);
}

function setActive(active: boolean)
{
	activeTimeout.refresh();
	rpcData.smallImageKey = active ? "active" : "inactive";
	rpcData.smallImageText = `${active ? "Active" : "Inactive"} in VSCode`;
}

function setImageByLang(document: TextDocument)
{
	let image = imageKeys.find(i => i.matches.includes(resolveFileName(document.fileName)));
	if (!image) image = imageKeys.find(i => i.matches.includes(resolveFileExtension(document.fileName)));
	if (!image) image = imageKeys.find(i => i.matches.includes(document.languageId));
  
	rpcData.largeImageKey = image ? image.key : "file";
}

const resolveFileName = (file: string): string | undefined => file.split(/(\/)+|(\\)+/).pop();

const resolveFileExtension = (file: string): string | undefined => file.split(".").pop();
