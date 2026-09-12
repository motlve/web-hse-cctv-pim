package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

// Role tersimpan sebagai varchar bebas di DB (models.User.Role), tanpa enum
// constraint — whitelist ini mencegah role di luar daftar yang dikenal
// frontend (dropdown "Hak Akses Role" di User.jsx) masuk lewat API langsung,
// yang kalau lolos akan hilang diam-diam dari role distribution chart.
var validUserRoles = []string{
	"Admin",
	"Manager HSE",
	"Petugas CCTV",
	"Petugas HSE",
	"Petugas GSL",
	"Guest",
}

func isValidUserRole(role string) bool {
	for _, r := range validUserRoles {
		if r == role {
			return true
		}
	}
	return false
}

func updateUserActivity(username string) {

	now := time.Now()

	config.DB.Model(&models.User{}).
		Where("username = ?", username).
		Updates(map[string]interface{}{

			"is_online": true,

			"last_activity": now,

		})
}

// =====================================
// GET ALL USER
// =====================================

func GetUsers(
	w http.ResponseWriter,
	r *http.Request,
) {

	var users []models.User

	if err := config.DB.Find(&users).Error; err != nil {

		http.Error(
			w,
			"Gagal mengambil data user",
			http.StatusInternalServerError,
		)

		return
	}


	type UserResponse struct {

		models.User

		Status string `json:"status"`
	}


	response := []UserResponse{}


	for _, u := range users {


		status := "Offline"



		// ===============================
		// CEK STATUS ONLINE
		// ===============================

	if u.LastActivity != nil {

    diff := time.Since(*u.LastActivity)

    if diff <= 2*time.Minute {

        status = "Online"

    } else {

        status = "Offline"

    }

}



		response = append(
			response,
			UserResponse{

				User: u,

				Status: status,
			},
		)

	}



	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(response)

}



// =====================================
// GET PROFILE
// =====================================

func GetUserProfile(
	w http.ResponseWriter,
	r *http.Request,
) {


	usernameVal :=
		r.Context().Value(
			middlewares.UsernameKey,
		)



	if usernameVal == nil {


		http.Error(
			w,
			"Unauthorized",
			http.StatusUnauthorized,
		)


		return
	}



	username, ok := usernameVal.(string)

	fmt.Println("==============================")
fmt.Println("JWT USERNAME :", username)

var users []models.User

err := config.DB.Find(&users).Error

if err != nil {
	fmt.Println("DB ERROR :", err)
} else {

	fmt.Println("TOTAL USER :", len(users))

	for _, u := range users {
		fmt.Println(
			"DB USER :",
			u.Username,
		)
	}

}

fmt.Println("==============================")

if !ok {
    http.Error(
        w,
        "Invalid username context",
        http.StatusUnauthorized,
    )
    return
}


fmt.Println(
    "HEARTBEAT USERNAME:",
    username,
)



	user,err :=
		models.GetUserByUsername(
			config.DB,
			username,
		)



	if err != nil {


		http.Error(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)


		return
	}



	json.NewEncoder(w).Encode(
		map[string]interface{}{

			"username":user.Username,

			"fullname":user.Fullname,

			"role":user.Role,

			"email":user.Email,

		},
	)

}



// =====================================
// CREATE USER
// =====================================

func CreateUser(
	w http.ResponseWriter,
	r *http.Request,
) {


	var req struct {


		Password string `json:"password"`

		Fullname string `json:"fullname"`

		Role string `json:"role"`

		Email string `json:"email"`

	}



	if err :=
		json.NewDecoder(r.Body).Decode(&req);
		err != nil {


		http.Error(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)


		return
	}




	req.Fullname =
		strings.TrimSpace(
			req.Fullname,
		)


	req.Email =
		strings.TrimSpace(
			req.Email,
		)



	if req.Password == "" ||
		req.Fullname == "" ||
		req.Role == "" {


		http.Error(
			w,
			"Password fullname dan role wajib diisi",
			http.StatusBadRequest,
		)


		return
	}


	if !isValidUserRole(req.Role) {

		http.Error(
			w,
			"Role tidak valid",
			http.StatusBadRequest,
		)

		return
	}




	// =====================================
	// GENERATE USERNAME
	// =====================================

	username :=
		utils.GenerateUsername(
			req.Role,
			req.Fullname,
		)




	// cek duplicate username

	var check models.User


	for {


		err :=
			config.DB.
				Where(
					"username = ?",
					username,
				).
				First(&check).
				Error



		if err != nil {

			break

		}



		username =
			utils.GenerateUsername(
				req.Role,
				req.Fullname,
			)

	}




	// =====================================
	// HASH PASSWORD
	// =====================================


	hashPassword,err :=
		bcrypt.GenerateFromPassword(
			[]byte(req.Password),
			bcrypt.DefaultCost,
		)



	if err != nil {


		http.Error(
			w,
			"Gagal hash password",
			http.StatusInternalServerError,
		)


		return
	}




	user :=
		models.User{
Username: username,

		Password: string(hashPassword),

		Fullname:req.Fullname,

		Role:req.Role,

		Email:req.Email,

		IsOnline:false,

		LastLogin:nil,

		LastActivity:nil,
		}




	if err :=
		config.DB.Create(&user).Error;
		err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)


		return
	}




	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(
		map[string]interface{}{


			"success":true,


			"message":
				"User berhasil dibuat",


			"username":
				username,


			"user":
				user,


		},
	)

}



// =====================================
// UPDATE USER
// =====================================

func UpdateUser(
	w http.ResponseWriter,
	r *http.Request,
) {

	id := mux.Vars(r)["id"]

	var user models.User

	if err := config.DB.First(&user, id).Error; err != nil {
		http.Error(w, "User tidak ditemukan", http.StatusNotFound)
		return
	}

	// =====================================
	// CEK IDENTITAS & ROLE REQUESTER
	// =====================================

	usernameVal := r.Context().Value(middlewares.UsernameKey)
	if usernameVal == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requesterUsername, ok := usernameVal.(string)
	if !ok || requesterUsername == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requester, err := models.GetUserByUsername(config.DB, requesterUsername)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	isAdmin := requester.Role == "Admin"
	isSelf := requester.ID == user.ID

	// user biasa hanya boleh update dirinya sendiri
	if !isAdmin && !isSelf {
		http.Error(w, "Forbidden: tidak punya izin mengubah user lain", http.StatusForbidden)
		return
	}

	var req struct {
		Username string `json:"username"`
		Fullname string `json:"fullname"`
		Email    string `json:"email"`
		Role     string `json:"role"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	user.Username = req.Username
	user.Fullname = req.Fullname
	user.Email = req.Email

	// =====================================
	// HANYA ADMIN YANG BOLEH UBAH ROLE
	// =====================================
	if req.Role != "" && req.Role != user.Role {
		if !isAdmin {
			http.Error(w, "Forbidden: hanya admin yang bisa mengubah role", http.StatusForbidden)
			return
		}
		if !isValidUserRole(req.Role) {
			http.Error(w, "Role tidak valid", http.StatusBadRequest)
			return
		}
		user.Role = req.Role
	}

	// update password jika ada
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Gagal hash password", http.StatusInternalServerError)
			return
		}
		user.Password = string(hash)
	}

	if err := config.DB.Save(&user).Error; err != nil {
		http.Error(w, "Gagal update user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User berhasil diupdate",
		"user":    user,
	})
}



// =====================================
// DELETE USER
// =====================================

func DeleteUser(
	w http.ResponseWriter,
	r *http.Request,
) {



	id :=
		mux.Vars(r)["id"]



	var user models.User



	if err :=
		config.DB.First(
			&user,
			id,
		).Error;
		err != nil {


		http.Error(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)


		return
	}




	if err :=
		config.DB.Delete(
			&user,
		).Error;
		err != nil {


		http.Error(
			w,
			"Gagal menghapus user",
			http.StatusInternalServerError,
		)


		return
	}




	json.NewEncoder(w).Encode(
		map[string]interface{}{


			"success":true,


			"message":
				"User berhasil dihapus",

		},
	)

}

func HeartbeatUser(
	w http.ResponseWriter,
	r *http.Request,
) {

	fmt.Println("===== HEARTBEAT REQUEST =====")


	usernameVal := r.Context().Value(
		middlewares.UsernameKey,
	)


	if usernameVal == nil {

		http.Error(
			w,
			"Username tidak ditemukan",
			http.StatusUnauthorized,
		)

		return
	}



	username, ok := usernameVal.(string)


	if !ok || username == "" {

		http.Error(
			w,
			"Invalid username",
			http.StatusUnauthorized,
		)

		return
	}



	fmt.Println(
		"HEARTBEAT USER:",
		username,
	)



	var user models.User


	err := config.DB.
		Where(
			"username = ?",
			username,
		).
		First(&user).
		Error



	if err != nil {

		fmt.Println(
			"USER NOT FOUND:",
			username,
		)

		fmt.Println(
			"ERROR:",
			err,
		)


		http.Error(
			w,
			"User tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}



	now := time.Now()



	err = config.DB.
		Model(&models.User{}).
		Where(
			"id = ?",
			user.ID,
		).
		Updates(map[string]interface{}{

			"is_online": true,

			"last_activity": now,

		}).
		Error



	if err != nil {

		fmt.Println(
			"UPDATE ERROR:",
			err,
		)


		http.Error(
			w,
			"Gagal update heartbeat",
			http.StatusInternalServerError,
		)

		return
	}



	fmt.Println(
		"HEARTBEAT SUCCESS:",
		user.Username,
	)



	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(
		map[string]interface{}{

			"success":true,

			"username":user.Username,

			"time":now,

		},
	)

}

// =====================================
// LOGOUT USER
// =====================================

func Logout(
	w http.ResponseWriter,
	r *http.Request,
) {


	usernameVal := r.Context().Value(
		middlewares.UsernameKey,
	)


	fmt.Println(
		"LOGOUT CONTEXT:",
		usernameVal,
	)



	if usernameVal == nil {

		http.Error(
			w,
			"Unauthorized",
			http.StatusUnauthorized,
		)

		return
	}



	username := usernameVal.(string)


	fmt.Println(
		"LOGOUT USER:",
		username,
	)



	err := config.DB.Model(
		&models.User{},
	).
	Where(
		"username = ?",
		username,
	).
	Updates(map[string]interface{}{

		"is_online": false,

		"last_activity": time.Now(),

	}).Error



	if err != nil {

		fmt.Println(
			"LOGOUT ERROR:",
			err,
		)

		http.Error(
			w,
			"Gagal logout",
			http.StatusInternalServerError,
		)

		return
	}



	fmt.Println(
		"LOGOUT SUCCESS:",
		username,
	)



	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"success":true,
			"message":"Logout berhasil",
		},
	)

}