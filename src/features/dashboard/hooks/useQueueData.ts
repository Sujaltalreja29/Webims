import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardCheck, FlaskConical, PackageSearch } from 'lucide-react';
import type { UserRole } from '../../../core/models';
import { refillRequestApi, labResultApi, billingApi, medicationInventoryApi } from '../../../core/services/api';
import { ACCESS_CONTROL } from '../../../core/constants/access-control';

export interface QueueDataItem {
  key: string;
  title: string;
  description: string;
  count: number;
  path: string;
  icon: typeof AlertTriangle;
  colorClasses: string;
  roles: UserRole[];
}

export const useQueueData = (role?: UserRole) => {
  const [loading, setLoading] = useState(true);
  const [queueItems, setQueueItems] = useState<QueueDataItem[]>([]);

  useEffect(() => {
    const loadQueues = async () => {
      setLoading(true);
      try {
        const [pendingRefills, pendingLabs, pendingClaims, deniedClaims, lowStock] = await Promise.all([
          refillRequestApi.getPending(),
          labResultApi.getPendingOrders(),
          billingApi.getPending(),
          billingApi.getDenied(),
          medicationInventoryApi.getLowStock()
        ]);

        setQueueItems([
          {
            key: 'refills',
            title: 'Pending Refills',
            description: 'Requests waiting for clinical review',
            count: pendingRefills.length,
            path: '/clinical/refill-requests',
            icon: ClipboardCheck,
            colorClasses: 'bg-cyan-100 text-cyan-700',
            roles: ACCESS_CONTROL.routes.refillRequests
          },
          {
            key: 'labs',
            title: 'Lab Orders Pending',
            description: 'Ordered or in-progress tests',
            count: pendingLabs.length,
            path: '/lab',
            icon: FlaskConical,
            colorClasses: 'bg-indigo-100 text-indigo-700',
            roles: ACCESS_CONTROL.routes.lab
          },
          {
            key: 'claims',
            title: 'Billing Actions',
            description: 'Draft, submitted, or denied claims',
            count: pendingClaims.length + deniedClaims.length,
            path: '/billing',
            icon: AlertTriangle,
            colorClasses: 'bg-amber-100 text-amber-700',
            roles: ACCESS_CONTROL.routes.billing
          },
          {
            key: 'inventory',
            title: 'Low Stock Alerts',
            description: 'Medications at or below reorder level',
            count: lowStock.length,
            path: '/pharmacy/inventory',
            icon: PackageSearch,
            colorClasses: 'bg-rose-100 text-rose-700',
            roles: ACCESS_CONTROL.routes.pharmacyInventory
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadQueues();
  }, []);

  const visibleQueues = useMemo(
    () => queueItems.filter((queue) => (role ? queue.roles.includes(role) : false)),
    [queueItems, role]
  );

  return { loading, queueItems: visibleQueues };
};
