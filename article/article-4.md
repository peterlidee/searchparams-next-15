# 4. Testing (async) searchParams with Jest in Next 15

This is the fourth part in a series were we look into using and testing the new `searchParams` interface in `Next 15`. In the first part we explained what changed in `Next 15` and what the difference is between synchronous and asynchronous `searchParams`. In the second part we quickly went over the code for a little example app. In the 3rd part we setup `Jest` and `@testing-library/react` with `eslint` plugins.

In this part we're going to start testing. We start of with testing the `searchParams` prop in the page route component.

Note: this code is available in a [github repo](https://github.com/peterlidee/searchparams-next-15).

## page Component

Let's look at our page component:

```tsx
// src/app/list/page.tsx

import List from '@/components/List';
import ListControles from '@/components/ListControles';
import validateSortOrder from '@/lib/validateSortOrder';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ITEMS = ['apple', 'banana', 'cherry', 'lemon'];

export default async function ListPage({ searchParams }: Props) {
  const currSearchParams = await searchParams;
  const sortOrder = validateSortOrder(currSearchParams.sortOrder);
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>List</h2>
      <ListControles />
      <List items={ITEMS} sortOrder={sortOrder} />
    </>
  );
}
```

This is more a container component but it is where `searchParams` is passed. The component receives `searchParams`, validates it as `sortOrder` and then passes it to `<List />`.

We're doing a unit test here. We want to test `<ListPage />` in isolation. That means we have to mock the `validateSortOrder` function and the `<ListControles />` and `<List />` components. Let's start with that.

## Mocking

We write a testfile, import everything and then mock said 3 files:

```tsx
// src/app/list/__tests__/page.test.tsx

import { screen, render } from '@testing-library/react';

import ListPage from '../page';

import validateSortOrder from '@/lib/validateSortOrder';
import List from '@/components/List';
import ListControles from '@/components/ListControles';

jest.mock('@/lib/validateSortOrder');
jest.mock('@/components/List');
jest.mock('@/components/ListControles');

describe('<ListPage />', () => {});
```

## Rendering async components in Jest

Before we continue we need to talk about how you render asynchronous server components in `Jest`.

We have a `<Home />` component to test this on. Let's make that async:

```tsx
// src/app/page.tsx

export default async function Home() {
  return <div>hello world</div>;
}
```

We already wrote a test for this component in a previous part when we were setting up `Jest`:

```tsx
// src/app/__tests__/page.test.tsx

import { screen, render } from '@testing-library/react';

import Home from '@/app/page';

describe('<Home />', () => {
  test('It renders', () => {
    render(<Home />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
```

It worked before we made `<Home />` async, let's run it again. It errors with some confusing messages:

```
...

A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

...
```

There is more but it doesn't really matter. The thing is that the test doesn't run anymore.

I looked into this, tried and tested different methods like `act`, `waitFor`, `await findBy...` and more. Nothing worked. It seems that `Jest` is not equipped to handle async server components.

But we can make it work:

```tsx
// src/app/__tests__/page.test.tsx

import { screen, render } from '@testing-library/react';

import Home from '@/app/page';

describe('<Home />', () => {
  test('It renders', async () => {
    const component = await Home();
    render(component);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
```

We called `<Home />` as a function. In case you don't know this, any functional component can simply be called as a function. We also await the function (made the entire test async) and assign it to a `const`. Finally, we render our `const` component.

Test passes, everything works. This seems to be the only way to make async server components work in `Jest` so we will use it. Please comment if you know a better way!

## async props

Remember, `searchParams` has to be async. If not we could just do this:

```ts
// does not work
const component = await ListPage({ searchParams: { sortOrder: 'asc' } });
render(component);
```

Immediately, TypeScript will yell at us because the type doesn't match. This is the type we set on searchParams:

```ts
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
```

It's a promise that resolves into an object. The value for each property of this object has to be string, an array of strings or undefined. So, we're missing the promise part.

How do we do that then? We could just manually write a promise:

```tsx
// write promise
const promise = new Promise<{
  [key: string]: string | string[] | undefined;
}>((res) => {
  res({ sortOrder: 'asc' });
});
// pass it to <ListPage />
const component = await ListPage({ searchParams: promise });
render(component);
```

This works but there is a simpler way. Async functions also return a promise:

```ts
async function generateSearchParams(value: {
  [key: string]: string | string[] | undefined;
}) {
  return value;
}
```

We can then call this function like this:

```tsx
const params = {
  sortOrder: 'asc',
};
const component = await ListPage({
  searchParams: generateSearchParams(params),
});
render(component);
```

This might be a bit confusing, I know, let me recap. We need to call `<ListPage />` with an async `searchParams` prop. So we created an async function that just returns an object it gets passed as argument. Since it's an async function, it returns said object inside a promise. Exactly what we needed.

## testing `<ListPage />`

Now that everything is setup, let's actually test our component.

```tsx
// src/app/list/page.tsx

import List from '@/components/List';
import ListControles from '@/components/ListControles';
import validateSortOrder from '@/lib/validateSortOrder';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ITEMS = ['apple', 'banana', 'cherry', 'lemon'];

export default async function ListPage({ searchParams }: Props) {
  const currSearchParams = await searchParams;
  const sortOrder = validateSortOrder(currSearchParams.sortOrder);
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>List</h2>
      <ListControles />
      <List items={ITEMS} sortOrder={sortOrder} />
    </>
  );
}
```

We first write an `it renders` test:

```tsx
// test passes

test('It renders', async () => {
  const params = {
    sortOrder: 'asc',
  };
  const component = await ListPage({
    searchParams: generateSearchParams(params),
  });
  render(component);
  expect(validateSortOrder).toHaveBeenCalled();
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/list/i);
  expect(ListControles).toHaveBeenCalled();
  expect(List).toHaveBeenCalled();
});
```

We already mocked `validateSortOrder` so that will now return `undefined`. But, we can use `.toHaveBeenCalledWith` on the `validateSortOrder` mock to verify that our searchParams.sortOrder value is correctly passed.

Note that this is core `NextJs` behavior and we shouldn't really test this. It's a `Next` thing and should work. We will just do it here to prove our setup works.

```tsx
// test passes

test('searchParams is correctly passed down', async () => {
  const params = {
    sortOrder: 'asc',
  };
  const component = await ListPage({
    searchParams: generateSearchParams(params),
  });
  render(component);
  expect(validateSortOrder).toHaveBeenCalledWith('asc');
});
```

Finally, should we test with different sortOrder params? No. Why not? Because `validateSortOrder` handles this. The function returns either `desc` or `asc` (as default or when sortOrder=asc). But, we mocked `validateSortOrder`. So it doesn't matter. Maybe one last test, what happens when there is no sortOrder param?

```tsx
// test passes

test('It calls validateSortOrder with undefined when searchParams.sortOrder does not exist', async () => {
  const params = {};
  const component = await ListPage({
    searchParams: generateSearchParams(params),
  });
  render(component);
  expect(validateSortOrder).toHaveBeenCalledWith(undefined);
});
```

And that's all we need to test `<ListPage />`. Here is our final full test file:

```tsx
// src/app/list/page.tsx
// tests pass

import { screen, render } from '@testing-library/react';

import ListPage from '../page';

import validateSortOrder from '@/lib/validateSortOrder';
import List from '@/components/List';
import ListControles from '@/components/ListControles';

jest.mock('@/lib/validateSortOrder');
jest.mock('@/components/List');
jest.mock('@/components/ListControles');

async function generateSearchParams(value: {
  [key: string]: string | string[] | undefined;
}) {
  return value;
}

describe('<ListPage />', () => {
  test('It renders', async () => {
    const params = {
      sortOrder: 'asc',
    };
    const component = await ListPage({
      searchParams: generateSearchParams(params),
    });
    render(component);
    expect(validateSortOrder).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /list/i
    );
    expect(ListControles).toHaveBeenCalled();
    expect(List).toHaveBeenCalled();
  });

  test('searchParams is correctly passed down', async () => {
    const params = {
      sortOrder: 'asc',
    };
    const component = await ListPage({
      searchParams: generateSearchParams(params),
    });
    render(component);
    expect(validateSortOrder).toHaveBeenCalledWith('asc');
  });

  test('It calls validateSortOrder with undefined when searchParams.sortOrder does not exist', async () => {
    const params = {};
    const component = await ListPage({
      searchParams: generateSearchParams(params),
    });
    render(component);
    expect(validateSortOrder).toHaveBeenCalledWith(undefined);
  });
});
```

## Conclusion

Mainly, we learned how to render an async component in `Jest` and how to pass an async prop to an async component. All and all it's not very hard, just a bit cumbersome.

Our little app has some more components and functions but only `<ListControles />` matters for this series because it uses `useSearchParams`, `usePathname` and `useRouter`. In the next part I will show how to mock and test this component.

I wrote some tests for the other components too but I won't go into to those. You can see the tests in the [repo](TODO: add link).

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).
