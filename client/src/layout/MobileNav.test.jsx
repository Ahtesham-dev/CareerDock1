import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

jest.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }) => <a {...props}>{children}</a>,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

import MobileNav from './MobileNav';

describe('MobileNav', () => {
  it('renders the statistics tab with a clear label', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(<MobileNav />);
    });

    expect(container.textContent).toContain('Statistics');
    container.remove();
  });
});
