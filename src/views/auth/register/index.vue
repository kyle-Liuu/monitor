<template>
  <div class="login register">
    <LoginLeftView></LoginLeftView>
    <div class="right-wrap">
      <div class="header">
        <ArtLogo class="icon" />
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3 class="title">{{ $t('register.title') }}</h3>
          <p class="sub-title">{{ $t('register.subTitle') }}</p>
          <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
            <ElFormItem prop="username">
              <ElInput
                v-model.trim="formData.username"
                :placeholder="$t('register.placeholder[0]')"
              />
            </ElFormItem>

            <ElFormItem prop="email">
              <ElInput v-model.trim="formData.email" placeholder="请输入邮箱地址" type="email" />
            </ElFormItem>

            <ElFormItem prop="fullName">
              <ElInput v-model.trim="formData.fullName" placeholder="请输入真实姓名" />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder[1]')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                v-model.trim="formData.confirmPassword"
                :placeholder="$t('register.placeholder[2]')"
                type="password"
                autocomplete="off"
                @keyup.enter="register"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="agreement">
              <ElCheckbox v-model="formData.agreement">
                {{ $t('register.agreeText') }}
                <router-link
                  style="color: var(--main-color); text-decoration: none"
                  to="/privacy-policy"
                  >{{ $t('register.privacyPolicy') }}</router-link
                >
              </ElCheckbox>
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="register-btn"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="footer">
              <p>
                {{ $t('register.hasAccount') }}
                <router-link :to="RoutesAlias.Login">{{ $t('register.toLogin') }}</router-link>
              </p>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'
  import { ElMessage } from 'element-plus'
  import { UserService } from '@/api/usersApi'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'Register' })

  const { t } = useI18n()

  const router = useRouter()
  const formRef = ref<FormInstance>()

  const systemName = AppConfig.systemInfo.name
  const loading = ref(false)

  const formData = reactive({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    agreement: false
  })

  const validateUsername = (rule: any, value: string, callback: any) => {
    if (value === '') {
      callback(new Error(t('register.placeholder[0]')))
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      callback(new Error('用户名只能包含字母、数字和下划线，长度3-20位'))
    } else {
      callback()
    }
  }

  const validateEmail = (rule: any, value: string, callback: any) => {
    if (value === '') {
      callback(new Error('请输入邮箱地址'))
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      callback(new Error('请输入正确的邮箱格式'))
    } else {
      callback()
    }
  }

  const validatePass = (rule: any, value: string, callback: any) => {
    if (value === '') {
      callback(new Error(t('register.placeholder[1]')))
    } else if (value.length < 6) {
      callback(new Error('密码长度不能少于6位'))
    } else {
      if (formData.confirmPassword !== '') {
        formRef.value?.validateField('confirmPassword')
      }
      callback()
    }
  }

  const validatePass2 = (rule: any, value: string, callback: any) => {
    if (value === '') {
      callback(new Error(t('register.rule[0]')))
    } else if (value !== formData.password) {
      callback(new Error(t('register.rule[1]')))
    } else {
      callback()
    }
  }

  const rules = reactive<FormRules>({
    username: [{ required: true, validator: validateUsername, trigger: 'blur' }],
    email: [{ required: true, validator: validateEmail, trigger: 'blur' }],
    fullName: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
    ],
    password: [{ required: true, validator: validatePass, trigger: 'blur' }],
    confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
    agreement: [
      {
        validator: (rule: any, value: boolean, callback: any) => {
          if (!value) {
            callback(new Error(t('register.rule[4]')))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ]
  })

  const register = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      // 调用注册API
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: 'R_USER', // 新注册用户默认为普通用户
        is_active: true
      }

      await UserService.createUser(registerData)

      ElMessage.success('注册成功，正在跳转到登录页面...')
      toLogin()
    } catch (error: any) {
      console.error('注册失败:', error)

      // 处理不同类型的错误
      let errorMessage = '注册失败，请稍后重试'

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }

      // 处理常见错误
      if (errorMessage.includes('username')) {
        errorMessage = '用户名已存在，请使用其他用户名'
      } else if (errorMessage.includes('email')) {
        errorMessage = '邮箱已被注册，请使用其他邮箱'
      }

      ElMessage.error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const toLogin = () => {
    setTimeout(() => {
      router.push(RoutesAlias.Login)
    }, 1500)
  }
</script>

<style lang="scss" scoped>
  @use '../login/index' as login;
  @use './index' as register;
</style>
