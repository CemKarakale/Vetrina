export interface StatWidgetData {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: string;
  color: 'purple' | 'orange' | 'green' | 'pink';
  format?: 'number' | 'currency' | 'percent';
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartWidgetData {
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: ChartDataPoint[];
  color?: string;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SpendingWidgetData {
  title: string;
  totalSpent: number;
  categories: SpendingCategory[];
  period: string;
}

export interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  imageUrl?: string;
}

export interface TopProductsWidgetData {
  title: string;
  products: TopProduct[];
}

export interface RecentOrder {
  id: number;
  productName: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface RecentActivityWidgetData {
  title: string;
  orders: RecentOrder[];
}

export type WidgetType = 'stat' | 'chart' | 'spending' | 'top-products' | 'recent-activity';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  gridArea?: string;
}

export type DashboardRole = 'USER' | 'CORPORATE' | 'ADMIN';
export type DashboardRange = '7d' | '30d' | '90d';

export interface DashboardInsight {
  label: string;
  value: string;
  detail: string;
  status?: 'good' | 'warning' | 'danger' | 'neutral';
}

export interface DashboardAlert {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface CustomerSegment {
  name: string;
  customers: number;
  averageSpend: number;
  satisfaction: number;
}

export interface StoreComparisonItem {
  storeName: string;
  revenue: number;
  orders: number;
  rating: number;
}

export interface AuditActivity {
  actor: string;
  action: string;
  date: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface UserDashboardDto {
  spending: SpendingOverview;
  spendingTrend: ChartWidgetData;
  recentOrders: RecentOrder[];
  stats: StatWidgetData[];
  personalInsights?: DashboardInsight[];
  shipmentAlerts?: DashboardAlert[];
}

export interface SpendingOverview {
  title: string;
  totalSpent: number;
  period: string;
  categories: SpendingCategory[];
}

export interface CorporateDashboardDto {
  revenue: StatWidgetData;
  orders: StatWidgetData;
  products: StatWidgetData;
  conversionRate: StatWidgetData;
  revenueChart: ChartWidgetData;
  topProducts: TopProductsWidgetData;
  categoryDistribution: ChartWidgetData;
  inventoryAlerts?: DashboardAlert[];
  customerSegments?: CustomerSegment[];
  fulfillmentInsights?: DashboardInsight[];
  reviewInsights?: DashboardInsight[];
}

export interface TopProductsData {
  title: string;
  products: TopProduct[];
}

export interface AdminDashboardDto {
  totalRevenue: StatWidgetData;
  totalOrders: StatWidgetData;
  totalUsers: StatWidgetData;
  totalStores: StatWidgetData;
  platformRevenueChart: ChartWidgetData;
  userGrowthChart: ChartWidgetData;
  categoryDistribution: ChartWidgetData;
  storeComparisons?: StoreComparisonItem[];
  auditActivities?: AuditActivity[];
  systemInsights?: DashboardInsight[];
}

export type DashboardData = UserDashboardDto | CorporateDashboardDto | AdminDashboardDto;
