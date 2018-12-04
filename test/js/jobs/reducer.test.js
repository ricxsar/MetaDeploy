import reducer from 'jobs/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = { 'job-1': null, 'job-2': { id: 'job-2' } };
    const expected = {};
    const actual = reducer(initial, {
      type: 'USER_LOGGED_OUT',
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_JOB_SUCCEEDED action', () => {
    const initial = { 'job-2': null };
    const expected = { 'job-2': null, 'job-1': { id: 'job-1' } };
    const actual = reducer(initial, {
      type: 'FETCH_JOB_SUCCEEDED',
      payload: { id: 'job-1', job: { id: 'job-1' } },
    });

    expect(actual).toEqual(expected);
  });

  test('handles JOB_STARTED action', () => {
    const initial = {};
    const expected = { 'job-1': { id: 'job-1' } };
    const actual = reducer(initial, {
      type: 'JOB_STARTED',
      payload: { id: 'job-1' },
    });

    expect(actual).toEqual(expected);
  });

  describe('JOB_STEP_COMPLETED action', () => {
    test('adds new job', () => {
      const initial = {};
      const expected = { 'job-1': { id: 'job-1' } };
      const actual = reducer(initial, {
        type: 'JOB_STEP_COMPLETED',
        payload: { job: { id: 'job-1' } },
      });

      expect(actual).toEqual(expected);
    });

    test('updates existing job', () => {
      const initial = {
        'job-1': { id: 'job-1', steps: ['step-1'], completed_steps: [] },
      };
      const expected = {
        'job-1': { ...initial['job-1'], completed_steps: ['step-1'] },
      };
      const actual = reducer(initial, {
        type: 'JOB_STEP_COMPLETED',
        payload: { step_id: 'step-1', job: { id: 'job-1' } },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores already-completed step', () => {
      const initial = {
        'job-1': {
          id: 'job-1',
          steps: ['step-1', 'step-2'],
          completed_steps: ['step-1'],
        },
      };
      const expected = {
        'job-1': { ...initial['job-1'], completed_steps: ['step-1'] },
      };
      const actual = reducer(initial, {
        type: 'JOB_STEP_COMPLETED',
        payload: { step_id: 'step-1', job: { id: 'job-1' } },
      });

      expect(actual).toEqual(expected);
    });

    test('ignores unknown step', () => {
      const initial = {
        'job-1': {
          id: 'job-1',
          steps: ['step-1'],
          completed_steps: [],
        },
      };
      const expected = { ...initial };
      const actual = reducer(initial, {
        type: 'JOB_STEP_COMPLETED',
        payload: { step_id: 'foo', job: { id: 'job-1' } },
      });

      expect(actual).toEqual(expected);
    });
  });

  test('handles JOB_COMPLETED action', () => {
    const initial = {};
    const expected = { 'job-1': { id: 'job-1' } };
    const actual = reducer(initial, {
      type: 'JOB_COMPLETED',
      payload: { id: 'job-1' },
    });

    expect(actual).toEqual(expected);
  });

  test('handles JOB_UPDATED action', () => {
    const initial = {};
    const expected = { 'job-1': { id: 'job-1' } };
    const actual = reducer(initial, {
      type: 'JOB_UPDATED',
      payload: { id: 'job-1' },
    });

    expect(actual).toEqual(expected);
  });
});