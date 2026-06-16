module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx http-server . -p 4173 -c-1',
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.95 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-byte-weight': ['warn', { maxNumericValue: 1250000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
