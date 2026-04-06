export async function fetchNavigationItems() {
  return [
    { path: '/', label: '대시보드', icon: 'fa-chart-pie', section: 'basic', sectionLabel: '기본' },

    { path: '/master/clients', label: '거래처 관리', icon: 'fa-building', section: 'sales', sectionLabel: '기초정보' },
    { path: '/master/items', label: '품목 관리', icon: 'fa-box', section: 'sales', sectionLabel: '기초정보' },

    { path: '/pi', label: 'PI (견적송장)', icon: 'fa-file-invoice', section: 'orders', sectionLabel: '주문' },
    { path: '/po', label: 'PO (발주서)', icon: 'fa-file-contract', section: 'orders', sectionLabel: '주문' },
    { path: '/ci', label: 'CI (상업송장)', icon: 'fa-file-invoice-dollar', section: 'orders', sectionLabel: '주문' },
    { path: '/pl', label: 'PL (포장명세)', icon: 'fa-boxes-stacked', section: 'orders', sectionLabel: '주문' },

    { path: '/production', label: '생산지시서', icon: 'fa-industry', section: 'status', sectionLabel: '생산·출하' },
    { path: '/shipment-orders', label: '출하지시서', icon: 'fa-truck-loading', section: 'status', sectionLabel: '생산·출하' },
    { path: '/collections', label: '매출·수금', icon: 'fa-coins', section: 'status', sectionLabel: '생산·출하' },
    { path: '/shipments', label: '출하현황', icon: 'fa-shipping-fast', section: 'status', sectionLabel: '생산·출하' },

    { path: '/activities', label: '활동기록', icon: 'fa-clipboard-list', section: 'activity', sectionLabel: '활동' },
    { path: '/contacts', label: '컨택 리스트', icon: 'fa-address-book', section: 'activity', sectionLabel: '활동' },
    { path: '/emails', label: '메일 이력', icon: 'fa-envelope', section: 'activity', sectionLabel: '활동' },
    { path: '/package', label: '활동 패키지', icon: 'fa-folder-open', section: 'activity', sectionLabel: '활동' },

    { path: '/users', label: '사용자 관리', icon: 'fa-users-cog', section: 'admin', sectionLabel: '관리' },
  ]
}
