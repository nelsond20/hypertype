import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x',
    }),
    paths: {
      relative: false,
    },
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'style-src': ['self'],
        'style-src-attr': ['unsafe-inline'],
        'img-src': ['self', 'data:'],
        'font-src': ['self'],
        'connect-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
      },
    },
  },
};

export default config;
