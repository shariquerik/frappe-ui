import { defineComponent, h } from 'vue'
import ListView from '../ListView/ListView.vue'
import { warnDeprecated } from '../../utils/warnDeprecated'
import ListRoot from './primitives/ListRoot.vue'
import ListItem from './primitives/ListItem.vue'

// Legacy shape: `<List ...>` rendered the old ListView. The name now belongs
// to the new compound namespace, so direct usage of <List> emits a one-time
// deprecation warning per P13 while continuing to render the old component.
const LegacyList = defineComponent({
  name: 'List',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    return () => {
      warnDeprecated(
        '<List> (rendering ListView)',
        '<ListView> directly, or migrate to <List.Root> + <List.Item>',
        'docs/components/list',
      )
      return h(ListView as any, attrs, slots)
    }
  },
})

export const List = Object.assign(LegacyList, {
  Root: ListRoot,
  Item: ListItem,
})

export type {
  ListKey,
  ListSelection,
  ListAriaMode,
  ListItemEntry,
  ListRootContext,
  ListRootProps,
  ListItemProps,
  ListReorderPayload,
  ListDropZoneContext,
} from './types'
