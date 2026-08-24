package models

import (
	"time"
)

type SummaryRequestCamera struct {
	ID uint `gorm:"primaryKey;autoIncrement" json:"id"`
	IDCamera string `gorm:"type:varchar(50);index" json:"id_camera"`
	TanggalRequest time.Time `json:"tanggal_request"`
	Lokasi string `json:"lokasi"`
	LokasiDetail string `json:"lokasi_detail"`
	TanggalPemasangan *time.Time `json:"tanggal_pemasangan,omitempty"`
	Status string `json:"status"`
	ProgressDays int `json:"progress_days"`
	InputDatabase string `json:"input_database"`
	Keterangan string `json:"keterangan"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


func (SummaryRequestCamera) TableName() string {
	return "summary_request_camera"
}