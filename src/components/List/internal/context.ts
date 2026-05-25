import { inject, type InjectionKey } from 'vue'
import type { ListDropZoneContext, ListRootContext, ListKey } from '../types'

export const LIST_ROOT_CONTEXT: InjectionKey<ListRootContext<any>> = Symbol(
  'frappe-ui:list-root',
)

/**
 * Optional drop-zone context. Provided by <List.Group> in Slice 3 so
 * <List.Item :draggable> can reject drops into a collapsed group. Not
 * provided in Slices 1/2/5 — the inject simply returns `null` and the
 * drop proceeds normally.
 */
export const LIST_DROP_ZONE_CONTEXT: InjectionKey<ListDropZoneContext> =
  Symbol('frappe-ui:list-drop-zone')

export function useListRootContext<Key extends ListKey = ListKey>(
  consumer: string,
): ListRootContext<Key> {
  const ctx = inject(LIST_ROOT_CONTEXT, null)
  if (!ctx) {
    throw new Error(
      `[List] <${consumer}> must be used inside <List.Root>.`,
    )
  }
  return ctx as ListRootContext<Key>
}

/**
 * Returns the enclosing drop-zone context if any. Returns `null` when an
 * item lives outside a <List.Group> — callers must treat that as "no
 * collapse restrictions apply."
 */
export function useListDropZoneContext(): ListDropZoneContext | null {
  return inject(LIST_DROP_ZONE_CONTEXT, null)
}
