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

    jump() {
        this.start = this.current;
    }

    scanSpace() {
        // console.debug("Lexer:scanSpace");
        while (this.match('\n') || this.match(' ')) this.advance();
        const raw = this.extract()
        return makeToken(TOKEN_SPACE, raw, raw, [], {});
    }

    scanHeader() {
        // console.debug("Lexer:scanHeader");
        let count = 0;
        while (this.consume('#')) count++;
        const children = [];
        if (this.consume(' ')) {
            while(!this.match('\n') && !this.isAtEnd()) {
                const child = this.scanChildren();
                if (child) {
                    children.push(child);
                } else {
                    this.advance();
                }
            }
            const raw = this.extract();
            const text = raw.replace(/^#+\s+/g, '');
            return makeToken(headerTokenType(count), raw, text, children, {});
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

        let raw = this.text.slice(
            start+slice.before,
            this.current-slice.after
        );

        const text = raw.slice(preCount-slice.before, raw.length-postCount+slice.after);
        const type = modifier === '~' ? TOKEN_STRIKE : (preCount === 1 || postCount === 1 ? TOKEN_ITAL : TOKEN_BOLD);

        if (type !== TOKEN_ITAL && (preCount > 2 || postCount > 2)) {
            const textIndex = raw.indexOf(text);
            raw = raw.slice(textIndex - 2, textIndex+text.length + 2);
            if (postCount > 2) this.rollback(2);
        }

        return makeToken(type, raw, text, [], {});
    }

    scanAnchor() {
        // console.debug("Lexer:scanAnchor");
        // Consume ']' char that triggered `scanAnchor`
        const children = [];
        this.advance();
        const textStart = this.current;
        while (!this.match(']') && !this.match('\n') && !this.isAtEnd()) {
            const child = this.scanChildren();
            if (child) {
                children.push(child);
            } else {
                this.advance();
            }
        }
        const textEnd = this.current;
        if (!this.consume(']')) return false;
        if (!this.consume('(')) return false;
        const hrefStart = this.current;
        while (!this.match(')') && !this.match('\n') && !this.isAtEnd()) this.advance();
        const hrefEnd = this.current;
        if (!this.consume(')')) return false;


        const raw = this.text.slice(textStart-1, this.current);
        const text = this.text.slice(textStart, textEnd);
        const href = this.text.slice(hrefStart, hrefEnd);
        return makeToken(TOKEN_LINK, raw, text, children, {href: href});
    }

    scanParagraph() {
        // console.debug("Lexer:scanParagraph");
        const children = [];
        while (!(this.match('\n') && this.peekNext() == '\n') && !this.isAtEnd()) {
            const child = this.scanChildren();
            if (child) {
                children.push(child);
            } else {
                this.advance();
            }
        }

        const raw = this.extract();
        const text = raw.replace(/\n\s{2,}/g, ' ');
        return makeToken(TOKEN_P, raw, text, children, {});
    }

    scanChildren() {
        const c = this.peek();
        switch (c) {
            case '[': {
                const current = this.current;
                const child = this.scanAnchor();
                if (child) return child;
                this.rollback(current);
                break;
            }
            case '*':
            case '_':
            case '~': {
                const current = this.current;
                const child = this.scanModifier(current, c)
                if (child) return child;
                this.rollback(current);
                break;
            }
        }
        return false;
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
        return makeToken(TOKEN_HR, raw, raw, [], {});
    }

    scanListItem() {
        if (!(this.match('-') && this.peekNext() === ' ')) return false;

        const children = [];
        while(!this.match('\n') && !this.match('\n') && !this.isAtEnd()) {
            const child = this.scanChildren();
            if (child) {
                children.push(child);
            } else {
                this.advance();
            }
        }
        const raw = this.extract();
        const text = raw.slice(2, raw.length);
        this.consume('\n');
        this.jump();
        return makeToken(TOKEN_LI, raw, text, children, {});
    }

    scanUnorderedList() {
        const children = [];
        const start = this.start;
        let li;
        do {
            li = this.scanListItem();
            if (li) children.push(li);
        } while (li);

        const raw = this.text.slice(start, this.current);
        return makeToken(TOKEN_UL, raw, raw, children, {});
    }

    scanToken() {
        // console.debug("Lexer:scanToken");
        this.start = this.current;
        const c = this.peek();
        switch (c) {
            case '\n':
            case ' ': return this.scanSpace();
            case '#': return this.scanHeader();
            case '-': {
                const n = this.peekNext();
                switch (n) {
                    case ' ': return this.scanUnorderedList();
                    case '-': return this.scanLine();
                }
            }
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