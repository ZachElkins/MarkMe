const OPTIONS = {
    autoRun: true
}

function scanText(input) {
    const lexer = new Lexer(input);
    lexer.lex();
    return lexer.tokens;
}

function compileTokens(tokens) {
    const transpiler = new Transpiler(tokens);
    transpiler.compile();
    return transpiler.html;
}

function timer(fn) {
    const startTime = performance.now();
    fn();
    return performance.now()-startTime;
}

function autoRunInput(e) {
    const checked = document.getElementById("auto-run").checked;
    OPTIONS.autoRun = checked;
    document.getElementById("submit").disabled = checked;
}

function autoRun() {
    if (OPTIONS.autoRun) run();
}

function run() {
    const input = document.getElementById("input").innerText;
    let tokens;
    let output;

    let lexTime = timer(() => tokens = scanText(input));
    let compileTime = timer(() => output = compileTokens(tokens));

    document.getElementById("lexer-output").innerText = JSON.stringify(tokens, undefined, 2);
    document.getElementById("html-output").innerHTML = output;
    document.getElementById("transpiler-output").innerText = output;
    document.getElementById("lex-time").innerHTML = lexTime;
    document.getElementById("compile-time").innerHTML = compileTime;
}

window.onload = function() {
    run();
}