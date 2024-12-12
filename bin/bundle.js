const { build } = await import('esbuild')
await build({
  bundle: true,
  entryPoints: ['./src/**/*.ts'],
  format: 'esm',
  inject: ['./bin/cjs-shims.js'],
  loader: { '.node': 'copy' },
  outdir: './dist',
  platform: 'node',
  plugins: [],
  splitting: false,
  treeShaking: true,
})
