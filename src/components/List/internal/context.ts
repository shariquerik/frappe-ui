import { inject, type InjectionKey } from 'vue'
import type {
  ListColumnsContext,
  ListGroupContext,
  ListKey,
  ListRootContext,
} from '../types'

export const LIST_ROOT_CONTEXT: InjectionKey<ListRootContext<any>> = Symbol(
  'frappe-ui:list-root',
)

export const LIST_GROUP_CONTEXT: InjectionKey<ListGroupContext> = Symbol(
  'frappe-ui:list-group',
)

/**
 * Slice 4: <List.Columns> provides this to descendant <List.ColumnHeader>s.
 * Cells reach the same context via Root (one Columns block per Root), since
 * Cells render inside Items — outside the Columns DOM subtree.
 */
export const LIST_COLUMNS_CONTEXT: InjectionKey<ListColumnsContext> = Symbol(
  'frappe-ui:list-columns',
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

/**
 * Returns the live Columns context. Prefers the directly-injected provider
 * (descendants of <List.Columns>), falls back to the Root-registered one
 * (Cells inside Items). Throws when no <List.Columns> is present.
 */
export function useListColumnsContext(
  consumer: string,
  root: ListRootContext<any>,
): ListColumnsContext {
  const direct = inject(LIST_COLUMNS_CONTEXT, null)
  if (direct) return direct
  const fromRoot = root.columns.value
  if (!fromRoot) {
    throw new Error(
      `[List] <${consumer}> must be used inside <List.Root> with a <List.Columns> block.`,
    )
  }
  return fromRoot
}
