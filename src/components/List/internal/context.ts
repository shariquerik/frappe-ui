import { inject, type InjectionKey } from 'vue'
import type { ListRootContext, ListKey } from '../types'

export const LIST_ROOT_CONTEXT: InjectionKey<ListRootContext<any>> = Symbol(
  'frappe-ui:list-root',
)

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
