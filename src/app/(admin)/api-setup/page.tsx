import React from 'react';
import { AdminApiSetupView } from '../../../components/admin/admin-views';
import { ApiConfig } from '../../../types';

interface AdminApiSetupPageProps {
  apiConfigs: ApiConfig[];
  onSaveApiConfig: (config: ApiConfig) => void;
}

export default function AdminApiSetupPage(props: AdminApiSetupPageProps) {
  return <AdminApiSetupView {...props} />;
}
