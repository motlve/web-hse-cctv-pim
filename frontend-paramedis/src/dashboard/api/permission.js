export const ROLE = {
  ADMIN: 'admin',
  MANAGER_HSE: 'manager_hse',
  PETUGAS_HSE: 'petugas_hse',
  PETUGAS_CCTV: 'petugas_cctv',
  GUEST: 'guest',
};

export const canView = (role, menu) => {
  const permission = {
    admin: [
      'dashboard',
      'incident',
      'camera',
      'location',
      'category',
      'officer',
      'user',
      'performance',
    ],

    manager_hse: [
      'dashboard',
      'incident',
      'camera',
      'location',
      'category',
      'officer',
      'performance',
    ],

    petugas_hse: [
      'dashboard',
      'incident',
      'camera',
      'location',
      'category',
      'officer',
      'performance',
    ],

    petugas_cctv: ['dashboard', 'location', 'category', 'officer', 'camera'],

    guest: ['dashboard', 'incident', 'camera', 'location', 'category', 'officer', 'performance'],
  };

  return permission[role]?.includes(menu);
};

export const canEdit = (role, menu) => {
  const editPermission = {
    admin: ['incident', 'camera', 'location', 'category', 'officer', 'user', 'performance'],

    manager_hse: ['incident', 'camera', 'location', 'category', 'officer', 'performance'],

    petugas_hse: ['incident', 'camera', 'location', 'category', 'officer'],

    petugas_cctv: [],

    guest: [],
  };

  return editPermission[role]?.includes(menu);
};
