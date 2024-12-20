# 3. How to setup Jest in a Next project (+ eslint for testing)

At the time of writing the first 2 parts in this series, I was using `Next 15.0.1`. That version still used `React 19 rc` - release candidate. `@testing-library/react` still ran on `React 18` and that caused a dependency conflict with `Next`. All of this resulted into us not being able to use `rtl` (react testing library) to run tests.

Luckily, by now, a stable version of `React 19` has been released and `rtl` has been updated to `React 19` also. So, we're going to update `Next` (15.1.0) and then setup testing.

Note: this code is available in a [github repo](https://github.com/peterlidee/searchparams-next-15).

## Updating Next

We just run

```
npm install next@latest react@latest react-dom@latest
npm update
```

This will update most of our packages. We follow this up by running

```
npm outdated
```

to see what's left to do. In my case it's these:

```
Package              Current    Wanted   Latest  Location                         Depended by
@types/node         20.17.10  20.17.10  22.10.2  node_modules/@types/node         searchparams-next-15
@types/react         18.3.17   18.3.17   19.0.1  node_modules/@types/react        searchparams-next-15
@types/react-dom      18.3.5    18.3.5   19.0.2  node_modules/@types/react-dom    searchparams-next-15
eslint                8.57.1    8.57.1   9.17.0  node_modules/eslint              searchparams-next-15
eslint-config-next    15.0.1    15.0.1   15.1.0  node_modules/eslint-config-next  searchparams-next-15
```

So we run:

```
npm i @types/node@latest @types/react@latest @types/react-dom@latest eslint-config-next@latest
```

Note that we skipped `eslint` because `Next` seems to be still using version 8 and I want to avoid the mess of trying to update to version 9.

I started the app up and everything seems to be running as expected. Great, let's setup `Jest`.

## Setting up Jest in a Next project

We start of by using the instructions in the [Next docs](https://nextjs.org/docs/app/building-your-application/testing/jest#manual-setup):

```
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node
```

Next, we create a `jest.config.ts` file in the root:

```ts
// jest.config.ts

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
```

This is all just copy past from the docs. We did uncomment this line:

```ts
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
```

And immediately create this file:

```ts
// jest.setup.ts
import '@testing-library/jest-dom';
```

This will automatically load `jest-dom` in every test so we don't have to manually load it each time. Great!

Now we add some scripts in out `package.json` file so we can run these test. We add:

```
  "test": "jest",
  "test:watch": "jest --watch",
  "coverage": "jest --coverage"
```

We also need to run the following so Typescript understands what we're doing.

```
npm i -D @types/jest
```

Another issue we have to deal with is import aliases. Out of the box, `Next` is configured to understand import aliases:

```ts
import List from '@/components/List';
```

It doesn't have a relative import path but works with the `@` alias. `Jest` however is not configured with a default alias path. We have to do it ourself. In `jest.config.ts` we add this line in the config object:

```ts
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1', // Map @/ to ./src/
},
```

Again, this will allow use to `@` alias inside our import paths in our `Jest` test files.

Finally, again in our config object, we add this line:

```ts
clearMocks: true,
```

So our mocks are cleared after each test. This will prevent tests from contaminating each other. This is our final `jest.config.ts` file:

```ts
// jest.config.ts

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Map @/ to ./src/
  },
  clearMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
```

## Testing

We're not ready yet but at this point I want to check if `Jest` is working. We temporarily add a simple sum function and write a test for it:

```ts
// src/lib/sum.ts

export default function sum(a: number, b: number) {
  return a + b;
}
```

```ts
// src/lib/__tests__/sum.test.ts

import sum from '../sum';

describe('function sum', () => {
  test('It returns the correct number', () => {
    expect(sum(1, 1)).toBe(2);
    expect(sum(1, 10)).toBe(11);
    expect(sum(3, 9)).toBe(12);
  });
});
```

Let's also test out an actual `React` component. We already have a good candidate in form of our home component:

```tsx
// app/page.tsx

export default function Home() {
  return <div>hello world</div>;
}
```

We write a test for it:

```tsx
// app/__tests__/page.test.tsx

import { screen, render } from '@testing-library/react';

import Home from '@/app/page';

describe('<Home />', () => {
  test('It renders', () => {
    render(<Home />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
```

When we run `jest --watch` both tests pass. This proves that `Jest` and `rtl` work. `.toBeInTheDocument()` is `jest-dom` so that also works.

## Setting up eslint for jest, jest-dom and react testing library

Great, but we're not done yet. We are working in `TypeScript` and we have `eslint` running in our components and functions but there are specific `eslint` rules for testing too. Let's install these.

We need `eslint` for `Jest`, `jest-dom` and `testing-library`:

```
npm i -D eslint-plugin-jest eslint-plugin-jest-dom eslint-plugin-testing-library
```

These are plugins. That means they're just sets of rules. Now we need to configure and apply these rules. We will be using the recommended setup for each. We do this in the `.eslintrc.json` file. By default it looks like this:

```json
// .eslintrc.json

{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

And we update it with all the relevant plugins like this:

```json
// .eslintrc.json

{
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:jest/recommended",
    "plugin:jest-dom/recommended",
    "plugin:testing-library/react"
  ],
  "plugins": ["jest", "testing-library", "jest-dom"]
}
```

With plugins being the rule sets and extends loading the setups or configs of each plugin.

## Testing eslint

Finally, we need to check if these new `eslint` rules are actually applied. We are going to do this by breaking specific rules and seeing if `eslint` yells at us.

If we google `npm eslint jest` we get to the [npm page for `eslint-plugin-jest`](https://www.npmjs.com/package/eslint-plugin-jest) and in the docs we get an overview of all the rules.

One of the rules is `no-identical-title`. This means that each `test` assertion must have a unique title or description. That's easy enough to break. In our `page.test.tsx` file from above we add following rules:

```ts
test('a', () => {});
test('a', () => {});
```

And we immediately get a warning and an error:

[insert image eslint-error.png]

The Error is:

```
Test title is used multiple times in the same describe blockes (lintjest/no-identical-title)
```

Which is exactly what we expected and proves that `eslint-plugin-jest` is working.

(Note: If you don't see anything try restarting your editor.)

We also had a warning (yellow squiggly) on test:

```
Test has no assertions (eslintjest/expect-expect)
```

Which is an other eslint rule telling us we shouldn't write tests without assertions (`expect`).

Next, is `eslint-plugin-jest-dom` working? We look at the npm page, read the docs and try to break a rule. `prefer-to-have-class` looks like an easy candidate: `prefer toHaveClass over checking element className`. Following rule

```ts
// DON'T DO THIS
expect(screen.getByText(/hello world/i).className).toBe('foobar');
```

gives us an error:

```
Prefer .toHaveClass() over checking element className eslint (jest-dom/prefer-to-have-class)
```

Proving `eslint-plugin-jest-dom` works.

Finally `eslint-plugin-testing-library`:

```ts
// DON'T DO THIS
expect(screen.getByRole('button')).not.toBeInTheDocument();
```

Error:

```
Use `queryBy*` queries rather than `getBy*` for checking element is NOT present eslint (testing-library/prefer-presence-queries)
```

And that is `eslint-plugin-testing-library` telling us we should use `queryBy` if we expect the element not to be in the document. Proving this final `eslint` plugin also is correctly setup.

## Summary

There is not much to be said here, we used this part to update `Next` and to install `Jest`, `rlt` and some `eslint` plugins.

In the next chapter we are going to actually start testing our app.

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).
