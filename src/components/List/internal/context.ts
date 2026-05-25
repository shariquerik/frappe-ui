import { inject, type InjectionKey } from 'vue'
import type { ListGroupContext, ListRootContext, ListKey } from '../types'

export const LIST_ROOT_CONTEXT: InjectionKey<ListRootContext<any>> = Symbol(
  'frappe-ui:list-root',
)

export const LIST_GROUP_CONTEXT: InjectionKey<ListGroupContext> = Symbol(
  'frappe-ui:list-group',
)

export function useListRootContext<Key extends ListKey = ListKey>(
  consumer: string,
): ListRootContext<Key> {
  const ctx = inject(LIST_ROOT_CONTEXT, null)
  if (!ctx) {
    throw new Error(`[List] <${consumer}> must be used inside <List.Root>.`)
  }
  return ctx as ListRootContext<Key>
}

/**
 * Optional — returns `null` when an item lives outside any <List.Group>.
 * Used by <List.Item> to register its `groupId` and by <List.GroupLabel> to
 * claim the group's `aria-labelledby` id.
 */
export function useListGroupContext(): ListGroupContext | null {
  return inject(LIST_GROUP_CONTEXT, null)
}
