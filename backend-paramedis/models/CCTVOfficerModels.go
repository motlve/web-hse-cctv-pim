package models

import (
	"time"

	"gorm.io/gorm"
)

type OfficerModels struct {

	ID uint `gorm:"primaryKey" json:"ID"`

	NameOfficer string `json:"name_officer"`

	Gender string `json:"gender"`

	Role string `json:"role"`


	// Status Officer
	// Aktif / Mutasi / Resign
	Status string `json:"status"`


	// Tanggal perubahan status terakhir
	TanggalStatus *time.Time `json:"tanggal_status"`


	// GORM Timestamp
	CreatedAt time.Time `json:"created_at"`

	UpdatedAt time.Time `json:"updated_at"`


	// Soft Delete
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}



// =====================================
// GET ALL OFFICER
// =====================================

func GetAllOfficers(
	db *gorm.DB,
) ([]OfficerModels, error) {

	var officers []OfficerModels

	err := db.
		Find(&officers).
		Error

	return officers, err
}



// =====================================
// SEARCH OFFICER BY NAME
// =====================================

func GetOfficersByName(
	db *gorm.DB,
	name string,
) ([]OfficerModels, error) {

	var officers []OfficerModels


	err := db.
		Where(
			"name_officer LIKE ?",
			"%"+name+"%",
		).
		Find(&officers).
		Error


	return officers, err
}



// =====================================
// CREATE OFFICER
// =====================================

func CreateOfficer(
	db *gorm.DB,
	officer *OfficerModels,
) error {


	// default status
	if officer.Status == "" {

		officer.Status = "Aktif"

	}


	// tanggal status awal
	now := time.Now()

	if officer.TanggalStatus == nil {

		officer.TanggalStatus = &now

	}


	return db.
		Create(officer).
		Error
}



// =====================================
// UPDATE STATUS OFFICER
// =====================================

func UpdateOfficerStatus(
	db *gorm.DB,
	id uint,
	status string,
) error {


	now := time.Now()


	return db.
		Model(&OfficerModels{}).
		Where(
			"id = ?",
			id,
		).
		Updates(
			map[string]interface{}{

				"status": status,

				"tanggal_status": now,

			},
		).
		Error
}

// =====================================
// DELETE OFFICER
// Soft Delete GORM
// =====================================

func DeleteOfficer(
	db *gorm.DB,
	id uint,
) error {

	return db.
		Delete(
			&OfficerModels{},
			id,
		).
		Error
}