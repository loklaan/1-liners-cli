"use strict";

const React = require("react");
const { render, useInput, useApp, measureElement, Box, Text } = require("ink");
const TextInput = require("ink-text-input").default;
const cardinal = require("cardinal");
const theme = require("./theme");
const Services = require("./services");
const { Tokens } = require("./consts");

const prefetchedNames = Promise.all([
  Services.fetchOneLinerNames(),
  // Min-loading time, to avoid jank
  new Promise((resolve) => setTimeout(resolve, 500)),
]).then(([names]) => names);

const getFnName = (state, cursor) =>
  (state.fnQuery ? state.fnNamesFiltered : state.fnNames)[cursor];

const KeyboardEvents = ({ up, down, enter }) => {
  useInput((input, key) => {
    if (key.downArrow) down();
    if (key.upArrow) up();
    if (key.return) enter();
  });

  return null;
};

const Exit = () => {
  const { exit } = useApp();
  setTimeout(exit, 10);
  return null;
};

const ListCursor = ({ height, symbol, row, symbolProps, ...props }) => (
  <Box {...props} flexDirection="column" marginRight={1} marginLeft={1}>
    {" "
      .repeat(height)
      .split("")
      .map((x, i) => {
        return (
          <Text key={i + "h"} {...symbolProps}>
            {i === row ? symbol : " "}
          </Text>
        );
      })}
  </Box>
);

const ListOfFunctions = ({ width, list, row, ...props }) => (
  <Box {...props} flexDirection="column" width={width}>
    {list.map((name, i) => (
      <Text key={name} dim={i !== row} underline={i === row}>
        {name.includes(Tokens.BEFORE) && name.includes(Tokens.AFTER)
          ? Services.highlightedTextToElements(name)
          : name}
      </Text>
    ))}
  </Box>
);

const CodeGutter = ({ rows }) => {
  const rowsArr = " ".repeat(rows).split("");
  return (
    <Box flexDirection="column">
      {rowsArr.map((_, i) => {
        return (
          <Box key={i} justifyContent="space-between">
            <Text color="grey">
              {i !== 0 && i !== rowsArr.length - 1 && "│"}

              {i === 0 && "┌"}
              {i === rowsArr.length - 1 && "└"}
            </Text>
            <Box justifyContent="flex-end">
              <Text color="grey">
                {i !== 0 && i !== rowsArr.length - 1 && i}
                {i === 0 && "┌"}
                {i > 0 && i < rowsArr.length - 1 && "│"}
                {i === rowsArr.length - 1 && "└"}
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const CodePanel = ({
  listWidth,
  height,
  list,
  row,
  symbol,
  symbolProps,
  code,
}) => {
  const linesOfCode = code.split("\n");
  const linesOfCodeCount =
    list.length > linesOfCode.length ? list.length : linesOfCode.length;

  return (
    <Box>
      <>
        <ListCursor
          marginTop={1}
          height={height}
          row={row}
          symbol={symbol}
          symbolProps={symbolProps}
        />
        <ListOfFunctions
          marginTop={1}
          list={list}
          width={listWidth}
          row={row}
        />
      </>

      <>
        <CodeGutter rows={linesOfCodeCount + 2} />
        <Box
          marginTop={1}
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start"
        >
          <Box marginLeft={2}>{!code ? null : <Text>{code}</Text>}</Box>
        </Box>
      </>
    </Box>
  );
};

const CodePanelContainer = ({ state, highlightedCode }) => {
  const {
    fnCode,
    fnLimit,
    fnNameLengthMax,
    fnQuery,
    fnNamesFiltered,
    fnNames,
    fnCursor,
  } = state;

  let code = highlightedCode;
  if (!code) {
    try {
      code = fnCode && cardinal.highlight(fnCode, { theme });
    } catch (e) {
      if (typeof fnCode === "string") {
        code = fnCode;
      }
    }
  }

  if (fnNames.length === 0) {
    return (
      <Box marginLeft={10} height={11} alignItems="center">
        <Text italic>Loading...</Text>
      </Box>
    );
  }

  return (
    <CodePanel
      code={code}
      height={fnLimit}
      listWidth={fnNameLengthMax}
      list={(fnQuery ? fnNamesFiltered : fnNames).slice(
        fnCursor > fnLimit - 1 ? fnCursor - (fnLimit - 1) : 0,
        fnCursor > fnLimit - 1 ? fnLimit + (fnCursor - (fnLimit - 1)) : fnLimit
      )}
      row={fnCursor > fnLimit - 1 ? fnLimit - 1 : fnCursor}
      symbol="λ"
      symbolProps={{ color: "magentaBright" }}
    />
  );
};

const App = () => {
  const [state, setState] = React.useState(() => ({
    userHasTyped: false,
    fnNameCopied: "",
    fnQuery: "",
    fnCursor: 0,
    fnLimit: 10,
    fnCode: "",
    fnNameLengthMax: 0,
    fnNames: [],
    fnNamesFiltered: [],
  }));

  const updateCodePreview = React.useCallback(
    (name, state) => {
      Services.fetchOneLinerCode(name).then((code) => {
        const currentName = (state.fnQuery
          ? state.fnNamesFiltered
          : state.fnNames)[state.fnCursor];

        if (name === currentName) {
          setState({ ...state, fnCode: code });
        }
      });
    },
    [setState]
  );

  React.useEffect(() => {
    prefetchedNames.then((names) => {
      const maxNameLength = names.reduce((max, n) => {
        return n.length > max ? n.length : max;
      }, 0);
      updateCodePreview(names[0], {
        ...state,
        fnNames: names,
        fnNameLengthMax: maxNameLength,
      });
    });
  }, []);

  const handleFnQuery = React.useCallback(
    (q) => {
      const normalizedQ = q.toLowerCase();
      const names = Services.fuzzyFilterList(normalizedQ, state.fnNames);

      updateCodePreview(names[0], {
        ...state,
        userHasTyped: true,
        fnQuery: normalizedQ,
        fnNamesFiltered: names,
        fnCursor: 0,
        fnCode: "",
      });
    },
    [state, updateCodePreview]
  );

  const handleNavDown = React.useCallback(() => {
    const limit =
      (state.fnQuery ? state.fnNamesFiltered.length : state.fnNames.length) - 1;

    let fnCursor = state.fnCursor + 1;
    if (fnCursor > limit) {
      fnCursor = 0;
    }

    if (fnCursor !== state.fnCursor) {
      updateCodePreview(getFnName(state, fnCursor), { ...state, fnCursor });
    }
  }, [state, updateCodePreview]);

  const handleNavUp = React.useCallback(() => {
    const limit = 0;

    let fnCursor = state.fnCursor - 1;
    if (fnCursor < limit) {
      fnCursor =
        (state.fnQuery ? state.fnNamesFiltered.length : state.fnNames.length) -
        1;
    }

    if (fnCursor !== state.fnCursor) {
      updateCodePreview(getFnName(state, fnCursor), { ...state, fnCursor });
    }
  }, [state, updateCodePreview]);

  const handleEnter = React.useCallback(() => {
    const clip = require("clipboardy");
    clip.writeSync(state.fnCode);
    setState({
      ...state,
      fnNameCopied: getFnName(state, state.fnCursor),
    });
  }, [state, setState]);

  const hasResults = state.fnQuery ? state.fnNamesFiltered.length > 0 : true;

  return (
    <Box flexDirection="column">
      <KeyboardEvents
        down={handleNavDown}
        up={handleNavUp}
        enter={handleEnter}
      />

      <Box alignItems="flex-end">
        <Box marginRight={1} flexDirection="column">
          {!state.userHasTyped && (
            <Box
              marginLeft={2}
              marginTop={1}
              marginBottom={1}
              flexDirection="column"
            >
              <Text marginBottom={1} bold>
                1 LINERS CLI
              </Text>
              <Text italic dim>
                Press enter on a selection to copy to clipboard.
              </Text>
            </Box>
          )}
          <Box>
            <Text bold dim color="white">
              ?
            </Text>
            <Text> Choose a one liner function </Text>
            <Text dim>‣</Text>
            <Box marginLeft={1}>
              <TextInput
                placeholder="Search by name..."
                value={state.fnQuery}
                onChange={handleFnQuery}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {!state.fnNameCopied &&
        (!hasResults ? (
          <Box marginTop={1} marginLeft={2}>
            <Text color="green">
              No matches for "
              <Text bold underline>
                {state.fnQuery}
              </Text>
              " - sorry!
            </Text>
          </Box>
        ) : (
          <CodePanelContainer state={state} />
        ))}
      {Boolean(state.fnNameCopied) && (
        <CodePanelContainer
          state={state}
          highlightedCode={cardinal.highlight(state.fnCode, { theme })}
        />
      )}
      {Boolean(state.fnNameCopied) && (
        <Box marginTop={1} marginLeft={2}>
          <Text>
            Copied "
            <Text underline>
              {Services.stripMatchTokens(state.fnNameCopied)}
            </Text>
            " to clipboard.
          </Text>
        </Box>
      )}

      {Boolean(state.fnNameCopied) && <Exit />}
    </Box>
  );
};

async function start() {
  render(<App />);
}

start().catch((err) => {
  console.error(err);
});
