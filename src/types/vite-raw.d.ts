// Vite's `?raw` import suffix returns the file's contents as a string at build time.
// Used by ChangelogComposer.test.tsx to source-scan the component without touching
// node:fs, which gets externalized to a browser stub under the jsdom vitest environment.
declare module '*?raw' {
  const content: string
  export default content
}
