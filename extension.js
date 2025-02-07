// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "zlogic" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('zlogic.Run', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Começar zLogic!');

		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showErrorMessage("Editor Does Not Exist");
			return;
		}
		const programaCompleto = editor.document.getText();
		const programaLimpo = removeSeqnum(programaCompleto);
		// const ProcedureDivision = ObterProcedureDivision(programaLimpo);

		const Lista = TrataProcedureDivision(programaLimpo);

		const UML = formataUBL(Lista);

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}


function removeSeqnum(fullText) {

	let fullTextArray = fullText.split(/\r?\n|\r|\n/g);

	let resultado = [];

	for (let i = 0; i < fullTextArray.length; ++i) {


		// if (fullTextArray[i].trim().length > 6) {

		// 	if (fullTextArray[i].substring(6, 7) != '*' && fullTextArray[i].substring(7, 72).trim().length>0) {

		resultado.push(fullTextArray[i].substring(6, 72));

		// 	}
		// }
	}
	return resultado;
}

// function ObterProcedureDivision(Programa = []) {

// 	let ListaProcedures = [];
// 	let ProcedureDivision = false;

// 	for (let i = 0; i < Programa.length; i++) {
// 		if (Programa[i].contains("PROCEDURE") || Programa[i].contains("DIVISION")) {
// 			ProcedureDivision = true;
// 		}
// 		if (ProcedureDivision) {
// 			ListaProcedures.push(Programa[i]);
// 		}

// 	}
// }


function TrataProcedureDivision(Programa) {

	let Procedures = [];
	let EstaProcedureDivision = false;
	let Filhos = [];
	let Paragrafo = '';
	const fimdelinha = /\r?\n|\r|\n/g;

	for (let i = 0; i < Programa.length; i++) {

		if (Programa[i].indexOf("PROCEDURE") > 0 && Programa[i].indexOf("DIVISION") > 0) {
			EstaProcedureDivision = true;
		} else {
			if (EstaProcedureDivision) {

				const element = Programa[i];

				if (element.length > 1) {
					if (element.substring(0, 1) != '*' && element.substring(1, 2) != ' ') {

						if (Filhos.length > 0) {
							Procedures[Procedures.length - 1].AdicionarFilhos(Filhos);
							Procedures[Procedures.length-1].AdicionarParagrafo(Paragrafo);
							Filhos = [];
						}
						Procedures.push(new Procedure(element.slice(1, -1), i));
						Paragrafo = '';

					} else {
						Paragrafo += element+fimdelinha;
						if (element.indexOf('PERFORM') > 0) {
							const elementSplit = element.split(/[\s,]+/);

							Filhos.push(elementSplit[2]);
						}
					}
				}
			}
		}
	}

	// Formatar os pais

	for (let i = 0; i < Procedures.length; i++) {
		// const elemento = Procedures[i].Nome;
		let Pais = [];

		for (let j = 0; j < Procedures.length; j++) {
			const element = Procedures[j];

			if (element.Filhos.includes(Procedures[i].Nome, 0)) {
				Pais.push(element.Nome);
			}

		}
		if (Pais.length>0){
		Procedures[i].AdicionarPais(Pais);
		} else {
			Procedures[i].DefinirNivel(0);
		}
	}

	return Procedures;
}



class Procedure {

	constructor(Nome = String, Linha = 0) {

		this.Nome = Nome;
		this.Linha = Linha;
		this.Filhos = [];
		this.Pais = [];
		this.Nivel = -1;
		this.Paragrafo = '';

	}
	/**
	 *
	 */
	DefinirNivel(nivel) {
		this.Nivel = nivel;
	}

	AdicionarFilhos(filhos = []) {
		this.Filhos = filhos;
	}

	AdicionarPais(pais = []) {
		this.Pais = pais;
	}

	AdicionarParagrafo(paragrafo = '') {
		this.Paragrafo = paragrafo;
	}
}

function formataUBL(Lista = []) {


}