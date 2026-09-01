import React from 'react';
import { UserLayout } from '../../components/user/user-layout';
import { UserNavTab } from '../../components/user/user-sidebar';
import { StoreSettings } from '../../types';

interface UserAppLayoutProps {
  children: React.ReactNode;
  activeTab: UserNavTab;
  onSelectTab: (tab: UserNavTab) => void;
  onOpenHowToDeposit: () => void;
  onOpenSupport: () => void;
  onOpenProfile: () => void;
  onSwitchToAdmin: () => void;
  storeSettings: StoreSettings;
}

export default function UserAppLayout(props: UserAppLayoutProps) {
  return <UserLayout {...props} />;
}
