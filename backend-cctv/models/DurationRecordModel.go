package models

import (
	"time"
)

type RecordingDuration struct {
	ID uint `gorm:"primaryKey;autoIncrement" json:"id"`

	// Nomor DVR / NVR
	NoDVRNVR string `gorm:"type:varchar(100);uniqueIndex" json:"no_dvr_nvr"`

	// Jenis kamera yang direkam
	JenisKamera string `gorm:"type:varchar(50)" json:"jenis_kamera"`
	// Contoh:
	// IP Camera
	// Analog Camera
	// Mixed

	// Lama penyimpanan
	DurasiRekamanHari int `json:"durasi_rekaman_hari"`

	// Kapasitas HDD
	KapasitasTB float64 `gorm:"type:decimal(10,2)" json:"kapasitas_tb"`

	// Keterangan
	Keterangan string `gorm:"type:text" json:"keterangan"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (RecordingDuration) TableName() string {
	return "recording_duration"
}