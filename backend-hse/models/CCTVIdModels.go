package models

import (
	"backend/config"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type IDCCTVModels struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	IDCamera            string `json:"id_camera" gorm:"type:varchar(100);uniqueIndex;not null"`
	IDNVR               string `json:"id_nvr" gorm:"not null"`
	Lokasi              string `json:"lokasi"`
	Area                string `json:"area"`
	Kondisi             string `json:"kondisi"`
	JumlahError         int    `json:"jumlah_error"`
	JumlahRequest       int    `json:"jumlah_request"`
	JumlahOnKembali     int    `json:"jumlah_on_kembali"`
	JumlahDurasiError   string `json:"jumlah_durasi_error"`
	AverageDurasiXError string `json:"average_durasi_x_error"`
}

func (IDCCTVModels) TableName() string {
	return "id_cctv"
}

// convert menit float64 ke format HH:MM:SS
func minutesToHHMMSS(minutes float64) string {
	totalSeconds := int(minutes * 60)
	h := totalSeconds / 3600
	m := (totalSeconds % 3600) / 60
	s := totalSeconds % 60
	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}



// Fungsi internal untuk hitung ulang statistik
func (c *IDCCTVModels) RecalculateStats() error {

	var logs []ListCameraTrouble

	if err := config.DB.
		Where("id_camera = ?", c.IDCamera).
		Find(&logs).Error; err != nil {
		return err
	}

	totalErrors := len(logs)
	totalRequests := 0
	totalOnKembali := 0

	var totalDurasi float64

	for _, log := range logs {

		if log.RequestPerbaikan != nil {
			totalRequests++
		}

		if log.SelesaiPerbaikan != nil {
			totalOnKembali++
		}

		if log.SelesaiPerbaikan != nil && !log.StartError.IsZero() {
			duration := log.SelesaiPerbaikan.Sub(log.StartError).Minutes()

			if duration > 0 {
				totalDurasi += duration
			}
		}
	}

	averageDurasi := 0.0

	if totalErrors > 0 {
		averageDurasi = totalDurasi / float64(totalErrors)
	}

	c.JumlahError = totalErrors
	c.JumlahRequest = totalRequests
	c.JumlahOnKembali = totalOnKembali
	c.JumlahDurasiError = minutesToHHMMSS(totalDurasi)
	c.AverageDurasiXError = minutesToHHMMSS(averageDurasi)


	return config.DB.
		Model(&IDCCTVModels{}).
		Where("id_camera = ?", c.IDCamera).
		Updates(map[string]interface{}{
			"jumlah_error":            c.JumlahError,
			"jumlah_request":          c.JumlahRequest,
			"jumlah_on_kembali":       c.JumlahOnKembali,
			"jumlah_durasi_error":     c.JumlahDurasiError,
			"average_durasi_x_error":  c.AverageDurasiXError,
		}).Error
}