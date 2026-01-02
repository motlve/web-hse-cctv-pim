package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Variabel global DB
var DB *gorm.DB

// Struct User
type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
	Fullname string `json:"fullname"`
}

// =============================
// 🔐 Fungsi Hash & Verify Password
// =============================

// HashPassword mengubah password biasa menjadi hash bcrypt
func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// CheckPassword memverifikasi apakah input password sesuai hash di DB
func (u *User) CheckPassword(inputPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(inputPassword))
	return err == nil
}

// =============================
// 📦 Fungsi Query Helper
// =============================

// GetUserByUsername mencari user berdasarkan username
func GetUserByUsername(db *gorm.DB, username string) (*User, error) {
	var user User
	err := db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateUser membuat user baru sekaligus hash password-nya
func CreateUser(db *gorm.DB, username, password, role, fullname string) (*User, error) {
	user := User{
		Username: username,
		Role:     role,
		Fullname: fullname,
	}
	err := user.HashPassword(password)
	if err != nil {
		return nil, err
	}

	if err := db.Create(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func SeedDefaultUsers(db *gorm.DB) {
	users := []struct {
		Username string
		Password string
		Role     string
		Fullname string
	}{
		{"32502", "managerhse001", "Manager HSE", "Yudha Pranata"},
	}

	for _, u := range users {
		var count int64
		db.Model(&User{}).Where("username = ?", u.Username).Count(&count)

		if count == 0 {
			newUser, err := CreateUser(db, u.Username, u.Password, u.Role, u.Fullname)
			if err != nil {
				println("❌ Gagal membuat user:", u.Username, "-", err.Error())
			} else {
				println("✅ User dibuat:", newUser.Username, "(", newUser.Role, ")")
			}
		} else {
			println("ℹ️ User sudah ada, skip:", u.Username)
		}
	}
}