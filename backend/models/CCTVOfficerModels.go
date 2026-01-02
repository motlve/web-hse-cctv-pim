package models

import "gorm.io/gorm"

type OfficerModels struct {
	gorm.Model
	NameOfficer string `json:"name_officer"`
	Gender      string `json:"gender"`
	Role        string `json:"role"`
}

func GetAllOfficers(db *gorm.DB) ([]OfficerModels, error) {
	var officers []OfficerModels
	err := db.Find(&officers).Error
	return officers, err
}

func GetOfficersByName(db *gorm.DB, name string) ([]OfficerModels, error) {
	var officers []OfficerModels
	err := db.Where("name_officer LIKE ?", "%"+name+"%").Find(&officers).Error
	return officers, err
}


func CreateOfficer(db *gorm.DB, officer *OfficerModels) error {
	return db.Create(officer).Error
}

func UpdateOfficer(db *gorm.DB, officer *OfficerModels) error {
	return db.Save(officer).Error
}

func DeleteOfficer(db *gorm.DB, id uint) error {
	return db.Delete(&OfficerModels{}, id).Error
}