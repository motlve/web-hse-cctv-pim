package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

// =====================================
// GET ALL CATEGORIES
// =====================================

func GetComplaintCategories(w http.ResponseWriter, r *http.Request) {

	var categories []models.ComplaintCategory

	if err := config.DB.Find(&categories).Error; err != nil {
		http.Error(w, "Gagal mengambil data kategori", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

// =====================================
// GET CATEGORY BY ID
// =====================================

func GetComplaintCategoryByID(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var category models.ComplaintCategory
	if err := config.DB.First(&category, id).Error; err != nil {
		http.Error(w, "Kategori tidak ditemukan", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(category)
}

// =====================================
// CREATE CATEGORY
// =====================================

func CreateComplaintCategory(w http.ResponseWriter, r *http.Request) {

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(req.Name)

	if req.Name == "" {
		http.Error(w, "Nama kategori wajib diisi", http.StatusBadRequest)
		return
	}

	// cek duplikat nama
	var existing models.ComplaintCategory
	if err := config.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		http.Error(w, "Kategori dengan nama ini sudah ada", http.StatusBadRequest)
		return
	}

	category := models.ComplaintCategory{Name: req.Name}

	if err := config.DB.Create(&category).Error; err != nil {
		http.Error(w, "Gagal menyimpan kategori", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Kategori berhasil dibuat",
		"data":    category,
	})
}

// =====================================
// UPDATE CATEGORY
// =====================================

func UpdateComplaintCategory(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var category models.ComplaintCategory
	if err := config.DB.First(&category, id).Error; err != nil {
		http.Error(w, "Kategori tidak ditemukan", http.StatusNotFound)
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(req.Name)

	if req.Name == "" {
		http.Error(w, "Nama kategori wajib diisi", http.StatusBadRequest)
		return
	}

	category.Name = req.Name

	if err := config.DB.Save(&category).Error; err != nil {
		http.Error(w, "Gagal update kategori", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Kategori berhasil diupdate",
		"data":    category,
	})
}

// =====================================
// DELETE CATEGORY
// =====================================

func DeleteComplaintCategory(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var category models.ComplaintCategory
	if err := config.DB.First(&category, id).Error; err != nil {
		http.Error(w, "Kategori tidak ditemukan", http.StatusNotFound)
		return
	}

	// cek apakah kategori masih dipakai ComplaintRecord
	var usageCount int64
	config.DB.Model(&models.ComplaintRecord{}).Where("category_id = ?", id).Count(&usageCount)

	if usageCount > 0 {
		http.Error(w, "Kategori masih dipakai oleh data komplain, tidak bisa dihapus", http.StatusBadRequest)
		return
	}

	if err := config.DB.Delete(&category).Error; err != nil {
		http.Error(w, "Gagal menghapus kategori", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Kategori berhasil dihapus",
	})
}