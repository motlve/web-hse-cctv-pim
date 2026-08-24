import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { Portal } from './Portal';

/**
 * HoverDropdown
 *
 * Trigger tetap di posisi aslinya di DOM (jadi styling flex/grid di Topbar
 * tidak berubah). Panel-nya di-render lewat Portal ke document.body dan
 * posisinya dihitung manual dari getBoundingClientRect() trigger, jadi dia
 * tidak pernah kepotong oleh ancestor manapun yang overflow-hidden
 * (mis. Layout.jsx), terlepas dari z-index.
 *
 * align="left"  -> panel rata kiri terhadap trigger (dipakai utk "Fasilitas")
 * align="right" -> panel rata kanan terhadap trigger (dipakai utk "Login")
 */
export function HoverDropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      rightOffset: window.innerWidth - rect.right,
    });
  }, []);

  const handleOpen = () => {
    clearCloseTimer();
    updatePosition();
    setOpen(true);
  };

  const handleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div ref={triggerRef} onMouseEnter={handleOpen} onMouseLeave={handleClose}>
      {trigger}

      {open && coords && (
        <Portal>
          <div
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
            className="fixed z-50"
            style={{
              top: coords.top,
              ...(align === 'right'
                ? { right: coords.rightOffset }
                : { left: coords.left }),
            }}
          >
            {children}
          </div>
        </Portal>
      )}
    </div>
  );
}
