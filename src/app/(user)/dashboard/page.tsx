import React from 'react';
import { UserDashboard } from '../../../components/user/user-dashboard';
import { UserStats, TopSeller, StoreSettings } from '../../../types';
import { QuickActionKey } from '../../../components/user/quick-actions';

interface UserDashboardPageProps {
  userStats: UserStats;
  topSellers: TopSeller[];
  storeSettings: StoreSettings;
  onQuickAction: (action: QuickActionKey) => void;
  onOpenDeposit: () => void;
}

export default function UserDashboardPage(props: UserDashboardPageProps) {
  return <UserDashboard {...props} />;
}
