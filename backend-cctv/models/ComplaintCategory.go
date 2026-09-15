package models

import (
	"gorm.io/gorm"
)

type ComplaintCategory struct {

	ID uint `gorm:"primaryKey" json:"id"`

	Name string `json:"name"`

	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

}

func (ComplaintCategory) TableName() string {
	return "complaint_category"
}