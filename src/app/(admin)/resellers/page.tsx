import React from 'react';
import { AdminResellersView } from '../../../components/admin/admin-views';
import { ResellerUser } from '../../../types';

interface AdminResellersPageProps {
  resellers: ResellerUser[];
  onPromoteUser: (userId: string) => void;
  onDemoteUser: (userId: string) => void;
}

export default function AdminResellersPage(props: AdminResellersPageProps) {
  return <AdminResellersView {...props} />;
}
