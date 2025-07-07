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

            <ElFormItem prop="email">
              <ElInput
                v-model.trim="formData.email"
                :placeholder="$t('register.placeholder[3]')"
              />
            </ElFormItem>

            <ElFormItem prop="full_name">
              <ElInput
                v-model.trim="formData.full_name"
                :placeholder="$t('register.placeholder[4]')"
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
  import type { FormInstance, FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { AuthService } from '@/api/authApi'
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'Register' })

  const { t } = useI18n()

  const router = useRouter()
  const formRef = ref<FormInstance>()

  const systemName = AppConfig.systemInfo.name
  const loading = ref(false)

  const formData = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    full_name: '',
    agreement: false
  })

  const validatePass = (rule: any, value: string, callback: any) => {
    if (value === '') {
      callback(new Error(t('register.placeholder[1]')))
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
    username: [
      { required: true, message: t('register.placeholder[0]'), trigger: 'blur' },
      { min: 3, max: 20, message: t('register.rule[2]'), trigger: 'blur' }
    ],
    password: [
      { required: true, validator: validatePass, trigger: 'blur' },
      { min: 6, message: t('register.rule[3]'), trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }],
    email: [
      { required: false, message: '请输入邮箱地址', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
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

      // 构建注册参数
      const registerParams = {
        username: formData.username,
        password: formData.password,
        email: formData.email || undefined,
        full_name: formData.full_name || undefined
      }

      // 发送注册请求
      await AuthService.register(registerParams)
      
      ElMessage.success('注册成功，即将跳转到登录页')
      toLogin()
    } catch (error) {
      loading.value = false
      
      if (error instanceof HttpError) {
        ElMessage.error(`注册失败: ${error.message || '服务器错误'}`)
      } else {
        ElMessage.error(`注册失败: ${error instanceof Error ? error.message : '请稍后重试'}`)
        console.error('[Register] 注册错误:', error)
      }
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
