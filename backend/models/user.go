package models

import (
	"errors"

	"gorm.io/gorm"
)

var DB *gorm.DB

type User struct {
	gorm.Model
	Username string `json:"username" gorm:"unique;not null"`
	Password string `json:"password" gorm:"not null"`
	Role	 string `json:"role" gorm:"not null"`
	Fullname string `json:"fullname" gorm:"not null"`
}

func GetUserByUsername(username string) (*User, error){
	var user User
	result := DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("User not found")
		}
		return nil, result.Error
	}
	return &user, nil
}