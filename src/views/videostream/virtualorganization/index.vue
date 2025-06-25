<template>
  <ArtTableFullScreen>
    <div class="virtual-org-root" id="table-full-screen">
      <ElSplitter>
        <!-- 左侧组织树 -->
        <ElSplitterPanel :min="250" :size="300" collapsible>
          <div class="org-tree-panel">
            <div class="org-tree-card">
              <el-input v-model="orgSearch" placeholder="请输入区域名称" size="large" clearable @input="filterOrgTree"
                class="org-search-input">
                <template #prefix>
                  <el-icon>
                    <ElSearch />
                  </el-icon>
                </template>
              </el-input>
              <div class="org-tree-scroll">
                <ElTree :data="filteredTreeData" :props="treeProps" @node-click="handleNodeClick" default-expand-all
                  node-key="id" highlight-current class="org-tree" />
              </div>
            </div>
          </div>
        </ElSplitterPanel>
        <!-- 右侧区域直接嵌入StreamInfo页面 -->
        <ElSplitterPanel :min="600">
          <StreamInfo :org-id="selectedOrgId" />
        </ElSplitterPanel>
      </ElSplitter>
    </div>
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElSplitter, ElSplitterPanel, ElTree, ElInput, ElIcon } from 'element-plus'
import { Search as ElSearch } from '@element-plus/icons-vue'
import StreamInfo from '@/views/videostream/streaminfo/index.vue'
import { ORG_TREE_MOCK, OrgNode } from '@/mock/temp/orgTree'

const orgSearch = ref('')
const treeProps = { children: 'children', label: 'name' }
const treeData = ref<OrgNode[]>(ORG_TREE_MOCK)
const filteredTreeData = ref<OrgNode[]>(ORG_TREE_MOCK)
const selectedOrgId = ref(treeData.value[0]?.id || '')

function filterOrgTree() {
  if (!orgSearch.value) {
    filteredTreeData.value = treeData.value
    return
  }
  const keyword = orgSearch.value.toLowerCase()
  function filter(nodes: OrgNode[]): OrgNode[] {
    const res: OrgNode[] = []
    for (const node of nodes) {
      const children = node.children ? filter(node.children) : undefined
      if (
        (node.name || '').toLowerCase().includes(keyword) ||
        (children && children.length > 0)
      ) {
        res.push({ ...node, children })
      }
    }
    return res
  }
  filteredTreeData.value = filter(treeData.value)
}

function handleNodeClick(data: OrgNode) {
  selectedOrgId.value = data.id
}
</script>

<style lang="scss" scoped>
.virtual-org-root {
  min-width: 1200px;
  background: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.org-tree-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.org-tree-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--art-main-bg-color);
  border-radius: calc(var(--custom-radius) / 2 + 2px);
  border: 1px solid var(--art-card-border) !important;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  margin-right: 6px;
  overflow: hidden;
  padding: 1px !important;
}

.org-search-input {
  max-width: 220px;
  margin: 12px;

  .el-input__wrapper {
    background: transparent;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: none;
    transition: border-color 0.2s;
  }

  .el-input__wrapper.is-focus {
    border-color: var(--el-color-primary);
  }

  input {
    color: #fff;
    background: transparent;

    &::placeholder {
      color: #8a8a8a;
      opacity: 1;
    }
  }

  .el-input__prefix {
    color: #8a8a8a;
  }
}

.org-tree-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 8px 8px 8px;
}

.org-tree {
  background: transparent;
  font-size: 15px;

  :deep(.el-tree-node__content) {
    border-radius: 6px;
    margin-bottom: 2px;
    transition: background 0.2s;

    &:hover {
      background: var(--el-color-primary-light-9);
    }

    &.is-current {
      background: var(--el-color-primary-light-7);
      color: var(--el-color-primary);
    }
  }
}
</style>

<style>
.el-splitter-bar__dragger-horizontal::before {
  display: none !important;
  content: none !important;
}
</style>
