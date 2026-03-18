import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import CommonComponentsPage from '@/views/CommonComponentsPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import DomainComponentsPage from '@/views/DomainComponentsPage.vue'
import ServicePage from '@/views/ServicePage.vue'

const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/auth/LoginPage.vue'),
        meta: { title: '로그인' },
      },
    ],
  },
  {
    path: '/forgot-password',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordPage.vue'),
        meta: { title: '비밀번호 찾기' },
      },
    ],
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage,
        meta: {
          title: 'Dashboard',
          serviceName: '공통 대시보드',
        },
      },
      {
        path: 'common-preview',
        name: 'common-preview',
        component: CommonComponentsPage,
        meta: {
          title: 'Common Preview',
          serviceName: '공통 컴포넌트 프리뷰',
          description: '1차 구현한 공통 컴포넌트의 동작 검증용 화면',
        },
      },
      {
        path: 'domain-preview',
        name: 'domain-preview',
        component: DomainComponentsPage,
        meta: {
          title: 'Domain Preview',
          serviceName: '도메인 공통 컴포넌트 프리뷰',
          description: '2차 구현한 문서/활동 도메인 공통 컴포넌트 검증용 화면',
        },
      },
      {
        path: 'auth',
        name: 'auth',
        component: () => import('@/views/auth/UserManagementPage.vue'),
        meta: {
          title: 'Auth',
          serviceName: '사용자 관리',
        },
      },
      {
        path: 'master',
        name: 'master',
        component: ServicePage,
        meta: {
          title: 'Master',
          serviceName: '기준정보 화면',
          description: '품목, 거래처, 조직, 코드성 데이터 관리',
        },
      },
      {
        path: 'order',
        name: 'order',
        component: ServicePage,
        meta: {
          title: 'Order',
          serviceName: '주문 화면',
          description: '주문 등록, 상태 전이, 출고 연계 화면',
        },
      },
      {
        path: 'document',
        name: 'document',
        component: ServicePage,
        meta: {
          title: 'Document',
          serviceName: '문서 화면',
          description: '전자문서 목록, 상세, 승인 흐름 설계용',
        },
      },
      {
        path: 'sales',
        name: 'sales',
        component: ServicePage,
        meta: {
          title: 'Sales',
          serviceName: '매출 화면',
          description: '매출 현황, 추이 분석, KPI 차트 설계용',
        },
      },
      {
        path: 'pdf',
        name: 'pdf',
        component: ServicePage,
        meta: {
          title: 'PDF',
          serviceName: 'PDF 센터',
          description: '템플릿 관리, 생성 이력, 미리보기 화면',
        },
      },
      {
        path: 'notification',
        name: 'notification',
        component: ServicePage,
        meta: {
          title: 'Notification',
          serviceName: '알림 화면',
          description: '메일, 알림 이력, 발송 정책 설계용',
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Screen Design'} | Team2`
})

export default router
