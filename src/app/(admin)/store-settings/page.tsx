import React from 'react';
import { AdminStoreSettingsView } from '../../../components/admin/admin-views';
import { StoreSettings } from '../../../types';

interface AdminStoreSettingsPageProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
}

export default function AdminStoreSettingsPage(props: AdminStoreSettingsPageProps) {
  return <AdminStoreSettingsView {...props} />;
}
