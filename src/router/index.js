import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import CommonComponentsPage from '@/views/CommonComponentsPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import DomainComponentsPage from '@/views/DomainComponentsPage.vue'
import CIPage from '@/views/documents/CIPage.vue'
import CollectionsPage from '@/views/documents/CollectionsPage.vue'
import PIPage from '@/views/documents/PIPage.vue'
import PIDetailPage from '@/views/documents/PIDetailPage.vue'
import PLPage from '@/views/documents/PLPage.vue'
import POPage from '@/views/documents/POPage.vue'
import PODetailPage from '@/views/documents/PODetailPage.vue'
import ProductionOrderPage from '@/views/documents/ProductionOrderPage.vue'
import ShipmentsPage from '@/views/documents/ShipmentsPage.vue'
import ShipmentOrderPage from '@/views/documents/ShipmentOrderPage.vue'
import ServicePage from '@/views/ServicePage.vue'
import ActivityListPage from '@/views/activity/ActivityListPage.vue'
import ActivityCreatePage from '@/views/activity/ActivityCreatePage.vue'
import ContactListPage from '@/views/contacts/ContactListPage.vue'
import EmailListPage from '@/views/emails/EmailListPage.vue'
import ActivityPackagePage from '@/views/package/ActivityPackagePage.vue'

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
        path: 'activities',
        name: 'activities',
        component: ActivityListPage,
        meta: {
          title: 'Activities',
          serviceName: '기록 관리',
          description: '활동 기록을 조회하고 관리합니다.',
        },
      },
      {
        path: 'activities/manage',
        name: 'activities-create',
        component: ActivityCreatePage,
        meta: {
          title: 'Activities - 등록',
          serviceName: '기록 등록',
          description: '새로운 활동 기록을 등록합니다.',
        },
      },
      {
        path: 'master',
        children: [
          { path: '', redirect: { name: 'client-list' } },
          {
            path: 'clients',
            name: 'client-list',
            component: () => import('@/views/master/ClientListPage.vue'),
            meta: { title: 'Master', serviceName: '거래처 관리' },
          },
          {
            path: 'clients/:id',
            name: 'client-detail',
            component: () => import('@/views/master/ClientDetailPage.vue'),
            meta: { title: 'Master', serviceName: '거래처 상세' },
          },
          {
            path: 'items',
            name: 'item-list',
            component: () => import('@/views/master/ItemListPage.vue'),
            meta: { title: 'Master', serviceName: '품목 관리' },
          },
          {
            path: 'items/:id',
            name: 'item-detail',
            component: () => import('@/views/master/ItemDetailPage.vue'),
            meta: { title: 'Master', serviceName: '품목 상세' },
          },
        ],
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
        path: 'pi/:id',
        name: 'pi-detail',
        component: PIDetailPage,
        meta: {
          title: 'PI Detail',
          serviceName: 'PI 상세',
          description: 'PI 상세 화면',
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
        path: 'po/:id',
        name: 'po-detail',
        component: PODetailPage,
        meta: {
          title: 'PO Detail',
          serviceName: 'PO 상세',
          description: 'PO 상세 화면',
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
        component: CollectionsPage,
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
        path: 'contacts',
        name: 'contacts',
        component: ContactListPage,
        meta: {
          title: 'Contacts',
          serviceName: '컨택 리스트',
          description: '거래처 연락처 관리 화면',
        },
      },
      {
        path: 'emails',
        name: 'emails',
        component: EmailListPage,
        meta: {
          title: 'Emails',
          serviceName: '메일 이력',
          description: '메일 발송 이력 화면',
        },
      },
      {
        path: 'package',
        name: 'package',
        component: ActivityPackagePage,
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
          requiredRole: 'admin',
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
