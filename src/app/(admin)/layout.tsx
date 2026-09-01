import React from 'react';
import { AdminLayout } from '../../components/admin/admin-layout';
import { AdminNavTab } from '../../components/admin/admin-sidebar';
import { StoreSettings } from '../../types';

interface AdminAppLayoutProps {
  children: React.ReactNode;
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  onSwitchToUser: () => void;
  storeSettings: StoreSettings;
}

export default function AdminAppLayout(props: AdminAppLayoutProps) {
  return <AdminLayout {...props} />;
}
