package models

import (
	"time"
)

type SummaryRequestCamera struct {
	IDCamera       string     `gorm:"primaryKey;type:varchar(50)" json:"id_camera"`
	TanggalRequest time.Time  `json:"tanggal_request"`                   // Tanggal permintaan
	Lokasi         string     `json:"lokasi"`                            // Dari data lokasi
	LokasiDetail   string     `json:"lokasi_detail"`                     // Detail lokasi
	TanggalPemasangan *time.Time `json:"tanggal_pemasangan,omitempty"`     // Tanggal pemasangan, bisa kosong
	Status         string     `json:"status"`                             // Request / Success
	ProgressDays   int        `json:"progress_days"`                     // Selisih hari antara request dan pemasangan
	InputDatabase  string     `json:"input_database"`                     // Dropdown: Terinput / Belum Terinput
	Keterangan     string     `json:"keterangan"`                        // Catatan tambahan
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (SummaryRequestCamera) TableName() string {
	return "summary_request_camera"
}