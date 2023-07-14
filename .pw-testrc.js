import FS from 'node:fs'
import { pathToFileURL } from 'node:url'

// Adds a esbuild plugin so we can resolve file URLs relative to the
// import.meta.url property.

export default {
  buildConfig: {
    plugins: [
      {
        name: 'import.meta.url',
        setup({ onLoad }) {
          onLoad({ filter: /\.js|\.ts/, namespace: 'file' }, (args) => {
            let code = FS.readFileSync(args.path, 'utf8')
            code = code.replace(
              /import\.meta\.url/g,
              JSON.stringify(pathToFileURL(args.path))
            )
            return { contents: code }
          })
        },
      },
    ],
  },
}
