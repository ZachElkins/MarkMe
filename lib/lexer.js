class Lexer {

    constructor(_text) {
        this.text = _text;
        this.start = 0;
        this.current = 0;
        this.line = 0;
        this.tokens = [];
    }

    peek() {
        return this.text[this.current];
    }

    peekNext() {
        return this.text[this.current+1];
    }

    isAtEnd() {
        return this.current >= this.text.length;
    }

    match(c) {
        return this.peek() === c;
    }

    advance() {
        this.current++;
        return this.text[this.current-1];
    }
    
    consume(c) {
        if (!this.match(c)) return false;
        this.advance();
        return true;
    }

    extract() {
        return this.text.slice(this.start, this.current);
    }

    rollback(last) {
        this.current = last;
    }

    scanSpace() {
        // console.debug("Lexer:scanSpace");
        while (this.match('\n') || this.match(' ')) this.advance();
        const raw = this.extract()
        return makeToken(TOKEN_SPACE, raw, raw, []);
    }

    scanHeader() {
        // console.debug("Lexer:scanHeader");
        let count = 0;
        while (this.consume('#')) count++;

        if (this.consume(' ')) {
            while(!this.match('\n') && !this.isAtEnd()) this.advance();
            const raw = this.extract();
            const text = raw.replace(/^#+\s+/g, '');
            return makeToken(headerTokenType(count), raw, text, []);
        }
        return this.scanParagraph();
    }

    scanModifier(start, modifier) {
        // console.debug("Lexer:scanModifier");
        let preCount = 0;
        let postCount = 0;
        
        while (this.consume(modifier)) preCount++;
        while (!this.match(modifier) && !this.match('\n') && !this.isAtEnd()) this.advance();
        while (this.consume(modifier)) postCount++;
            
        if (preCount < 1 || postCount < 1) return false;

        /* 
        * diff = 0 | same
        * diff > 0 | more before
        * diff < 0 | more after
        */
        let diff = preCount - postCount;
        let slice = { before: 0, after: 0 }

        if (diff > 0) slice.before = diff;
        else if (diff < 0) slice.after = -diff;

        const raw = this.text.slice(
            start+slice.before,
            this.current-slice.after
        );

        const text = raw.slice(preCount-slice.before, raw.length-postCount+slice.after);
        const type = modifier === '~' ? TOKEN_STRIKE : (preCount === 1 || postCount === 1 ? TOKEN_ITAL : TOKEN_BOLD);
        return makeToken(type, raw, text, []);
    }

    scanParagraph() {
        // console.debug("Lexer:scanParagraph");
        const children = [];
        while (!(this.match('\n') && this.peekNext() == '\n') && !this.isAtEnd()) {
            const c = this.peek();
            switch (c) {
                case '*':
                case '_':
                case '~':
                    const current = this.current;
                    const child = this.scanModifier(current, c)
                    if (child) {
                        children.push(child);
                        break;
                    }
                    this.rollback(current);
                default:
                    this.advance();
            }
        }

        const raw = this.extract();
        const text = raw.replace(/\n\s{2,}/g, ' ');
        return makeToken(TOKEN_P, raw, text, children);
    }

    scanLine() {
        // console.debug("Lexer:scanLine");
        let count = 0;
        while (this.consume('-')) count++;

        if (!this.match('\n') || count < 3) {
            this.advance();
            return this.scanParagraph();
        }

        const raw = this.extract();
        return makeToken(TOKEN_HR, raw, raw, []);
    }

    scanToken() {
        // console.debug("Lexer:scanToken");
        this.start = this.current;
        const c = this.peek();
        switch (c) {
            case '\n':
            case ' ': return this.scanSpace();
            case '#': return this.scanHeader();
            case '-': return this.scanLine();
            default: return this.scanParagraph();
        }
    }

    lex() {
        // console.debug("Lexer:lex")
        while (!this.isAtEnd()) {
            this.tokens.push(this.scanToken());
        }
    }
}