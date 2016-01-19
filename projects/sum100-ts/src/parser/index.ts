// 解析器实现

import {ASTNode, BinaryOpNode, ExpressionNode, NumberNode, UnaryOpNode} from '../ast';

// 词法分析器
class Lexer {
    private pos = 0;
    private tokens: Token[] = [];

    constructor(private input: string) {
    }

    tokenize(): Token[] {
        this.pos = 0;
        this.tokens = [];

        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            if (/\s/.test(char)) {
                this.pos++;
                continue;
            }

            if (/\d/.test(char)) {
                this.readNumber();
            } else if (char === '=') {
                this.tokens.push({type: 'EQUALS', value: '='});
                this.pos++;
            } else if (['+', '-', '*', '/', '%', '^'].includes(char)) {
                this.tokens.push({type: 'OPERATOR', value: char});
                this.pos++;
            } else if (char === '!') {
                this.tokens.push({type: 'FACTORIAL', value: '!'});
                this.pos++;
            } else if (char === '√') {
                this.tokens.push({type: 'SQRT', value: '√'});
                this.pos++;
            } else if (char === '(') {
                this.tokens.push({type: 'LPAREN', value: '('});
                this.pos++;
            } else if (char === ')') {
                this.tokens.push({type: 'RPAREN', value: ')'});
                this.pos++;
            } else {
                throw new Error(`Unexpected character: ${char}`);
            }
        }

        this.tokens.push({type: 'EOF', value: ''});
        return this.tokens;
    }

    private readNumber(): void {
        let num = '';
        while (this.pos < this.input.length && /\d/.test(this.input[this.pos])) {
            num += this.input[this.pos];
            this.pos++;
        }
        this.tokens.push({type: 'NUMBER', value: num});
    }
}

interface Token {
    type: 'NUMBER' | 'OPERATOR' | 'FACTORIAL' | 'SQRT' | 'LPAREN' | 'RPAREN' | 'EQUALS' | 'EOF';
    value: string;
}

// 语法分析器
export class Parser {
    private pos = 0;
    private tokens: Token[] = [];

    parse(input: string): ExpressionNode {
        const lexer = new Lexer(input);
        this.tokens = lexer.tokenize();
        this.pos = 0;

        const leftExpr = this.parseExpression();

        if (this.currentToken().type !== 'EQUALS') {
            throw new Error('Expected = sign');
        }
        this.advance();

        if (this.currentToken().type !== 'NUMBER') {
            throw new Error('Expected target number after =');
        }

        const target = parseInt(this.currentToken().value);
        this.advance();

        if (this.currentToken().type !== 'EOF') {
            throw new Error('Unexpected tokens after target number');
        }

        return new ExpressionNode(leftExpr, target);
    }

    private currentToken(): Token {
        return this.tokens[this.pos] || {type: 'EOF', value: ''};
    }

    private advance(): void {
        this.pos++;
    }

    private parseExpression(): ASTNode {
        return this.parseAddSub();
    }

    private parseAddSub(): ASTNode {
        let left = this.parseMulDiv();

        while (this.currentToken().type === 'OPERATOR' &&
        ['+', '-'].includes(this.currentToken().value)) {
            const op = this.currentToken().value as '+' | '-';
            this.advance();
            const right = this.parseMulDiv();
            left = new BinaryOpNode(left, op, right);
        }

        return left;
    }

    private parseMulDiv(): ASTNode {
        let left = this.parsePower();

        while (this.currentToken().type === 'OPERATOR' &&
        ['*', '/', '%'].includes(this.currentToken().value)) {
            const op = this.currentToken().value as '*' | '/' | '%';
            this.advance();
            const right = this.parsePower();
            left = new BinaryOpNode(left, op, right);
        }

        return left;
    }

    private parsePower(): ASTNode {
        let left = this.parseUnary();

        if (this.currentToken().type === 'OPERATOR' && this.currentToken().value === '^') {
            this.advance();
            const right = this.parsePower(); // 右结合
            left = new BinaryOpNode(left, '^', right);
        }

        return left;
    }

    private parseUnary(): ASTNode {
        if (this.currentToken().type === 'OPERATOR' && this.currentToken().value === '-') {
            this.advance();
            const operand = this.parseUnary();
            return new UnaryOpNode('-', operand);
        }

        if (this.currentToken().type === 'SQRT') {
            this.advance();
            const operand = this.parseUnary();
            return new UnaryOpNode('√', operand);
        }

        return this.parsePostfix();
    }

    private parsePostfix(): ASTNode {
        let node = this.parsePrimary();

        while (this.currentToken().type === 'FACTORIAL') {
            this.advance();
            node = new UnaryOpNode('!', node);
        }

        return node;
    }

    private parsePrimary(): ASTNode {
        if (this.currentToken().type === 'NUMBER') {
            const value = parseInt(this.currentToken().value);
            this.advance();
            return new NumberNode(value);
        }

        if (this.currentToken().type === 'LPAREN') {
            this.advance();
            const expr = this.parseExpression();
            if (this.currentToken().type !== 'RPAREN') {
                throw new Error('Expected closing parenthesis');
            }
            this.advance();
            return new ParenNode(expr);
        }

        throw new Error(`Unexpected token: ${this.currentToken().value}`);
    }
}

// 解析数字序列（用于求解器生成表达式）
export function parseNumberSequence(input: string): number[] {
    return input.trim().split(/\s+/).map(s => {
        const num = parseInt(s);
        if (isNaN(num)) {
            throw new Error(`Invalid number: ${s}`);
        }
        return num;
    });
}

// 解析完整输入（数字序列 = 目标值）
export function parseInput(input: string): { numbers: number[], target: number } {
    const parts = input.split('=');
    if (parts.length !== 2) {
        throw new Error('Input must contain exactly one = sign');
    }

    const numbers = parseNumberSequence(parts[0]);
    const target = parseInt(parts[1].trim());

    if (isNaN(target)) {
        throw new Error('Invalid target number');
    }

    return {numbers, target};
}