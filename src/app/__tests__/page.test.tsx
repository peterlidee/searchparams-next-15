import { screen, render } from '@testing-library/react';

import Home from '@/app/page';

describe('<Home />', () => {
  test('It renders', async () => {
    const component = await Home();
    render(component);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
