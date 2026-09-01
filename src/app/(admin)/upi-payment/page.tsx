import React from 'react';
import { AdminUpiPaymentView } from '../../../components/admin/admin-views';
import { PaymentGatewayConfig } from '../../../types';

interface AdminUpiPaymentPageProps {
  paymentConfigs: PaymentGatewayConfig[];
  onSaveConfig: (config: PaymentGatewayConfig) => void;
}

export default function AdminUpiPaymentPage(props: AdminUpiPaymentPageProps) {
  return <AdminUpiPaymentView {...props} />;
}
