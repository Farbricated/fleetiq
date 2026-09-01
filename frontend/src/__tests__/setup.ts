import '@testing-library/jest-dom';

// Mock fetch globally
globalThis.fetch = vi.fn();

// Utility to mock a fetch response
export function mockFetchResponse(data: unknown, ok = true) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
  });
}

// Reset fetch mock before each test
beforeEach(() => {
  vi.clearAllMocks();
});
