package models

import (
	"time"
)

type ServicePerformance struct {

	ID uint `gorm:"primaryKey" json:"id"`

	Area string `json:"area"`

	Perangkat string `json:"perangkat"`

	TotalCameraAffected int `json:"total_camera_affected"`

	TanggalKerusakan time.Time `json:"tanggal_kerusakan"`

	TanggalDilaporkan *time.Time `json:"tanggal_dilaporkan"`

	TanggalBerfungsiKembali *time.Time `json:"tanggal_berfungsi_kembali"`

	TotalDurasiPerbaikan int `json:"total_durasi_perbaikan"`

	Status string `json:"status"`

	Keterangan string `json:"keterangan"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`
}

func (ServicePerformance) TableName() string {
	return "service_performance"
}