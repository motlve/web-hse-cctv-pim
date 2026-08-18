package models

import (
	"time"

	"gorm.io/gorm"
)


type IncidentRecord struct {

ID uint `gorm:"primaryKey" json:"id"`

DatetimeOfIncident time.Time `json:"datetimeOfIncident"`

Location string `json:"location"`

Category string `json:"category"`

DescriptionOfIncident string `json:"descriptionOfIncident"`

NameOfficer string `json:"nameOfficer"`

Information *string `json:"information,omitempty"`

DatetimeComplete *time.Time `json:"datetimeComplete,omitempty"`

Duration *string `json:"duration,omitempty"`


DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

}

func (IncidentRecord) TableName() string {
    return "incident_record"
}
