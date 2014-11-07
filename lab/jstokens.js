var tokens = {
    comment: {
        line: "//",
        block: "/**/"
    },
    reserved_word: {
        value: ["null", "true", "false"],
        standard: [
            "break",
            "case",
            "catch",
            "continue",
            "default",
            "delete",
            "do",
            "else",
            "for",
            "function",
            "if",
            "in",
            "instanceof",
            "new",
            "return",
            "switch",
            "this",
            "throw",
            "try",
            "typeof",
            "var",
            "with", // discouraged
            "while"
        ],
        extended: [
            "class",
            "const",
            "debugger",
            "export",
            "extends",
            "finally",
            "import",
            "let",
            "super",
            "void",

            "yield"
        ],
        "future": [
            "enum",
            "await",
            "implements",
            "package",
            "protected",
            "static",
            "interface",
            "private",
            "public",
            "abstract",
            "boolean",
            "byte",
            "char",
            "double",
            "final",
            "float",
            "goto",
            "int",
            "long",
            "native",
            "short",
            "synchronized",
            "transient",
            "volatile"
        ]
    },
    literal: {
        number: {
            binary: "0b01/0B01",
            oct: "0o01/0O1",
            dec: "+-123.456e789",
            hex: "0x01/0X01"
        },
        string: {
            dquote: "\"string\"",
            squote: "'string'",
            template: "`string ${varname}`"
        },
        regex: "/[a-z]*/i"
    },
    "undefined": "undefined",
    identifier: "_$abcdefABCDEFáÜ_123_",
    symbols: [
        "^",
        "^=",
        "~",
        "<",
        "<<",
        "<<=",
        "<=",
        "=",
        "==",
        "===",
        ">",
        ">=",
        ">>",
        ">>=",
        ">>>",
        ">>>=",
        "|",
        "|=",
        "||",
        "-",
        "-=",
        ",",
        "!",
        "!=",
        "!==",
        "/",
        "/=",
        "...",
        "(",
        ")",
        "[",
        "]",
        "{",
        "}",
        "*",
        "*=",
        "&",
        "&=",
        "&&",
        "%",
        "%=",
        "+",
        "+=",
        "--",
        "++",
        "?",
        ":",
        "."
    ]
};
