import React from 'react';
import { AdminDashboardOverview } from '../../../components/admin/admin-views';
import { Product, ResellerUser } from '../../../types';

interface AdminDashboardPageProps {
  products: Product[];
  resellers: ResellerUser[];
  onNavigate: (tab: any) => void;
}

export default function AdminDashboardPage(props: AdminDashboardPageProps) {
  return <AdminDashboardOverview {...props} />;
}
