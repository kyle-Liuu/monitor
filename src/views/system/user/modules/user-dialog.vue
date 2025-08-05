<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="formData.username" :disabled="dialogType === 'edit'" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="formData.email" type="email" />
      </ElFormItem>
      <ElFormItem label="姓名" prop="fullName">
        <ElInput v-model="formData.fullName" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="mobile">
        <ElInput v-model="formData.mobile" />
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add'" label="密码" prop="password">
        <ElInput v-model="formData.password" type="password" show-password />
      </ElFormItem>
      <ElFormItem label="性别" prop="gender">
        <ElSelect v-model="formData.gender">
          <ElOption
            v-for="option in userGenderOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色" prop="roles">
        <ElSelect v-model="formData.roles" multiple>
          <ElOption
            v-for="role in rolesList"
            :key="role.role_id"
            :value="role.role_code"
            :label="role.role_name"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="标签" prop="tags">
        <ElSelect v-model="formData.tags" multiple allow-create filterable>
          <ElOption v-for="tag in commonTags" :key="tag" :value="tag" :label="tag" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态" prop="isActive">
        <ElSwitch v-model="formData.isActive" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '提交' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { UserService } from '@/api/usersApi'
  import { useOptions } from '@/composables/useOptions'

  interface Props {
    visible: boolean
    type: string
    userData?: any
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 使用统一选项管理
  const { userGenderOptions, rolesList, fetchRoles, rolesLoading } = useOptions()

  // 加载状态
  const submitting = ref(false)

  // 通用标签数据
  const commonTags = ref(['VIP用户', '测试用户', '临时用户', '系统用户'])

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    username: '',
    email: '',
    fullName: '',
    mobile: '',
    password: '',
    gender: '男',
    roles: [] as string[],
    tags: [] as string[],
    isActive: true
  })

  // 表单验证规则
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    mobile: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    roles: [{ required: true, message: '请选择角色', trigger: 'blur' }]
  }

  // 初始化表单数据
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    if (isEdit) {
      Object.assign(formData, {
        username: row.userName || '',
        email: row.userEmail || '',
        fullName: row.nickName || '',
        mobile: row.userPhone || '',
        password: '', // 编辑时不显示密码
        gender: row.userGender || '男',
        roles: Array.isArray(row.userRoles) ? row.userRoles : [],
        tags: Array.isArray(row.userTags) ? row.userTags : [],
        isActive: row.status === '1'
      })
    } else {
      // 重置为默认值
      Object.assign(formData, {
        username: '',
        email: '',
        fullName: '',
        mobile: '',
        password: '',
        gender: '男',
        roles: [],
        tags: [],
        isActive: true
      })
    }
  }

  // 统一监听对话框状态变化
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        initFormData()
        fetchRoles() // 直接使用统一的 fetchRoles
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    const valid = await new Promise((resolve) => {
      formRef.value?.validate((valid) => resolve(valid))
    })

    if (!valid) return

    try {
      submitting.value = true

      if (dialogType.value === 'add') {
        // 创建用户
        const createData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          mobile: formData.mobile,
          tags: formData.tags, // API期望string[]类型
          roles: formData.roles, // API期望string[]类型
          is_active: formData.isActive
        }

        await UserService.createUser(createData)
        ElMessage.success('用户创建成功')
      } else {
        // 更新用户
        const updateData = {
          username: formData.username,
          email: formData.email,
          full_name: formData.fullName,
          mobile: formData.mobile,
          tags: formData.tags, // API期望string[]类型
          roles: formData.roles, // API期望string[]类型
          is_active: formData.isActive
        }

        await UserService.updateUser(props.userData.id, updateData)
        ElMessage.success('用户更新成功')
      }

      dialogVisible.value = false
      emit('submit')
    } catch (error: any) {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  }
</script>
