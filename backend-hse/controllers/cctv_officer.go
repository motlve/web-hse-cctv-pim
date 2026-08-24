package controllers

import (
	"backend/config"
	"backend/middlewares"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// ======================================================
// GET PUBLIC OFFICER
// GET /api/public/officer
//
// Public route - TANPA AUTH
// Digunakan untuk landing page / company profile
// Hanya menampilkan officer dengan status "Aktif"
// ======================================================

func GetPublicOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	var officers []models.OfficerModels

	err := config.DB.
		Where("status = ?", "Aktif").
		Order("name_officer ASC").
		Find(&officers).
		Error

	if err != nil {
		fmt.Println("ERROR GET PUBLIC OFFICER:", err)

		http.Error(
			w,
			"Gagal mengambil data officer",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		officers,
	)
}

// ======================================================
// GET ALL OFFICER
// GET /api/officer
//
// Protected route - WAJIB AUTH
// Optional query:
// /api/officer?name=rizky
// ======================================================

func GetAllOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	// ==========================================
	// CHECK USERNAME DARI AUTH MIDDLEWARE
	// ==========================================

	usernameVal := r.Context().Value(
		middlewares.UsernameKey,
	)

	username, ok := usernameVal.(string)

	if !ok {
		http.Error(
			w,
			"Unauthorized",
			http.StatusUnauthorized,
		)

		return
	}

	fmt.Println(
		"Request by:",
		username,
	)

	// ==========================================
	// SEARCH BY NAME
	// ==========================================

	name := r.URL.Query().Get("name")

	var (
		officers []models.OfficerModels
		err      error
	)

	if name != "" {
		officers, err = models.GetOfficersByName(
			config.DB,
			name,
		)
	} else {
		officers, err = models.GetAllOfficers(
			config.DB,
		)
	}

	if err != nil {
		fmt.Println(
			"ERROR GET ALL OFFICER:",
			err,
		)

		http.Error(
			w,
			"Gagal mengambil data petugas",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		officers,
	)
}

// ======================================================
// CREATE OFFICER
// POST /api/officer
//
// Protected route - WAJIB AUTH
// ======================================================

func CreateOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	var officer models.OfficerModels

	err := json.NewDecoder(
		r.Body,
	).Decode(&officer)

	if err != nil {
		http.Error(
			w,
			"Data tidak valid",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// DEFAULT STATUS
	// ==========================================

	if officer.Status == "" {
		officer.Status = "Aktif"
	}

	// ==========================================
	// CREATE
	// ==========================================

	err = models.CreateOfficer(
		config.DB,
		&officer,
	)

	if err != nil {
		fmt.Println(
			"ERROR CREATE OFFICER:",
			err,
		)

		http.Error(
			w,
			"Gagal membuat petugas",
			http.StatusInternalServerError,
		)

		return
	}

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"message": "Officer berhasil ditambahkan",
			"data":    officer,
		},
	)
}

// ======================================================
// UPDATE DATA OFFICER
// PUT /api/officer/{id}
//
// Protected route - WAJIB AUTH
//
// Yang dapat diubah:
// - name_officer
// - gender
// - role
// ======================================================

func UpdateOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	// ==========================================
	// GET ID
	// ==========================================

	id, err := strconv.Atoi(
		mux.Vars(r)["id"],
	)

	if err != nil {
		http.Error(
			w,
			"ID tidak valid",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// REQUEST BODY
	// ==========================================

	var req models.OfficerModels

	err = json.NewDecoder(
		r.Body,
	).Decode(&req)

	if err != nil {
		http.Error(
			w,
			"Body tidak valid",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// UPDATE
	// ==========================================

	result := config.DB.
		Model(&models.OfficerModels{}).
		Where("id = ?", id).
		Updates(
			map[string]interface{}{
				"name_officer": req.NameOfficer,
				"gender":       req.Gender,
				"role":         req.Role,
			},
		)

	if result.Error != nil {
		fmt.Println(
			"ERROR UPDATE OFFICER:",
			result.Error,
		)

		http.Error(
			w,
			"Gagal update data",
			http.StatusInternalServerError,
		)

		return
	}

	// ==========================================
	// CHECK DATA FOUND
	// ==========================================

	if result.RowsAffected == 0 {
		http.Error(
			w,
			"Officer tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]string{
			"message": "Data officer berhasil diperbarui",
		},
	)
}

// ======================================================
// UPDATE STATUS OFFICER
// PUT /api/officer/status/{id}
//
// Protected route - WAJIB AUTH
//
// Status:
// - Aktif
// - Mutasi
// - Resign
// ======================================================

func UpdateStatusOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	// ==========================================
	// GET ID
	// ==========================================

	id, err := strconv.Atoi(
		mux.Vars(r)["id"],
	)

	if err != nil {
		http.Error(
			w,
			"ID tidak valid",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// REQUEST
	// ==========================================

	var request struct {
		Status string `json:"status"`
	}

	err = json.NewDecoder(
		r.Body,
	).Decode(&request)

	if err != nil {
		http.Error(
			w,
			"Data status tidak valid",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// VALIDATE STATUS
	// ==========================================

	if request.Status == "" {
		http.Error(
			w,
			"Status wajib diisi",
			http.StatusBadRequest,
		)

		return
	}

	if request.Status != "Aktif" &&
		request.Status != "Mutasi" &&
		request.Status != "Resign" {

		http.Error(
			w,
			"Status hanya Aktif, Mutasi, atau Resign",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// UPDATE STATUS
	// ==========================================

	result := config.DB.
		Model(&models.OfficerModels{}).
		Where("id = ?", id).
		Updates(
			map[string]interface{}{
				"status":         request.Status,
				"tanggal_status": time.Now(),
			},
		)

	if result.Error != nil {
		fmt.Println(
			"ERROR UPDATE STATUS:",
			result.Error,
		)

		http.Error(
			w,
			"Gagal update status",
			http.StatusInternalServerError,
		)

		return
	}

	// ==========================================
	// CHECK DATA FOUND
	// ==========================================

	if result.RowsAffected == 0 {
		http.Error(
			w,
			"Officer tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"message": "Status officer berhasil diubah",
			"status":  request.Status,
		},
	)
}

// ======================================================
// DELETE OFFICER
// DELETE /api/officer/{id}
//
// Protected route - WAJIB AUTH
//
// GORM Delete:
// Jika model memiliki DeletedAt,
// maka ini menjadi SOFT DELETE.
// ======================================================

func DeleteOfficer(
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	// ==========================================
	// GET ID
	// ==========================================

	id, err := strconv.Atoi(
		mux.Vars(r)["id"],
	)

	if err != nil {
		http.Error(
			w,
			"ID tidak valid",
			http.StatusBadRequest,
		)

		return
	}

	// ==========================================
	// DELETE
	// ==========================================

	result := config.DB.
		Delete(
			&models.OfficerModels{},
			id,
		)

	if result.Error != nil {
		fmt.Println(
			"ERROR DELETE OFFICER:",
			result.Error,
		)

		http.Error(
			w,
			"Gagal menghapus petugas",
			http.StatusInternalServerError,
		)

		return
	}

	// ==========================================
	// CHECK DATA FOUND
	// ==========================================

	if result.RowsAffected == 0 {
		http.Error(
			w,
			"Officer tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]string{
			"message": "Petugas berhasil dihapus",
		},
	)
}