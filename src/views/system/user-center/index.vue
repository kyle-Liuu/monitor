<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.webp" />
          <div class="avatar-wrapper">
            <img class="avatar" :src="currentUserInfo.avatar || '@imgs/user/avatar.webp'" />
            <div class="avatar-upload" @click="triggerAvatarUpload">
              <i class="iconfont-sys">&#xe603;</i>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarUpload"
            />
          </div>
          <h2 class="name">{{ currentUserInfo.userName || '用户' }}</h2>
          <p class="des">{{ form.des || '这个人很懒，什么都没留下~' }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont-sys">&#xe72e;</i>
              <span>{{ currentUserInfo.email || '未设置邮箱' }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe608;</i>
              <span>{{ getRoleDisplayName() }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe736;</i>
              <span>{{ form.address || '未设置地址' }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe811;</i>
              <span>{{ form.company || '未设置公司信息' }}</span>
            </div>
          </div>

          <div class="lables">
            <h3>标签</h3>
            <div>
              <div v-for="tag in userTags" :key="tag">
                {{ tag }}
              </div>
            </div>
          </div>

          <div class="greeting">
            <h3>{{ date }}，{{ currentUserInfo.userName || '用户' }}！</h3>
            <p>今天也要努力工作哦~</p>
          </div>
        </div>
      </div>

      <div class="right-wrap">
        <div class="info box-style">
          <h1 class="title">基本设置</h1>

          <ElForm
            :model="form"
            class="form"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem label="姓名" prop="full_name">
                <ElInput v-model="form.full_name" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="性别" prop="gender" class="right-input">
                <ElSelect v-model="form.gender" placeholder="请选择性别" :disabled="!isEdit">
                  <ElOption
                    v-for="item in genderOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="用户名" prop="username">
                <ElInput v-model="form.username" disabled />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="right-input">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机" prop="mobile">
                <ElInput v-model="form.mobile" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="地址" prop="address" class="right-input">
                <ElInput v-model="form.address" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="公司" prop="company">
                <ElInput v-model="form.company" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="标签" prop="tags" class="right-input">
                <ElSelect
                  v-model="form.tags"
                  multiple
                  allow-create
                  filterable
                  :disabled="!isEdit"
                  placeholder="选择或输入标签"
                >
                  <ElOption v-for="tag in commonTags" :key="tag" :value="tag" :label="tag" />
                </ElSelect>
              </ElFormItem>
            </ElRow>

            <ElFormItem label="个人介绍" prop="des" :style="{ height: '130px' }">
              <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton v-if="isEdit" @click="cancelEdit" style="width: 90px; margin-right: 10px">
                取消
              </ElButton>
              <ElButton
                type="primary"
                style="width: 90px"
                v-ripple
                @click="handleEditProfile"
                :loading="updating"
              >
                {{ isEdit ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="info box-style" style="margin-top: 20px">
          <h1 class="title">更改密码</h1>

          <ElForm
            :model="pwdForm"
            class="form"
            ref="pwdFormRef"
            :rules="pwdRules"
            label-width="86px"
            label-position="top"
          >
            <ElFormItem label="当前密码" prop="currentPassword">
              <ElInput
                v-model="pwdForm.currentPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
                placeholder="请输入当前密码"
              />
            </ElFormItem>

            <ElFormItem label="新密码" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
                placeholder="请输入新密码"
              />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
                placeholder="请确认新密码"
              />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton
                v-if="isEditPwd"
                @click="cancelEditPwd"
                style="width: 90px; margin-right: 10px"
              >
                取消
              </ElButton>
              <ElButton
                type="primary"
                style="width: 90px"
                v-ripple
                @click="handleEditPassword"
                :loading="updatingPwd"
              >
                {{ isEditPwd ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { UserService } from '@/api/usersApi'
  import { useOptions } from '@/composables/useOptions'
  import { ElForm, ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  // 使用统一选项管理
  const { userGenderOptions } = useOptions()

  const userStore = useUserStore()
  const currentUserInfo = computed(() => userStore.getUserInfo)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const updating = ref(false)
  const updatingPwd = ref(false)
  const date = ref('')
  const avatarInput = ref<HTMLInputElement>()

  // 基本信息表单
  const form = reactive({
    username: '',
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    company: '',
    gender: '男',
    tags: [] as string[],
    des: ''
  })

  // 密码修改表单
  const pwdForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const ruleFormRef = ref<FormInstance>()
  const pwdFormRef = ref<FormInstance>()

  // 基本信息验证规则
  const rules = reactive<FormRules>({
    full_name: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    mobile: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }]
  })

  // 密码修改验证规则
  const pwdRules = reactive<FormRules>({
    currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== pwdForm.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  })

  // 性别选项使用统一管理
  const genderOptions = userGenderOptions

  const commonTags = ref(['专注设计', '很有想法', '技术专家', '团队协作', '创新思维', '沟通能力强'])

  // 计算用户标签
  const userTags = computed(() => {
    if (form.tags && form.tags.length > 0) {
      return form.tags
    }
    return ['新用户', '待完善']
  })

  // 获取角色显示名称
  const getRoleDisplayName = () => {
    const roles = currentUserInfo.value.roles || []
    const roleNames = {
      R_SUPER: '超级管理员',
      R_ADMIN: '管理员',
      R_USER: '普通用户'
    }

    if (roles.length === 0) return '未分配角色'

    const displayNames = roles.map((role) => roleNames[role as keyof typeof roleNames] || role)
    return displayNames.join(', ')
  }

  // 初始化用户信息
  const initUserInfo = () => {
    const userInfo = currentUserInfo.value
    Object.assign(form, {
      username: userInfo.userName || '',
      full_name: userInfo.fullName || '',
      email: userInfo.email || '',
      mobile: userInfo.mobile || '',
      address: '', // 从用户信息中获取，如果有的话
      company: '', // 从用户信息中获取，如果有的话
      gender: '男', // 默认值，可以从用户信息中获取
      tags: userInfo.tags || [],
      des: '' // userInfo中没有description字段，使用默认空值
    })
  }

  // 初始化时间问候
  const initGreeting = () => {
    const d = new Date()
    const h = d.getHours()
    let text = ''

    if (h >= 6 && h < 9) {
      text = '早上好'
    } else if (h >= 9 && h < 11) {
      text = '上午好'
    } else if (h >= 11 && h < 13) {
      text = '中午好'
    } else if (h >= 13 && h < 18) {
      text = '下午好'
    } else if (h >= 18 && h < 24) {
      text = '晚上好'
    } else if (h >= 0 && h < 6) {
      text = '很晚了，早点休息'
    }

    date.value = text
  }

  // 处理基本信息编辑
  const handleEditProfile = async () => {
    if (!isEdit.value) {
      isEdit.value = true
      return
    }

    // 保存操作
    if (!ruleFormRef.value) return

    const valid = await new Promise((resolve) => {
      ruleFormRef.value?.validate((valid) => resolve(valid))
    })

    if (!valid) return

    try {
      updating.value = true

      const updateData = {
        full_name: form.full_name,
        email: form.email,
        mobile: form.mobile,
        tags: form.tags
      }

      const userId = currentUserInfo.value.userId
      if (!userId) {
        ElMessage.error('用户ID不存在')
        return
      }

      await UserService.updateUser(userId, updateData)

      // 更新store中的用户信息（如果有刷新方法的话）
      // await userStore.refreshUserInfo()

      ElMessage.success('个人信息更新成功')
      isEdit.value = false
    } catch (error: any) {
      console.error('更新用户信息失败:', error)
      ElMessage.error(error.message || '更新失败')
    } finally {
      updating.value = false
    }
  }

  // 取消基本信息编辑
  const cancelEdit = () => {
    isEdit.value = false
    initUserInfo() // 重置表单数据
    ruleFormRef.value?.clearValidate()
  }

  // 处理密码修改
  const handleEditPassword = async () => {
    if (!isEditPwd.value) {
      isEditPwd.value = true
      return
    }

    // 保存操作
    if (!pwdFormRef.value) return

    const valid = await new Promise((resolve) => {
      pwdFormRef.value?.validate((valid) => resolve(valid))
    })

    if (!valid) return

    try {
      updatingPwd.value = true

      const userId = currentUserInfo.value.userId
      if (!userId) {
        ElMessage.error('用户ID不存在')
        return
      }

      await UserService.resetUserPassword(userId, {
        newPassword: pwdForm.newPassword
      })

      ElMessage.success('密码修改成功')
      isEditPwd.value = false

      // 清空密码表单
      Object.assign(pwdForm, {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      console.error('修改密码失败:', error)
      ElMessage.error(error.message || '修改密码失败')
    } finally {
      updatingPwd.value = false
    }
  }

  // 取消密码编辑
  const cancelEditPwd = () => {
    isEditPwd.value = false
    Object.assign(pwdForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    pwdFormRef.value?.clearValidate()
  }

  // 触发头像上传
  const triggerAvatarUpload = () => {
    avatarInput.value?.click()
  }

  // 处理头像上传
  const handleAvatarUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }

    // 检查文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过2MB')
      return
    }

    try {
      // 这里应该调用头像上传API
      // const formData = new FormData()
      // formData.append('avatar', file)
      // await UserService.uploadAvatar(formData)

      // 临时使用本地预览
      const reader = new FileReader()
      reader.onload = (e) => {
        // 更新头像显示
        console.log('头像上传功能待实现')
        ElMessage.success('头像上传成功（演示）')
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('头像上传失败:', error)
      ElMessage.error(error.message || '头像上传失败')
    }
  }

  onMounted(() => {
    initGreeting()
    initUserInfo()
  })

  // 监听用户信息变化
  watch(
    currentUserInfo,
    () => {
      initUserInfo()
    },
    { immediate: true }
  )
</script>

<style lang="scss">
  .user {
    .icon {
      width: 1.4em;
      height: 1.4em;
      overflow: hidden;
      vertical-align: -0.15em;
      fill: currentcolor;
    }
  }
</style>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;

    $box-radius: calc(var(--custom-radius) + 4px);

    .box-style {
      border: 1px solid var(--art-border-color);
    }

    .content {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;

      .left-wrap {
        width: 450px;
        margin-right: 25px;

        .user-wrap {
          position: relative;
          height: 600px;
          padding: 35px 40px;
          overflow: hidden;
          text-align: center;
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200px;
            object-fit: cover;
          }

          .avatar-wrapper {
            position: relative;
            display: inline-block;
            margin-top: 120px;

            .avatar {
              position: relative;
              z-index: 10;
              width: 80px;
              height: 80px;
              object-fit: cover;
              border: 2px solid #fff;
              border-radius: 50%;
            }

            .avatar-upload {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 24px;
              height: 24px;
              background: var(--el-color-primary);
              border: 2px solid #fff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: #fff;
              font-size: 12px;
              transition: all 0.3s;

              &:hover {
                background: var(--el-color-primary-light-3);
              }
            }
          }

          .name {
            margin-top: 20px;
            font-size: 22px;
            font-weight: 400;
          }

          .des {
            margin-top: 20px;
            font-size: 14px;
            color: var(--art-text-gray-600);
          }

          .outer-info {
            width: 300px;
            margin: auto;
            margin-top: 30px;
            text-align: left;

            > div {
              margin-top: 10px;

              span {
                margin-left: 8px;
                font-size: 14px;
              }
            }
          }

          .lables {
            margin-top: 40px;

            h3 {
              font-size: 15px;
              font-weight: 500;
            }

            > div {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              margin-top: 15px;

              > div {
                padding: 3px 6px;
                margin: 0 10px 10px 0;
                font-size: 12px;
                background: var(--art-main-bg-color);
                border: 1px solid var(--art-border-color);
                border-radius: 2px;
              }
            }
          }

          .greeting {
            margin-top: 20px;

            h3 {
              font-size: 16px;
              font-weight: 500;
              color: var(--el-color-primary);
            }

            p {
              margin-top: 8px;
              font-size: 12px;
              color: var(--art-text-gray-500);
            }
          }
        }
      }

      .right-wrap {
        flex: 1;
        overflow: hidden;
        border-radius: $box-radius;

        .info {
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .title {
            padding: 15px 25px;
            font-size: 20px;
            font-weight: 400;
            color: var(--art-text-gray-800);
            border-bottom: 1px solid var(--art-border-color);
          }

          .form {
            box-sizing: border-box;
            padding: 30px 25px;

            > .el-row {
              .el-form-item {
                width: calc(50% - 10px);
              }

              .el-input,
              .el-select {
                width: 100%;
              }
            }

            .right-input {
              margin-left: 20px;
            }

            .el-form-item-right {
              display: flex;
              align-items: center;
              justify-content: end;

              .el-button {
                width: 110px !important;
              }
            }
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-ipad-vertical) {
    .page-content {
      .content {
        display: block;
        margin-top: 5px;

        .left-wrap {
          width: 100%;
        }

        .right-wrap {
          width: 100%;
          margin-top: 15px;
        }
      }
    }
  }
</style>
