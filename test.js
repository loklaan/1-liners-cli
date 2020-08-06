const test = require('ava');
const Services = require("./dist/services");

test('executable snippets', async t => {
  const names = await Services.fetchOneLinerNames();
  t.true(names && names.length > 0);

  await Promise.all(names.map(async name => {
    const code = await Services.fetchOneLinerCode(name);
    t.is(typeof code, 'string');
    t.true(code.length > 0);

    t.notThrows(() => {
      let error;
      try {
        const codeFn = new Function(code);
        codeFn();
      } catch (err) {
        error = err;
      }

      if (error) {
        console.error(`Function Name: ${name}`);
        console.error(`Function Source:\n${code}`);
        throw error;
      }
    });
  }));
});

