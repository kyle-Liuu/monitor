<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.webp" />
          <div class="avatar-container">
            <img class="avatar" :src="formattedAvatarUrl" />
            <div class="avatar-edit-btn" @click="showAvatarUpload">
              <el-icon><Edit /></el-icon>
            </div>
          </div>
          <h2 class="name">{{ userInfo.username }}</h2>
          <p class="des">{{ previewData.description || userInfo.description || '尚未设置个人介绍' }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont-sys">&#xe60f;</i>
              <span>{{ userInfo.phone || '未设置手机号' }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe72e;</i>
              <span>{{ userInfo.email || '未设置邮箱' }}</span>
            </div>
          </div>

        
          <div class="lables">
            <h3>标签</h3>
            <div>
              <el-tag
                v-for="(tag, index) in previewData.tags"
                :key="index"
                class="tag"
                effect="light"
                size="small"
              >
                {{ tag }}
              </el-tag>
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
              <ElFormItem label="昵称" prop="username" class="right-input">
                <ElInput v-model="form.username" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机" prop="phone">
                <ElInput v-model="form.phone" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="right-input">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="性别" prop="gender">
                <ElSelect v-model="form.gender" placeholder="请选择" :disabled="!isEdit">
                  <ElOption
                    v-for="item in genderOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="标签" prop="tags" class="right-input">
                <el-input-tag 
                  v-model="form.tags" 
                  :disabled="!isEdit"
                  :max-tag-count="5"
                  draggable
                  placeholder="请输入标签，回车确认"
                  @update:modelValue="handleTagsChange"
                />
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

            <!-- 个人介绍 -->
            <ElFormItem label="个人介绍" prop="description" :style="{ height: '130px' }">
              <ElInput 
                type="textarea" 
                :rows="4" 
                v-model="form.description" 
                :disabled="!isEdit"
                @input="handleDescriptionChange"
              />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton v-if="isEdit" @click="cancelEdit" style="margin-right: 10px">取消</ElButton>
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
              <ElButton v-if="isEditPwd" @click="cancelEditPwd" style="margin-right: 10px">取消</ElButton>
              <ElButton type="primary" style="width: 90px" v-ripple @click="editPwd">
                {{ isEditPwd ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
    
    <!-- 头像上传对话框 -->
    <el-dialog
      v-model="avatarDialogVisible"
      title="头像裁剪上传"
      width="720px"
      :close-on-click-modal="false"
      @close="handleAvatarDialogClose"
      class="avatar-dialog"
    >
      <div class="avatar-upload-dialog">
        <!-- 使用裁剪组件 -->
        <ArtCutterImg
          ref="cutterRef"
          v-model:imgUrl="tempAvatarUrl"
          :boxWidth="340"
          :boxHeight="260"
          :cutWidth="160"
          :cutHeight="160"
          :quality="1"
          :tool="false"
          :watermarkText="''"
          :showPreview="true"
          :originalGraph="true"
          :title="''"
          :previewTitle="'预览效果'"
          @error="handleCropError"
          @imageLoadComplete="handleCropLoadComplete"
          @imageLoadError="handleCropLoadError"
          @onPrintImg="handlePrintImg"
          @imageSelected="handleImageSelected"
          class="cropper-container"
        >
          <!-- 隐藏原组件的按钮 -->
          <template #choose>
            <div></div>
          </template>
          <template #cancel>
            <div></div>
          </template>
          <template #confirm>
            <div></div>
          </template>
        </ArtCutterImg>
        
        <div class="dialog-footer">
          <div class="left-actions">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              @change="handleFileSelect"
            >
              <el-button type="primary" plain>
                选择图片
              </el-button>
            </el-upload>
            
            <el-button type="danger" plain @click="clearImage">
              清空
            </el-button>
          </div>
          
          <div class="right-actions">
            <el-button @click="avatarDialogVisible = false">取消</el-button>
            <el-button 
              type="primary" 
              @click="uploadOriginalImage" 
              :loading="isAvatarUploading"
            >
              上传原图
            </el-button>
            <el-button 
              type="success" 
              @click="uploadCroppedImage" 
              :loading="isAvatarUploading"
            >
              上传裁剪图
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { ElForm, FormInstance, FormRules, ElMessage, ElMessageBox, ElLoading } from 'element-plus'
  import { HttpError } from '@/utils/http/error'
  import { Plus, Edit, User, Delete } from '@element-plus/icons-vue'
  import { UserService } from '@/api/userApi'
  import { formatImageUrl, formatAvatarUrl, updateAvatarVersion } from '@/utils/dataprocess/format'
  import mittBus from '@/utils/sys/mittBus'
  import ArtCutterImg from '@/components/core/media/art-cutter-img/index.vue'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)
  const router = useRouter()

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  
  // 表单引用
  const ruleFormRef = ref<FormInstance>()
  const pwdFormRef = ref<FormInstance>()

  // 头像上传相关
  const avatarUrl = ref('')
  const avatarDialogVisible = ref(false)
  const tempAvatarUrl = ref('')
  const originalAvatarUrl = ref('') // 保存原始头像URL
  const isAvatarUploading = ref(false)
  
  // 裁剪组件引用
  const cutterRef = ref()
  
  // 添加缓存破坏时间戳
  const avatarTimestamp = ref(Date.now())

  // 预览数据（用于实时显示）
  const previewData = reactive({
    description: '',
    tags: [] as string[]
  })

  // 原始表单数据（用于取消操作）
  const originalForm = reactive<any>({})

  // 用户信息表单
  const form = reactive<any>({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    gender: 0,
    description: '',
    created_at: '',
    updated_at: '',
    tags: [] as string[]
  })

  // 密码表单
  const pwdForm = reactive<any>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // 原始密码表单（用于取消操作）
  const originalPwdForm = reactive<any>({})

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
    tags: [
      { validator: (rule, value, callback) => {
        if (value && value.length > 5) {
          callback(new Error('最多只能添加5个标签'))
        } else {
          callback()
        }
      }, trigger: 'change' }
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
      { min: 6, message: '密码长度不小于6位', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { 
        pattern: /^(?:(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[@$!%*?&])|(?=.*\d)(?=.*[@$!%*?&]))[A-Za-z\d@$!%*?&]{6,}$/,
        message: '密码必须包含字母、数字和特殊字符中的至少两种，且长度至少为6位',
        trigger: 'blur'
      },
      { 
        validator: (rule, value, callback) => {
          if (value === pwdForm.oldPassword) {
            callback(new Error('新密码不能与当前密码相同'))
          } else {
            // 如果确认密码已输入，则同时校验确认密码
            if (pwdForm.confirmPassword) {
              pwdFormRef.value?.validateField('confirmPassword')
            }
            callback()
          }
        },
        trigger: 'blur'
      }
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
    // 初始化标签，如果用户信息中有标签则使用，否则使用默认标签
    form.tags = Array.isArray((info as any).tags) ? (info as any).tags : ['编辑添加标签']
    // 格式化日期时间
    form.created_at = info.created_at ? formatDateTime(info.created_at) : '未知'
    form.updated_at = info.updated_at ? formatDateTime(info.updated_at) : '未知'
    // 设置头像
    avatarUrl.value = info.avatar || ''
    
    // 初始化预览数据
    previewData.description = form.description
    previewData.tags = [...form.tags]
    
    // 保存初始表单数据（用于取消操作）
    Object.assign(originalForm, form)
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

  // 获取格式化后的头像URL，添加版本号控制缓存
  const formattedAvatarUrl = computed(() => {
    return formatAvatarUrl(avatarUrl.value);
  });

  onMounted(() => {
    initUserInfo()
  })

  // 处理描述变更，实时更新预览
  const handleDescriptionChange = () => {
    previewData.description = form.description
  }
  
  // 处理标签变更，实时更新预览
  const handleTagsChange = () => {
    previewData.tags = [...form.tags]
  }

  // 取消编辑用户信息
  const cancelEdit = () => {
    // 恢复表单到原始数据
    Object.assign(form, originalForm)
    
    // 同步更新预览数据
    previewData.description = form.description
    previewData.tags = [...form.tags]
    
    isEdit.value = false
    ElMessage.info('已取消编辑')
  }

  // 编辑/保存用户信息
  const edit = async () => {
    if (isEdit.value) {
      // 保存操作
      if (!ruleFormRef.value) return
      
      try {
        await ruleFormRef.value.validate()
        
        const updateData = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          gender: Number(form.gender),
          description: form.description,
          tags: form.tags // 添加标签字段
        }
        
        if (userInfo.value && userInfo.value.user_id) {
          // 使用API更新用户信息
          const response = await UserService.updateUser(userInfo.value.user_id, updateData)
          
          // 更新本地存储的用户信息
          if (response) {
            userStore.setUserInfo(response as unknown as Api.User.UserInfo)
            ElMessage.success('个人信息更新成功')
            
            // 更新原始表单数据
            Object.assign(originalForm, form)
          }
          
          isEdit.value = false
        } else {
          ElMessage.error('获取用户ID失败')
        }
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
      // 保存原始表单数据
      Object.assign(originalForm, form)
      isEdit.value = true
    }
  }

  // 取消编辑密码
  const cancelEditPwd = () => {
    // 恢复表单到原始数据
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    
    isEditPwd.value = false
    ElMessage.info('已取消编辑')
  }

  // 编辑/保存密码
  const editPwd = async () => {
    if (isEditPwd.value) {
      // 保存操作
      if (!pwdFormRef.value) return
      
      try {
        await pwdFormRef.value.validate()
        
        // 二次确认
        try {
          await ElMessageBox.confirm(
            '修改密码后，您将需要重新登录。是否继续？',
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
          )
        } catch (e) {
          return // 用户取消操作
        }
        
        const passwordData = {
          current_password: pwdForm.oldPassword,
          new_password: pwdForm.newPassword
        }
        
        if (userInfo.value && userInfo.value.user_id) {
          // 显示加载中
          const loading = ElLoading.service({
            lock: true,
            text: '正在修改密码...',
            background: 'rgba(0, 0, 0, 0.7)',
          })
          
          try {
            // 使用API修改密码
            await UserService.changePassword(userInfo.value.user_id, passwordData)
            
            loading.close()
            ElMessage.success('密码修改成功，请重新登录')
            isEditPwd.value = false
            
            // 清空表单
            pwdForm.oldPassword = ''
            pwdForm.newPassword = ''
            pwdForm.confirmPassword = ''
            
            // 延迟一下再登出，让用户能看到成功消息
            setTimeout(() => {
              // 登出并跳转到登录页
              userStore.logOut()
              router.push('/auth/login')
            }, 1500)
          } catch (error) {
            loading.close()
            throw error
          }
        } else {
          ElMessage.error('获取用户ID失败')
        }
      } catch (error) {
        if (error instanceof HttpError) {
          // 直接显示后端返回的错误信息，不添加前缀
          ElMessage.error(error.message || '服务器错误')
          console.error('[UserCenter] 修改密码错误:', error)
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

  // 显示头像上传对话框
  const showAvatarUpload = () => {
    // 保存原始头像URL用于后续上传原图
    originalAvatarUrl.value = formattedAvatarUrl.value
    tempAvatarUrl.value = formattedAvatarUrl.value
    avatarDialogVisible.value = true
  }

  // 处理文件选择
  const handleFileSelect = (file: any) => {
    const rawFile = file.raw
    if (!rawFile) {
      ElMessage.error('无法获取文件信息')
      return
    }
    
    // 检查文件大小（限制为500KB）
    const isLt500K = rawFile.size / 1024 < 500
    if (!isLt500K) {
      ElMessage.error('头像文件不能超过500KB')
      return
    }

    // 检查文件类型
    if (!rawFile.type.startsWith('image/')) {
      ElMessage.error('请上传图片文件')
      return
    }

    // 创建本地预览URL并传递给裁剪组件
    const fileUrl = URL.createObjectURL(rawFile)
    tempAvatarUrl.value = fileUrl
    originalAvatarUrl.value = fileUrl
    
    // 告诉裁剪组件更新图片
    if (cutterRef.value && cutterRef.value.imgCutterModal) {
      cutterRef.value.imgCutterModal.handleOpen({
        name: rawFile.name || '头像图片',
        src: fileUrl
      })
    }
  }
  
  // 清空图片
  const clearImage = () => {
    if (cutterRef.value) {
      // 使用组件暴露的clearImage方法
      if (typeof cutterRef.value.clearImage === 'function') {
        cutterRef.value.clearImage()
      } else if (typeof cutterRef.value.handleClearAll === 'function') {
        cutterRef.value.handleClearAll()
      }
      
      // 清空所有相关状态
      tempAvatarUrl.value = ''
      originalAvatarUrl.value = ''
      
      // 通知用户
      ElMessage.info('已清空图片')
    }
  }

  // 处理头像上传对话框关闭
  const handleAvatarDialogClose = () => {
    tempAvatarUrl.value = ''
    originalAvatarUrl.value = ''
    avatarDialogVisible.value = false
  }

  // 裁剪组件的错误处理
  const handleCropError = (error: any) => {
    console.error('裁剪错误:', error)
    ElMessage.error('图片裁剪出错')
  }

  // 裁剪组件的图片加载完成处理
  const handleCropLoadComplete = (result: any) => {
    console.log('图片加载完成:', result)
    
    // 当用户选择了新图片时，更新原图URL
    if (result && result.src) {
      console.log('检测到新图片加载，更新原图URL')
      originalAvatarUrl.value = result.src
    }
  }
  
  // 裁剪组件的图片加载错误处理
  const handleCropLoadError = (error: any) => {
    console.error('图片加载失败:', error)
    ElMessage.error('图片加载失败')
  }
  
  // 监听裁剪过程中的预览图像变化
  const handlePrintImg = (result: { dataURL: string }) => {
    console.log('图片裁剪预览更新')
    // 这里不更新originalAvatarUrl，因为这是裁剪过程
  }

  // 处理新图片选择事件
  const handleImageSelected = (data: { originalUrl: string }) => {
    console.log('用户选择了新图片:', data)
    originalAvatarUrl.value = data.originalUrl
  }

  // 将Base64图像转换为Blob对象
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new Blob([u8arr], { type: mime })
  }

  // 将Blob对象转换为File对象
  const blobToFile = (blob: Blob, filename: string): File => {
    return new File([blob], filename, { type: blob.type })
  }

  // 上传原图
  const uploadOriginalImage = async () => {
    if (!userInfo.value || !userInfo.value.user_id) return
    
    try {
      isAvatarUploading.value = true
      
      // 使用组件暴露的方法获取原始图片
      const originalImg = cutterRef.value?.getOriginalImage()
      
      if (!originalImg) {
        ElMessage.warning('未找到原始图片')
        isAvatarUploading.value = false
        return
      }
      
      console.log('上传原图:', originalImg)
      
      // 获取原始图片URL，创建Blob和File对象
      const blob = await fetch(originalImg).then(r => r.blob())
      const file = blobToFile(blob, `avatar_${Date.now()}.png`)
      
      // 上传头像文件
      const avatarPath = await UserService.uploadAvatar(file, userInfo.value.user_id)
      
      if (!avatarPath) {
        throw new Error('头像上传失败')
      }
      
      // 更新用户头像信息
      await UserService.updateAvatar(userInfo.value.user_id, avatarPath)
      
      // 更新本地头像URL
      avatarUrl.value = avatarPath
      
      // 更新用户信息中的头像
      userStore.updateUserAvatar(avatarPath)
      
      // 更新头像版本号，强制刷新头像缓存
      updateAvatarVersion()
      
      // 发出头像更新事件，通知其他组件刷新
      mittBus.emit('avatar-updated')
      
      ElMessage.success('原图上传成功')
      
      // 关闭对话框
      avatarDialogVisible.value = false
    } catch (error) {
      ElMessage.error('头像上传失败')
      console.error('[UserCenter] 上传头像错误:', error)
    } finally {
      isAvatarUploading.value = false
    }
  }
  
  // 上传裁剪后的图片
  const uploadCroppedImage = async () => {
    if (!userInfo.value || !userInfo.value.user_id) return
    
    try {
      isAvatarUploading.value = true
      
      // 获取裁剪后的图片
      const croppedImage = cutterRef.value?.getCroppedImage()
      
      if (!croppedImage) {
        ElMessage.warning('请先裁剪图片')
        isAvatarUploading.value = false
        return
      }
      
      // 将裁剪后的图片(Base64)转换为File对象
      const blob = dataURLtoBlob(croppedImage)
      const file = blobToFile(blob, `avatar_${Date.now()}.png`)
      
      // 上传头像文件
      const avatarPath = await UserService.uploadAvatar(file, userInfo.value.user_id)
      
      if (!avatarPath) {
        throw new Error('头像上传失败')
      }
      
      // 更新用户头像信息
      await UserService.updateAvatar(userInfo.value.user_id, avatarPath)
      
      // 更新本地头像URL
      avatarUrl.value = avatarPath
      
      // 更新用户信息中的头像
      userStore.updateUserAvatar(avatarPath)
      
      // 更新头像版本号，强制刷新头像缓存
      updateAvatarVersion()
      
      // 发出头像更新事件，通知其他组件刷新
      mittBus.emit('avatar-updated')
      
      ElMessage.success('裁剪图上传成功')
      
      // 关闭对话框
      avatarDialogVisible.value = false
    } catch (error) {
      ElMessage.error('头像上传失败')
      console.error('[UserCenter] 上传头像错误:', error)
    } finally {
      isAvatarUploading.value = false
    }
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
    
    // 头像上传对话框样式
    .avatar-upload-dialog {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .dialog-footer {
        margin-top: 15px;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .left-actions {
          display: flex;
          gap: 10px;
        }
        
        .right-actions {
          display: flex;
          gap: 10px;
        }
      }
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
    
    // 头像容器和编辑按钮
    .avatar-container {
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
      
      .avatar-edit-btn {
        position: absolute;
        right: -5px;
        bottom: -5px;
        z-index: 11;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: #fff;
        cursor: pointer;
        background: var(--el-color-primary);
        border-radius: 50%;
        opacity: 0;
        transition: all 0.3s;
        
        &:hover {
          transform: scale(1.1);
        }
        
        .el-icon {
          font-size: 12px;
        }
      }
      
      &:hover .avatar-edit-btn {
        opacity: 1;
      }
    }

    // 头像预览样式
    .avatar-preview {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .avatar-preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      font-size: 40px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color-light);
      border-radius: 50%;
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

              .role-tag, .tag {
                margin: 0 5px 10px;
              }
              
              > div:not(.role-tag):not(.tag) {
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
                width: 90px !important;
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
