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
		const ListaOrdenada = ordenaParagrafos(Lista);

		const html = formataUBL(ListaOrdenada);

		let painel;
		painel = vscode.window.createWebviewPanel('zLogic', 'zLogic', 2, {
			enableScripts: true,
			retainContextWhenHidden: true,
			enableFindWidget: true,
			enableCommandUris: true,

		});
		painel.onDidDispose(() => {
			painel.dispose();
		});
		painel.webview.html = html;


	});

	let disposable2 = vscode.commands.registerCommand('zlogic.toWhere', function () {

	});

	let disposable3 = vscode.commands.registerCommand('zlogic.fromWhere', function () {

	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
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

		resultado.push(fullTextArray[i].substring(6, 72));

	}
	return resultado;
}



function TrataProcedureDivision(Programa) {

	let Procedures = [];
	let EstaProcedureDivision = false;
	let Filhos = [];
	let Paragrafo = '';
	let saiu = false;
	const fimdelinha = '<br/>';

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
							Filhos = [];
						}
						if (Procedures.length > 0) {
							Procedures[Procedures.length - 1].AdicionarParagrafo(Paragrafo);
						}
						Procedures.push(new Procedure(element.slice(1, -1), i));
						Paragrafo = '';
						saiu = false;

					} else {
						if (element.indexOf(' EXIT') > 0 || (element.indexOf(' STOP') > 0 && element.indexOf(' RUN'))) {
							saiu = true;
						}
						if (!saiu) {
							Paragrafo += element + fimdelinha;
							if (element.indexOf('PERFORM') > 0) {
								const elementSplit = element.split(/[\s,]+/);

								if (elementSplit[2] != undefined) {
									// Evitar ficar undefined por causa de perform varying
									Filhos.push(elementSplit[2]);
								}
							}
						}
					}
				} else {
					if (Paragrafo.length > 0) {
						Paragrafo += element + fimdelinha;
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
		if (Pais.length > 0) {
			Procedures[i].AdicionarPais(Pais);
		} else {
			Procedures[i].DefinirNivel(0);
		}
	}

	// trata niveis

	let nivelTratar = 0;
	let temNivel = true;

	while (temNivel) {

		temNivel = false;

		for (let i = 0; i < Procedures.length; i++) {

			if (Procedures[i].Nivel == nivelTratar) {

				temNivel = true;

				for (let j = 0; j < Procedures[i].Filhos.length; j++) {

					for (let k = 0; k < Procedures.length; k++) {
						if (Procedures[i].Filhos[j] == Procedures[k].Nome) {
							Procedures[k].Nivel = nivelTratar + 1;
							// let caminhoTemp = [];
							// caminhoTemp.push(Procedures[i].Nome);
							Procedures[k].Caminhos.push(Procedures[i].Nome);
							for (let y = 0; y < Procedures[i].Caminhos.length; y++) {
								// caminhoTemp=caminhoTemp.concat(Procedures[i].Caminhos[y]);
								Procedures[k].Caminhos=Procedures[k].Caminhos.concat(Procedures[i].Caminhos[y]);
							}
							// Procedures[k].Caminhos.push(caminhoTemp);
							Procedures[k].Caminhos = uniq(Procedures[k].Caminhos);

						}

					}

				}

			}

		}

		++nivelTratar;

	}


	return Procedures;
}

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

class Procedure {

	constructor(Nome = String, Linha = 0) {

		this.Nome = Nome;
		this.Linha = Linha;
		this.Filhos = [];
		this.Pais = [];
		this.Nivel = -1;
		this.Paragrafo = '';
		this.Top = 0;
		this.Left = 0;
		this.width = 0;
		this.Height = 0;
		this.PontoOutX = 0;
		this.PontoOutY = 0;
		this.PontoInX = 0;
		this.PontoInY = 0;
		this.Caminhos = [];
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


	InserirCaixa(top = 0, left = 0, width = 0, height = 0) {
		this.Top = top;
		this.Left = left;
		this.width = width;
		this.Height = height;
		this.PontoOutX = left + width;
		this.PontoOutY = top + (height / 2) - 1;
		this.PontoInX = left;
		this.PontoInY = top + (height / 2);
	}

}

function ordenaParagrafos(paragrafo = []) {

	let saida = [];

	for (let i = 0; i < paragrafo.length; i++) {
		if (obterParagrafoPorNome(paragrafo[i].Nome, saida) == '') {
			saida.push(paragrafo[i]);

			if (paragrafo[i].Filhos.length > 0) {
				obterFilhos(paragrafo[i].Filhos, paragrafo);
			}
		}



	}

	function obterFilhos(filhos = [], paragrafo = []) {

		for (let j = 0; j < filhos.length; j++) {

			if (obterParagrafoPorNome(filhos[j].toString(), saida) == '') {
				const filho = obterParagrafoPorNome(filhos[j].toString(), paragrafo);
				if (filho != '') {
					saida.push(filho);

					if (filho.Filhos.length > 0) {
						obterFilhos(filho.Filhos, paragrafo);
					}
				}
			}
		}
	}

	return saida;
}


function obterParagrafoPorNome(Nome = String, Paragrafos = []) {

	for (let i = 0; i < Paragrafos.length; i++) {
		if (Paragrafos[i].Nome == Nome)
			return Paragrafos[i];
	}
	return '';
}

function formataUBL(Lista = []) {

	let Listahtml = '';
	let Linhashtml = '';
	const CaixaEspaçoTop = 50;
	const CaixaEspaço = 100;
	const CaixaWidth = 250;
	const CaixaHeight = 30;
	// const NomeFonte = vscode

	// formata caixa
	for (let i = 0; i < Lista.length; i++) {

		if (Lista[i].Paragrafo != '') {

			const CaixaTop = i * CaixaEspaçoTop;
			const CaixaLeft = Lista[i].Nivel * (CaixaWidth + CaixaEspaço);

			Lista[i].InserirCaixa(CaixaTop, CaixaLeft, CaixaWidth, CaixaHeight);

			Listahtml += `<div id="${Lista[i].Nome}" class="procedure" onclick="Seleciona('${Lista[i].Nome},${Lista[i].Caminhos}')" style="left:${CaixaLeft}px; top:${CaixaTop}px; width:${CaixaWidth}px; height:${CaixaHeight}px"><p>${Lista[i].Nome}</p><span class="tooltiptext">${Lista[i].Paragrafo}</span></div>`;

		}
	}

	// formata linhas
	for (let i = 0; i < Lista.length; i++) {
		const FilhoX = Lista[i].PontoInX;
		const FilhoY = Lista[i].PontoInY;
		for (let j = 0; j < Lista[i].Pais.length; j++) {
			const elemento = obterParagrafoPorNome(Lista[i].Pais[j], Lista);
			const PaiX = elemento.PontoOutX;
			const PaiY = elemento.PontoOutY;

			const x1 = 5;
			const x2 = FilhoX - PaiX - 1;

			let y1 = 0;
			let y2 = 0;
			let seta = '';
			let LinhaTOP = 0;
			let LinhaBOTTOM = 0;

			if (PaiY < FilhoY) {
				y1 = 1;
				y2 = FilhoY - PaiY - 1;
				LinhaTOP = PaiY;
				LinhaBOTTOM = FilhoY - PaiY + 10;
				const mx = CaixaEspaço / 2;
				seta = `M ${x1 - 1} ${y1 - 1} \\ L ${mx + 1 + 5} ${y1 - 1} \\ L ${mx + 1 + 5} ${y2 - 1} \\ L ${x2 - 5} ${y2 - 1} \\ L ${x2 - 5} ${y2 - 5} \\ L ${x2} ${y2} \\ L ${x2 - 5} ${y2 + 5} \\ L ${x2 - 5} ${y2 + 1} \\ L ${mx - 1 + 5} ${y2 + 1} \\ L ${mx - 1 + 5} ${y1 + 1} \\ L ${x1 - 1} ${y1 + 1} Z`;
			} else {
				y1 = PaiY - FilhoY + 5;
				y2 = 4;
				LinhaTOP = FilhoY - 5;
				LinhaBOTTOM = PaiY - FilhoY + 10;
				const mx = (x2 - x1) - 25;
				seta = `M ${x1 - 1} ${y1 + 1} \\ L ${mx + 1 - 5} ${y1 + 1} \\ L ${mx + 1 - 5} ${y2 + 1} \\ L ${x2 - 5} ${y2 + 1} \\ L ${x2 - 5} ${y2 + 5} \\ L ${x2} ${y2} \\ L ${x2 - 5} ${y2 - 5} \\ L ${x2 - 5} ${y2 - 1} \\ L ${mx - 1 - 5} ${y2 - 1} \\ L ${mx - 1 - 5} ${y1 - 1} \\ L ${x1 - 1} ${y1 - 1} Z`;
			}

			Linhashtml += `<div id="Linha-${Lista[i].Pais[j] + '-' + Lista[i].Nome}" class="linha" style="left:${PaiX}px; top:${LinhaTOP}px; width:${FilhoX - PaiX}px; height:${LinhaBOTTOM}px; clip-path: path('${seta}')"></div>`;
		}
	}

	let html =
		`<!DOCTYPE html>
	<html>
	<head>
		<meta charset='utf-8'>
		<meta http-equiv='X-UA-Compatible' content='IE=edge'>
		<title>Page Title</title>
		<meta name='viewport' content='width=device-width, initial-scale=1'>
		<style>
			.procedure {
			    display: block;
				position: absolute;
				text-align: center;
				border: var(--vscode-editor-inactiveSelectionBackground);
				border-style: solid;
           		border-radius: 10px;
		 		opacity: 1;
			}

			.procedure:hover {
				background-color: var(--vscode-editorInfo-foreground);
		 		opacity: 1;
		 	}

		  	.procedureactivo {
				background-color: var(--vscode-editor-inactiveSelectionBackground);
		  	}

		  	.procedureopacity, .linhaopacity {
		 		opacity: 0.1;
		  	}
			.procedure p {
				position: static;
    			top: 50%;
    			left: 50%;
    			transform: translateY(-50%);
			}

			.linha {
			  	z-index: 1;
				display: block;
				position: absolute;
				background-color: var(--vscode-editor-inactiveSelectionBackground);
			}

			.linha:hover {
			  	z-index: 2;
			  	background-color: var(--vscode-editorError-foreground);
		  	}
			.quadro {
				margin: 50px;
    			display: block;
    			position: sticky;
			}
			.procedure .tooltiptext {
            	visibility: hidden;
            	width: 500px;
            	background-color: black;
            	color: #fff;
            	text-align: left;
            	border-radius: 6px;
            	padding: 5px 0;
				font-family: var(--vscode-editor-font-family);

            	/* Position the tooltip */
            	position: absolute;
            	z-index: 5;
          	}

          	.procedure:hover .tooltiptext {
        		visibility: visible;
          	}

			span {
				white-space: pre;
			}

		</style>
		<script>
		    let caixaClicada = '';

			function DesSeleciona(ListaIdentidade) {

				console.log('DesSeleciona');
			}

			function Seleciona(ListaIdentidade) {

				const identidade = ListaIdentidade.split(',');
				const Quantidade = document.getElementsByClassName("procedureactivo").length;
				    console.log('Quantidade ' + Quantidade);

				removetodos();

				 if (Quantidade==0) {

				 	// seleciona a primeira vez e activa

				 	activa(identidade);

				} else {

					const Quantidade2 = document.getElementsByClassName("procedureopacity").length;

 					for (let i=0; i<Quantidade2;i++) {
					    console.log('indice2' + i);
						document.getElementsByClassName("procedureopacity")[0].classList.remove("procedureopacity");
			 		}

					const Quantidade3 = document.getElementsByClassName("linhaopacity").length;

 					for (let i=0; i<Quantidade3;i++) {
					    console.log('indice2' + i);
						document.getElementsByClassName("linhaopacity")[0].classList.remove("linhaopacity");
			 		}

					console.log('caixaClicada ' + caixaClicada);
					console.log('identidade[0]' + identidade[0])
					if (caixaClicada != identidade[0] || caixaClicada=='') {
						activa(identidade);
					} else {
						caixaClicada='';
					}

				}
			}

			function tornarOpacto() {

				for (let i=0; i<document.getElementsByClassName("procedure").length;i++) {
				    // Tornar todas as caixas com opacidade reduzida
					document.getElementsByClassName("procedure")[i].classList.add("procedureopacity");
			 	}

				const linhas = document.getElementsByClassName("linha");

				for (let i=0; i<linhas.length;i++) {
				    // tornar todas as linhas com opacidade reduzida
					linhas[i].classList.add("linhaopacity");
			 	}
			}

			function activa(identidade) {
				tornarOpacto();
				const linhas = document.getElementsByClassName("linha");
				for (let i=0; i<identidade.length;i++) {
					caixaClicada = document.getElementById(identidade[0]).id;
					document.getElementById(identidade[i]).classList.add("procedureactivo");
					document.getElementById(identidade[i]).classList.remove("procedureopacity");


					// 	let NumProcedures = 0;
					// for (let j=0; j<linhas.length;j++) {

					// 	console.log('opacidade linha ' + linhas[j].id);


					// 	console.log('linhas[j].id ' + linhas[j].id)
                    //     console.log('identidade['+i+'] ' +identidade[i])

					// 	if (linhas[j].id.includes(identidade[i])) {
					// 		if (NumProcedures<1) {
					// 		   ++NumProcedures;
					// 		   console.log('NumProcedures ' + NumProcedures)
					// 		} else {
					// 			linhas[j].classList.remove("linhaopacity");
					// 		}
					// 	}
					// }
				}
				for (let i=0; i<linhas.length;i++) {

					let NumProcedures = 0;

					for (let j=0; j<identidade.length; j++ ) {

						if (linhas[i].id.includes(identidade[j])) {
							++NumProcedures;
							if (NumProcedures>1) {
								linhas[i].classList.remove("linhaopacity");
							}
						}
					}
  				}
			}
			function removetodos() {
				    console.log('Remove  todos');

				const Quantidade = document.getElementsByClassName("procedureactivo").length;

 				for (let i=0; i<Quantidade;i++) {
				    console.log('indice' + i);
					document.getElementsByClassName("procedureactivo")[0].classList.remove("procedureactivo");
			 	}

			}
		</script>
	</head>
	<body>
		<div class="quadro">
		${Listahtml}
		${Linhashtml}
		</div>
	</body>
	</html>`
		;
	return html;
}