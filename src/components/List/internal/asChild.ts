/**
 * `as` / `asChild` element-type override is delegated to reka-ui's
 * <Primitive>. This module is a thin facade so primitives import from one
 * place and downstream changes (e.g. swapping the underlying implementation)
 * stay local.
 */
export { Primitive } from 'reka-ui'
export type { PrimitiveProps } from 'reka-ui'
