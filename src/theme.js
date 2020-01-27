const colors = require('ansicolors')

module.exports = {
  Boolean: {
    true: undefined,
    false: undefined,
    _default: colors.brightRed
  },

  Identifier: {
    undefined: colors.brightBlack,
    self: colors.brightRed,
    console: colors.magenta,
    log: colors.magenta,
    warn: colors.red,
    error: colors.brightRed,
    _default: (s, info) => {
      const prevToken = info.tokens[info.tokenIndex - 1];

      return (
        prevToken &&
        prevToken.type === 'Keyword' &&
        prevToken.value === 'const'
      )
        ? colors.magenta(s)
        : colors.white(s)
    }
  },

  Null: {
    _default: colors.brightBlack
  },

  Numeric: {
    _default: colors.white
  },

  String: {
    _default: function(s, info) {
      const nextToken = info.tokens[info.tokenIndex + 1];

      // show keys of object literals and json in different color
      return nextToken &&
      nextToken.type === "Punctuator" &&
      nextToken.value === ":"
        ? colors.green(s)
        : colors.brightGreen(s);
    }
  },

  Keyword: {
    break: undefined,

    case: undefined,
    catch: undefined,
    class: undefined,
    const: undefined,
    continue: undefined,

    debugger: undefined,
    default: undefined,
    delete: undefined,
    do: undefined,

    else: undefined,
    enum: undefined,
    export: undefined,
    extends: undefined,

    finally: undefined,
    for: undefined,
    function: undefined,

    if: undefined,
    implements: undefined,
    import: undefined,
    in: undefined,
    instanceof: undefined,
    let: undefined,
    new: undefined,
    package: undefined,
    private: undefined,
    protected: undefined,
    public: undefined,
    return: undefined,
    static: undefined,
    super: undefined,
    switch: undefined,

    this: undefined,
    throw: undefined,
    try: undefined,
    typeof: undefined,

    var: undefined,
    void: undefined,

    while: undefined,
    with: undefined,
    yield: undefined,
    _default: colors.white
  },
  Punctuator: {
    ";": undefined,
    ".": undefined,
    ",": undefined,

    "{": undefined,
    "}": undefined,
    "(": undefined,
    ")": undefined,
    "[": undefined,
    "]": undefined,

    "<": undefined,
    ">": undefined,
    "+": undefined,
    "-": undefined,
    "*": undefined,
    "%": undefined,
    "&": undefined,
    "|": undefined,
    "^": undefined,
    "!": undefined,
    "~": undefined,
    "?": undefined,
    ":": undefined,
    "=": undefined,

    "<=": undefined,
    ">=": undefined,
    "==": undefined,
    "!=": undefined,
    "++": undefined,
    "--": undefined,
    "<<": undefined,
    ">>": undefined,
    "&&": undefined,
    "||": undefined,
    "+=": undefined,
    "-=": undefined,
    "*=": undefined,
    "%=": undefined,
    "&=": undefined,
    "|=": undefined,
    "^=": undefined,
    "/=": undefined,
    "=>": undefined,
    "**": undefined,

    "===": undefined,
    "!==": undefined,
    ">>>": undefined,
    "<<=": undefined,
    ">>=": undefined,
    "...": undefined,
    "**=": undefined,

    ">>>=": undefined,

    _default: colors.white
  },

  // line comment
  Line: {
    _default: colors.brightBlack
  },

  /* block comment */
  Block: {
    _default: colors.brightBlack
  },

  // JSX
  JSXAttribute: {
    _default: colors.magenta
  },
  JSXClosingElement: {
    _default: colors.magenta
  },
  JSXElement: {
    _default: colors.magenta
  },
  JSXEmptyExpression: {
    _default: colors.magenta
  },
  JSXExpressionContainer: {
    _default: colors.magenta
  },
  JSXIdentifier: {
    className: colors.magenta,
    _default: colors.magenta
  },
  JSXMemberExpression: {
    _default: colors.magenta
  },
  JSXNamespacedName: {
    _default: colors.magenta
  },
  JSXOpeningElement: {
    _default: colors.magenta
  },
  JSXSpreadAttribute: {
    _default: colors.magenta
  },
  JSXText: {
    _default: colors.brightGreen
  },

  _default: undefined
}
