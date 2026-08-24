package models

import (
	"os"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// =============================
// GLOBAL DB
// =============================

var DB *gorm.DB


// =============================
// USER MODEL
// =============================

type User struct {

	gorm.Model


	Username string `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`


	Password string `gorm:"not null" json:"-"`


	Role string `gorm:"type:varchar(50);index" json:"role"`


	Fullname string `gorm:"type:varchar(100)" json:"fullname"`


	Email string `gorm:"type:varchar(100)" json:"email"`



	// =============================
	// USER ONLINE TRACKING
	// =============================

	// true selama user belum logout
	IsOnline bool `gorm:"default:false;index" json:"is_online"`


	// waktu terakhir login
	LastLogin *time.Time `gorm:"column:last_login" json:"last_login,omitempty"`


	// aktivitas terakhir user
	LastActivity *time.Time `gorm:"column:last_activity" json:"last_activity,omitempty"`



	// =============================
	// RESET PASSWORD OTP
	// =============================

	ResetOTP string `gorm:"type:varchar(10)" json:"-"`


	OTPExpiredAt *time.Time `json:"otp_expired_at,omitempty"`

}



// =============================
// HASH PASSWORD
// =============================

func (u *User) HashPassword(password string) error {


	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)


	if err != nil {
		return err
	}


	u.Password = string(hash)


	return nil
}



// =============================
// CHECK PASSWORD
// =============================

func (u *User) CheckPassword(password string) bool {


	err := bcrypt.CompareHashAndPassword(
		[]byte(u.Password),
		[]byte(password),
	)


	return err == nil
}



// =============================
// GET USER BY USERNAME
// =============================

func GetUserByUsername(
	db *gorm.DB,
	username string,
) (*User,error){


	var user User


	err := db.
		Where(
			"username = ?",
			username,
		).
		First(&user).
		Error


	if err != nil {

		return nil,err

	}


	return &user,nil
}



// =============================
// CREATE USER
// =============================

func CreateUser(
	db *gorm.DB,
	username string,
	password string,
	role string,
	fullname string,

)(*User,error){


	user := User{

		Username: username,

		Role: role,

		Fullname: fullname,

		IsOnline:false,
	}



	err := user.HashPassword(password)


	if err != nil {

		return nil,err

	}



	err = db.Create(&user).Error


	if err != nil {

		return nil,err

	}



	return &user,nil
}



// =============================
// UPDATE USER
// =============================

func UpdateUserData(
	db *gorm.DB,
	user *User,

	fullname string,
	role string,
	email string,

)error{


	user.Fullname = fullname

	user.Role = role

	user.Email = email



	return db.Save(user).Error

}



// =============================
// SET USER ONLINE
// =============================

func SetUserOnline(
	db *gorm.DB,
	userID uint,

) error {


	now := time.Now()


	return db.Model(&User{}).
		Where(
			"id = ?",
			userID,
		).
		Updates(map[string]interface{}{

			"is_online": true,

			"last_login": &now,

			"last_activity": &now,

		}).Error

}



// =============================
// UPDATE LAST ACTIVITY
// =============================
//
// Tidak mengubah status online
// User tetap online sampai logout
//

func UpdateLastActivity(
	db *gorm.DB,
	userID uint,

) error {


	now := time.Now()


	return db.Model(&User{}).
		Where(
			"id = ?",
			userID,
		).
		Update(
			"last_activity",
			&now,
		).
		Error

}



// =============================
// SET USER OFFLINE
// =============================

func SetUserOffline(
	db *gorm.DB,
	userID uint,

) error {


	return db.Model(&User{}).
		Where(
			"id = ?",
			userID,
		).
		Updates(map[string]interface{}{

			"is_online": false,

		}).Error

}



// =============================
// SEED DEFAULT USER
// =============================

func SeedDefaultUsers(db *gorm.DB){


	if err := godotenv.Load(); err != nil {

		println(
			"⚠️ .env tidak ditemukan",
		)

	}



	username :=
		os.Getenv(
			"DEFAULT_ADMIN_USERNAME",
		)


	password :=
		os.Getenv(
			"DEFAULT_ADMIN_PASSWORD",
		)


	fullname :=
		os.Getenv(
			"DEFAULT_ADMIN_NAME",
		)



	if username == "" ||
		password == "" ||
		fullname == "" {


		println(
			"⚠️ Default admin belum dikonfigurasi",
		)


		return

	}



	var count int64


	db.Model(&User{}).
		Where(
			"username = ?",
			username,
		).
		Count(&count)



	if count > 0 {


		println(
			"ℹ️ user sudah ada:",
			username,
		)


		return

	}



	user,err :=
		CreateUser(
			db,
			username,
			password,
			"Admin",
			fullname,
		)



	if err != nil {


		println(
			"❌ gagal membuat user:",
			err.Error(),
		)


		return

	}



	println(
		"✅ user dibuat:",
		user.Username,
	)

}