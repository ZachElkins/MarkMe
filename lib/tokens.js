TOKEN_H1 = "h1";
TOKEN_H2 = "h2";
TOKEN_H3 = "h3";
TOKEN_H4 = "h4";
TOKEN_P = "p";
TOKEN_BOLD = "b";
TOKEN_ITAL = "i";
TOKEN_STRIKE = "s"
TOKEN_TEXT = "text";
TOKEN_SPACE = "space";
TOKEN_HR = "hr";

function makeToken(tokenType, rawText, tokenText, childTokens) {
    // console.log(`Making token ${tokenType} with text '${tokenText}' ('${rawText}')`);
    return {
        type: tokenType,
        raw: rawText,
        text: tokenText,
        children: childTokens
    }
}

function headerTokenType(count) {
    switch (count) {
        case 1: return TOKEN_H1
        case 2: return TOKEN_H2
        case 3: return TOKEN_H3
        default: return TOKEN_H4
    }
}