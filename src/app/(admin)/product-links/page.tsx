import React from 'react';
import { AdminProductLinksView } from '../../../components/admin/admin-views';
import { ProductLink } from '../../../types';

interface AdminProductLinksPageProps {
  productLinks: ProductLink[];
}

export default function AdminProductLinksPage(props: AdminProductLinksPageProps) {
  return <AdminProductLinksView {...props} />;
}
