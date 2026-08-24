import Swal from 'sweetalert2';

// Konfigurasi dasar bergaya Apple, dipakai di semua Swal.fire()
export const appleSwalConfig = {
  customClass: {
    popup: 'apple-swal-popup',
    title: 'apple-swal-title',
    htmlContainer: 'apple-swal-html',
    confirmButton: 'apple-swal-confirm',
    cancelButton: 'apple-swal-cancel',
    actions: 'apple-swal-actions',
    icon: 'apple-swal-icon',
  },
  buttonsStyling: false, // penting: matikan style default Swal biar custom class kepakai
  backdrop: 'rgba(0,0,0,0.35)',
  showClass: {
    popup: 'swal2-show', // animasi default sudah cukup halus, bisa custom lagi kalau mau
  },
};

// Helper: gabungkan config apple dengan opsi lain
export const appleSwal = (options) => {
  return Swal.fire({
    ...appleSwalConfig,
    ...options,
    customClass: {
      ...appleSwalConfig.customClass,
      ...(options.customClass || {}),
    },
  });
};
