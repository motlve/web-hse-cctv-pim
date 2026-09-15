package models

import (
	"time"

	"gorm.io/gorm"
)

type GSLOfficerModel struct {

	ID uint `gorm:"primaryKey" json:"id"`

	NameOfficer string `json:"nameOfficer"`

	Gender string `json:"gender"`

	Role string `json:"role"`

	Status string `json:"status"`

	TanggalStatus *time.Time `json:"tanggalStatus,omitempty"`

	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

}

func (GSLOfficerModel) TableName() string {
	return "gsl_officer"
}