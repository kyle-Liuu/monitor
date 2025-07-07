<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.webp" />
          <img class="avatar" src='@imgs/user/avatar.webp' />
          <h2 class="name">{{ userInfo.username }}</h2>
          <p class="des">{{ userInfo.description || '尚未设置个人介绍' }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont-sys">&#xe72e;</i>
              <span>{{ userInfo.email || '未设置邮箱' }}</span>
            </div>
            <!-- 注释掉职位信息
            <div>
              <i class="iconfont-sys">&#xe608;</i>
              <span>{{ form.position || '未设置职位' }}</span>
            </div>
            -->
            <!-- 注释掉地址信息
            <div>
              <i class="iconfont-sys">&#xe736;</i>
              <span>{{ form.address || '未设置地址' }}</span>
            </div>
            -->
            <!-- 注释掉部门信息
            <div>
              <i class="iconfont-sys">&#xe811;</i>
              <span>{{ form.department || '未设置部门' }}</span>
            </div>
            -->
          </div>

          <div class="lables">
            <h3>角色</h3>
            <div>
              <div v-for="role in userInfo.roles" :key="role.role_code">
                {{ role.role_name }}
              </div>
              <div v-if="!userInfo.roles || userInfo.roles.length === 0">
                暂无角色
              </div>
            </div>
          </div>
        </div>

        <!-- <el-carousel class="gallery" height="160px"
          :interval="5000"
          indicator-position="none"
        >
          <el-carousel-item class="item" v-for="item in galleryList" :key="item">
            <img :src="item"/>
          </el-carousel-item>
        </el-carousel> -->
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
                <el-input v-model="form.full_name" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="性别" prop="gender" class="right-input">
                <ElSelect v-model="form.gender" placeholder="请选择" :disabled="!isEdit">
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
              <ElFormItem label="昵称" prop="username">
                <ElInput v-model="form.username" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="right-input">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机" prop="phone">
                <ElInput v-model="form.phone" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="上传头像" prop="avatar" class="right-input">
                <el-upload
                  class="avatar-uploader"
                  action="/api/users/avatar"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                  :before-upload="beforeAvatarUpload"
                  :disabled="!isEdit"
                >
                  <img v-if="avatarUrl" :src="avatarUrl" class="avatar-preview" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                  <template #tip>
                    <div class="el-upload__tip">
                      jpg/png文件，大小不超过500KB
                    </div>
                  </template>
                </el-upload>
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="创建时间" prop="created_at">
                <ElInput v-model="form.created_at" disabled />
              </ElFormItem>
              <ElFormItem label="上次修改时间" prop="updated_at" class="right-input">
                <ElInput v-model="form.updated_at" disabled />
              </ElFormItem>
            </ElRow>

            <!-- 恢复个人介绍 -->
            <ElFormItem label="个人介绍" prop="description" :style="{ height: '130px' }">
              <ElInput type="textarea" :rows="4" v-model="form.description" :disabled="!isEdit" />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton type="primary" style="width: 90px" v-ripple @click="edit">
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
            <ElFormItem label="当前密码" prop="oldPassword">
              <ElInput
                v-model="pwdForm.oldPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="新密码" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton type="primary" style="width: 90px" v-ripple @click="editPwd">
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
  import { ElForm, FormInstance, FormRules, ElMessage, ElMessageBox } from 'element-plus'
  import { UserService } from '@/api/userApi'
  import { HttpError } from '@/utils/http/error'
  import { Plus } from '@element-plus/icons-vue'
  import type { UploadProps } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  
  // 表单引用
  const ruleFormRef = ref<FormInstance>()
  const pwdFormRef = ref<FormInstance>()

  // 头像上传相关
  const avatarUrl = ref('')
  const uploadHeaders = computed(() => {
    return {
      Authorization: `Bearer ${userStore.getToken}`
    }
  })

  // 用户信息表单
  const form = reactive({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    // address: '',
    gender: 0,
    // position: '',
    // department: '',
    description: '',
    created_at: '',
    updated_at: ''
  })

  // 密码表单
  const pwdForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 性别选项
  const genderOptions = [
    { value: 1, label: '男' },
    { value: 2, label: '女' },
    { value: 0, label: '保密' }
  ]

  // 表单验证规则
  const rules = reactive<FormRules>({
    username: [
      { required: true, message: '用户名不能为空', trigger: 'blur' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '只能包含字母、数字、下划线和中文', trigger: 'blur' }
    ],
    full_name: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    phone: [
      { required: true, message: '请输入手机号码', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ],
    gender: [
      { required: true, message: '请选择性别', trigger: 'change' }
    ],
    description: [
      { required: false, message: '请输入个人介绍', trigger: 'blur' },
      { max: 500, message: '个人介绍不能超过500个字符', trigger: 'blur' }
    ],
    created_at: [
      { required: false }
    ],
    updated_at: [
      { required: false }
    ]
  })

  // 密码表单验证规则
  const pwdRules = reactive<FormRules>({
    oldPassword: [
      { required: true, message: '请输入当前密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
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

  // 初始化用户信息
  const initUserInfo = () => {
    const info = userInfo.value
    form.username = info.username || ''
    form.full_name = info.full_name || ''
    form.email = info.email || ''
    form.phone = info.phone || ''
    form.gender = info.gender !== undefined ? Number(info.gender) : 0
    form.description = info.description || ''
    // 格式化日期时间
    form.created_at = info.created_at ? formatDateTime(info.created_at) : '未知'
    form.updated_at = info.updated_at ? formatDateTime(info.updated_at) : '未知'
    // 设置头像
    avatarUrl.value = info.avatar || ''
    // 其他字段保持默认值
  }

  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    } catch (e) {
      return dateStr
    }
  }

  onMounted(() => {
    initUserInfo()
  })

  // 编辑/保存用户信息
  const edit = async () => {
    if (isEdit.value) {
      // 保存操作
      if (!ruleFormRef.value) return
      
      try {
        await ruleFormRef.value.validate()
        
        const updateData: Record<string, any> = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          gender: Number(form.gender),
          description: form.description
        }
        
        await UserService.updateUser(userInfo.value.id!, updateData)
        
        // 更新本地存储的用户信息
        const updatedUserInfo = await UserService.getUserInfo()
        userStore.setUserInfo(updatedUserInfo)
        
        ElMessage.success('个人信息更新成功')
        isEdit.value = false
      } catch (error) {
        if (error instanceof HttpError) {
          ElMessage.error(`更新失败: ${error.message || '服务器错误'}`)
        } else {
          ElMessage.error('表单验证失败，请检查输入')
          console.error('[UserCenter] 更新用户信息错误:', error)
        }
      }
    } else {
      // 进入编辑模式
      isEdit.value = true
    }
  }

  // 编辑/保存密码
  const editPwd = async () => {
    if (isEditPwd.value) {
      // 保存操作
      if (!pwdFormRef.value) return
      
      try {
        await pwdFormRef.value.validate()
        
        const updateData = {
          password: pwdForm.newPassword
        }
        
        await UserService.updateUser(userInfo.value.id!, updateData)
        
        ElMessage.success('密码修改成功')
        isEditPwd.value = false
        
        // 清空表单
        pwdForm.oldPassword = ''
        pwdForm.newPassword = ''
        pwdForm.confirmPassword = ''
      } catch (error) {
        if (error instanceof HttpError) {
          ElMessage.error(`密码修改失败: ${error.message || '服务器错误'}`)
        } else {
          ElMessage.error('表单验证失败，请检查输入')
          console.error('[UserCenter] 修改密码错误:', error)
        }
      }
    } else {
      // 进入编辑模式
      isEditPwd.value = true
    }
  }

  // 头像上传成功处理
  const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
    if (response && response.data) {
      avatarUrl.value = response.data.avatar_url
      // 更新用户信息中的头像
      userStore.updateUserAvatar(avatarUrl.value)
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('头像上传失败')
    }
  }

  // 头像上传前的验证
  const beforeAvatarUpload: UploadProps['beforeUpload'] = (file) => {
    // 检查文件类型
    const isJPG = file.type === 'image/jpeg'
    const isPNG = file.type === 'image/png'
    const isLt500K = file.size / 1024 < 500

    if (!isJPG && !isPNG) {
      ElMessage.error('头像只能是 JPG 或 PNG 格式!')
      return false
    }
    if (!isLt500K) {
      ElMessage.error('头像大小不能超过 500KB!')
      return false
    }
    return true
  }
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

    // 头像上传样式
    .avatar-uploader {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .avatar-preview {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 100px;
        height: 100px;
        line-height: 100px;
        text-align: center;
        border: 1px dashed var(--art-border-color);
        border-radius: 50%;
      }
      
      .el-upload__tip {
        color: var(--art-text-gray-600);
        font-size: 12px;
        margin-top: 8px;
      }
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

          .avatar {
            position: relative;
            z-index: 10;
            width: 80px;
            height: 80px;
            margin-top: 120px;
            object-fit: cover;
            border: 2px solid #fff;
            border-radius: 50%;
          }

          .name {
            margin-top: 20px;
            font-size: 22px;
            font-weight: 400;
          }

          .des {
            margin-top: 20px;
            font-size: 14px;
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
        }

        .gallery {
          margin-top: 25px;
          border-radius: 10px;

          .item {
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
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
