import { screen, render } from '@testing-library/react';

import Home from '@/app/page';

describe('<Home />', () => {
  test('It renders', () => {
    render(<Home />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
