function singleton(tag) {
    return `<${tag}/>`
}

function open(tag) {
    return `<${tag}>`
}

function close(tag) {
    return `</${tag}>`
}

function wrap(text, tag) {
    return `${open(tag)}${text}${close(tag)}`
}

class Transpiler {

    constructor(_tokens) {
        this.current = 0;
        this.tokens = _tokens;
        this.html = "";
    }

    peekLast() {
        return this.tokens[this.current-1];
    }

    peek() {
        return this.tokens[this.current];
    }

    advance() {
        this.current++;
        return this.tokens[this.current-1];
    }

    isAtEnd() {
        return this.current >= this.tokens.length
    }

    compileParagraph() {
        // console.debug("Transpiler:compileParagh");
        const token = this.peekLast();
        const children = token.children;
        let replacements = [];
        const childTranspiler = new Transpiler(children);
        while (!childTranspiler.isAtEnd()) {
            const raw = childTranspiler.peek().raw;
            const child = childTranspiler.compileToken();
            replacements.push({
                from: raw,
                to: child
            })
        }
        let text = token.text;
        for (let replace of replacements) {
            text = text.replace(replace.from, replace.to)
        }
        return wrap(text, TOKEN_P)
        // return wrap(this.peekLast().text, TOKEN_P)
    }

    compileStrong() {
        // console.debug("Transpiler:compileStrong");
        return wrap(this.peekLast().text, TOKEN_BOLD)
    }

    compileItalic() {
        // console.debug("Transpiler:compileItalics");
        return wrap(this.peekLast().text, TOKEN_ITAL)
    }

    compileStrikethrough() {
        // console.debug("Transpiler:compileIStrikeThrough");
        return wrap(this.peekLast().text, TOKEN_STRIKE)
    }

    compilerHeader() {
        // console.debug("Transpiler::compilerHeader");
        const headerType = this.peekLast().type;
        return wrap(this.peekLast().text, headerType)
    }

    compileToken() {
        const token = this.advance();
        // const token = this.peek();
        switch (token.type) {
            case TOKEN_P: return this.compileParagraph();
            case TOKEN_BOLD: return this.compileStrong();
            case TOKEN_ITAL: return this.compileItalic();
            case TOKEN_STRIKE: return this.compileStrikethrough();
            case TOKEN_H1:
            case TOKEN_H2:
            case TOKEN_H3:
            case TOKEN_H4: return this.compilerHeader();
            case TOKEN_HR: return singleton(TOKEN_HR);
            default: return '\n';
        }
    }

    compile() {
        this.html = "";
        while (!this.isAtEnd()) {
            this.html += this.compileToken();
        }
        return this.html;
    }
}