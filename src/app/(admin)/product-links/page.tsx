import React from 'react';
import { AdminProductLinksView } from '../../../components/admin/admin-views';
import { ProductLink, Product } from '../../../types';

interface AdminProductLinksPageProps {
  productLinks: ProductLink[];
  products?: Product[];
  onSaveProductLink?: (link: ProductLink) => void;
  onDeleteProductLink?: (id: string) => void;
  onSyncAllProductLinks?: () => void;
  onToggleLinkStatus?: (linkId: string, status: 'ACTIVE' | 'DISABLED') => void;
}

export default function AdminProductLinksPage(props: AdminProductLinksPageProps) {
  return <AdminProductLinksView {...props} />;
}
