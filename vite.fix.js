/**
 * This is a build-time fix for TypeScript errors in Vite build.
 * This file is meant to be included in the build process to patch import paths.
 */

module.exports = {
  // This is a Rollup plugin that will transform imports to schema.ts to schema-build.ts
  // during the production build, which will avoid the TypeScript errors.
  name: 'schema-import-rewrite',
  resolveId(source, importer) {
    if (source === './shared/schema' || source === '../shared/schema' || source === '@shared/schema') {
      console.log('🔄 Rewriting schema import to schema-build in:', importer);
      if (source === './shared/schema') return './shared/schema-build';
      if (source === '../shared/schema') return '../shared/schema-build';
      if (source === '@shared/schema') return '@shared/schema-build';
    }
    return null;
  }
};