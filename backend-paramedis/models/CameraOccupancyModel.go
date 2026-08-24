package models

import (
	"time"
)

type CameraOccupancy struct {
	ID uint `gorm:"primaryKey;autoIncrement" json:"id"`

	// Area
	Area string `gorm:"type:varchar(100);index" json:"area"`

	// Jumlah kamera
	TotalKamera int `json:"total_kamera"`

	// Jenis kamera
	IP int `json:"ip"`

	Analog int `json:"analog"`

	// Persentase
	PersentaseIP float64 `gorm:"type:decimal(5,2)" json:"persentase_ip"`

	PersentaseAnalog float64 `gorm:"type:decimal(5,2)" json:"persentase_analog"`

	// Kamera tambahan
	JumlahKameraTambahan int `json:"jumlah_kamera_tambahan"`

	// Keterangan
	Keterangan string `gorm:"type:text" json:"keterangan"`

	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`
}

func (CameraOccupancy) TableName() string {
	return "camera_occupancy"
}