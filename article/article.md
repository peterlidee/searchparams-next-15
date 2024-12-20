series name: Using, testing and mocking searchParams, useSearchParams and useRouter in next 15

# Part 1 synchronous and asynchronous searchParams in `Next 15`

`Next 15` changed how we use the `searchParams` props of the `page.tsx` file (the route root, `/someroute/page.tsx`). `searchParams` is now asynchronous.

```tsx
export default async function SomeRoute({ searchParams }) {
  const currSearchParams = await searchParams;
  return 'hello world';
}
```

## Why asynchronous?

`Next` aims to further improve optimization. Prior, `Next` would have let the entire component wait for the `searchParams` request to be fulfilled before starting to render. By making the `searchParams` request asynchronous, `Next` can immediately start rendering the synchronous part of the code while it's running the `searchParams` request.

Small side note, `Next 15` also made `headers`, `cookies` and the `params` page prop asynchronous. Read more on those in the [release notes](https://nextjs.org/blog/next-15#async-request-apis-breaking-change).

## What about synchronous components?

In the above example, we used the `await` keyword, therefore we also had to use the `async` keyword. This makes our component **asynchronous**.

But, there is this line in the [release notes](https://nextjs.org/blog/next-15#async-request-apis-breaking-change):

> For an easier migration, these APIs [`headers`, `cookies`, ... `searchParams`] can temporarily be accessed synchronously, but will show warnings in development and production until the next major version.

I found that line a bit confusing at first. It does **not** mean that you can do this:

```tsx
// wrong
const currSearchParams = searchParams;
```

In `Next 15` the `searchParams` request always returns a promise and in above example, since we didn't await, it would be a pending promise. Not a `searchParams` object with actual values.

## Examples

There is more confusion to be had but at this point I found some [upgrade examples](https://nextjs.org/docs/app/building-your-application/upgrading/version-15#asynchronous-page). I will walk you through them with my own code.

I made a fresh `Next 15` install with `TypeScript`, `ESLint`, `Tailwind CSS`, `app router` and cleaned out the boilerplate code. Note: this code is available in a [github repo](https://github.com/peterlidee/searchparams-next-15).

I created a new route `/asyncpage` with following code:

```tsx
// src/app/asyncpage/page.tsx

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AsyncPage({ searchParams }: Props) {
  const currSearchParams = await searchParams;
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>async page ?foo=bar</h2>
      <div>searchParam foo is: {currSearchParams.foo}</div>
    </>
  );
}
```

Preview:

// TODO: add image async-page

This is what we've seen before. It is the new way of using the `searchParam` request in `Next 15`.

Now, we also create a `/syncpage` route. The component has to be synchronous meaning it cannot have the `async` keyword. If we can't use `async` we can't use `await` and that leaves us with a pending promise as we've seen.

## use

With `Next 15` comes the new [`React 19` `use` hook](https://react.dev/reference/react/use).

> use is a React API that lets you read the value of a resource like a Promise or context.

This obviously seems to fit our requirements so, here is our new component:

```tsx
// src/app/syncpage/page.tsx

import { use } from 'react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function SyncPage({ searchParams }: Props) {
  const currSearchParams = use(searchParams);
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>sync page ?foo=bar</h2>
      <div>searchParam foo is: {currSearchParams.foo}</div>
    </>
  );
}
```

Preview:

// TODO: insert image searchParams-Next-15-sync-page.png

We basically flipped out `await` with `use` but there are some things to note here. I knew about the new `use` hook but I haven't studied it in depth and some things surprised me:

1. You don't need async on your component using `use`.
2. Even though it's a hook, you don't need the `'use client'` directive!! In other words, you can use the `use` hook in server components. I'm pretty sure this is the only exception to this rule and it is an extension of `Next`'s new shift towards server components.

But, there is another question. Why use this? Why not make the page async and use await? I don't know. It this better? Is this faster? I'm not sure. An edge case could be when your page component needs to be a client component. Since client components can't be async you would have to use the synchronous `searchParams` version with the `use` hook. But making the page component a client component is probably a poor practice.

Remember the quote from the [`Next 15` release notes](https://nextjs.org/blog/next-15#async-request-apis-breaking-change) from earlier?

> For an easier migration, these APIs [`headers`, `cookies`, ... `searchParams`] can temporarily be accessed synchronously, but will show warnings in development and production until the next major version.

I ran this app both in development and production mode and encountered no errors or warning on the synchronous page when using the `searchParams` directive. This leads me to believe that `searchParams` will be permanently available _synchronously_.

## Conclusion

By now you should understand how to use `searchParams` synchronously and asynchronously. All and all it's not very difficult. Since `Next` recommends using the async version, let's just do that then.

This series on `searchParams` in `Next 15` handles both using and testing/mocking. To properly test and mock we need a wee example which we will quickly do in part 2.

---

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).

# Part 2 An example of using searchParams, useSearchParams and Next router in Next 15

This is part 2 of a series on `searchParams` in `Next 15`. In the first part we talked about synchronous and asynchronous `searchParams`. Later, we want to run some tests on this but this means we first need some code to run tests on. This will be our focus in this chapter.

Note: this code is available in a [github repo](https://github.com/peterlidee/searchparams-next-15).

SPOILER: Right now, `@testing-library/react` doesn't work for `Next 15`. This means that we cannot write these tests yet. See part 3.

## List

We will make a little app where we can sort a list of fruits ascending or descending. Preview:

// TODO: add image link searchParams-Next-15-list-app.png

This app consists of 2 components: the actual list and the sort buttons. For the list, we will pass the `searchParams` prop from page to `<List />`. So route `list?sortOrder=asc` will pass `asc`: `<List sortOrder='asc' />`.

For the sort buttons we will use the `useSearchParams` hook. This gives me the opportunity to demonstrate how to mock `next/navigation` hooks in `Next 15`. Pushing the buttons calls `push` function on `useRouter`, f.e. `router.push('/list?sortOrder=desc')`.

## /list/page.tsx

Our first component is the route root page.tsx:

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

In this component we use the asynchronous `searchParams` request. We extract a sortOrder value from `searchParams` using the `validateSortOrder` function:

```ts
// src/lib/validateSortOrder.ts

import isSortOrderT from '@/types/isSortOrderT';
import { SortOrderT } from '@/types/SortOrderT';

const DEFAULT_SORT_ORDER: SortOrderT = 'asc';

export default function validateSortOrder(
  value: string | string[] | undefined | null
) {
  if (!value) return DEFAULT_SORT_ORDER;
  if (Array.isArray(value)) return DEFAULT_SORT_ORDER;
  if (!isSortOrderT(value)) return DEFAULT_SORT_ORDER;
  return value;
}
```

This function checks if `searchParams.sortOrder` is either `asc` or `desc` and returns the default `asc` when it's not.

## List

Our `<List />` component receives the validated sortOrder value (`'asc' | 'desc'`) and simply sorts the fruits accordingly. Nothing new here:

```tsx
// scr/components/List.tsx

import { SortOrderT } from '@/types/SortOrderT';

type Props = {
  items: string[];
  sortOrder: SortOrderT;
};

const SORT_CALLBACKS = {
  asc: (a: string, b: string) => (a > b ? 1 : -1),
  desc: (a: string, b: string) => (a < b ? 1 : -1),
};

export default function List({ items, sortOrder }: Props) {
  const sortedItems = items.sort(SORT_CALLBACKS[sortOrder]);
  return (
    <ul className='list-disc'>
      {sortedItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
```

## ListControles

Our final component holds our sort buttons and uses the `useSearchParams` hook.

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
    // this is incorrect, it should be
    // const newParams = new URLSearchParams(searchParams.toString());
    // we fix this later on
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortOrder', val);
    newParams.set('ha ha ha ha', '123 456 789');
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

## useSearchParams

The `useSearchParams` hook returns a readonly `URLSearchParams` interface: `ReadonlyURLSearchParams`.

> The URLSearchParams interface defines utility methods to work with the query string of a URL.
>
> source: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

These utility methods includes things like: `has()`, `get()` and `set()`. So, for example, on url `/list?foo=bar`, we can do this:

```tsx
const searchParams = useSearchParams();

searchParams.has('foo'); // true
searchParams.has('mooooo'); // false
searchParams.get('foo'); // 'bar'
searchParams.get('mooooo'); // null
```

But, in this case, we can't use `.set`. Why not? Because `useSearchParams` returns a readonly `ReadonlyURLSearchParams` interface.

```tsx
searchParams.set('foo', bar); // Unhandled Runtime Error (crash)
```

Given the simplicity of this app we could just manually write our new search params:

```jsx
router.push(`/list?sortOrder=${value}`);
```

But that has 2 potential problems. Firstly, value isn't url encoded (we could again do this manually). Secondly, we lose other potential search params. For example if we are on url `/list?sortOrder=desc&color=red`, we would want to keep the color parameter and not just delete it.

That is why we use `URLSearchParams`. But, we need to go from a readonly to a read and write `URLSearchParams` interface. Luckily, this is quite easy. Here is our handleSort function from our `<ListControles />` component

```tsx
function handleSort(val: SortOrderT) {
  // this is incorrect, it should be
  // const newParams = new URLSearchParams(searchParams.toString());
  // we fix this later on
  const newParams = new URLSearchParams(searchParams);
  newParams.set('sortOrder', val);
  router.push(`${pathname}?${newParams.toString()}`);
}
```

- We create a new `URLSeachParams` interface and pass in the old one. This way we don't lose any search params. The new `URLSeachParams` is **not** readonly.
- Note: pass it like this: `new URLSearchParams(searchParams.toString())`. Above example is incorrect.
- Next, we write a new sortOrder value using the `.set` method. This will also url encode both the key and the value.
- Finally, we need to go from a `URLSearchParams` interface to an actual url search params string which we do by simply calling the `.toString()` method on the interface.

By doing it this way we preserve existing search params and we also get some free url encoding. All and all a handy API. I like it.

## Recap

We just build a simple fruit sorting app so we have some code to test and mock with `Jest` and `React Testing Library`.

We have our page component that uses asynchronous `searchParams` prop and then our `<ListControles />` component were we will have to mock `usePathname`, `useSearchParams`and `useRouter`.

We will do this in the next chapters.

---

If you want to support my writing, you can [donate with paypal](https://www.paypal.com/donate/?hosted_button_id=4D78YQU4V5NEJ).

# 3. Writing Jest tests for searchParams in Next 15

This is the third part in a series were we look into using and testing the new `searchParams` interface in `Next 15`. In the first part we explained what changed in `Next 15` and what the difference is between synchronous and asynchronous `searchParams`. In the second part we quickly went over the code for a little example app. In this part we are going to start writing tests for this example app using `Jest`.

## Setup

We started with a clean `Next 15` install (`npx create-next-app@latest`). We now have to manually install `Jest`, `React Testing Library` and some other things. We are just following instructions from the `Next` [setup guide](https://nextjs.org/docs/app/building-your-application/testing/jest).

```
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom ts-node
```

## Error

```
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error
npm error While resolving: searchparams-next-15@0.1.0
npm error Found: react@19.0.0-rc-69d4b800-20241021
npm error node_modules/react
npm error   react@"19.0.0-rc-69d4b800-20241021" from the root project
npm error
npm error Could not resolve dependency:
npm error peer react@"^18.0.0" from @testing-library/react@16.0.1
```

What happened? `Next 15` is build on `React 19 RC`. It's a Release Candidate version of `React`, not a stable version.

`@testing-library/react` still runs on `React 18`. It has a development dependency of `React 18` while `Next 15` has a development dependency of `React 19`. Hence the error.

## To be continued

Unfortunately this means we are stuck for now. No testing in `Next 15`. We have to wait for `@testing-library/react` to update and we cannot write tests for now. I will keep an eye on this and continue this series once `@testing-library/react` updates.

############# end prev version
