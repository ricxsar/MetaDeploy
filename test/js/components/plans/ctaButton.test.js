import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import CtaButton from 'components/plans/ctaButton';

const defaultPlan = {
  id: 1,
  slug: 'my-plan',
  title: 'My Plan',
  steps: [
    {
      id: 1,
      name: 'Step 1',
      description: 'This is a step description.',
      kind: 'Metadata',
      kind_icon: 'package',
      is_required: true,
      is_recommended: true,
    },
  ],
};

const defaultPreflight = {
  plan: 1,
  status: 'complete',
  results: {},
  is_valid: true,
  error_count: 0,
  warning_count: 0,
  is_ready: true,
};

describe('<CtaButton />', () => {
  const doStartPreflight = jest.fn();
  const doStartJob = jest.fn();

  const setup = options => {
    const defaults = {
      plan: defaultPlan,
      user: { valid_token_for: 'foo' },
      preflight: defaultPreflight,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container } = render(
      <CtaButton
        plan={opts.plan}
        user={opts.user}
        preflight={opts.preflight}
        selectedSteps={new Set([1])}
        doStartPreflight={doStartPreflight}
        doStartJob={doStartJob}
      />,
    );
    return { getByText, container };
  };

  describe('no user', () => {
    test('renders login btn', () => {
      const { getByText } = setup({ user: null });

      expect(getByText('Log In to Start Pre-Install Validation')).toBeVisible();
    });
  });

  describe('unknown preflight', () => {
    test('renders loading btn', () => {
      const { getByText } = setup({ preflight: undefined });

      expect(getByText('Loading...')).toBeVisible();
    });
  });

  describe('no preflight', () => {
    test('renders start-preflight btn', () => {
      const { getByText } = setup({ preflight: null });

      expect(getByText('Start Pre-Install Validation')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: null,
          user: { valid_token_for: null },
        });

        expect(
          getByText('Log In to Start Pre-Install Validation'),
        ).toBeVisible();
      });
    });
  });

  describe('started preflight', () => {
    test('renders progress btn', () => {
      const { getByText } = setup({ preflight: { status: 'started' } });

      expect(getByText('Pre-Install Validation In Progress...')).toBeVisible();
    });
  });

  describe('complete preflight, no errors', () => {
    test('renders install btn', () => {
      const { getByText } = setup();

      expect(getByText('Install')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          user: { valid_token_for: null },
        });

        expect(getByText('Log In to Install')).toBeVisible();
      });
    });
  });

  describe('complete preflight, with errors', () => {
    test('renders re-run-preflight btn', () => {
      const { getByText } = setup({
        preflight: { status: 'complete', is_valid: true, error_count: 1 },
      });

      expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: { status: 'complete', is_valid: true, error_count: 1 },
          user: { valid_token_for: null },
        });

        expect(
          getByText('Log In to Re-Run Pre-Install Validation'),
        ).toBeVisible();
      });
    });
  });

  describe('failed preflight', () => {
    test('renders re-run-preflight btn', () => {
      const { getByText } = setup({
        preflight: { status: 'failed', is_valid: true, error_count: 0 },
      });

      expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: { status: 'failed', is_valid: true, error_count: 0 },
          user: { valid_token_for: null },
        });

        expect(
          getByText('Log In to Re-Run Pre-Install Validation'),
        ).toBeVisible();
      });
    });
  });

  describe('unknown preflight status', () => {
    test('renders nothing', () => {
      const { container } = setup({ preflight: { status: 'foo' } });

      expect(container.children).toHaveLength(0);
    });
  });

  describe('start-preflight click', () => {
    test('calls doStartPreflight with plan id', () => {
      const { getByText } = setup({ preflight: null });
      fireEvent.click(getByText('Start Pre-Install Validation'));

      expect(doStartPreflight).toHaveBeenCalledWith(1);
    });
  });

  describe('re-run-preflight click', () => {
    test('calls doStartPreflight with plan id', () => {
      const { getByText } = setup({
        preflight: { status: 'complete', is_valid: false, error_count: 0 },
      });
      fireEvent.click(getByText('Re-Run Pre-Install Validation'));

      expect(doStartPreflight).toHaveBeenCalledWith(1);
    });
  });

  describe('start-install click', () => {
    test('calls doStartJob with plan id and steps', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Install'));

      expect(doStartJob).toHaveBeenCalledWith({ plan: 1, steps: [1] });
    });
  });
});
