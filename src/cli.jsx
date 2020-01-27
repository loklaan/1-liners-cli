'use strict';

const React = require('react');
const { render, useInput, useApp, Box, Text, Color } = require('ink');
const TextInput = require('ink-text-input').default;
const cardinal = require('cardinal');
const theme = require('./theme');
const Services = require('./services');
const { Tokens } = require('./consts');

const KeyboardEvents = ({ up, down, enter }) => {
  useInput((input, key) => {
    if (key.downArrow) down();
    if (key.upArrow) up();
    if (key.return) enter();
  })

  return null;
}

const Exit = () => {
  const { exit } = useApp();
  setTimeout(exit, 10);
  return null;
}

const Gutter = ({ height, symbol, row, symbolProps }) => (
  <Box flexDirection="column" marginRight={1} marginLeft={1}>
    {' '.repeat(height).split('').map((x, i) => {
      return i === row
        ? <Color key={i + 'h'} {...symbolProps}>{symbol}</Color>
        : ' '
    })}
  </Box>
)

const FnList = ({ width, list, row }) => (
  <Box flexDirection="column" width={width}>
    {list.map((name, i) => (
      <Color key={name} dim={i !== row} underline={i === row}>
        {name.includes(Tokens.BEFORE) && name.includes(Tokens.AFTER)
          ? Services.highlightedTextToElements(name)
          : name
        }
      </Color>
    ))
    }
  </Box>
)

class App extends React.Component {
  constructor () {
    super();

    const updateCodePreview = (name) => {
      Services.fetchOneLinerCode(name).then(code => {
        const currentName = (this.state.fnQuery
            ? this.state.fnNamesFiltered
            : this.state.fnNames
        )[this.state.fnCursor];

        if (name === currentName) {
          this.setState({ fnCode: code })
        }
      })
    }

    const getFnName = (state, cursor) => (state.fnQuery
      ? state.fnNamesFiltered
      : state.fnNames
    )[cursor]

    this.state = {
      fnNameCopied: '',
      fnQuery: '',
      fnCursor: 0,
      fnLimit: 10,
      fnCode: '',
      fnNameLengthMax: 0,
      fnNames: [],
      fnNamesFiltered: [],
    }

    Services.fetchOneLinerNames()
      .then(names => {
        const maxNameLength = names.reduce((max, n) => {
          return n.length > max ? n.length : max
        }, 0)
        this.setState({ fnNames: names, fnNameLengthMax: maxNameLength })
        updateCodePreview(names[0]);
      })

    this.handleFnQuery = q => {
      const names = Services.fuzzyFilterList(q, this.state.fnNames)

      this.setState({
        fnQuery: q,
        fnNamesFiltered: names,
        fnCursor: 0,
        fnCode: ''
      });
      updateCodePreview(names[0])
    };

    this.handleNavDown = () => {
      const limit = (this.state.fnQuery
        ? this.state.fnNamesFiltered.length
        : this.state.fnNames.length) - 1;

      let fnCursor = this.state.fnCursor + 1;
      if (fnCursor > limit) {
        fnCursor = 0;
      }

      if (fnCursor !== this.state.fnCursor) {
        this.setState({ fnCursor })
        updateCodePreview(getFnName(this.state, fnCursor))
      }
    }

    this.handleNavUp = () => {
      const limit = 0;

      let fnCursor = this.state.fnCursor - 1;
      if (fnCursor < limit) {
        fnCursor = (this.state.fnQuery
          ? this.state.fnNamesFiltered.length
          : this.state.fnNames.length) - 1;
      }

      if (fnCursor !== this.state.fnCursor) {
        this.setState({ fnCursor })
        updateCodePreview(getFnName(this.state, fnCursor))
      }
    }

    this.handleEnter = () => {
      const clip = require('clipboardy');
      clip.writeSync(this.state.fnCode);
      this.setState({
        fnNameCopied: getFnName(
          this.state,
          this.state.fnCursor
        )
      });
    }
  }

  render () {
    const hasResults = this.state.fnQuery
      ? this.state.fnNamesFiltered.length > 0
      : true;

    return (
      <Box flexDirection="column">
        <KeyboardEvents
          down={this.handleNavDown}
          up={this.handleNavUp}
          enter={this.handleEnter}
        />

        <Box>
          <Box marginRight={1}>
            <Text><Color bold>?</Color> Choose a one liner function to copy <Color dim>‣</Color></Text>
          </Box>

          <TextInput
            value={this.state.fnQuery}
            onChange={this.handleFnQuery}
          />
        </Box>

        {!this.state.fnNameCopied && (
          !hasResults
            ? this.renderNoResults()
            : this.renderQueriedCode()
        )}
        {this.state.fnNameCopied && (
          this.renderCopiedCode()
        )}
        {this.state.fnNameCopied && (
          <Box marginTop={1} marginLeft={2}>
            <Text>Copied "<Color underline>{this.state.fnNameCopied}</Color>" to clipboard.</Text>
          </Box>
        )}

        {this.state.fnNameCopied && <Exit />}
      </Box>
    )
  }

  renderNoResults () {
    return (
      <Box marginTop={1} marginLeft={2}>
        <Color green>No matches for "<Color bold underline>{this.state.fnQuery}</Color>" - sorry!</Color>
      </Box>
    );
  }

  renderCopiedCode () {
    let code = cardinal.highlight(this.state.fnCode, {theme});

    return this.renderBottom({
      code,
      height: this.state.fnLimit,
      listWidth: this.state.fnNameLengthMax,
      list: (this.state.fnQuery
        ? this.state.fnNamesFiltered
        : this.state.fnNames)
        .slice(
          this.state.fnCursor > this.state.fnLimit - 1
            ? this.state.fnCursor - (this.state.fnLimit - 1)
            : 0,
          this.state.fnCursor > this.state.fnLimit - 1
            ? this.state.fnLimit + (this.state.fnCursor - (this.state.fnLimit - 1))
            : this.state.fnLimit
        ),
      row: this.state.fnCursor > this.state.fnLimit - 1
        ? this.state.fnLimit - 1
        : this.state.fnCursor,
      symbol: "✓",
      symbolProps: { bold: true, green: true }
    })
  }

  renderQueriedCode () {
    let code;
    try {
      code = this.state.fnCode && cardinal.highlight(this.state.fnCode, {theme});
    } catch (e) {
      if (typeof this.state.fnCode === 'string') {
        code = this.state.fnCode
      }
    }

    return this.renderBottom({
      code,
      height: this.state.fnLimit,
      listWidth: this.state.fnNameLengthMax,
      list: (this.state.fnQuery
        ? this.state.fnNamesFiltered
        : this.state.fnNames)
        .slice(
          this.state.fnCursor > this.state.fnLimit - 1
            ? this.state.fnCursor - (this.state.fnLimit - 1)
            : 0,
          this.state.fnCursor > this.state.fnLimit - 1
            ? this.state.fnLimit + (this.state.fnCursor - (this.state.fnLimit - 1))
            : this.state.fnLimit
        ),
      row: this.state.fnCursor > this.state.fnLimit - 1
        ? this.state.fnLimit - 1
        : this.state.fnCursor,
      symbol: "λ",
      symbolProps: { magentaBright: true }
    })
  }

  renderBottom ({ listWidth, height, list, row, symbol, symbolProps, code }) {
    return (
      <Box marginTop={1}>
        <Gutter
          height={height}
          row={row}
          symbol={symbol}
          symbolProps={symbolProps}
        />

        <FnList
          list={list}
          width={listWidth}
          row={row}
        />

        <Box flexDirection="column" alignItems="center" justifyContent="center">
          <Box marginLeft={2}>
            {!code ? null : <Text>{code}</Text>}
          </Box>
        </Box>
      </Box>
    )
  }
}

async function start () {
  render(<App />)
}

start().catch(err => {
  console.error(err);
});
