<template>
  <div class="tag-cascader">
    <n-cascader
        :clearable="clearable"
        :cascade="false"
        :check-strategy="'all'"
        :disabled="disabled"
        :expand-trigger="'hover'"
        :filterable="filterable"
        :loading="loading"
        :max-tag-count="maxTagCount"
        :multiple="multiple"
        :options="options"
        :placeholder="resolvedPlaceholder"
        :show-path="false"
        :size="size"
        :value="ids"
        @update:value="handleUpdate"
    />
    <p v-if="showCount && multiple" class="count-hint" :class="{ reached: ids.length >= maxCount }">
      已选择 {{ ids.length }} / {{ maxCount }} 个标签
    </p>
  </div>
</template>

<script lang="ts" setup>
// 项目标签 Cascader：投稿 / 项目编辑 / 项目墙筛选共用。
// 数据源 GET /api/project/tags/tree（公开 Tag 字典，父子层级）。
// - selectable=false 的分组节点保持可展开，但在回写前过滤，不能被项目直接选择；
// - cascade=false：每个标签独立勾选（不会因勾选分组而连带选中子节点）；
// - 多选模式下受 maxCount（默认 10，对标后端 MAX_TAGS_PER_PROJECT）限制，超限时拦截并提示。
// v-model 始终是扁平的 tagIds 数组（兼容 Naive UI 不同 check-strategy 的输出形态）。
import type {TagTreeNode} from "~/types/projectHub";

const props = withDefaults(defineProps<{
  modelValue?: Array<number | string>;
  // 最多可选标签数（仅 multiple 生效）；项目表单 10，项目墙筛选可传一个大数 + showCount=false
  maxCount?: number;
  multiple?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  filterable?: boolean;
  showCount?: boolean;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  maxTagCount?: number | "responsive";
}>(), {
  modelValue: () => [],
  maxCount: 10,
  multiple: true,
  disabled: false,
  clearable: true,
  filterable: true,
  showCount: true,
  placeholder: "",
  size: "medium",
  maxTagCount: "responsive",
});

const emit = defineEmits<{
  "update:modelValue": [ids: Array<number | string>];
}>();

const message = useMessage();
const {loadTagTree} = useProjectHubApi();

const tree = ref<TagTreeNode[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    tree.value = await loadTagTree();
  } catch (error) {
    tree.value = [];
    message?.error(error instanceof Error && error.message ? error.message : "加载标签失败，请稍后重试");
  } finally {
    loading.value = false;
  }
});

interface CascaderOption {
  label: string;
  value: number | string;
  selectable: boolean;
  children?: CascaderOption[];
}

// 分组节点不能 disabled，否则 hover/click 都无法展开；是否可选在回写时单独校验。
const toOptions = (nodes: TagTreeNode[]): CascaderOption[] =>
    nodes.map((node) => {
      const children = node.children?.length ? toOptions(node.children) : undefined;
      return {
        label: node.name,
        value: node.id,
        selectable: node.selectable,
        ...(children ? {children} : {}),
      };
    });

const options = computed<CascaderOption[]>(() => toOptions(tree.value));

const selectableIds = computed(() => {
  const ids = new Set<string>();
  const collect = (nodes: TagTreeNode[]) => {
    for (const node of nodes) {
      if (node.selectable) {
        ids.add(String(node.id));
      }
      if (node.children?.length) {
        collect(node.children);
      }
    }
  };
  collect(tree.value);
  return ids;
});

// 兼容历史路径数组形态，并确保分组节点永远不会进入 v-model。
const normalizeIds = (val: unknown): Array<number | string> => {
  if (!Array.isArray(val)) {
    return [];
  }
  return val.flatMap((entry) => {
    if (Array.isArray(entry)) {
      return entry.length ? [entry[entry.length - 1]] : [];
    }
    return entry == null ? [] : [entry];
  }).filter((id) => selectableIds.value.has(String(id)));
};

const ids = computed(() => normalizeIds(props.modelValue));

const resolvedPlaceholder = computed(() =>
    props.placeholder || (props.multiple ? "选择项目标签（最多 " + props.maxCount + " 个）" : "选择标签"),
);

const handleUpdate = (val: unknown) => {
  const next = normalizeIds(val);
  // 多选模式超限时拦截：不回写、不抛错，仅提示，保留已有选择
  if (props.multiple && next.length > props.maxCount) {
    message?.warning(`最多只能选择 ${props.maxCount} 个标签`);
    return;
  }
  emit("update:modelValue", next);
};
</script>

<style scoped>
.tag-cascader {
  width: 100%;
}

.count-hint {
  margin: 6px 0 0;
  color: #795b36;
  font-size: 12px;
  font-weight: 700;
}

.count-hint.reached {
  color: #a14a3b;
}
</style>
