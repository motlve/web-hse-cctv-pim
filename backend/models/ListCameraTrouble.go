package models

import (
	"time"
)

type ListCameraTrouble struct {
	IDCamera         string    `gorm:"primaryKey;type:varchar(50)" json:"id_camera"`
	TanggalInput     time.Time `json:"tanggal_input"`
	Lokasi           string    `json:"lokasi"`
	LokasiDetail     string    `json:"lokasi_detail"`
	Keterangan       string    `json:"keterangan"`
	Petugas          string    `json:"petugas"`
	StartError       time.Time `json:"start_error"`
	RequestPerbaikan time.Time `json:"request_perbaikan"`
	SelesaiPerbaikan time.Time `json:"selesai_perbaikan"`
	Status           string    `json:"status"`
	DurasiError      string    `json:"durasi_error"` // ✅ baru
	ResponseTime     string    `json:"response_time"`
	AverageResponse  string    `json:"average_response"`
}

// Nama tabel di database
func (ListCameraTrouble) TableName() string {
	return "list_camera_trouble"
}
