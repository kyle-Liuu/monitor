<template>
  <ArtTableFullScreen>
    <div class="virtual-org-root" id="table-full-screen">
      <ElSplitter>
        <!-- 左侧组织树 -->
        <ElSplitterPanel :min="260" :size="260" collapsible>
          <div class="org-tree-panel">
            <div class="org-tree-card">
              <el-input v-model="orgSearch" placeholder="请输入区域名称" size="large" clearable @input="filterOrgTree"
                class="org-search-input">
                <template #prefix>
                  <el-icon>
                    <ElSearch />
                  </el-icon>
                </template>
                <template #append>
                  <el-icon v-if="loading" class="is-loading">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-029747aa="">
                      <path fill="currentColor"
                        d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z">
                      </path>
                    </svg>
                  </el-icon>
                </template>
              </el-input>
              <div class="org-tree-scroll">
                <ElTree :data="filteredTreeData" :props="treeProps" @node-click="handleNodeClick" default-expand-all
                  node-key="id" highlight-current :current-node-key="selectedOrgId" class="org-tree"
                  :empty-text="orgSearch ? '未找到匹配的组织' : '暂无组织数据'" />
              </div>
            </div>
          </div>
        </ElSplitterPanel>
        <ElSplitterPanel :min="600">
          <VirtualOrgAndStream ref="virtualOrgStreamRef" :org-id="selectedOrgId" />
        </ElSplitterPanel>
      </ElSplitter>
    </div>
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElSplitter, ElSplitterPanel, ElTree, ElInput, ElIcon, ElMessage } from 'element-plus'
import { Search as ElSearch } from '@element-plus/icons-vue'
import VirtualOrgAndStream from '@/views/videostream/virtualorganization/vittualOrgAndStream.vue'
import { ORG_TREE_MOCK, OrgNode } from '@/mock/temp/orgTree'

const orgSearch = ref('')
const treeProps = { children: 'children', label: 'name' }
const treeData = ref<OrgNode[]>(ORG_TREE_MOCK)
const filteredTreeData = ref<OrgNode[]>(ORG_TREE_MOCK)
const selectedOrgId = ref(treeData.value[0]?.id || '')
const loading = ref(false)
const virtualOrgStreamRef = ref()

function filterOrgTree() {
  if (!orgSearch.value) {
    filteredTreeData.value = treeData.value
    return
  }

  loading.value = true
  setTimeout(() => {
    try {
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
    } catch (err) {
      console.error('过滤组织树出错:', err)
      ElMessage.error('搜索出错，请重试')
      filteredTreeData.value = treeData.value
    } finally {
      loading.value = false
    }
  }, 100)
}

function handleNodeClick(data: OrgNode) {
  if (data.id === selectedOrgId.value) return

  selectedOrgId.value = data.id
  // 刷新右侧视频流列表
  nextTick(() => {
    if (virtualOrgStreamRef.value && virtualOrgStreamRef.value.getTableData) {
      virtualOrgStreamRef.value.getTableData()
    }
  })
}

// 初始化时确保有默认选中的组织
onMounted(() => {
  if (!selectedOrgId.value && treeData.value.length > 0) {
    selectedOrgId.value = treeData.value[0].id
  }
})
</script>

<style lang="scss" scoped>
.virtual-org-root {
  width: 100%;
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
  max-width: 90%;
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

/* 响应式适配 */
@media screen and (max-width: 1400px) {
  .org-tree {
    font-size: 14px;
  }
}

@media screen and (max-width: 1200px) {
  .org-search-input {
    margin: 8px;
  }
}
</style>

<style>
.el-splitter-bar__dragger-horizontal::before {
  display: none !important;
  content: none !important;
}
</style>
