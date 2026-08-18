package models

import "gorm.io/gorm"

type LocationModels struct {
	ID   uint   `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`
}

func GetAllLocations(db *gorm.DB) ([]LocationModels, error) {
	var locations []LocationModels
	result := db.Find(&locations)
	return locations, result.Error
}

func CreateLocation(db *gorm.DB, location *LocationModels) (error) {
	return db.Create(location).Error
}

func UpdateLocation(db *gorm.DB, location *LocationModels) error {
	return db.Save(location).Error
}

func DeleteLocation(db *gorm.DB, id uint) error {
	return db.Delete(&LocationModels{}, id).Error
}