package models

import (
	"time"

	"gorm.io/gorm"
)

type ComplaintRecord struct {

	ID uint `gorm:"primaryKey" json:"id"`

	// ==== Tahap 1 — diisi Petugas GSL (wajib saat create) ====

	ComplaintDate time.Time `json:"complaintDate"`

	ReporterName string `json:"reporterName"`

	GSLOfficerID uint `json:"gslOfficerId"`

	GSLOfficer GSLOfficerModel `gorm:"foreignKey:GSLOfficerID" json:"gslOfficer,omitempty"`

	IncidentDate time.Time `json:"incidentDate"`

	DetailLocation string `json:"detailLocation"`

	ComplaintDescription string `json:"complaintDescription"`

	DateTimeReported time.Time `json:"dateTimeReported"`

	CategoryID uint `json:"categoryId"`

	Category ComplaintCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`

	Month string `json:"month"`

	// ==== Tahap 2 — diisi Petugas CCTV (belakangan, nullable) ====

	Chronology *string `json:"chronology,omitempty"`

	DateTimeFollowedUp *time.Time `json:"dateTimeFollowedUp,omitempty"`

	Notes *string `json:"notes,omitempty"`

	// ==== Tahap 3 — diisi Manager HSE (belakangan, nullable) ====

	Status *string `json:"status,omitempty"`

	// Total Response SENGAJA tidak disimpan sebagai kolom — dihitung 
	// di controller dari selisih DateTimeFollowedUp - DateTimeReported, 
	// biar gak out-of-sync kalau salah satu tanggal diedit belakangan.

	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

}

func (ComplaintRecord) TableName() string {
	return "complaint_record"
}