import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import CommonComponentsPage from '@/views/CommonComponentsPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import DomainComponentsPage from '@/views/DomainComponentsPage.vue'
import CIPage from '@/views/documents/CIPage.vue'
import PIPage from '@/views/documents/PIPage.vue'
import PLPage from '@/views/documents/PLPage.vue'
import POPage from '@/views/documents/POPage.vue'
import ProductionOrderPage from '@/views/documents/ProductionOrderPage.vue'
import ShipmentsPage from '@/views/documents/ShipmentsPage.vue'
import ShipmentOrderPage from '@/views/documents/ShipmentOrderPage.vue'
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
        path: 'clients',
        name: 'clients',
        component: ServicePage,
        meta: {
          title: 'Clients',
          serviceName: '거래처 관리',
          description: '거래처 조회 및 관리 화면',
        },
      },
      {
        path: 'products',
        name: 'products',
        component: ServicePage,
        meta: {
          title: 'Products',
          serviceName: '품목 관리',
          description: '품목 조회 및 관리 화면',
        },
      },
      {
        path: 'pi',
        name: 'pi',
        component: PIPage,
        meta: {
          title: 'PI',
          serviceName: 'PI 관리',
          description: 'PI 조회 및 상세 화면',
        },
      },
      {
        path: 'po',
        name: 'po',
        component: POPage,
        meta: {
          title: 'PO',
          serviceName: 'PO 관리',
          description: 'PO 조회 및 상세 화면',
        },
      },
      {
        path: 'ci',
        name: 'ci',
        component: CIPage,
        meta: {
          title: 'CI',
          serviceName: 'CI 관리',
          description: 'CI 조회 및 상세 화면',
        },
      },
      {
        path: 'pl',
        name: 'pl',
        component: PLPage,
        meta: {
          title: 'PL',
          serviceName: 'PL 관리',
          description: 'PL 조회 및 상세 화면',
        },
      },
      {
        path: 'production',
        name: 'production',
        component: ProductionOrderPage,
        meta: {
          title: 'Production',
          serviceName: '생산 관리',
          description: '생산지시서 관리 화면',
        },
      },
      {
        path: 'shipment-orders',
        name: 'shipment-orders',
        component: ShipmentOrderPage,
        meta: {
          title: 'Shipment Orders',
          serviceName: '출하 관리',
          description: '출하지시서 관리 화면',
        },
      },
      {
        path: 'collections',
        name: 'collections',
        component: ServicePage,
        meta: {
          title: 'Collections',
          serviceName: '매출·수금 현황',
          description: '매출 및 수금 현황 화면',
        },
      },
      {
        path: 'shipments',
        name: 'shipments',
        component: ShipmentsPage,
        meta: {
          title: 'Shipments',
          serviceName: '출하현황',
          description: '출하 진행 현황 화면',
        },
      },
      {
        path: 'activities',
        name: 'activities',
        component: ServicePage,
        meta: {
          title: 'Activities',
          serviceName: '기록 관리',
          description: '활동기록 조회 및 관리 화면',
        },
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: ServicePage,
        meta: {
          title: 'Contacts',
          serviceName: '컨택 리스트',
          description: '거래처 연락처 관리 화면',
        },
      },
      {
        path: 'emails',
        name: 'emails',
        component: ServicePage,
        meta: {
          title: 'Emails',
          serviceName: '메일 이력',
          description: '메일 발송 이력 화면',
        },
      },
      {
        path: 'package',
        name: 'package',
        component: ServicePage,
        meta: {
          title: 'Package',
          serviceName: '활동기록 패키지',
          description: '활동기록 패키지 화면',
        },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/auth/UserManagementPage.vue'),
        meta: {
          title: 'Users',
          serviceName: '사용자 관리',
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
