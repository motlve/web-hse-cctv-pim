package models

import "gorm.io/gorm"

type CategoryModels struct {
	ID   uint   `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`
}

func GetAllCategories(db *gorm.DB) ([]CategoryModels, error) {
	var categories []CategoryModels
	result := db.Find(&categories)
	return categories, result.Error
}

func CreateCategory(db *gorm.DB, category *CategoryModels) (error) {
	return db.Create(category).Error
}

func UpdateCategory(db *gorm.DB, category *CategoryModels) error {
	return db.Save(category).Error
}

func DeleteCategory(db *gorm.DB, id uint) error {
	return db.Delete(&CategoryModels{}, id).Error
}