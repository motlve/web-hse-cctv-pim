package controllers

import (
	"backend/config"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// =======================
// STRUCT
// =======================

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}


type RequestResetPasswordRequest struct {
	Username string `json:"username"`
}


type VerifyOTPRequest struct {
	Username string `json:"username"`
	OTP      string `json:"otp"`
}


type ResetPasswordRequest struct {
	Username    string `json:"username"`
	OTP         string `json:"otp"`
	NewPassword string `json:"newPassword"`
}



// =======================
// CHECK USER
// =======================

func CheckUser(
	w http.ResponseWriter,
	r *http.Request,
) {

	var req struct {
		Username string `json:"username"`
	}


	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		RespondErrorJSON(
			w,
			"Invalid request body",
			http.StatusBadRequest,
		)

		return
	}


	req.Username = strings.TrimSpace(req.Username)


	if req.Username == "" {

		RespondErrorJSON(
			w,
			"Username harus diisi",
			http.StatusBadRequest,
		)

		return
	}



	var user models.User


	if err := config.DB.
		Where("username = ?", req.Username).
		First(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}



	RespondJSON(
		w,
		http.StatusOK,
		map[string]interface{}{

			"success": true,

			"message": "User ditemukan",

			"email": user.Email,
		},
	)

}



// =======================
// REQUEST RESET PASSWORD
// =======================

func RequestResetPassword(
	w http.ResponseWriter,
	r *http.Request,
) {

	var req RequestResetPasswordRequest


	// =======================
	// DECODE REQUEST
	// =======================

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		RespondErrorJSON(
			w,
			"Invalid request body",
			http.StatusBadRequest,
		)

		return
	}


	req.Username = strings.TrimSpace(req.Username)


	if req.Username == "" {

		RespondErrorJSON(
			w,
			"Username harus diisi",
			http.StatusBadRequest,
		)

		return
	}



	// =======================
	// GET USER
	// =======================

	var user models.User


	if err := config.DB.
		Where("username = ?", req.Username).
		First(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}




	// =======================
	// CHECK EMAIL
	// =======================

	if user.Email == "" {

		RespondErrorJSON(
			w,
			"Email user belum tersedia",
			http.StatusBadRequest,
		)

		return
	}



	// =======================
	// GENERATE OTP
	// =======================

	otp := utils.GenerateOTP()


	expired := time.Now().Add(5 * time.Minute)



	fmt.Println("==============================")
	fmt.Println("USERNAME :", user.Username)
	fmt.Println("EMAIL    :", user.Email)
	fmt.Println("NEW OTP  :", otp)
	fmt.Println("EXPIRED  :", expired)
	fmt.Println("==============================")



	// =======================
	// SAVE OTP
	// =======================

	user.ResetOTP = otp

	user.OTPExpiredAt = &expired



	if err := config.DB.Save(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"Gagal menyimpan OTP",
			http.StatusInternalServerError,
		)

		return
	}



	// =======================
	// VERIFY SAVE DATABASE
	// =======================

	var checkUser models.User


	if err := config.DB.
		Where("username = ?", req.Username).
		First(&checkUser).Error; err != nil {


		RespondErrorJSON(
			w,
			"Gagal membaca OTP",
			http.StatusInternalServerError,
		)

		return
	}



	fmt.Println("==============================")
	fmt.Println("OTP DATABASE :", checkUser.ResetOTP)
	fmt.Println("TIME DATABASE:", checkUser.OTPExpiredAt)
	fmt.Println("==============================")




	// =======================
	// SEND EMAIL OTP
	// =======================

	if err := utils.SendOTPEmail(
		user.Email,
		otp,
	); err != nil {


		fmt.Println(
			"SMTP ERROR:",
			err,
		)


		RespondErrorJSON(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}




	// =======================
	// RESPONSE
	// =======================

	RespondJSON(
		w,
		http.StatusOK,
		map[string]interface{}{

			"success": true,

			"message": "OTP berhasil dikirim",

		},
	)

}



// =======================
// VERIFY OTP
// =======================

func VerifyOTP(
	w http.ResponseWriter,
	r *http.Request,
) {


	var req VerifyOTPRequest


	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {


		RespondErrorJSON(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)

		return
	}



	req.Username = strings.TrimSpace(req.Username)

	req.OTP = strings.TrimSpace(req.OTP)




	var user models.User



	if err := config.DB.
		Where("username = ?", req.Username).
		First(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}




	if user.ResetOTP != req.OTP {


		RespondErrorJSON(
			w,
			"OTP salah",
			http.StatusUnauthorized,
		)

		return
	}



	if user.OTPExpiredAt == nil ||
		time.Now().After(*user.OTPExpiredAt) {


		RespondErrorJSON(
			w,
			"OTP expired",
			http.StatusUnauthorized,
		)

		return
	}



	RespondJSON(
		w,
		http.StatusOK,
		map[string]interface{}{

			"success":true,

			"message":"OTP valid",

		},
	)

}



// =======================
// RESET PASSWORD
// =======================

func ResetPassword(
	w http.ResponseWriter,
	r *http.Request,
) {


	var req ResetPasswordRequest



	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {


		RespondErrorJSON(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)

		return
	}



	req.Username = strings.TrimSpace(req.Username)

	req.OTP = strings.TrimSpace(req.OTP)

	req.NewPassword = strings.TrimSpace(req.NewPassword)




	var user models.User



	if err := config.DB.
		Where("username = ?", req.Username).
		First(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}





	if user.ResetOTP != req.OTP {


		RespondErrorJSON(
			w,
			"OTP tidak valid",
			http.StatusUnauthorized,
		)

		return
	}





	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.NewPassword),
		bcrypt.DefaultCost,
	)



	if err != nil {


		RespondErrorJSON(
			w,
			"Gagal hash password",
			http.StatusInternalServerError,
		)

		return
	}



	user.Password = string(hash)

	user.ResetOTP = ""

	user.OTPExpiredAt = nil




	if err := config.DB.Save(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"Gagal update password",
			http.StatusInternalServerError,
		)

		return
	}




	RespondJSON(
		w,
		http.StatusOK,
		map[string]interface{}{

			"success":true,

			"message":"Password berhasil diubah",

		},
	)

}



// =======================
// LOGIN
// =======================

// =======================
// LOGIN
// =======================

func Login(
	w http.ResponseWriter,
	r *http.Request,
) {


	var creds Credentials


	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {


		RespondErrorJSON(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)

		return
	}



	creds.Username = strings.TrimSpace(creds.Username)

	creds.Password = strings.TrimSpace(creds.Password)



	var user models.User



	if err := config.DB.
		Where("username = ?", creds.Username).
		First(&user).Error; err != nil {


		RespondErrorJSON(
			w,
			"Username/password salah",
			http.StatusUnauthorized,
		)

		return
	}




	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.Password),
		[]byte(creds.Password),
	); err != nil {


		RespondErrorJSON(
			w,
			"Username/password salah",
			http.StatusUnauthorized,
		)

		return
	}



	// ===================================
	// UPDATE USER ONLINE STATUS
	// ===================================

	now := time.Now()


	user.LastLogin = &now

	user.LastActivity = &now

	user.IsOnline = true



	if err := config.DB.Save(&user).Error; err != nil {


		fmt.Println(
			"GAGAL UPDATE STATUS USER:",
			err,
		)


	}



	fmt.Println(
		"USER ONLINE:",
		user.Username,
	)




	// ===================================
	// GENERATE JWT
	// ===================================

	token, err := utils.GenerateJWTToken(
		user.Username,
	)



	if err != nil {


		RespondErrorJSON(
			w,
			"Gagal membuat token",
			http.StatusInternalServerError,
		)

		return
	}




	RespondJSON(
		w,
		http.StatusOK,
		map[string]interface{}{

			"token":token,


			"user":map[string]interface{}{

				"username":user.Username,

				"role":user.Role,

				"fullname":user.Fullname,

			},
		},
	)

}



// =======================
// RESPONSE HELPER
// =======================

func RespondJSON(
	w http.ResponseWriter,
	status int,
	data interface{},
) {


	w.Header().Set(
		"Content-Type",
		"application/json",
	)


	w.WriteHeader(status)


	json.NewEncoder(w).
		Encode(data)

}



func RespondErrorJSON(
	w http.ResponseWriter,
	message string,
	status int,
) {


	RespondJSON(
		w,
		status,
		map[string]interface{}{

			"success":false,

			"message":message,

		},
	)

}

