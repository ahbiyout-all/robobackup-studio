// Stub module for lightningcss to prevent environment-specific binary load errors
export function transform() {
  return { code: Buffer.from('') };
}

export function transformStyleAttribute() {
  return { code: Buffer.from('') };
}

export function bundle() {
  return { code: Buffer.from('') };
}

export default {
  transform,
  transformStyleAttribute,
  bundle,
};
