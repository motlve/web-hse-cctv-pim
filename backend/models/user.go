package models

import (
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

func GetUserByUsername(db *gorm.DB, username string) (*User, error) {
    var user User
    err := db.Where("username = ?", username).First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}
