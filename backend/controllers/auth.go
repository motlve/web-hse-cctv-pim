package controllers

import (
	"backend/config"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// Structs
type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ResetPasswordRequest struct {
	Username    string `json:"username"`    // untuk request reset
	NewPassword string `json:"newPassword"` // untuk reset password baru
}

// =======================
// HELPER RESPONSE JSON
// =======================
func RespondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func RespondErrorJSON(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}

// =======================
// LOGIN HANDLER
// =======================
func Login(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		RespondErrorJSON(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	creds.Username = strings.TrimSpace(creds.Username)
	creds.Password = strings.TrimSpace(creds.Password)

	var user models.User
	if result := config.DB.Where("username = ?", creds.Username).First(&user); result.Error != nil {
		RespondErrorJSON(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		RespondErrorJSON(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	token, err := utils.GenerateJWTToken(user.Username)
	if err != nil {
		RespondErrorJSON(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"username": user.Username,
			"role":     user.Role,
			"fullname": user.Fullname,
		},
	})
}

// =======================
// CHECK USER HANDLER
// =======================
func CheckUser(w http.ResponseWriter, r *http.Request) {
    var req struct{ Username string `json:"username"` }
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil || strings.TrimSpace(req.Username) == "" {
        RespondErrorJSON(w, "Username diperlukan", http.StatusBadRequest)
        return
    }

    var user models.User
    result := config.DB.Where("username = ?", req.Username).First(&user)
    if result.Error != nil {
        RespondErrorJSON(w, "User tidak ditemukan", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "User ditemukan"})
}


// =======================
// RESET PASSWORD HANDLER
// =======================
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondErrorJSON(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.NewPassword = strings.TrimSpace(req.NewPassword)

	if req.Username == "" || req.NewPassword == "" {
		RespondErrorJSON(w, "Username dan password baru harus diisi", http.StatusBadRequest)
		return
	}

	var user models.User
	if result := config.DB.Where("username = ?", req.Username).First(&user); result.Error != nil {
		RespondErrorJSON(w, "User tidak ditemukan", http.StatusNotFound)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		RespondErrorJSON(w, "Gagal hash password baru", http.StatusInternalServerError)
		return
	}

	user.Password = string(hashedPassword)
	config.DB.Save(&user)

	RespondJSON(w, map[string]string{
		"message": "Password berhasil diubah",
	})
}
