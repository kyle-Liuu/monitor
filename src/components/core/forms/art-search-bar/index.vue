<template>
  <section class="search-bar art-custom-card" :class="{ collapsed: isCollapsed }">
    <!-- 折叠状态下只显示展开图标 -->
    <div v-if="isCollapsed" class="collapsed-toggle" @click="isCollapsed = false">
      <el-icon>
        <Search />
      </el-icon>
    </div>

    <!-- 正常展示内容 -->
    <div v-else class="search-content">
      <el-form :model="filter" :label-position="props.labelPosition">
        <el-row class="search-form-row" :gutter="props.gutter">
          <el-col v-for="item in props.items" :key="item.prop" :xs="24" :sm="12" :md="item.elColSpan || props.elColSpan"
            :lg="item.elColSpan || props.elColSpan" :xl="item.elColSpan || props.elColSpan">
            <el-form-item :label="`${item.label}`" :prop="item.prop" :label-width="props.labelWidth">
              <component :is="getComponent(item.type)" v-model:value="filter[item.prop]" :item="item" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="props.elColSpan" :lg="props.elColSpan" :xl="props.elColSpan"
            class="action-column">
            <div class="action-buttons-wrapper">
              <div class="form-buttons">
                <el-button class="reset-button" @click="$emit('reset')" v-ripple>{{
                  $t('table.searchBar.reset')
                }}</el-button>
                <el-button type="primary" class="search-button" @click="$emit('search')" v-ripple>{{
                  $t('table.searchBar.search')
                }}</el-button>
              </div>
              <div class="filter-toggle" @click="isCollapsed = true">
                <div class="icon-wrapper">
                  <el-icon>
                    <ArrowUpBold />
                  </el-icon>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpBold, Search } from '@element-plus/icons-vue'
import { useWindowSize } from '@vueuse/core'
import ArtSearchInput from './widget/art-search-input/index.vue'
import ArtSearchSelect from './widget/art-search-select/index.vue'
import ArtSearchRadio from './widget/art-search-radio/index.vue'
import ArtSearchDate from './widget/art-search-date/index.vue'
import { SearchComponentType, SearchFormItem } from '@/types'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 500)

type FilterVo = string | number | undefined | null | unknown[]

interface PropsVO {
  filter: Record<string, FilterVo> // 查询参数
  items: SearchFormItem[] // 表单数据
  elColSpan?: number // 每列的宽度（基于 24 格布局）
  gutter?: number // 表单控件间隙
  isExpand?: boolean // 展开/收起
  labelPosition?: 'left' | 'right' // 表单域标签的位置
  labelWidth?: string // 文字宽度
  showExpand?: boolean // 是否需要展示，收起
  buttonLeftLimit?: number // 按钮靠左对齐限制（表单项小于等于该值时）
}

const props = withDefaults(defineProps<PropsVO>(), {
  elColSpan: 6,
  gutter: 12,
  isExpand: false,
  labelPosition: 'right',
  labelWidth: '70px',
  showExpand: true,
  buttonLeftLimit: 2
})

const emit = defineEmits<{
  (e: 'update:filter', filter: Record<string, FilterVo>): void
  (e: 'reset'): void
  (e: 'search'): void
}>()

const isCollapsed = ref(true) // 组件折叠状态

const filter = computed({
  get: () => props.filter,
  set: (val) => emit('update:filter', val)
})

const getComponent = (type: SearchComponentType): any => {
  const componentsMap: Record<string, any> = {
    input: ArtSearchInput,
    select: ArtSearchSelect,
    radio: ArtSearchRadio,
    datetime: ArtSearchDate,
    date: ArtSearchDate,
    daterange: ArtSearchDate,
    datetimerange: ArtSearchDate,
    month: ArtSearchDate,
    monthrange: ArtSearchDate,
    year: ArtSearchDate,
    yearrange: ArtSearchDate,
    week: ArtSearchDate
  }
  return componentsMap[type]
}
</script>

<style lang="scss" scoped>
.search-bar {
  background-color: var(--art-main-bg-color);
  border-radius: calc(var(--custom-radius) / 2 + 2px);
  transition: all 0.3s ease;

  &.collapsed {
    height: auto;
  }

  .collapsed-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding-right: 20px;
    color: var(--main-color);
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  .search-content {
    padding: 20px 20px 0;
  }

  :deep(.el-form-item__label) {
    display: flex;
    align-items: center;
    line-height: 20px;
  }

  .search-form-row {
    display: flex;
    flex-wrap: wrap;
  }

  .action-column {
    flex: 1;
    max-width: 100%;

    .action-buttons-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 12px;
    }

    .filter-toggle {
      display: flex;
      align-items: center;
      margin-left: 10px;
      line-height: 32px;
      color: var(--main-color);
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }

      .icon-wrapper {
        display: flex;
        align-items: center;
        font-size: 16px;
      }
    }
  }
}
</style>