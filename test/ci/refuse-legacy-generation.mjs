import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

function refuse(url) {
  if (url.protocol === 'file:' && /(?:^|[\\/])scripts[\\/]generate\.mjs$/u.test(fileURLToPath(url))) {
    throw new Error('The retired generation scheduler was resolved');
  }
}

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) {
      refuse(new URL(specifier, context.parentURL ?? pathToFileURL(`${process.cwd()}/`)));
    }
    const result = next(specifier, context);
    refuse(new URL(result.url));
    return result;
  },
});
