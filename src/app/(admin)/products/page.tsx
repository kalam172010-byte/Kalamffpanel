import React from 'react';
import { AdminProductsView } from '../../../components/admin/admin-views';
import { Product } from '../../../types';

interface AdminProductsPageProps {
  products: Product[];
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onToggleMaintenance: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteAllProducts?: () => void;
  onBulkToggleStatus?: (productIds: string[], targetStatus?: 'ACTIVE' | 'DISABLED') => void;
}

export default function AdminProductsPage(props: AdminProductsPageProps) {
  return <AdminProductsView {...props} />;
}
