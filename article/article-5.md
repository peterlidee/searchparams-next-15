# 5. Mocking usePathName, useSearchParams and useRouter with Jest in Next 15

In previous parts we saw how to use and test the async `searchParam` prop in a route page component. Since we're working with `searchParams` I wanted to demonstrate how to test a file that uses `useSearchParams`, `usePathname` and `useRouter`.

Note: this code is available in a [github repo](https://github.com/peterlidee/searchparams-next-15).

## `<ListControles />`

This is the component we will be testing:

```tsx
// src/components/ListControles.tsx

'use client';

import validateSortOrder from '@/lib/validateSortOrder';
import { SortOrderT } from '@/types/SortOrderT';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function ListControles() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // get validated sortOrder value
  const sortOrder = validateSortOrder(searchParams.get('sortOrder'));

  function handleSort(val: SortOrderT) {
    const newParams = new URLSearchParams(searchParams);
    // note: this is incorrect (explanation later), should be
    // const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('sortOrder', val);
    router.push(`${pathname}?${newParams.toString()}`);
  }

  return (
    <div>
      <div className='mb-2'>current sort order: {sortOrder}</div>
      <div className='flex gap-1'>
        <button
          className='bg-blue-700 text-white py-1 px-4 rounded-sm'
          onClick={() => handleSort('asc')}
        >
          sort ascending
        </button>
        <button
          className='bg-blue-700 text-white py-1 px-4 rounded-sm'
          onClick={() => handleSort('desc')}
        >
          sort descending
        </button>
      </div>
    </div>
  );
}
```

It's basically just 2 buttons. When you click them it takes the current url and changes or adds the `searchParam` `sortOrder=asc` or `sortOrder=desc` and then pushes the new url to `router`.

```
original url  -> localhost:3000/list?sortOrder=asc
new url       -> localHost:3000/list?sortOrder=desc
```

There is also a text displaying the current sortOrder value.

```ts
<div className='mb-2'>current sort order: {sortOrder}</div>
```

## TLDR;

If you are just looking for code snippets, skip to the bottom. However, be warned, I ran into a lot of issues and walk you through them. Pure copy/paste might not suit your specific need.

## Setting up our test

For now, we will setup a basic test without mocking any of the hooks. Since we also want to test button clicks we will need `@testing-library/user-event` so let's quickly install that:

```
npm i -D @testing-library/user-event
```

We proceed by putting up an initial testing file:

```tsx
// src/components/__tests__/ListControles.test.tsx
// Errors for now

import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ListControles from '../ListControles';
import validateSortOrder from '@/lib/validateSortOrder';
jest.mock('@/lib/validateSortOrder');

function setup() {
  (validateSortOrder as jest.Mock).mockReturnValue('asc');
  render(<ListControles />);
  const buttonAsc = screen.getByRole('button', { name: /sort ascending/i });
  const buttonDesc = screen.getByRole('button', { name: /sort descending/i });
  return { buttonAsc, buttonDesc };
}

describe('<ListControles /> component', () => {
  // error
  test('It renders', () => {
    const { buttonAsc, buttonDesc } = setup('asc');
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
    expect(buttonAsc).toBeInTheDocument();
    expect(buttonDesc).toBeInTheDocument();
  });
});
```

We wrote the basics of our test file here. Except for our hooks, we have all the imports, we already mocked `validateSortOrder` and we have a setup function so we don't have to write the queries every time.

We also wrote a simple first test `it renders` that checks if the text and buttons are in the document. Great, but if fails:

```
invariant expected app router to be mounted
```

This is as expected, we are running a `Jest` test so there is no `window` or `router` available. So, we need to do some mocking.

## jest.mock

Let's import all our hooks and mock them:

```ts
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
jest.mock('next/navigation');
```

Our test still errors but now we have a different error:

```
TypeError: Cannot read properties of undefined (reading 'get')

> 13 |   const sortOrder = validateSortOrder(searchParams.get('sortOrder'));
```

Using `jest.mock` with the pathname/package is what's called a [`Jest` automatic mock](https://jestjs.io/docs/es6-class-mocks#automatic-mock).

What `jest.mock` does is take the package and mock every export it has. Every function and hook that `next/navigation` returns is now mocked.

TODO: insert image next-navigation

This means that we can now use `Jest` matchers and helpers like `.toHaveBeenCalled()`. So for example this would now work:

```ts
expect(useSearchParams).toHaveBeenCalled();
```

But it also means that these hooks don't do anything anymore. They have no body and they don't return anything (`undefined`).

In our `<ListControles />` component, this code runs:

```ts
const searchParams = useSearchParams();
// ...
const sortOrder = validateSortOrder(searchParams.get('sortOrder'));
```

But since we mocked `useSearchParams`, `searchParams` doesn't have the get method anymore and that is our current error we're facing:

```
TypeError: Cannot read properties of undefined (reading 'get')
```

## mocking useSearchParams in Next 15

So, we need to fix this. We need to return something from our `useSearchParams` mock. But what? `useSearchParams` returns a `URLSearchParams` interface that gives us access to a whole bunch of properties like `set`, `get`, `has`, ... We only need the `get` method.

We could just create a new `URLSearchParams` interface, pass it mock `searchParams` (f.e. `{ sortOrder: 'asc' }`) and return that from `useSearchParams` mock. That might work but there a problem with it. I would **not** enable us to listen for the `searchParams.get` method to have been called. And that is something we do want to test.

We actually need the `get` method to be mocked or to be a mock. So let's return an object from `useSearchParams`. On this object we put a `get` property with a `Jest` mock as value:

```ts
(useSearchParams as jest.Mock).mockReturnValue({
  get: jest.fn(),
});
```

Good news, all our error are gone. Our `it renders` test passes! Yay. But, let's add a new test.

```tsx
test('It correctly sets sortOrder', () => {
  setup();
  expect(get).toHaveBeenCalled();
});
```

Error:

```
ReferenceError: get is not defined
```

This should make sense, we don't have direct access to the `get` mock because it only exists (is scoped) inside the return value from the `useSearchParams` mock.

The solution is quite simple, create a get mock first and then pass it:

```ts
const getMock: jest.Mock = jest.fn();
(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
});
```

And update the test:

```ts
expect(getMock).toHaveBeenCalled();
```

And everything passes. Let's finish the rest of the current test:

```ts
// passes

test('It correctly sets sortOrder', () => {
  setup();
  expect(getMock).toHaveBeenCalled();
  expect(validateSortOrder).toHaveBeenCalled();
  expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
});
```

Note that we could also mock a return value from `getMock` but in our case that's useless.

## toString() mock

Are we done with mocking `useSearchParams`? No. If we look into our component, we use it a second time in our `handleSort` function:

```tsx
function handleSort(val: SortOrderT) {
  // note: incorrect, will be fixed later
  const newParams = new URLSearchParams(searchParams);
  newParams.set('sortOrder', val);
  router.push(`${pathname}?${newParams.toString()}`);
}
```

So we pass `searchParams` into a new `URLSearchParams` interface:

```ts
const newParams = new URLSearchParams(searchParams);
```

I explained this in part 1 of this series. The `useSearchParams` hooks return a readonly `URLSearchParams` interface. But we need to update it (with a new sortOrder) so readonly doesn't work for us.

!!! NOTE: following paragraph is incorrect, we 'discover' this in a bit !!!

So we manually create a new `URLSearchParams` and pass the old readonly `URLSearchParams` into it. The new one will then call the `toString` method on the old one to receive it's searchParam values.

This means, we need to also create a `toString` method on our `useSearchParams` hook. We already know how to do this because we already did the `get` method:

```tsx
const getMock: jest.Mock = jest.fn();
const toStringMock: jest.Mock = jest.fn();
(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
  toString: toStringMock,
});
```

Note: we only need `get` and `toString`, if you need more methods, this is how you add those.

We now have a `toStringMock` as well but we will come back to that later because there is no way to test this for now.

## testing handleSort

The only thing left to test now is the `handleSort` function that gets triggered by button clicks. We can simulate button clicks with `user-event`. Let's write a new test:

```tsx
test('It calls router.push with "sortOrder=asc" when "sort ascending" button is clicked', async () => {
  const user = userEvent.setup();
  const { buttonAsc } = setup();
  await user.click(buttonAsc);
});
```

This is just the setup needed to have our component fire the `handleSort` function. Right now, it errors:

```
TypeError: Cannot read properties of undefined (reading 'push')
```

## mocking useRouter in Next 15

Pretty much the same problem we had with the `get` method on `useSearchParams`. Remember, `useRouter` itself has already been mock by the `Jest` automatic mock:

```ts
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
```

But, this means that it now returns nothing. So, we need to create a return from the `useRouter` mock with a `push` method on it:

```tsx
// mock useRouter
const routerPushMock: jest.Mock = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: routerPushMock,
});
```

And the error is gone. But we haven't asserted anything in our latest test. We need to somehow test this:

```tsx
function handleSort(val: SortOrderT) {
  // still incorrect
  const newParams = new URLSearchParams(searchParams);
  newParams.set('sortOrder', val);
  router.push(`${pathname}?${newParams.toString()}`);
}
```

The only way to test this is to listen what our `routerPushMock` has been called with. There are 2 problems with that:

1. `toStringMock` doesn't return anything
2. `usePathname` mock doesn't return anything either.

This makes it rather unpredictable what `routerPushMock` has been called with. Let's add an assertion:

```ts
// don't actually do this
expect(routerPushMock).toHaveBeenCalledWith('dunno');
```

Obviously this will fail but `Jest` will actually tell us what it got called with:

```ts
Expected: 'dunno';
Received: 'undefined?get=function+%28%29+%7B%0A++++++++return+fn.apply%28this%2C+arguments%29%3B%0A++++++%7D&toString=function+%28%29+%7B%0A++++++++return+fn.apply%28this%2C+arguments%29%3B%0A++++++%7D&sortOrder=asc';
```

This surprised me. It looks like our entire mocked object was converted to a string. So weird.

## URLSearchParams

I had a long look into this and finally found the problem. Our test revealed an error in our original component code! Yay, that is what testing is for!

We have this line of code in our component:

```ts
const newParams = new URLSearchParams(searchParams);
```

We create a new `URLSearchParams` interface by passing in the `ReadonlyURLSearchParams` that `useSearchParams` returns. But that seems to be incorrect.

The [docs are unclear](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) but `URLSearchParams` takes as possible arguments:

- a valid query string, f.e. `?sortOrder=asc` (not a full url!)
- an object, f.e. `{ sortOrder: 'asc' }`
- `URLSearchParams.toString()`, notice the `.toString()` method

And that was causing the problem! So, we update our `<ListPage />` component:

```ts
// incorrect
const newParams = new URLSearchParams(searchParams);
// correct
const newParams = new URLSearchParams(searchParams.toString());
```

and rerun the test. Our test still fails but it makes sense now:

```ts
Expected: 'dunno';
Received: 'undefined?sortOrder=asc';
```

Take a look at our `handleSort` function again:

```tsx
function handleSort(val: SortOrderT) {
  // note the .toString()
  const newParams = new URLSearchParams(searchParams.toString());
  newParams.set('sortOrder', val);
  router.push(`${pathname}?${newParams.toString()}`);
}
```

`searchParams.toString()` has been mocked with `toStringMock` and returns undefined for now. This means that newParams will have no params. On the next rule, we update newParam with sortOrder and the val argument `asc`, passed by the "sort ascending" button. We then push router with pathName (`undefined`) and our `newParam.toString()` which is `sortOrder=asc`.

If we temporarily update our test, everything passes:

```ts
// we're not done yet, don't do this
expect(routerPushMock).toHaveBeenCalledWith('undefined?sortOrder=asc');
```

## mocking usePathname in Next 15

We fill fix the pathname mock now. It's so simple. We already mocked `usePathname` itself. We only have to add a return value to the mock:

```ts
// add return value to usePathname mock
(usePathname as jest.Mock).mockReturnValue('example.com');
```

And then update our test:

```ts
expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
```

## testing <ListControles />

The hard work is done. We mocked all our hooks and everything seems to work. Let's now fine tune our tests.

Our last test looks like this:

```tsx
// passes
test('It calls router.push with "sortOrder=asc" when "sort ascending" button is clicked', async () => {
  const user = userEvent.setup();
  const { buttonAsc } = setup();
  await user.click(buttonAsc);
  expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
});
```

We can do the same on the other button:

```tsx
// passes
test('It calls router.push with "sortOrder=desc" when "sort descending" button is clicked', async () => {
  const user = userEvent.setup();
  const { buttonDesc } = setup();
  await user.click(buttonDesc);
  expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=desc');
});
```

I also want to test if the current url searchParams are correctly overwritten with new values. There is no current url because we are running tests in `Jest`. So we have to fake current searchParams by mocking a return value from `toStringMock`.

```ts
// passes
test('It overwrites current searchParam "sortOrder=asc" when button "sort ascending" is clicked', async () => {
  const user = userEvent.setup();
  (toStringMock as jest.Mock).mockReturnValue('sortOrder=asc');
  const { buttonAsc } = setup();
  await user.click(buttonAsc);
  expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
});

// passes
test('It overwrites current searchParam "sortOrder=desc" when button "sort ascending" is clicked', async () => {
  const user = userEvent.setup();
  (toStringMock as jest.Mock).mockReturnValue('sortOrder=desc');
  const { buttonAsc } = setup();
  await user.click(buttonAsc);
  expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
});
```

As a final test, we test if it correctly preserves existing searchParams. Again, we have to mock (fake) current url search params.

```ts
// passes

test('It preserves existing searchParams (except sortOrder) when button "sort ascending" is clicked', async () => {
  const user = userEvent.setup();
  (toStringMock as jest.Mock).mockReturnValue('foo=bar&foo=baz');
  const { buttonAsc } = setup();
  await user.click(buttonAsc);
  expect(routerPushMock).toHaveBeenCalledWith(
    'example.com?foo=bar&foo=baz&sortOrder=asc'
  );
});
```

And that's a wrap. I consider <ListControles /> properly tested. For brevity, here's our full test file

```tsx
// src/components/__test__/ListControles.test.js
// all tests pass

import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ListControles from '../ListControles';
import validateSortOrder from '@/lib/validateSortOrder';
jest.mock('@/lib/validateSortOrder');

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
jest.mock('next/navigation');

// add a return value to useSearchParams mock
const getMock: jest.Mock = jest.fn();
const toStringMock: jest.Mock = jest.fn();
(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
  toString: toStringMock,
});

// add a return value to useRouter mock
const routerPushMock: jest.Mock = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: routerPushMock,
});

// add return value to usePathname mock
(usePathname as jest.Mock).mockReturnValue('example.com');

function setup() {
  (validateSortOrder as jest.Mock).mockReturnValue('asc');
  render(<ListControles />);
  const buttonAsc = screen.getByRole('button', { name: /sort ascending/i });
  const buttonDesc = screen.getByRole('button', { name: /sort descending/i });
  return { buttonAsc, buttonDesc };
}

describe('<ListControles /> component', () => {
  test('It renders', () => {
    const { buttonAsc, buttonDesc } = setup();
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
    expect(buttonAsc).toBeInTheDocument();
    expect(buttonDesc).toBeInTheDocument();
  });

  test('It correctly sets sortOrder', () => {
    setup();
    expect(getMock).toHaveBeenCalled();
    expect(validateSortOrder).toHaveBeenCalled();
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
  });

  test('It calls router.push with "sortOrder=asc" when "sort ascending" button is clicked', async () => {
    const user = userEvent.setup();
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It calls router.push with "sortOrder=desc" when "sort descending" button is clicked', async () => {
    const user = userEvent.setup();
    const { buttonDesc } = setup();
    await user.click(buttonDesc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=desc');
  });

  test('It overwrites current searchParam "sortOrder=asc" when button "sort ascending" is clicked', async () => {
    const user = userEvent.setup();
    (toStringMock as jest.Mock).mockReturnValue('sortOrder=asc');
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It overwrites current searchParam "sortOrder=desc" when button "sort ascending" is clicked', async () => {
    const user = userEvent.setup();
    (toStringMock as jest.Mock).mockReturnValue('sortOrder=desc');
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It preserves existing searchParams (except sortOrder) when button "sort ascending" is clicked', async () => {
    const user = userEvent.setup();
    (toStringMock as jest.Mock).mockReturnValue('foo=bar&foo=baz');
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith(
      'example.com?foo=bar&foo=baz&sortOrder=asc'
    );
  });
});
```

## Summary

I am aware this is quite a messy article. On the one hand you have to be aware of the component we are trying to test. On the other hand we're writing tests, learning to mock the `next/navigation` hooks and constantly running into problems and issues. Maybe my explanations aren't that clear too.

But I do think that running into problems and learning how to solve them gives a much better understanding on how to test and use mocks.

As a little bonus I also wrote an integration test for the entire `/list` route. You can see it on [github](TODO: add link).

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).

// link old articles to new one
// TODO: remove spoiler in part 2
