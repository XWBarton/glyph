import type * as Monaco from 'monaco-editor'

export const TYPST_LANGUAGE_ID = 'typst'

export function registerTypstLanguage(monaco: typeof Monaco): void {
  if (monaco.languages.getLanguages().some(l => l.id === TYPST_LANGUAGE_ID)) return

  monaco.languages.register({
    id: TYPST_LANGUAGE_ID,
    extensions: ['.typ'],
    aliases: ['Typst', 'typst']
  })

  monaco.languages.setMonarchTokensProvider(TYPST_LANGUAGE_ID, {
    defaultToken: '',
    tokenPostfix: '.typst',

    tokenizer: {
      root: [
        // Block comments
        [/\/\*/, 'comment', '@blockComment'],
        // Line comments
        [/\/\/.*$/, 'comment'],

        // Headings: = (up to 6) at start of line
        [/^={1,6}(?=\s|$)/, 'heading'],

        // Hash keywords
        [/#(let|set|show|import|include|if|else|for|while|return|break|continue|and|or|not|in|none|true|false)\b/, 'keyword'],

        // Hash functions / identifiers
        [/#[a-zA-Z_][a-zA-Z0-9_-]*/, 'function'],

        // Strings (inside code expressions)
        [/"([^"\\]|\\.)*"/, 'string'],

        // Math mode $...$
        [/\$/, 'math', '@mathInline'],

        // Raw code block ```lang ... ```
        [/```[a-z]*/, 'raw', '@rawBlock'],
        // Raw inline `...`
        [/`[^`\n]*`/, 'raw'],

        // Labels <name>
        [/<[a-zA-Z_][a-zA-Z0-9_:.-]*>/, 'label'],

        // References @name
        [/@[a-zA-Z_][a-zA-Z0-9_:.-]*/, 'reference'],

        // Numbers with optional typst units
        [/-?\d+\.?\d*(pt|em|rem|cm|mm|in|px|%|fr|deg|rad|sp)?/, 'number'],

        // Bold *...*  (greedy, same line)
        [/\*[^*\n]+\*/, 'bold'],

        // Italic _..._  (greedy, same line)
        [/_[^_\n]+_/, 'italic'],

        // List markers at line start: -, +, numbered, term /
        [/^([ \t]*)([-+\/])(?=\s)/, ['', 'list']],
        [/^([ \t]*)(\d+\.)(?=\s)/, ['', 'list']],

        // Horizontal rule ---
        [/^---$/, 'rule'],

        // Escape sequences
        [/\\[^\s]/, 'escape'],
      ],

      blockComment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment']
      ],

      mathInline: [
        [/\$/, 'math', '@pop'],
        [/[^\$\n]+/, 'math']
      ],

      rawBlock: [
        [/```/, 'raw', '@pop'],
        [/[^`]+/, 'raw']
      ]
    }
  })
}
