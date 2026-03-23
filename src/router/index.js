import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import CommonComponentsPage from '@/views/CommonComponentsPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import DomainComponentsPage from '@/views/DomainComponentsPage.vue'
import CIPage from '@/views/documents/CIPage.vue'
import CIDetailPage from '@/views/documents/CIDetailPage.vue'
import CollectionsPage from '@/views/documents/CollectionsPage.vue'
import PIPage from '@/views/documents/PIPage.vue'
import PIDetailPage from '@/views/documents/PIDetailPage.vue'
import PLPage from '@/views/documents/PLPage.vue'
import PLDetailPage from '@/views/documents/PLDetailPage.vue'
import POPage from '@/views/documents/POPage.vue'
import PODetailPage from '@/views/documents/PODetailPage.vue'
import ProductionOrderPage from '@/views/documents/ProductionOrderPage.vue'
import ProductionOrderDetailPage from '@/views/documents/ProductionOrderDetailPage.vue'
import ShipmentsPage from '@/views/documents/ShipmentsPage.vue'
import ShipmentsDetailPage from '@/views/documents/ShipmentsDetailPage.vue'
import ShipmentOrderPage from '@/views/documents/ShipmentOrderPage.vue'
import ShipmentOrderDetailPage from '@/views/documents/ShipmentOrderDetailPage.vue'
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
          description: '역할별 주요 업무 현황을 한눈에 확인하는 메인 화면입니다.',
        },
      },
      {
        path: 'common-preview',
        name: 'common-preview',
        component: CommonComponentsPage,
        meta: {
          title: 'Common Preview',
          serviceName: '공통 컴포넌트 프리뷰',
          description: '공통 컴포넌트의 동작을 검증하는 개발용 화면입니다.',
        },
      },
      {
        path: 'domain-preview',
        name: 'domain-preview',
        component: DomainComponentsPage,
        meta: {
          title: 'Domain Preview',
          serviceName: '도메인 공통 컴포넌트 프리뷰',
          description: '도메인 공통 컴포넌트의 동작을 검증하는 개발용 화면입니다.',
        },
      },
      {
        path: 'activities',
        name: 'activities',
        component: ActivityListPage,
        meta: {
          title: 'Activities',
          serviceName: '기록 관리',
          description: '영업 활동 기록을 조회하고 관리합니다.',
        },
      },
      {
        path: 'activities/manage',
        name: 'activities-create',
        component: ActivityCreatePage,
        meta: {
          title: 'Activities - 등록',
          serviceName: '기록 등록',
          description: '새로운 영업 활동 기록을 등록합니다.',
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
            meta: { title: 'Master', serviceName: '거래처 관리', description: '해외 거래처 정보를 조회하고 관리합니다.' },
          },
          {
            path: 'clients/:id',
            name: 'client-detail',
            component: () => import('@/views/master/ClientDetailPage.vue'),
            meta: { title: 'Master', serviceName: '거래처 상세', description: '거래처의 상세 정보를 확인합니다.' },
          },
          {
            path: 'items',
            name: 'item-list',
            component: () => import('@/views/master/ItemListPage.vue'),
            meta: { title: 'Master', serviceName: '품목 관리', description: '취급 품목 정보를 조회하고 관리합니다.' },
          },
          {
            path: 'items/:id',
            name: 'item-detail',
            component: () => import('@/views/master/ItemDetailPage.vue'),
            meta: { title: 'Master', serviceName: '품목 상세', description: '품목의 상세 정보를 확인합니다.' },
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
          description: 'Proforma Invoice(견적송장)를 조회하고 관리합니다.',
        },
      },
      {
        path: 'pi/:id',
        name: 'pi-detail',
        component: PIDetailPage,
        meta: {
          title: 'PI Detail',
          serviceName: 'PI 상세',
          description: 'Proforma Invoice(견적송장)의 상세 내용을 확인합니다.',
        },
      },
      {
        path: 'po',
        name: 'po',
        component: POPage,
        meta: {
          title: 'PO',
          serviceName: 'PO 관리',
          description: 'Purchase Order(발주서)를 조회하고 관리합니다.',
        },
      },
      {
        path: 'po/:id',
        name: 'po-detail',
        component: PODetailPage,
        meta: {
          title: 'PO Detail',
          serviceName: 'PO 상세',
          description: 'Purchase Order(발주서)의 상세 내용을 확인합니다.',
        },
      },
      {
        path: 'ci',
        name: 'ci',
        component: CIPage,
        meta: {
          title: 'CI',
          serviceName: 'CI 관리',
          description: 'Commercial Invoice(상업송장)를 조회하고 관리합니다.',
        },
      },
      {
        path: 'ci/:id',
        name: 'ci-detail',
        component: CIDetailPage,
        meta: {
          title: 'CI Detail',
          serviceName: 'Commercial Invoice 상세',
          description: 'Commercial Invoice(상업송장)의 상세 내용을 확인합니다.',
        },
      },
      {
        path: 'pl',
        name: 'pl',
        component: PLPage,
        meta: {
          title: 'PL',
          serviceName: 'PL 관리',
          description: 'Packing List(포장명세서)를 조회하고 관리합니다.',
        },
      },
      {
        path: 'pl/:id',
        name: 'pl-detail',
        component: PLDetailPage,
        meta: {
          title: 'PL Detail',
          serviceName: 'Packing List 상세',
          description: 'Packing List(포장명세서)의 상세 내용을 확인합니다.',
        },
      },
      {
        path: 'production',
        name: 'production',
        component: ProductionOrderPage,
        meta: {
          title: 'Production',
          serviceName: '생산 관리',
          description: '생산지시서를 조회하고 생산 현황을 관리합니다.',
        },
      },
      {
        path: 'production/:id',
        name: 'production-detail',
        component: ProductionOrderDetailPage,
        meta: {
          title: 'Production Detail',
          serviceName: '생산지시서 상세',
          description: '생산지시서의 상세 내용을 확인합니다.',
        },
      },
      {
        path: 'shipment-orders',
        name: 'shipment-orders',
        component: ShipmentOrderPage,
        meta: {
          title: 'Shipment Orders',
          serviceName: '출하 관리',
          description: '출하지시서를 조회하고 출하 업무를 관리합니다.',
        },
      },
      {
        path: 'shipment-orders/:id',
        name: 'shipment-order-detail',
        component: ShipmentOrderDetailPage,
        meta: {
          title: 'Shipment Order Detail',
          serviceName: '출하지시서 상세',
          description: '출하지시서의 상세 내용을 확인합니다.',
        },
      },
      {
        path: 'collections',
        name: 'collections',
        component: CollectionsPage,
        meta: {
          title: 'Collections',
          serviceName: '매출·수금 현황',
          description: '매출 실적 및 수금 내역을 조회하고 관리합니다.',
        },
      },
      {
        path: 'shipments',
        name: 'shipments',
        component: ShipmentsPage,
        meta: {
          title: 'Shipments',
          serviceName: '출하현황',
          description: '전체 출하 건의 진행 상태를 모니터링합니다.',
        },
      },
      {
        path: 'shipments/:id',
        name: 'shipment-detail',
        component: ShipmentsDetailPage,
        meta: {
          title: 'Shipment Detail',
          serviceName: '출하현황 상세',
          description: '개별 출하 건의 상세 진행 상태를 확인합니다.',
        },
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: ContactListPage,
        meta: {
          title: 'Contacts',
          serviceName: '컨택 리스트',
          description: '거래처 담당자 연락처를 조회하고 관리합니다.',
        },
      },
      {
        path: 'emails',
        name: 'emails',
        component: EmailListPage,
        meta: {
          title: 'Emails',
          serviceName: '메일 이력',
          description: '거래처 발송 메일 이력을 조회합니다.',
        },
      },
      {
        path: 'package',
        name: 'package',
        component: ActivityPackagePage,
        meta: {
          title: 'Package',
          serviceName: '활동기록 패키지',
          description: '활동기록을 패키지 단위로 묶어 조회합니다.',
        },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/auth/UserManagementPage.vue'),
        meta: {
          title: 'Users',
          serviceName: '사용자 관리',
          description: '시스템 사용자 계정을 조회하고 관리합니다.',
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
